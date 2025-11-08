-- =====================================================
-- MIGRATION 009: INTAKE FORMS SYSTEM
-- =====================================================
-- Features:
-- 1. Form builder con campos personalizables
-- 2. Form submissions por pacientes (sin auth)
-- 3. Tracking de completado
-- 4. Auto-populate data en patient records
-- =====================================================

-- =====================================================
-- 1. INTAKE_FORMS TABLE
-- =====================================================
-- Formularios creados por el doctor
CREATE TABLE IF NOT EXISTS intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_template BOOLEAN DEFAULT false, -- true si es template pre-cargado
  category VARCHAR(100), -- 'medical_history', 'consent', 'questionnaire', etc.
  
  -- Form fields (JSON array)
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [
  --   {
  --     "id": "field_1",
  --     "type": "text",
  --     "label": "Nombre completo",
  --     "placeholder": "Juan Pérez",
  --     "required": true,
  --     "order": 1
  --   },
  --   {
  --     "id": "field_2",
  --     "type": "select",
  --     "label": "¿Toma medicamentos?",
  --     "options": ["Sí", "No"],
  --     "required": true,
  --     "order": 2
  --   }
  -- ]
  
  -- Settings
  require_signature BOOLEAN DEFAULT false,
  allow_file_upload BOOLEAN DEFAULT false,
  multi_language BOOLEAN DEFAULT false,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_intake_forms_user_id ON intake_forms(user_id);
CREATE INDEX idx_intake_forms_category ON intake_forms(category);
CREATE INDEX idx_intake_forms_active ON intake_forms(active);

-- =====================================================
-- 2. FORM_SUBMISSIONS TABLE
-- =====================================================
-- Respuestas de pacientes a los formularios
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  form_id UUID NOT NULL REFERENCES intake_forms(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  
  -- Submission data
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: {
  --   "field_1": "Juan Alberto Pérez López",
  --   "field_2": "Sí",
  --   "field_3": "Metformina 850mg",
  --   "field_allergies": "Penicilina"
  -- }
  
  -- Signature (if required)
  signature_data TEXT, -- base64 PNG
  signature_timestamp TIMESTAMPTZ,
  
  -- Files uploaded (if allowed)
  uploaded_files JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"filename": "foto.jpg", "url": "https://...", "size": 1024}]
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed', -- 'draft', 'completed'
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_patient_id ON form_submissions(patient_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_submitted_at ON form_submissions(submitted_at DESC);

-- =====================================================
-- 3. FORM_TOKENS TABLE
-- =====================================================
-- Tokens únicos para acceso público a formularios
CREATE TABLE IF NOT EXISTS form_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  form_id UUID NOT NULL REFERENCES intake_forms(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Token
  token VARCHAR(255) NOT NULL UNIQUE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'expired'
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Tracking
  sent_via VARCHAR(50), -- 'whatsapp', 'email', 'sms'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_form_tokens_token ON form_tokens(token);
CREATE INDEX idx_form_tokens_form_id ON form_tokens(form_id);
CREATE INDEX idx_form_tokens_patient_id ON form_tokens(patient_id);
CREATE INDEX idx_form_tokens_status ON form_tokens(status);
CREATE INDEX idx_form_tokens_expires_at ON form_tokens(expires_at);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_tokens ENABLE ROW LEVEL SECURITY;

-- intake_forms policies
CREATE POLICY "Users can view their own forms"
  ON intake_forms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forms"
  ON intake_forms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms"
  ON intake_forms FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms"
  ON intake_forms FOR DELETE
  USING (auth.uid() = user_id);

-- form_submissions policies
CREATE POLICY "Users can view submissions for their forms"
  ON form_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM intake_forms
      WHERE intake_forms.id = form_submissions.form_id
      AND intake_forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can submit forms via public link"
  ON form_submissions FOR INSERT
  WITH CHECK (true); -- Validado por token en API

CREATE POLICY "Users can update submissions for their forms"
  ON form_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM intake_forms
      WHERE intake_forms.id = form_submissions.form_id
      AND intake_forms.user_id = auth.uid()
    )
  );

-- form_tokens policies
CREATE POLICY "Users can view tokens for their forms"
  ON form_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM intake_forms
      WHERE intake_forms.id = form_tokens.form_id
      AND intake_forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tokens for their forms"
  ON form_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM intake_forms
      WHERE intake_forms.id = form_tokens.form_id
      AND intake_forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tokens for their forms"
  ON form_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM intake_forms
      WHERE intake_forms.id = form_tokens.form_id
      AND intake_forms.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_intake_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intake_forms_updated_at_trigger
  BEFORE UPDATE ON intake_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_intake_forms_updated_at();

-- Function to check if token is valid
CREATE OR REPLACE FUNCTION is_form_token_valid(token_value VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM form_tokens
    WHERE token = token_value
    AND status = 'pending'
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to mark token as completed
CREATE OR REPLACE FUNCTION complete_form_token(token_value VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE form_tokens
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE token = token_value;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. PRE-LOADED TEMPLATES
-- =====================================================

-- Template 1: Historia Clínica General
INSERT INTO intake_forms (user_id, name, description, is_template, category, fields, require_signature)
SELECT 
  id,
  'Historia Clínica General',
  'Formulario básico de historia clínica para primera consulta',
  true,
  'medical_history',
  '[
    {"id": "nombre", "type": "text", "label": "Nombre completo", "required": true, "order": 1},
    {"id": "fecha_nacimiento", "type": "date", "label": "Fecha de nacimiento", "required": true, "order": 2},
    {"id": "sexo", "type": "select", "label": "Sexo", "options": ["Masculino", "Femenino", "Otro"], "required": true, "order": 3},
    {"id": "telefono", "type": "phone", "label": "Teléfono", "required": true, "order": 4},
    {"id": "email", "type": "email", "label": "Email", "required": false, "order": 5},
    {"id": "alergias", "type": "textarea", "label": "¿Tiene alergias conocidas?", "placeholder": "Medicamentos, alimentos, otros...", "required": true, "order": 6},
    {"id": "medicamentos", "type": "textarea", "label": "¿Toma algún medicamento actualmente?", "placeholder": "Liste todos los medicamentos...", "required": true, "order": 7},
    {"id": "enfermedades", "type": "textarea", "label": "Enfermedades previas o crónicas", "placeholder": "Diabetes, hipertensión, etc.", "required": false, "order": 8},
    {"id": "cirugias", "type": "textarea", "label": "Cirugías previas", "placeholder": "Liste todas las cirugías...", "required": false, "order": 9},
    {"id": "motivo_consulta", "type": "textarea", "label": "Motivo de la consulta", "required": true, "order": 10}
  ]'::jsonb,
  true
FROM auth.users
WHERE email LIKE '%admin%' OR email LIKE '%test%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Template 2: Consentimiento Informado
INSERT INTO intake_forms (user_id, name, description, is_template, category, fields, require_signature)
SELECT 
  id,
  'Consentimiento Informado',
  'Consentimiento legal para procedimientos médicos',
  true,
  'consent',
  '[
    {"id": "nombre", "type": "text", "label": "Nombre completo", "required": true, "order": 1},
    {"id": "acepto_procedimiento", "type": "checkbox", "label": "Autorizo al médico a realizar el procedimiento explicado", "required": true, "order": 2},
    {"id": "entiendo_riesgos", "type": "checkbox", "label": "Entiendo los riesgos y complicaciones potenciales", "required": true, "order": 3},
    {"id": "puedo_preguntar", "type": "checkbox", "label": "He tenido oportunidad de hacer preguntas", "required": true, "order": 4},
    {"id": "fecha", "type": "date", "label": "Fecha", "required": true, "order": 5}
  ]'::jsonb,
  true
FROM auth.users
WHERE email LIKE '%admin%' OR email LIKE '%test%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE intake_forms IS 'Formularios personalizables creados por doctores';
COMMENT ON TABLE form_submissions IS 'Respuestas de pacientes a formularios';
COMMENT ON TABLE form_tokens IS 'Tokens únicos para acceso público a formularios';
