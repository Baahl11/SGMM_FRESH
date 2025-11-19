-- ============================================================================
-- STRIPE CONNECT - COBRO DE COMISIÓN POR CITAS
-- ============================================================================
-- Created: 2025-11-18
-- Description: Sistema de comisiones automáticas usando Stripe Connect
-- ============================================================================

-- Tabla para cuentas conectadas de Stripe
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL DEFAULT 'express' CHECK (account_type IN ('express', 'standard')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  details_submitted BOOLEAN DEFAULT FALSE,
  requirements_pending JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_stripe_account UNIQUE(user_id, stripe_account_id)
);

-- Índices para connected_accounts
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_stripe_id ON connected_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_status ON connected_accounts(onboarding_completed, charges_enabled);

-- Comentarios
COMMENT ON TABLE connected_accounts IS 'Cuentas de Stripe Connect para médicos que reciben pagos directos';
COMMENT ON COLUMN connected_accounts.stripe_account_id IS 'ID de la cuenta Stripe Connect (acct_xxx)';
COMMENT ON COLUMN connected_accounts.account_type IS 'express = Stripe maneja onboarding | standard = control total';
COMMENT ON COLUMN connected_accounts.charges_enabled IS 'Puede recibir pagos (KYC completado)';
COMMENT ON COLUMN connected_accounts.payouts_enabled IS 'Puede recibir transferencias a su banco';

-- ============================================================================
-- Actualizar tabla booking_deposits para rastrear comisiones
-- ============================================================================

ALTER TABLE booking_deposits 
ADD COLUMN IF NOT EXISTS connected_account_id UUID REFERENCES connected_accounts(id),
ADD COLUMN IF NOT EXISTS application_fee_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS transfer_id TEXT,
ADD COLUMN IF NOT EXISTS platform_fee_id UUID;

-- Índices
CREATE INDEX IF NOT EXISTS idx_booking_deposits_connected_account ON booking_deposits(connected_account_id);
CREATE INDEX IF NOT EXISTS idx_booking_deposits_transfer ON booking_deposits(transfer_id) WHERE transfer_id IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN booking_deposits.connected_account_id IS 'Cuenta Stripe Connect del médico que recibe el pago';
COMMENT ON COLUMN booking_deposits.application_fee_amount IS 'Monto de comisión cobrado por la plataforma';
COMMENT ON COLUMN booking_deposits.transfer_id IS 'ID de transferencia de Stripe (tr_xxx)';

-- ============================================================================
-- Tabla para rastrear comisiones de plataforma
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  booking_deposit_id UUID REFERENCES booking_deposits(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  stripe_fee_id TEXT UNIQUE,
  stripe_balance_transaction_id TEXT,
  payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para platform_fees
CREATE INDEX IF NOT EXISTS idx_platform_fees_connected_account ON platform_fees(connected_account_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_user ON platform_fees(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_deposit ON platform_fees(booking_deposit_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_created ON platform_fees(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_fees_stripe_fee ON platform_fees(stripe_fee_id) WHERE stripe_fee_id IS NOT NULL;

-- Comentarios
COMMENT ON TABLE platform_fees IS 'Registro de todas las comisiones cobradas por la plataforma';
COMMENT ON COLUMN platform_fees.amount IS 'Monto de comisión en MXN (ej: 3% del depósito)';
COMMENT ON COLUMN platform_fees.stripe_fee_id IS 'ID del application fee en Stripe (fee_xxx)';

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Connected Accounts: Solo el dueño puede ver su cuenta
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connected account" ON connected_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connected account" ON connected_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connected account" ON connected_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Platform Fees: Solo el dueño puede ver sus comisiones
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own platform fees" ON platform_fees
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- Función para actualizar updated_at automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_connected_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_connected_accounts_updated_at
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_connected_accounts_updated_at();

-- ============================================================================
-- Vista para analytics de comisiones
-- ============================================================================

CREATE OR REPLACE VIEW platform_fees_summary AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_fees,
  SUM(amount) as total_amount,
  AVG(amount) as avg_fee_amount,
  COUNT(DISTINCT user_id) as unique_doctors
FROM platform_fees
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

COMMENT ON VIEW platform_fees_summary IS 'Resumen mensual de comisiones cobradas';

-- ============================================================================
-- Tabla de configuración de comisiones de plataforma
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_fee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT true,
  fee_type TEXT DEFAULT 'percentage' CHECK (fee_type IN ('percentage', 'fixed', 'hybrid')),
  fee_percentage DECIMAL(5,2) DEFAULT 3.00,
  fixed_fee_amount DECIMAL(10,2) DEFAULT 0,
  min_fee_amount DECIMAL(10,2),
  max_fee_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración por defecto (3% de comisión)
INSERT INTO platform_fee_settings (is_active, fee_type, fee_percentage, fixed_fee_amount)
VALUES (true, 'percentage', 3.00, 0)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE platform_fee_settings IS 'Configuración global de comisiones de plataforma';
COMMENT ON COLUMN platform_fee_settings.fee_type IS 'percentage = solo %, fixed = cantidad fija, hybrid = ambos';
COMMENT ON COLUMN platform_fee_settings.fee_percentage IS 'Porcentaje de comisión (ej: 3.00 = 3%)';
COMMENT ON COLUMN platform_fee_settings.fixed_fee_amount IS 'Cantidad fija en MXN (solo para fixed o hybrid)';
