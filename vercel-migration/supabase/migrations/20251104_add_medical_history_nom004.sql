-- Migration: Add Medical History fields for NOM-004-SSA3-2012 compliance
-- Created: 2025-11-04
-- Purpose: Complete electronic medical record per Mexican standard

-- ============================================
-- 1. EXTEND PATIENTS TABLE WITH DEMOGRAPHIC DATA
-- ============================================

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS domicilio TEXT,
ADD COLUMN IF NOT EXISTS estado_civil TEXT CHECK (estado_civil IN ('soltero', 'casado', 'viudo', 'divorciado', 'union_libre')),
ADD COLUMN IF NOT EXISTS ocupacion TEXT,
ADD COLUMN IF NOT EXISTS lugar_nacimiento TEXT,
ADD COLUMN IF NOT EXISTS religion TEXT;

COMMENT ON COLUMN patients.domicilio IS 'Dirección completa del paciente';
COMMENT ON COLUMN patients.estado_civil IS 'Estado civil: soltero, casado, viudo, divorciado, union_libre';
COMMENT ON COLUMN patients.ocupacion IS 'Ocupación o profesión del paciente';
COMMENT ON COLUMN patients.lugar_nacimiento IS 'Lugar de nacimiento';
COMMENT ON COLUMN patients.religion IS 'Religión (opcional)';

-- ============================================
-- 2. CREATE MEDICAL_HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Antecedentes Heredo-Familiares
  antecedentes_heredofamiliares TEXT,
  diabetes_familiar BOOLEAN DEFAULT FALSE,
  hipertension_familiar BOOLEAN DEFAULT FALSE,
  cancer_familiar BOOLEAN DEFAULT FALSE,
  cardiopatias_familiar BOOLEAN DEFAULT FALSE,
  otros_familiares TEXT,
  
  -- Antecedentes Personales No Patológicos
  tabaquismo BOOLEAN DEFAULT FALSE,
  tabaquismo_detalles TEXT,
  alcoholismo BOOLEAN DEFAULT FALSE,
  alcoholismo_detalles TEXT,
  drogas BOOLEAN DEFAULT FALSE,
  drogas_detalles TEXT,
  ejercicio TEXT,
  alimentacion TEXT,
  higiene TEXT,
  
  -- Antecedentes Personales Patológicos
  antecedentes_patologicos TEXT,
  hospitalizaciones_previas TEXT,
  cirugias_previas TEXT,
  traumatismos TEXT,
  transfusiones TEXT,
  
  -- Antecedentes Gineco-Obstétricos (si aplica)
  menarca INTEGER,
  gestaciones INTEGER,
  partos INTEGER,
  cesareas INTEGER,
  abortos INTEGER,
  fum DATE,
  metodo_anticonceptivo TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: un solo registro de historia por paciente
  UNIQUE(patient_id)
);

CREATE INDEX IF NOT EXISTS idx_medical_history_patient 
ON medical_history(patient_id);

CREATE INDEX IF NOT EXISTS idx_medical_history_user 
ON medical_history(user_id);

-- ============================================
-- 3. CREATE ALLERGIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS patient_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  tipo_alergia TEXT NOT NULL CHECK (tipo_alergia IN ('medicamento', 'alimento', 'ambiental', 'otro')),
  alergeno TEXT NOT NULL,
  reaccion TEXT,
  severidad TEXT CHECK (severidad IN ('leve', 'moderada', 'severa', 'anafilaxia')),
  notas TEXT,
  fecha_descubrimiento DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient 
ON patient_allergies(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_allergies_user 
ON patient_allergies(user_id);

-- ============================================
-- 4. CREATE CURRENT_MEDICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS current_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  medicamento TEXT NOT NULL,
  dosis TEXT NOT NULL,
  frecuencia TEXT NOT NULL,
  via_administracion TEXT,
  indicacion TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  activo BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_current_medications_patient 
ON current_medications(patient_id);

CREATE INDEX IF NOT EXISTS idx_current_medications_user 
ON current_medications(user_id);

CREATE INDEX IF NOT EXISTS idx_current_medications_active 
ON current_medications(patient_id, activo) 
WHERE activo = TRUE;

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_medications ENABLE ROW LEVEL SECURITY;

-- Policies for medical_history
CREATE POLICY "Users can view own patients medical history"
  ON medical_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patients medical history"
  ON medical_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patients medical history"
  ON medical_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own patients medical history"
  ON medical_history FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for patient_allergies
CREATE POLICY "Users can view own patients allergies"
  ON patient_allergies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patients allergies"
  ON patient_allergies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patients allergies"
  ON patient_allergies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own patients allergies"
  ON patient_allergies FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for current_medications
CREATE POLICY "Users can view own patients medications"
  ON current_medications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patients medications"
  ON current_medications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patients medications"
  ON current_medications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own patients medications"
  ON current_medications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_medical_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_medical_history_updated_at
  BEFORE UPDATE ON medical_history
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_history_updated_at();

CREATE TRIGGER set_patient_allergies_updated_at
  BEFORE UPDATE ON patient_allergies
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_history_updated_at();

CREATE TRIGGER set_current_medications_updated_at
  BEFORE UPDATE ON current_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_history_updated_at();

-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE medical_history IS 
  'Historia clínica completa del paciente según NOM-004-SSA3-2012';

COMMENT ON TABLE patient_allergies IS 
  'Registro de alergias del paciente (medicamentos, alimentos, ambientales)';

COMMENT ON TABLE current_medications IS 
  'Medicamentos actuales que toma el paciente';

COMMENT ON COLUMN patient_allergies.severidad IS 
  'Severidad: leve, moderada, severa, anafilaxia';

COMMENT ON COLUMN current_medications.activo IS 
  'Indica si el medicamento sigue siendo tomado actualmente';
