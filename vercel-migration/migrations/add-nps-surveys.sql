-- Migration: NPS surveys (post-consultation)
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS nps_surveys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'Califica tu experiencia',
  message     text DEFAULT '¿Qué tan probable es que nos recomiendes con un familiar o amigo?',
  is_active   boolean NOT NULL DEFAULT true,
  send_delay_hours int NOT NULL DEFAULT 2,  -- hours after appointment to send/trigger
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nps_responses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id      uuid NOT NULL REFERENCES nps_surveys(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id     uuid REFERENCES patients(id) ON DELETE SET NULL,
  score          int NOT NULL CHECK (score >= 0 AND score <= 10),
  comment        text,
  respondent_name text,
  respondent_email text,
  submitted_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS nps_surveys_user_id_idx ON nps_surveys(user_id);
CREATE INDEX IF NOT EXISTS nps_responses_survey_id_idx ON nps_responses(survey_id);
CREATE INDEX IF NOT EXISTS nps_responses_submitted_at_idx ON nps_responses(submitted_at);

-- RLS
ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages surveys"
  ON nps_surveys FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner sees responses"
  ON nps_responses FOR SELECT
  USING (
    survey_id IN (SELECT id FROM nps_surveys WHERE user_id = auth.uid())
  );

-- Public INSERT (no auth) for patient submissions
CREATE POLICY "anyone submits response"
  ON nps_responses FOR INSERT
  WITH CHECK (true);
