-- Migration: Team Members System
-- Created: 2025-11-11
-- Purpose: Allow account owners to invite team members to share access

-- ============================================
-- 1. CREATE team_members TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_email TEXT NOT NULL,
  
  -- Role and permissions
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'doctor', 'receptionist', 'viewer')) DEFAULT 'doctor',
  
  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'inactive')) DEFAULT 'pending',
  
  -- Invitation tracking
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  invitation_token TEXT UNIQUE,
  
  -- Optional location assignment
  location_id UUID, -- Can be NULL for access to all locations
  
  -- Granular permissions (JSONB for flexibility)
  permissions JSONB DEFAULT '{
    "can_view_patients": true,
    "can_edit_patients": true,
    "can_delete_patients": false,
    "can_view_records": true,
    "can_edit_records": true,
    "can_delete_records": false,
    "can_view_appointments": true,
    "can_edit_appointments": true,
    "can_delete_appointments": false,
    "can_view_inventory": true,
    "can_edit_inventory": false,
    "can_view_reports": true,
    "can_manage_team": false
  }'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(owner_user_id, member_email),
  CHECK (owner_user_id != member_user_id) -- Can't invite yourself
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(member_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(member_email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_token ON team_members(invitation_token);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES FOR team_members
-- ============================================

-- Owners can view their team members
CREATE POLICY "Owners can view their team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

-- Members can view their own membership
CREATE POLICY "Members can view their own membership"
  ON team_members FOR SELECT
  TO authenticated
  USING (member_user_id = auth.uid());

-- Only owners can insert team members
CREATE POLICY "Owners can invite team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

-- Only owners can update their team members
CREATE POLICY "Owners can update team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid());

-- Only owners can delete team members
CREATE POLICY "Owners can remove team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (owner_user_id = auth.uid());

-- ============================================
-- 5. UPDATED RLS POLICIES FOR SHARED DATA
-- ============================================

-- Update patients policy to allow team access
DROP POLICY IF EXISTS "Users can view own patients" ON patients;
CREATE POLICY "Users can view own or team patients"
  ON patients FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() -- Own data
    OR user_id IN ( -- Or owner's data if I'm an active team member
      SELECT owner_user_id FROM team_members
      WHERE member_user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Update appointments policy
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
CREATE POLICY "Users can view own or team appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT owner_user_id FROM team_members
      WHERE member_user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Update treatments policy
DROP POLICY IF EXISTS "Users can view own treatments" ON treatments;
CREATE POLICY "Users can view own or team treatments"
  ON treatments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT owner_user_id FROM team_members
      WHERE member_user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Update records policy
DROP POLICY IF EXISTS "Users can view own records" ON records;
CREATE POLICY "Users can view own or team records"
  ON records FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT owner_user_id FROM team_members
      WHERE member_user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Update inventory_items policy
DROP POLICY IF EXISTS "Users can view own inventory" ON inventory_items;
CREATE POLICY "Users can view own or team inventory"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT owner_user_id FROM team_members
      WHERE member_user_id = auth.uid()
      AND status = 'active'
    )
  );

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_team_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_team_members_updated_at ON team_members;
CREATE TRIGGER trigger_update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();

-- Function to check if user can perform action based on permissions
CREATE OR REPLACE FUNCTION can_user_perform_action(
  action_name TEXT,
  target_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
  is_owner BOOLEAN;
BEGIN
  -- Check if user is the owner
  IF target_user_id IS NULL OR target_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is active team member with permission
  SELECT permissions INTO user_permissions
  FROM team_members
  WHERE member_user_id = auth.uid()
    AND owner_user_id = target_user_id
    AND status = 'active';
  
  IF user_permissions IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check specific permission
  RETURN COALESCE((user_permissions ->> action_name)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. COMMENTS
-- ============================================

COMMENT ON TABLE team_members IS 'Team collaboration - owners can invite members to share account access';
COMMENT ON COLUMN team_members.owner_user_id IS 'The account owner (pays subscription)';
COMMENT ON COLUMN team_members.member_user_id IS 'The invited member (NULL until they accept)';
COMMENT ON COLUMN team_members.member_email IS 'Email of the invitee';
COMMENT ON COLUMN team_members.role IS 'Predefined role with permission template';
COMMENT ON COLUMN team_members.status IS 'pending (invited), active (accepted), inactive (removed)';
COMMENT ON COLUMN team_members.permissions IS 'Granular JSONB permissions for fine control';
COMMENT ON COLUMN team_members.location_id IS 'Optional: restrict member to specific location';
COMMENT ON COLUMN team_members.invitation_token IS 'Secure token for invitation acceptance';
