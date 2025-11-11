-- ============================================
-- VERIFICATION SCRIPT FOR TEAM MEMBERS MIGRATION
-- Run this in Supabase Dashboard → SQL Editor
-- Returns a single consolidated result
-- ============================================

SELECT
  -- 1. Table exists
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'team_members'
  ) AS "✅ Table Exists",
  
  -- 2. Column count
  (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'team_members'
  ) AS "✅ Total Columns",
  
  -- 3. Index count
  (
    SELECT COUNT(*)
    FROM pg_indexes
    WHERE tablename = 'team_members'
  ) AS "✅ Total Indexes",
  
  -- 4. RLS enabled
  (
    SELECT rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'team_members'
  ) AS "✅ RLS Enabled",
  
  -- 5. Policy count
  (
    SELECT COUNT(*)
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'team_members'
  ) AS "✅ Policies Count",
  
  -- 6. Functions count
  (
    SELECT COUNT(*)
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name IN (
        'generate_team_invitation_token',
        'update_team_members_updated_at',
        'can_user_perform_action'
      )
  ) AS "✅ Functions Count",
  
  -- 7. Updated shared table policies
  (
    SELECT COUNT(*)
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('patients', 'appointments', 'treatments', 'records', 'inventory_items')
      AND policyname LIKE '%team%'
  ) AS "✅ Shared Policies",
  
  -- 8. Current members
  (
    SELECT COUNT(*) FROM team_members
  ) AS "✅ Current Members";

-- ============================================
-- EXPECTED RESULTS (Single Row):
-- ============================================
-- Table Exists: true
-- Total Columns: 13
-- Total Indexes: 6 (5 custom + 1 primary key)
-- RLS Enabled: true
-- Policies Count: 5
-- Functions Count: 3
-- Shared Policies: 5
-- Current Members: 0
