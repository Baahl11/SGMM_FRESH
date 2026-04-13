-- Google Calendar Integration Tables
-- Migration: 20250120_google_calendar.sql

-- Table for storing OAuth tokens (one per user)
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_type text DEFAULT 'Bearer',
  expires_at timestamptz NOT NULL,
  scope text,
  google_email text,
  calendar_id text DEFAULT 'primary',
  sync_enabled boolean DEFAULT true,
  auto_sync boolean DEFAULT true,
  sync_interval_minutes integer DEFAULT 15,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_token UNIQUE (user_id)
);

-- Table for tracking synced appointments
CREATE TABLE IF NOT EXISTS google_calendar_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id integer NOT NULL,
  google_event_id text NOT NULL,
  last_synced_at timestamptz DEFAULT now(),
  sync_status text DEFAULT 'synced', -- 'synced', 'pending', 'error'
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_appointment_sync UNIQUE (user_id, appointment_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gcal_tokens_user ON google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_gcal_sync_user ON google_calendar_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_gcal_sync_appointment ON google_calendar_sync(appointment_id);
CREATE INDEX IF NOT EXISTS idx_gcal_sync_google_event ON google_calendar_sync(google_event_id);

-- RLS Policies for google_calendar_tokens
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view own tokens" ON google_calendar_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own tokens" ON google_calendar_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own tokens" ON google_calendar_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own tokens" ON google_calendar_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for google_calendar_sync
ALTER TABLE google_calendar_sync ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sync records
CREATE POLICY "Users can view own sync records" ON google_calendar_sync
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sync records
CREATE POLICY "Users can insert own sync records" ON google_calendar_sync
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sync records
CREATE POLICY "Users can update own sync records" ON google_calendar_sync
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own sync records
CREATE POLICY "Users can delete own sync records" ON google_calendar_sync
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_google_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_google_calendar_tokens_updated_at
  BEFORE UPDATE ON google_calendar_tokens
  FOR EACH ROW EXECUTE FUNCTION update_google_calendar_updated_at();

CREATE TRIGGER update_google_calendar_sync_updated_at
  BEFORE UPDATE ON google_calendar_sync
  FOR EACH ROW EXECUTE FUNCTION update_google_calendar_updated_at();

-- Grant access to service role (for API operations)
GRANT ALL ON google_calendar_tokens TO service_role;
GRANT ALL ON google_calendar_sync TO service_role;
