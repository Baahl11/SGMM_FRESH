-- ============================================================================
-- UPDATE TEAM MEMBERS STATUS TO ACTIVE
-- ============================================================================
-- This script updates team members who have registered but status is still pending
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Update team members to active if their email exists in auth.users
UPDATE team_members
SET 
  status = 'active',
  member_user_id = auth.users.id,
  accepted_at = NOW(),
  updated_at = NOW()
FROM auth.users
WHERE team_members.member_email = auth.users.email
  AND team_members.status = 'pending'
  AND team_members.member_user_id IS NULL;

-- Verify the update
SELECT 
  tm.id,
  tm.member_email,
  tm.status,
  tm.member_user_id,
  tm.accepted_at,
  u.email as auth_email,
  u.id as auth_user_id
FROM team_members tm
LEFT JOIN auth.users u ON tm.member_email = u.email
ORDER BY tm.created_at DESC;
