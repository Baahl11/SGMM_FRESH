-- ============================================================================
-- RESET TEAM MEMBER TO PENDING STATUS
-- ============================================================================
-- Use this to reset a team member back to pending if they were activated by mistake
-- Replace 'email@example.com' with the actual email
-- ============================================================================

-- Reset specific member to pending
UPDATE team_members
SET 
  status = 'pending',
  member_user_id = NULL,
  accepted_at = NULL,
  updated_at = NOW()
WHERE member_email = 'EMAIL_TO_RESET@example.com'  -- REPLACE WITH ACTUAL EMAIL
  AND status = 'active';

-- Verify
SELECT 
  id,
  member_email,
  status,
  member_user_id,
  accepted_at,
  invitation_token
FROM team_members
WHERE member_email = 'EMAIL_TO_RESET@example.com';
