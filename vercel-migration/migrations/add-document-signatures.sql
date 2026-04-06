-- Migration: Signable documents (consentimientos informados)
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS document_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  content      text NOT NULL,  -- HTML/Markdown body
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_signatures (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     uuid NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
  patient_id      uuid REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id  uuid REFERENCES appointments(id) ON DELETE SET NULL,
  signer_name     text NOT NULL,
  signer_email    text,
  signature_data  text NOT NULL,  -- base64 SVG path data
  ip_address      text,
  signed_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doc_templates_user_id_idx ON document_templates(user_id);
CREATE INDEX IF NOT EXISTS doc_signatures_template_id_idx ON document_signatures(template_id);
CREATE INDEX IF NOT EXISTS doc_signatures_patient_id_idx ON document_signatures(patient_id);

-- RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages templates"
  ON document_templates FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner sees signatures"
  ON document_signatures FOR SELECT
  USING (
    template_id IN (SELECT id FROM document_templates WHERE user_id = auth.uid())
  );

-- Public INSERT (no auth) for patient signatures
CREATE POLICY "anyone signs document"
  ON document_signatures FOR INSERT
  WITH CHECK (true);

-- updated_at trigger (reuses function from intake-forms migration if already exists)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER doc_templates_set_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
