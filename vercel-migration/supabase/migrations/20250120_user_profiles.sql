-- Migration: Add user_profiles table with roles
-- Created: 2025-01-20
-- Purpose: User profiles with role-based access control

-- 1. User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile info
  name TEXT,
  email TEXT,
  
  -- Role-based access control
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  
  -- Plan info
  plan_type TEXT DEFAULT 'premium',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = (SELECT role FROM user_profiles WHERE user_id = auth.uid())); -- Can't change own role

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Function to update updated_at
DROP FUNCTION IF EXISTS update_user_profiles_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Create admin profile for existing users
-- TODO: Update this with your actual user email
INSERT INTO user_profiles (user_id, name, email, role, plan_type)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', email),
  email,
  'admin', -- First user is admin
  'premium'
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.users.id)
LIMIT 1; -- Only first user gets admin

-- Future users will be created as 'user' role by default via trigger or API

-- Comments
COMMENT ON TABLE user_profiles IS 'User profiles with role-based access control';
COMMENT ON COLUMN user_profiles.role IS 'admin can manage everything, user has limited access';
COMMENT ON COLUMN user_profiles.plan_type IS 'Subscription plan type (premium, basic, etc)';
