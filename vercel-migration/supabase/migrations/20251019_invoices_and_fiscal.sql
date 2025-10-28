-- Migration: Add invoices and fiscal data tables for Facturama integration
-- Created: 2025-10-19

-- Table for storing user/clinic Facturama configuration (multi-tenant)
CREATE TABLE IF NOT EXISTS facturama_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Facturama API credentials (encrypted)
  api_user VARCHAR(255) NOT NULL, -- Facturama username
  api_password_encrypted TEXT NOT NULL, -- Encrypted password
  is_sandbox BOOLEAN DEFAULT true, -- true=testing, false=production
  
  -- Emisor (clinic/business) fiscal data
  emisor_rfc VARCHAR(13) NOT NULL,
  emisor_razon_social VARCHAR(255) NOT NULL,
  emisor_regimen_fiscal VARCHAR(10) NOT NULL, -- 612, 601, etc.
  emisor_codigo_postal VARCHAR(5) NOT NULL,
  
  -- Certificate files (CSD del SAT - stored in Supabase Storage)
  certificate_cer_url TEXT, -- .cer file URL
  certificate_key_url TEXT, -- .key file URL
  certificate_password_encrypted TEXT, -- Password for .key file
  
  -- Contact info
  emisor_email VARCHAR(255),
  emisor_telefono VARCHAR(20),
  emisor_direccion TEXT,
  emisor_ciudad VARCHAR(100),
  emisor_estado VARCHAR(50),
  
  -- Settings
  serie_default VARCHAR(10) DEFAULT 'A', -- Default invoice series
  folio_inicial INTEGER DEFAULT 1, -- Starting folio number
  auto_send_email BOOLEAN DEFAULT true, -- Send invoice to patient automatically
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_configured BOOLEAN DEFAULT false, -- true when all required fields are set
  last_validated_at TIMESTAMP WITH TIME ZONE,
  validation_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id) -- One config per user
);

-- Table for storing patient fiscal information (RFC, business name, etc.)
CREATE TABLE IF NOT EXISTS patient_fiscal_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  rfc VARCHAR(13) NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
  regimen_fiscal VARCHAR(10) NOT NULL, -- 601, 603, 605, 606, etc.
  codigo_postal VARCHAR(5) NOT NULL,
  uso_cfdi VARCHAR(10) DEFAULT 'G03', -- G01, G02, G03, etc.
  email_facturacion VARCHAR(255),
  telefono VARCHAR(20),
  direccion TEXT,
  ciudad VARCHAR(100),
  estado VARCHAR(50),
  pais VARCHAR(2) DEFAULT 'MEX',
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_id, rfc)
);

-- Table for storing invoices (facturas)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  fiscal_data_id UUID REFERENCES patient_fiscal_data(id),
  
  -- Facturama data
  facturama_id VARCHAR(100) UNIQUE, -- ID from Facturama
  folio_number VARCHAR(50), -- Invoice number
  serie VARCHAR(10),
  uuid VARCHAR(36) UNIQUE, -- UUID del CFDI (timbre fiscal)
  
  -- Invoice details
  fecha_emision TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_timbrado TIMESTAMP WITH TIME ZONE,
  subtotal DECIMAL(10, 2) NOT NULL,
  iva DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'MXN',
  tipo_comprobante VARCHAR(1) DEFAULT 'I', -- I=Ingreso, E=Egreso, T=Traslado
  
  -- Payment info
  forma_pago VARCHAR(10) NOT NULL, -- 01=Efectivo, 03=Transferencia, 04=Tarjeta, etc.
  metodo_pago VARCHAR(10) DEFAULT 'PUE', -- PUE=Pago en una sola exhibición, PPD=Pago en parcialidades
  
  -- Files (stored in Supabase Storage)
  xml_url TEXT, -- URL to XML file
  pdf_url TEXT, -- URL to PDF file
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, issued, sent, cancelled
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Metadata
  notas TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for linking invoices to records (many-to-many)
-- Note: Using UUID for record_id to match current records table
CREATE TABLE IF NOT EXISTS invoice_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  monto DECIMAL(10, 2) NOT NULL, -- Amount billed from this record
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invoice_id, record_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_facturama_config_user ON facturama_config(user_id);
CREATE INDEX IF NOT EXISTS idx_facturama_config_active ON facturama_config(is_active, is_configured);
CREATE INDEX IF NOT EXISTS idx_fiscal_data_patient ON patient_fiscal_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_data_rfc ON patient_fiscal_data(rfc);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_uuid ON invoices(uuid);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_fecha ON invoices(fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_records_invoice ON invoice_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_records_record ON invoice_records(record_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER facturama_config_updated_at
  BEFORE UPDATE ON facturama_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER fiscal_data_updated_at
  BEFORE UPDATE ON patient_fiscal_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE facturama_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_fiscal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_records ENABLE ROW LEVEL SECURITY;

-- Users can only access their own Facturama config
CREATE POLICY "Users can view own facturama_config" ON facturama_config
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own facturama_config" ON facturama_config
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own facturama_config" ON facturama_config
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Allow authenticated users to read all fiscal data
CREATE POLICY "Allow authenticated read fiscal_data" ON patient_fiscal_data
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert fiscal_data" ON patient_fiscal_data
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update fiscal_data" ON patient_fiscal_data
  FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to manage invoices
CREATE POLICY "Allow authenticated read invoices" ON invoices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert invoices" ON invoices
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update invoices" ON invoices
  FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to manage invoice_records
CREATE POLICY "Allow authenticated read invoice_records" ON invoice_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert invoice_records" ON invoice_records
  FOR INSERT TO authenticated WITH CHECK (true);

-- Comments
COMMENT ON TABLE facturama_config IS 'Stores user/clinic Facturama API credentials and configuration (multi-tenant, one per user)';
COMMENT ON TABLE patient_fiscal_data IS 'Stores patient fiscal information for invoice generation (RFC, business name, etc.)';
COMMENT ON TABLE invoices IS 'Stores invoices generated through Facturama API';
COMMENT ON TABLE invoice_records IS 'Links invoices to treatment records (many-to-many relationship)';
COMMENT ON COLUMN facturama_config.api_password_encrypted IS 'Encrypted Facturama API password';
COMMENT ON COLUMN facturama_config.certificate_password_encrypted IS 'Encrypted password for .key certificate file';
COMMENT ON COLUMN facturama_config.is_sandbox IS 'true=Facturama sandbox (testing), false=production';
COMMENT ON COLUMN invoices.uuid IS 'UUID del timbre fiscal (SAT)';
COMMENT ON COLUMN invoices.forma_pago IS 'Catálogo SAT c_FormaPago: 01=Efectivo, 03=Transferencia, 04=Tarjeta';
COMMENT ON COLUMN invoices.metodo_pago IS 'PUE=Pago en una exhibición, PPD=Pago en parcialidades';
