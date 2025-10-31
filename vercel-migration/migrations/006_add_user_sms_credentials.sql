-- Migration: Add user_sms_credentials table
-- Date: 2025-10-30
-- Description: Store encrypted SMS provider credentials per user

CREATE TABLE IF NOT EXISTS user_sms_credentials (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('twilio', 'messagebird', 'plivo', 'manual')),
    credentials_encrypted TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user_profile FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_credentials UNIQUE (user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_sms_credentials_user_id ON user_sms_credentials(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_sms_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own credentials
CREATE POLICY "Users can view their own SMS credentials"
  ON user_sms_credentials FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own SMS credentials"
  ON user_sms_credentials FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own SMS credentials"
  ON user_sms_credentials FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own SMS credentials"
  ON user_sms_credentials FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE user_sms_credentials IS 'Stores encrypted SMS provider credentials for each user';
COMMENT ON COLUMN user_sms_credentials.credentials_encrypted IS 'JSON encrypted credentials specific to the provider';
COMMENT ON COLUMN user_sms_credentials.user_id IS 'References auth.users UUID via user_profiles';
