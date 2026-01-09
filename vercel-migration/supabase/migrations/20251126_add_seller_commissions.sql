-- Migration: Add seller commission tracking
-- Date: 2025-11-26
-- Description: Adds tables to track individual sellers and their commissions

-- ============================================
-- 1. TABLA DE VENDEDORES
-- ============================================
CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY, -- 'vendedor-juan', 'vendedor-maria', etc.
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  sales_team TEXT DEFAULT 'distributor', -- Siempre 'distributor' para vendedores externos
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar vendedores activos
CREATE INDEX IF NOT EXISTS idx_sellers_active ON sellers(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_sellers_team ON sellers(sales_team);

-- ============================================
-- 2. TABLA DE COMISIONES DE VENDEDORES
-- ============================================
CREATE TABLE IF NOT EXISTS seller_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  seller_id TEXT REFERENCES sellers(id),
  user_id UUID REFERENCES users(id), -- El médico/cliente
  
  -- Información del período
  month_number INT NOT NULL, -- 1 = trial, 2 = mes del vendedor, 3+ = normal
  billing_date TIMESTAMPTZ NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  -- Etapa de comisión
  commission_stage TEXT CHECK (commission_stage IN ('trial', 'seller_month', 'normal', 'cancelled')) NOT NULL,
  
  -- Montos
  gross_amount DECIMAL(10,2) NOT NULL, -- Lo que pagó el cliente
  commission_amount DECIMAL(10,2) DEFAULT 0, -- Lo que le toca al vendedor
  commission_percent DECIMAL(5,2) DEFAULT 0, -- Porcentaje de comisión
  
  -- Estado de pago
  paid_to_seller BOOLEAN DEFAULT false,
  payment_date TIMESTAMPTZ,
  payment_method TEXT, -- 'bank_transfer', 'cash', 'stripe_transfer'
  payment_reference TEXT, -- Número de transferencia, etc.
  
  -- Cancelación
  cancelled BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Metadata
  stripe_invoice_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_seller_commissions_seller ON seller_commissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_commissions_subscription ON seller_commissions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_seller_commissions_stage ON seller_commissions(commission_stage);
CREATE INDEX IF NOT EXISTS idx_seller_commissions_paid ON seller_commissions(paid_to_seller) WHERE paid_to_seller = false;
CREATE INDEX IF NOT EXISTS idx_seller_commissions_billing_date ON seller_commissions(billing_date DESC);

-- ============================================
-- 3. AGREGAR SELLER_ID A SUBSCRIPTIONS
-- ============================================
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS seller_id TEXT REFERENCES sellers(id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_seller ON subscriptions(seller_id);

-- ============================================
-- 4. FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_commissions_updated_at BEFORE UPDATE ON seller_commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. VISTAS ÚTILES PARA REPORTES
-- ============================================

-- Vista: Comisiones pendientes de pago
CREATE OR REPLACE VIEW pending_seller_payments AS
SELECT 
  sc.id,
  sc.seller_id,
  s.name as seller_name,
  sc.subscription_id,
  u.email as customer_email,
  u.name as customer_name,
  sc.month_number,
  sc.billing_date,
  sc.commission_stage,
  sc.gross_amount,
  sc.commission_amount,
  sc.stripe_invoice_id,
  sc.created_at
FROM seller_commissions sc
JOIN sellers s ON sc.seller_id = s.id
JOIN users u ON sc.user_id = u.id
WHERE sc.paid_to_seller = false 
  AND sc.cancelled = false
  AND sc.commission_amount > 0
ORDER BY sc.billing_date DESC;

-- Vista: Resumen de comisiones por vendedor
CREATE OR REPLACE VIEW seller_commission_summary AS
SELECT 
  s.id as seller_id,
  s.name as seller_name,
  s.email as seller_email,
  COUNT(DISTINCT sc.subscription_id) as total_sales,
  COUNT(CASE WHEN sc.commission_stage = 'seller_month' THEN 1 END) as commissions_earned,
  SUM(CASE WHEN sc.paid_to_seller = false AND sc.cancelled = false THEN sc.commission_amount ELSE 0 END) as pending_amount,
  SUM(CASE WHEN sc.paid_to_seller = true THEN sc.commission_amount ELSE 0 END) as paid_amount,
  SUM(sc.commission_amount) as total_commission_amount
FROM sellers s
LEFT JOIN seller_commissions sc ON s.id = sc.seller_id
WHERE s.active = true
GROUP BY s.id, s.name, s.email
ORDER BY total_sales DESC;

-- ============================================
-- 6. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================
COMMENT ON TABLE sellers IS 'Vendedores individuales de la distribuidora';
COMMENT ON TABLE seller_commissions IS 'Registro de comisiones por vendedor con timeline: Mes 1 (trial gratis), Mes 2 (100% vendedor), Mes 3+ (70% plataforma, 30% distribuidora)';

COMMENT ON COLUMN seller_commissions.month_number IS 'Número de mes desde que inició la suscripción: 1=trial gratis, 2=mes del vendedor, 3+=división normal';
COMMENT ON COLUMN seller_commissions.commission_stage IS 'Etapa de comisión: trial (gratis), seller_month (100% vendedor), normal (70/30 split), cancelled (cliente canceló)';
COMMENT ON COLUMN seller_commissions.commission_amount IS 'Monto a pagar al vendedor (solo mes 2 tiene monto > 0)';
COMMENT ON COLUMN seller_commissions.paid_to_seller IS 'Si ya se pagó al vendedor por transferencia bancaria';

-- ============================================
-- 7. DATOS DE EJEMPLO (ELIMINAR O MODIFICAR)
-- ============================================
-- Insertar los 5 vendedores de la distribuidora
INSERT INTO sellers (id, name, email, phone, active) VALUES
  ('vendedor-juan', 'Juan Pérez', 'juan@distribuidora.com', '+52 55 1234 5601', true),
  ('vendedor-maria', 'María González', 'maria@distribuidora.com', '+52 55 1234 5602', true),
  ('vendedor-carlos', 'Carlos López', 'carlos@distribuidora.com', '+52 55 1234 5603', true),
  ('vendedor-ana', 'Ana Martínez', 'ana@distribuidora.com', '+52 55 1234 5604', true),
  ('vendedor-pedro', 'Pedro Sánchez', 'pedro@distribuidora.com', '+52 55 1234 5605', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
-- Ejecutar estas queries para verificar que todo se creó correctamente:

-- SELECT * FROM sellers;
-- SELECT * FROM pending_seller_payments;
-- SELECT * FROM seller_commission_summary;
