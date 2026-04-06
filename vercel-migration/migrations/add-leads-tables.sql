-- Migration: leads + lead_notes tables
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS leads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre      text NOT NULL,
  email       text,
  telefono    text,
  source      text DEFAULT 'manual',        -- manual | landing_contact | whatsapp_click | calculator | referral
  status      text DEFAULT 'nuevo'
              CHECK (status IN ('nuevo','contactado','calificado','convertido','perdido')),
  notas       text,
  assigned_to uuid REFERENCES auth.users(id),
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_user_id_idx  ON leads(user_id);
CREATE INDEX IF NOT EXISTS leads_status_idx   ON leads(status);
CREATE INDEX IF NOT EXISTS leads_created_idx  ON leads(created_at DESC);

CREATE TABLE IF NOT EXISTS lead_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES auth.users(id) NOT NULL,
  body       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_notes_lead_id_idx ON lead_notes(lead_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- RLS
ALTER TABLE leads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- Leads: only visible to the owner (user_id)
CREATE POLICY "leads_select" ON leads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "leads_insert" ON leads FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "leads_update" ON leads FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "leads_delete" ON leads FOR DELETE USING (user_id = auth.uid());

-- Lead notes: visible if the parent lead belongs to the user
CREATE POLICY "lead_notes_select" ON lead_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_notes.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "lead_notes_insert" ON lead_notes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_notes.lead_id AND leads.user_id = auth.uid())
  );

CREATE POLICY "lead_notes_delete" ON lead_notes FOR DELETE
  USING (user_id = auth.uid());
