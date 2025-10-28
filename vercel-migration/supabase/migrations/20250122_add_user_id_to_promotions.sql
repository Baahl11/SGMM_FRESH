-- Migration: Add user_id to promotions table
-- Created: 2025-01-22
-- Purpose: Add user isolation to promotions

-- 1. Add user_id column
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON promotions(user_id);

-- 3. Assign existing promotions to admin user
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT user_id INTO admin_user_id
  FROM user_profiles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    UPDATE promotions SET user_id = admin_user_id WHERE user_id IS NULL;
    RAISE NOTICE 'All promotions assigned to admin user: %', admin_user_id;
  ELSE
    RAISE WARNING 'No admin user found - promotions not assigned';
  END IF;
END $$;

-- 4. Make user_id NOT NULL
ALTER TABLE promotions ALTER COLUMN user_id SET NOT NULL;

-- 5. Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies
DROP POLICY IF EXISTS "Users can view own promotions" ON promotions;
DROP POLICY IF EXISTS "Users can insert own promotions" ON promotions;
DROP POLICY IF EXISTS "Users can update own promotions" ON promotions;
DROP POLICY IF EXISTS "Users can delete own promotions" ON promotions;

-- 7. Create RLS policies
CREATE POLICY "Users can view own promotions"
  ON promotions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own promotions"
  ON promotions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own promotions"
  ON promotions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own promotions"
  ON promotions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 8. Comment
COMMENT ON COLUMN promotions.user_id IS 'User who owns this promotion';
