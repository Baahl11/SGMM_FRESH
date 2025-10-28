-- Migration: Add invitations system
-- Created: 2025-01-20
-- Purpose: Professional invitation system for paid clients

-- 1. Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invitation details
  email TEXT NOT NULL,
  name TEXT NOT NULL, -- Client's name
  token TEXT NOT NULL UNIQUE, -- Unique secure token for signup link
  
  -- Who invited
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  
  -- Plan info (for future multi-tier support)
  plan_type TEXT DEFAULT 'premium',
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  sent_count INTEGER DEFAULT 0, -- Track how many times email was sent
  last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT -- Optional admin notes
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- Prevent duplicate invitations for same email (unless previous ones are accepted/expired)
DROP INDEX IF EXISTS idx_invitations_email_pending;
CREATE UNIQUE INDEX idx_invitations_email_pending 
  ON invitations(email) 
  WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Only admins can view invitations" ON invitations;
DROP POLICY IF EXISTS "Only admins can insert invitations" ON invitations;
DROP POLICY IF EXISTS "Only admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Only admins can delete invitations" ON invitations;
DROP POLICY IF EXISTS "Anyone can validate invitation token" ON invitations;
DROP POLICY IF EXISTS "Authenticated users can view invitations" ON invitations;
DROP POLICY IF EXISTS "Authenticated users can insert invitations" ON invitations;
DROP POLICY IF EXISTS "Authenticated users can update invitations" ON invitations;
DROP POLICY IF EXISTS "Authenticated users can delete invitations" ON invitations;

-- RLS Policies - ONLY ADMINS can manage invitations
CREATE POLICY "Only admins can view invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Public can validate tokens (for signup page)
CREATE POLICY "Anyone can validate invitation token"
  ON invitations FOR SELECT
  TO anon, authenticated
  USING (status = 'pending' AND expires_at > NOW());

-- Function to auto-expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to generate secure token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE invitations IS 'Professional invitation system for new clients';
COMMENT ON COLUMN invitations.token IS 'Secure unique token for signup link (64 chars hex)';
COMMENT ON COLUMN invitations.sent_count IS 'Track email resends';
COMMENT ON COLUMN invitations.plan_type IS 'For future multi-tier support (premium, basic, etc)';
COMMENT ON COLUMN invitations.expires_at IS 'Invitations expire after 7 days by default';
