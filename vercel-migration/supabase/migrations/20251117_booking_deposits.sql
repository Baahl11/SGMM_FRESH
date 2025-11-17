-- ============================================
-- MIGRATION: Booking Deposits System
-- Date: 2025-11-17
-- Purpose: Cobrar depósitos para reservar citas y reducir no-shows
-- ============================================

-- ============================================
-- 1. Extend booking_settings table
-- ============================================

-- Add deposit configuration fields to booking_settings
ALTER TABLE booking_settings
ADD COLUMN IF NOT EXISTS require_deposit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_type TEXT DEFAULT 'fixed' CHECK (deposit_type IN ('fixed', 'percentage')),
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER DEFAULT 20 CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100),
ADD COLUMN IF NOT EXISTS deposit_min_amount DECIMAL(10,2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS deposit_max_amount DECIMAL(10,2) DEFAULT 1000.00,
ADD COLUMN IF NOT EXISTS refund_policy TEXT DEFAULT '24_hours' CHECK (refund_policy IN ('no_refund', '24_hours', '48_hours', '72_hours', 'anytime')),
ADD COLUMN IF NOT EXISTS deposit_message TEXT DEFAULT 'Se requiere un depósito para confirmar tu cita. El depósito será aplicado al costo total de tu consulta.',
ADD COLUMN IF NOT EXISTS services_requiring_deposit JSONB DEFAULT '[]'::jsonb; -- Array de service IDs: ["1", "2", "3"]

-- ============================================
-- 2. Create booking_deposits table
-- ============================================

CREATE TABLE IF NOT EXISTS booking_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionado con la reserva
  booking_id UUID NOT NULL REFERENCES public_bookings(id) ON DELETE CASCADE,
  clinic_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información del depósito
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'MXN',
  
  -- Stripe payment tracking
  payment_intent_id TEXT UNIQUE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
  
  -- Checkout session
  checkout_session_id TEXT UNIQUE,
  checkout_url TEXT,
  
  -- Payment method details (populated after payment)
  payment_method_type TEXT, -- 'card', 'oxxo', etc.
  last4 TEXT,
  card_brand TEXT,
  
  -- Refund tracking
  refund_status TEXT DEFAULT 'not_refunded' CHECK (refund_status IN ('not_refunded', 'pending', 'refunded', 'failed')),
  refund_id TEXT,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  -- Policy aplicada al momento del pago
  applied_refund_policy TEXT NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- Para pagos OXXO que expiran
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. Add deposit reference to public_bookings
-- ============================================

ALTER TABLE public_bookings
ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'not_required' CHECK (deposit_status IN ('not_required', 'pending', 'paid', 'refunded', 'failed'));

-- ============================================
-- 4. Enable Row Level Security
-- ============================================

ALTER TABLE booking_deposits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_deposits
CREATE POLICY "Users can view their own deposits"
  ON booking_deposits FOR SELECT
  TO authenticated
  USING (auth.uid() = clinic_user_id);

CREATE POLICY "Users can insert their own deposits"
  ON booking_deposits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = clinic_user_id);

CREATE POLICY "Users can update their own deposits"
  ON booking_deposits FOR UPDATE
  TO authenticated
  USING (auth.uid() = clinic_user_id)
  WITH CHECK (auth.uid() = clinic_user_id);

-- ============================================
-- 5. Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_booking_deposits_booking_id ON booking_deposits(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_deposits_clinic_user_id ON booking_deposits(clinic_user_id);
CREATE INDEX IF NOT EXISTS idx_booking_deposits_payment_intent_id ON booking_deposits(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_booking_deposits_payment_status ON booking_deposits(payment_status);
CREATE INDEX IF NOT EXISTS idx_booking_deposits_created_at ON booking_deposits(created_at DESC);

-- Index compuesto para consultas comunes
CREATE INDEX IF NOT EXISTS idx_booking_deposits_clinic_status 
  ON booking_deposits(clinic_user_id, payment_status, created_at DESC);

-- ============================================
-- 6. Create trigger for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_booking_deposits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_booking_deposits_updated_at ON booking_deposits;
CREATE TRIGGER trigger_update_booking_deposits_updated_at
  BEFORE UPDATE ON booking_deposits
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_deposits_updated_at();

-- ============================================
-- 7. Create view for deposit analytics
-- ============================================

CREATE OR REPLACE VIEW deposit_analytics AS
SELECT 
  bd.clinic_user_id,
  COUNT(*) as total_deposits,
  COUNT(CASE WHEN bd.payment_status = 'succeeded' THEN 1 END) as successful_deposits,
  COUNT(CASE WHEN bd.payment_status = 'pending' THEN 1 END) as pending_deposits,
  COUNT(CASE WHEN bd.payment_status = 'failed' THEN 1 END) as failed_deposits,
  COUNT(CASE WHEN bd.refund_status = 'refunded' THEN 1 END) as refunded_deposits,
  SUM(CASE WHEN bd.payment_status = 'succeeded' THEN bd.amount ELSE 0 END) as total_collected,
  SUM(CASE WHEN bd.refund_status = 'refunded' THEN bd.refund_amount ELSE 0 END) as total_refunded,
  AVG(CASE WHEN bd.payment_status = 'succeeded' THEN bd.amount END) as avg_deposit_amount,
  DATE_TRUNC('month', bd.created_at) as month
FROM booking_deposits bd
GROUP BY bd.clinic_user_id, DATE_TRUNC('month', bd.created_at);

-- ============================================
-- 8. Comments
-- ============================================

COMMENT ON TABLE booking_deposits IS 'Tracking de depósitos cobrados para reservas online';
COMMENT ON COLUMN booking_deposits.payment_intent_id IS 'Stripe PaymentIntent ID para tracking';
COMMENT ON COLUMN booking_deposits.checkout_session_id IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN booking_deposits.applied_refund_policy IS 'Política de reembolso aplicada al momento del pago';
COMMENT ON COLUMN booking_deposits.expires_at IS 'Fecha de expiración para métodos como OXXO';

COMMENT ON COLUMN booking_settings.require_deposit IS 'Si se requiere depósito para todas las reservas';
COMMENT ON COLUMN booking_settings.deposit_type IS 'Tipo de depósito: fixed (monto fijo) o percentage (% del precio)';
COMMENT ON COLUMN booking_settings.deposit_amount IS 'Monto fijo del depósito (cuando deposit_type = fixed)';
COMMENT ON COLUMN booking_settings.deposit_percentage IS 'Porcentaje del precio (cuando deposit_type = percentage)';
COMMENT ON COLUMN booking_settings.services_requiring_deposit IS 'IDs de servicios que requieren depósito (array JSON)';
COMMENT ON COLUMN booking_settings.refund_policy IS 'Política de reembolso: no_refund, 24_hours, 48_hours, 72_hours, anytime';

COMMENT ON COLUMN public_bookings.deposit_required IS 'Si esta reserva específica requiere depósito';
COMMENT ON COLUMN public_bookings.deposit_amount IS 'Monto del depósito calculado para esta reserva';
COMMENT ON COLUMN public_bookings.deposit_status IS 'Estado del depósito: not_required, pending, paid, refunded, failed';

-- ============================================
-- 9. Sample data for testing (opcional)
-- ============================================

-- Puedes descomentar esto para testing:
-- UPDATE booking_settings 
-- SET 
--   require_deposit = true,
--   deposit_type = 'fixed',
--   deposit_amount = 200.00,
--   deposit_message = 'Se requiere un depósito de $200 MXN para confirmar tu cita. Si cancelas con más de 24 horas de anticipación, se reembolsará el 100%.',
--   refund_policy = '24_hours'
-- WHERE user_id = (SELECT id FROM auth.users LIMIT 1);
