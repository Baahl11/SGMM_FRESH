-- Migration: Create bundles system
-- Date: 2025-01-17
-- Description: Tables for treatment bundles/packages

-- Bundles table (main)
CREATE TABLE IF NOT EXISTS bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio_total DECIMAL(10, 2) NOT NULL,
  descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bundle-Treatments junction table
CREATE TABLE IF NOT EXISTS bundle_treatments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  cantidad INTEGER DEFAULT 1,
  precio_individual DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bundle_id, treatment_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bundles_user_id ON bundles(user_id);
CREATE INDEX IF NOT EXISTS idx_bundles_activo ON bundles(activo);
CREATE INDEX IF NOT EXISTS idx_bundle_treatments_bundle_id ON bundle_treatments(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_treatments_treatment_id ON bundle_treatments(treatment_id);

-- RLS Policies
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_treatments ENABLE ROW LEVEL SECURITY;

-- Bundles: users can only see their own bundles
CREATE POLICY "Users can view own bundles"
  ON bundles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bundles"
  ON bundles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bundles"
  ON bundles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bundles"
  ON bundles FOR DELETE
  USING (auth.uid() = user_id);

-- Bundle treatments: access through bundle ownership
CREATE POLICY "Users can view bundle treatments through bundle ownership"
  ON bundle_treatments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bundles 
      WHERE bundles.id = bundle_treatments.bundle_id 
      AND bundles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert bundle treatments for own bundles"
  ON bundle_treatments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bundles 
      WHERE bundles.id = bundle_treatments.bundle_id 
      AND bundles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update bundle treatments for own bundles"
  ON bundle_treatments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bundles 
      WHERE bundles.id = bundle_treatments.bundle_id 
      AND bundles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete bundle treatments for own bundles"
  ON bundle_treatments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bundles 
      WHERE bundles.id = bundle_treatments.bundle_id 
      AND bundles.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_bundles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bundles_updated_at ON bundles;
CREATE TRIGGER bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_bundles_updated_at();
