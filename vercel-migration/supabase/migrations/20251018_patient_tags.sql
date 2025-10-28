-- Migration: Patient Tags System
-- Description: Add tags functionality to organize patients (VIP, Moroso, Urgente, etc)

-- Table: patient_tags
-- Stores available tags with colors
CREATE TABLE IF NOT EXISTS patient_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT, -- optional icon name (lucide-react)
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Table: patient_tag_assignments
-- Many-to-many relationship between patients and tags
CREATE TABLE IF NOT EXISTS patient_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES patient_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(patient_id, tag_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_tags_name ON patient_tags(name);
CREATE INDEX IF NOT EXISTS idx_patient_tag_assignments_patient ON patient_tag_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_tag_assignments_tag ON patient_tag_assignments(tag_id);

-- RLS Policies
ALTER TABLE patient_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Everyone can read tags
CREATE POLICY "Allow read access to all tags"
  ON patient_tags FOR SELECT
  USING (true);

-- Only authenticated users can create/update/delete tags
CREATE POLICY "Allow authenticated users to manage tags"
  ON patient_tags FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Everyone can read tag assignments
CREATE POLICY "Allow read access to all tag assignments"
  ON patient_tag_assignments FOR SELECT
  USING (true);

-- Only authenticated users can manage tag assignments
CREATE POLICY "Allow authenticated users to manage tag assignments"
  ON patient_tag_assignments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert default tags
INSERT INTO patient_tags (name, color, icon, description) VALUES
  ('VIP', '#fbbf24', 'Crown', 'Paciente VIP - Alta prioridad'),
  ('Moroso', '#ef4444', 'AlertCircle', 'Tiene pagos pendientes'),
  ('Urgente', '#f97316', 'AlertTriangle', 'Requiere atención urgente'),
  ('Nuevo', '#10b981', 'Sparkles', 'Paciente nuevo'),
  ('Seguimiento', '#3b82f6', 'Clock', 'En seguimiento activo'),
  ('Referido', '#8b5cf6', 'Users', 'Llegó por recomendación')
ON CONFLICT (name) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patient_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER patient_tags_updated_at
  BEFORE UPDATE ON patient_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_tags_updated_at();
