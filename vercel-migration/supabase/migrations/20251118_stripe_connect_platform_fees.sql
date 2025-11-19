-- ============================================================================
-- STRIPE CONNECT: PLATFORM FEES & COMMISSION SYSTEM
-- ============================================================================
-- Created: 2025-11-18
-- Description: Sistema de comisiones de plataforma para cobrar % por cada
--              cita pagada con depósito. Permite a cada médico recibir sus
--              pagos directamente mientras la plataforma cobra comisión.
-- ============================================================================

-- ============================================
-- 1. Create connected_accounts table
-- ============================================

CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe Connect IDs
  stripe_account_id TEXT UNIQUE NOT NULL, -- acct_xxxxx
  account_type TEXT NOT NULL DEFAULT 'express' CHECK (account_type IN ('express', 'standard')),
  
  -- Onboarding status
  onboarding_completed BOOLEAN DEFAULT false,
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  
  -- Account details
  business_type TEXT DEFAULT 'individual', -- 'individual' or 'company'
  country TEXT DEFAULT 'MX',
  email TEXT,
  
  -- Metadata
  details_submitted BOOLEAN DEFAULT false,
  requirements JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Índices para lookups rápidos
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id 
  ON connected_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_stripe_id 
  ON connected_accounts(stripe_account_id);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_status 
  ON connected_accounts(onboarding_completed, charges_enabled)
  WHERE charges_enabled = true;

-- ============================================
-- 2. Extend booking_deposits for Stripe Connect
-- ============================================

ALTER TABLE booking_deposits
ADD COLUMN IF NOT EXISTS connected_account_id TEXT, -- Stripe Connect account que recibió el pago
ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10,2), -- Comisión de plataforma
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2); -- Monto neto al médico (amount - platform_fee_amount)

-- Índice para búsquedas por connected account
CREATE INDEX IF NOT EXISTS idx_booking_deposits_connected_account
  ON booking_deposits(connected_account_id)
  WHERE connected_account_id IS NOT NULL;

-- ============================================
-- 3. Create platform_fees table (tracking de comisiones)
-- ============================================

CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionado con el pago
  booking_deposit_id UUID REFERENCES booking_deposits(id) ON DELETE CASCADE,
  clinic_user_id UUID NOT NULL REFERENCES auth.users(id),
  connected_account_id TEXT NOT NULL,
  
  -- Montos
  total_amount DECIMAL(10,2) NOT NULL, -- Monto total del pago
  fee_amount DECIMAL(10,2) NOT NULL, -- Comisión de plataforma
  fee_percentage DECIMAL(5,2) NOT NULL, -- % aplicado (ej: 3.00)
  net_amount DECIMAL(10,2) NOT NULL, -- Monto neto al médico
  
  -- Stripe IDs
  stripe_application_fee_id TEXT UNIQUE, -- fee_xxxxx
  payment_intent_id TEXT,
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'failed', 'refunded')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  collected_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_platform_fees_deposit 
  ON platform_fees(booking_deposit_id);

CREATE INDEX IF NOT EXISTS idx_platform_fees_clinic 
  ON platform_fees(clinic_user_id);

CREATE INDEX IF NOT EXISTS idx_platform_fees_connected_account 
  ON platform_fees(connected_account_id);

CREATE INDEX IF NOT EXISTS idx_platform_fees_status 
  ON platform_fees(status);

CREATE INDEX IF NOT EXISTS idx_platform_fees_stripe_fee 
  ON platform_fees(stripe_application_fee_id)
  WHERE stripe_application_fee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_platform_fees_created 
  ON platform_fees(created_at DESC);

-- ============================================
-- 4. Create platform_fee_settings table
-- ============================================

CREATE TABLE IF NOT EXISTS platform_fee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Global platform settings (one row only)
  is_active BOOLEAN DEFAULT true,
  
  -- Fee structure
  fee_type TEXT DEFAULT 'percentage' CHECK (fee_type IN ('percentage', 'fixed', 'hybrid')),
  fee_percentage DECIMAL(5,2) DEFAULT 3.00, -- 3% default
  fixed_fee_amount DECIMAL(10,2) DEFAULT 0, -- En MXN
  
  -- Minimum/Maximum fees
  min_fee_amount DECIMAL(10,2) DEFAULT 5.00, -- Mínimo $5 MXN
  max_fee_amount DECIMAL(10,2), -- NULL = sin límite
  
  -- Plan-specific overrides (opcional)
  free_for_basic_plan BOOLEAN DEFAULT false,
  basic_plan_fee_percentage DECIMAL(5,2),
  pro_plan_fee_percentage DECIMAL(5,2),
  enterprise_plan_fee_percentage DECIMAL(5,2),
  
  -- Metadata
  description TEXT,
  notes JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings (solo una fila)
INSERT INTO platform_fee_settings (
  is_active,
  fee_type,
  fee_percentage,
  fixed_fee_amount,
  min_fee_amount,
  description
) VALUES (
  true,
  'percentage',
  3.00,
  0,
  5.00,
  'Comisión del 3% por cada depósito de cita procesado'
) ON CONFLICT DO NOTHING;

-- ============================================
-- 5. Row Level Security (RLS)
-- ============================================

ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fee_settings ENABLE ROW LEVEL SECURITY;

-- connected_accounts: Users can view their own account
CREATE POLICY "Users can view their own connected account"
  ON connected_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected account"
  ON connected_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- platform_fees: Users can view their own fees
CREATE POLICY "Users can view their own platform fees"
  ON platform_fees FOR SELECT
  TO authenticated
  USING (auth.uid() = clinic_user_id);

-- platform_fee_settings: Public read access
CREATE POLICY "Anyone can view platform fee settings"
  ON platform_fee_settings FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 6. Functions & Triggers
-- ============================================

-- Function: update updated_at timestamp
CREATE OR REPLACE FUNCTION update_connected_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_platform_fees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_connected_accounts_updated_at ON connected_accounts;
CREATE TRIGGER update_connected_accounts_updated_at 
  BEFORE UPDATE ON connected_accounts 
  FOR EACH ROW EXECUTE FUNCTION update_connected_accounts_updated_at();

DROP TRIGGER IF EXISTS update_platform_fees_updated_at ON platform_fees;
CREATE TRIGGER update_platform_fees_updated_at 
  BEFORE UPDATE ON platform_fees 
  FOR EACH ROW EXECUTE FUNCTION update_platform_fees_updated_at();

-- ============================================
-- 7. Views para reportes
-- ============================================

-- Vista: Platform revenue summary
CREATE OR REPLACE VIEW platform_revenue_summary AS
SELECT
  DATE_TRUNC('day', pf.created_at) as date,
  COUNT(pf.id) as total_transactions,
  SUM(pf.total_amount) as gross_revenue,
  SUM(pf.fee_amount) as platform_revenue,
  SUM(pf.net_amount) as net_to_doctors,
  AVG(pf.fee_percentage) as avg_fee_percentage,
  COUNT(DISTINCT pf.clinic_user_id) as unique_doctors
FROM platform_fees pf
WHERE pf.status = 'collected'
GROUP BY DATE_TRUNC('day', pf.created_at)
ORDER BY date DESC;

-- Vista: Doctor earnings summary
CREATE OR REPLACE VIEW doctor_earnings_summary AS
SELECT
  pf.clinic_user_id,
  up.name as doctor_name,
  up.email as doctor_email,
  ca.stripe_account_id,
  COUNT(pf.id) as total_transactions,
  SUM(pf.total_amount) as gross_revenue,
  SUM(pf.fee_amount) as total_fees_paid,
  SUM(pf.net_amount) as net_earnings,
  AVG(pf.fee_percentage) as avg_fee_percentage,
  MIN(pf.created_at) as first_transaction,
  MAX(pf.created_at) as last_transaction
FROM platform_fees pf
LEFT JOIN user_profiles up ON up.user_id = pf.clinic_user_id
LEFT JOIN connected_accounts ca ON ca.user_id = pf.clinic_user_id
WHERE pf.status = 'collected'
GROUP BY pf.clinic_user_id, up.name, up.email, ca.stripe_account_id
ORDER BY net_earnings DESC;

-- ============================================
-- 8. Comments
-- ============================================

COMMENT ON TABLE connected_accounts IS 'Cuentas de Stripe Connect para cada médico';
COMMENT ON COLUMN connected_accounts.stripe_account_id IS 'ID de cuenta Stripe Connect (acct_xxxxx)';
COMMENT ON COLUMN connected_accounts.onboarding_completed IS 'Si completó el onboarding de Stripe';
COMMENT ON COLUMN connected_accounts.charges_enabled IS 'Si puede recibir pagos';
COMMENT ON COLUMN connected_accounts.payouts_enabled IS 'Si puede recibir transfers';

COMMENT ON TABLE platform_fees IS 'Tracking de comisiones cobradas por la plataforma';
COMMENT ON COLUMN platform_fees.fee_percentage IS 'Porcentaje de comisión aplicado (ej: 3.00 = 3%)';
COMMENT ON COLUMN platform_fees.stripe_application_fee_id IS 'ID de application fee en Stripe';

COMMENT ON TABLE platform_fee_settings IS 'Configuración global de comisiones de plataforma';
COMMENT ON COLUMN platform_fee_settings.fee_type IS 'percentage: % del monto | fixed: cantidad fija | hybrid: ambos';

COMMENT ON VIEW platform_revenue_summary IS 'Resumen diario de ingresos de plataforma';
COMMENT ON VIEW doctor_earnings_summary IS 'Resumen de ganancias por médico';
