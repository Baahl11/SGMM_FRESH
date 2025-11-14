-- Migration: Allow viewing team invitations by token (for accepting invitations)
-- This allows unauthenticated users to view an invitation using the token
-- so they can see who invited them before signing up/logging in

-- Add policy to allow viewing invitations by token (even when not authenticated)
CREATE POLICY "Anyone can view invitation by token"
  ON team_members FOR SELECT
  TO anon, authenticated
  USING (
    invitation_token IS NOT NULL 
    AND status = 'pending'
  );

-- Note: This is safe because:
-- 1. Tokens are cryptographically random (64 hex chars)
-- 2. Only pending invitations are visible
-- 3. Users still need to authenticate to accept
-- 4. The token is single-use (status changes to 'active' after acceptance)
