-- Create bundles table
CREATE TABLE IF NOT EXISTS bundles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_total DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create bundle_treatments junction table
CREATE TABLE IF NOT EXISTS bundle_treatments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(bundle_id, treatment_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bundles_activo ON bundles(activo);
CREATE INDEX IF NOT EXISTS idx_bundles_created_at ON bundles(created_at);
CREATE INDEX IF NOT EXISTS idx_bundle_treatments_bundle_id ON bundle_treatments(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_treatments_treatment_id ON bundle_treatments(treatment_id);

-- Enable RLS (Row Level Security)
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_treatments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust as needed based on your auth system)
CREATE POLICY "Users can view bundles" ON bundles FOR SELECT USING (true);
CREATE POLICY "Users can insert bundles" ON bundles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update bundles" ON bundles FOR UPDATE USING (true);
CREATE POLICY "Users can delete bundles" ON bundles FOR DELETE USING (true);

CREATE POLICY "Users can view bundle_treatments" ON bundle_treatments FOR SELECT USING (true);
CREATE POLICY "Users can insert bundle_treatments" ON bundle_treatments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update bundle_treatments" ON bundle_treatments FOR UPDATE USING (true);
CREATE POLICY "Users can delete bundle_treatments" ON bundle_treatments FOR DELETE USING (true);

-- Update function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for bundles
CREATE TRIGGER update_bundles_updated_at BEFORE UPDATE ON bundles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();