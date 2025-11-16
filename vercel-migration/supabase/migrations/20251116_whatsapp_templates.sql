-- ============================================================================
-- WHATSAPP MESSAGE TEMPLATES SYSTEM
-- ============================================================================
-- Created: 2025-11-16
-- Description: Sistema de templates de WhatsApp Business que deben ser
--              aprobados por Meta antes de poder usarse.
-- Policy: Templates deben seguir formato de Meta Business API
-- ============================================================================

-- ============================================================================
-- 1. WHATSAPP TEMPLATES TABLE
-- ============================================================================
-- Stores WhatsApp message templates submitted to Meta for approval
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template identification
  name TEXT NOT NULL, -- Template name (lowercase, no spaces, max 512 chars)
  category TEXT NOT NULL DEFAULT 'MARKETING', -- MARKETING, UTILITY, AUTHENTICATION
  language TEXT NOT NULL DEFAULT 'es_MX',
  
  -- Template content
  header_type TEXT, -- 'text', 'image', 'video', 'document', null
  header_text TEXT, -- Solo si header_type = 'text' (max 60 chars)
  header_media_url TEXT, -- URL si header_type = 'image', 'video', 'document'
  
  body_text TEXT NOT NULL, -- Main message (max 1024 chars, usa {{1}}, {{2}}, etc.)
  footer_text TEXT, -- Optional footer (max 60 chars)
  
  -- Interactive buttons (max 3 quick reply buttons OR 2 call-to-action buttons)
  buttons JSONB, -- Array de botones: [{type: 'QUICK_REPLY', text: 'Confirmar'}, ...]
  
  -- Meta approval status
  meta_template_id TEXT, -- ID asignado por Meta cuando se aprueba
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending, approved, rejected
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Usage tracking
  total_sent INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, name) -- No duplicar templates por usuario
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_user_id 
  ON whatsapp_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status 
  ON whatsapp_templates(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_meta_id 
  ON whatsapp_templates(meta_template_id);

-- ============================================================================
-- 2. PATIENT WHATSAPP CONSENT TABLE (Opt-in/Opt-out)
-- ============================================================================
-- Stores patient consent for WhatsApp messages (GDPR/Privacy compliance)
CREATE TABLE IF NOT EXISTS patient_whatsapp_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Consent status
  has_consented BOOLEAN DEFAULT false,
  consent_method TEXT, -- 'verbal', 'written_form', 'checkbox', 'whatsapp_reply'
  consent_date TIMESTAMPTZ,
  consent_ip_address TEXT,
  
  -- Opt-out
  opted_out BOOLEAN DEFAULT false,
  opted_out_date TIMESTAMPTZ,
  opt_out_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, patient_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_whatsapp_consent_user_id 
  ON patient_whatsapp_consent(user_id);

CREATE INDEX IF NOT EXISTS idx_patient_whatsapp_consent_patient_id 
  ON patient_whatsapp_consent(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_whatsapp_consent_status 
  ON patient_whatsapp_consent(has_consented, opted_out);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_whatsapp_consent ENABLE ROW LEVEL SECURITY;

-- Policies for whatsapp_templates
CREATE POLICY "Users can view their own templates"
  ON whatsapp_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON whatsapp_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON whatsapp_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON whatsapp_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for patient_whatsapp_consent
CREATE POLICY "Users can view their patients' consent"
  ON patient_whatsapp_consent FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create consent records for their patients"
  ON patient_whatsapp_consent FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update consent records for their patients"
  ON patient_whatsapp_consent FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete consent records for their patients"
  ON patient_whatsapp_consent FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. UPDATE TRIGGER FOR updated_at
-- ============================================================================

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_whatsapp_consent_updated_at
  BEFORE UPDATE ON patient_whatsapp_consent
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. SEED DATA - Templates Pre-configurados
-- ============================================================================
-- Templates comunes que los doctores pueden usar como base
-- NOTA: Estos templates DEBEN ser aprobados por Meta antes de usarse

-- Comentamos el seed porque cada doctor debe enviar sus propios templates a Meta
-- con su WhatsApp Business Account

/*
-- Template: Recordatorio de cita 24h
INSERT INTO whatsapp_templates (
  user_id,
  name,
  category,
  language,
  body_text,
  buttons,
  status
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Placeholder
  'recordatorio_cita_24h',
  'UTILITY',
  'es_MX',
  'Hola {{1}} 👋

Te recordamos tu cita médica:
📅 Fecha: {{2}}
🕐 Hora: {{3}}
👨‍⚕️ Doctor: {{4}}
📍 Ubicación: {{5}}

Es mañana, ¡te esperamos!',
  '[
    {"type": "QUICK_REPLY", "text": "Confirmar ✅"},
    {"type": "QUICK_REPLY", "text": "Reagendar 📅"}
  ]'::jsonb,
  'draft'
);

-- Template: Recordatorio de cita 2h
INSERT INTO whatsapp_templates (
  user_id,
  name,
  category,
  language,
  body_text,
  buttons,
  status
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'recordatorio_cita_2h',
  'UTILITY',
  'es_MX',
  '⏰ Tu cita es en 2 HORAS

👤 Paciente: {{1}}
🕐 Hora: {{2}}
👨‍⚥️ Doctor: {{3}}
📍 {{4}}

Por favor llega 10 minutos antes.',
  '[
    {"type": "QUICK_REPLY", "text": "Confirmado 👍"}
  ]'::jsonb,
  'draft'
);

-- Template: Confirmación de cita
INSERT INTO whatsapp_templates (
  user_id,
  name,
  category,
  language,
  body_text,
  buttons,
  status
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'confirmacion_cita',
  'UTILITY',
  'es_MX',
  '✅ Tu cita ha sido confirmada

👤 Paciente: {{1}}
📅 Fecha: {{2}}
🕐 Hora: {{3}}
👨‍⚕️ Doctor: {{4}}
📍 Ubicación: {{5}}

Recibirás un recordatorio 24 horas antes.',
  '[]'::jsonb,
  'draft'
);

-- Template: Cancelación de cita
INSERT INTO whatsapp_templates (
  user_id,
  name,
  category,
  language,
  body_text,
  buttons,
  status
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'cancelacion_cita',
  'UTILITY',
  'es_MX',
  '❌ Tu cita ha sido cancelada

👤 Paciente: {{1}}
📅 Fecha original: {{2}}
🕐 Hora original: {{3}}

Si deseas reagendar, contáctanos.',
  '[
    {"type": "QUICK_REPLY", "text": "Reagendar 📅"}
  ]'::jsonb,
  'draft'
);
*/

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE whatsapp_templates IS 
  'Message templates que deben ser aprobados por Meta Business antes de usarse. Formato según WhatsApp Business API.';

COMMENT ON COLUMN whatsapp_templates.name IS 
  'Nombre único del template (lowercase, sin espacios, max 512 chars). Ejemplo: recordatorio_cita_24h';

COMMENT ON COLUMN whatsapp_templates.category IS 
  'MARKETING (promociones), UTILITY (recordatorios, confirmaciones), AUTHENTICATION (OTP)';

COMMENT ON COLUMN whatsapp_templates.body_text IS 
  'Texto principal del mensaje. Usa {{1}}, {{2}}, etc. para variables. Max 1024 caracteres.';

COMMENT ON COLUMN whatsapp_templates.buttons IS 
  'Array JSON de botones. Max 3 QUICK_REPLY o 2 CALL_TO_ACTION. Ejemplo: [{"type": "QUICK_REPLY", "text": "Confirmar"}]';

COMMENT ON COLUMN whatsapp_templates.status IS 
  'draft = no enviado a Meta, pending = esperando aprobación, approved = listo para usar, rejected = rechazado por Meta';

COMMENT ON TABLE patient_whatsapp_consent IS 
  'Gestión de consentimiento de pacientes para recibir mensajes de WhatsApp (cumplimiento GDPR/LFPDPPP).';

COMMENT ON COLUMN patient_whatsapp_consent.has_consented IS 
  'true = paciente aceptó recibir WhatsApp, false = no ha dado consentimiento';

COMMENT ON COLUMN patient_whatsapp_consent.opted_out IS 
  'true = paciente solicitó dejar de recibir mensajes';
