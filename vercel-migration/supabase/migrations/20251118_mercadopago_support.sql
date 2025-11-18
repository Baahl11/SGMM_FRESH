-- ============================================================================
-- ADD MERCADOPAGO SUPPORT TO SUBSCRIPTIONS
-- ============================================================================
-- Created: 2025-11-18
-- Description: Agregar columnas para soportar Mercado Pago como pasarela de pago
-- ============================================================================

-- Agregar columnas para Mercado Pago
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'mercadopago', 'admin')),
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_payer_id TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_preapproval_id TEXT;

-- Índices para lookups rápidos
CREATE INDEX IF NOT EXISTS idx_subscriptions_mercadopago_payment
  ON subscriptions(mercadopago_payment_id)
  WHERE mercadopago_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_mercadopago_preapproval
  ON subscriptions(mercadopago_preapproval_id)
  WHERE mercadopago_preapproval_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_provider
  ON subscriptions(payment_provider);

-- Comentarios
COMMENT ON COLUMN subscriptions.payment_provider IS 'Payment gateway: stripe, mercadopago, or admin (lifetime/test)';
COMMENT ON COLUMN subscriptions.mercadopago_payment_id IS 'Mercado Pago payment ID';
COMMENT ON COLUMN subscriptions.mercadopago_payer_id IS 'Mercado Pago payer ID';
COMMENT ON COLUMN subscriptions.mercadopago_preapproval_id IS 'Mercado Pago subscription preapproval ID';
