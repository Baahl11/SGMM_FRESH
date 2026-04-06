-- Migration: intake_forms + intake_responses tables
-- Run in Supabase SQL editor

-- Form definitions (created by the clinic owner)
CREATE TABLE IF NOT EXISTS intake_forms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       text NOT NULL,
  description text,
  fields      jsonb NOT NULL DEFAULT '[]',
  -- fields structure: [{ id, type, label, required, options? }]
  -- type: text | textarea | select | checkbox | radio | date | phone | email
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS intake_forms_user_id_idx ON intake_forms(user_id);

-- Responses submitted by patients
CREATE TABLE IF NOT EXISTS intake_responses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id     uuid REFERENCES intake_forms(id) ON DELETE CASCADE NOT NULL,
  patient_id  uuid REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id uuid,  -- optional link to appointment
  nombre      text,     -- filled by patient if not logged in
  email       text,
  telefono    text,
  answers     jsonb NOT NULL DEFAULT '{}',
  -- answers: { [fieldId]: value }
  submitted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS intake_responses_form_id_idx    ON intake_responses(form_id);
CREATE INDEX IF NOT EXISTS intake_responses_patient_id_idx ON intake_responses(patient_id);

-- updated_at trigger (reuses function created in leads migration)
DROP TRIGGER IF EXISTS intake_forms_updated_at ON intake_forms;
CREATE TRIGGER intake_forms_updated_at
  BEFORE UPDATE ON intake_forms
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- RLS
ALTER TABLE intake_forms      ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_responses  ENABLE ROW LEVEL SECURITY;

-- Forms: owner full access
CREATE POLICY "intake_forms_select" ON intake_forms FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "intake_forms_insert" ON intake_forms FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "intake_forms_update" ON intake_forms FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "intake_forms_delete" ON intake_forms FOR DELETE USING (user_id = auth.uid());

-- Responses: owner can read all responses for their forms
CREATE POLICY "intake_responses_select" ON intake_responses FOR SELECT
  USING (EXISTS (SELECT 1 FROM intake_forms WHERE intake_forms.id = intake_responses.form_id AND intake_forms.user_id = auth.uid()));

-- Responses: anyone can submit (public form link)
CREATE POLICY "intake_responses_insert" ON intake_responses FOR INSERT WITH CHECK (true);
