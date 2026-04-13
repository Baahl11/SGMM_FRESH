-- ============================================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================================
-- This trigger automatically creates a user_profiles entry when someone signs up
-- ============================================================================

-- Function to create profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, name, role, plan_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'user', -- Default role
    'premium' -- Default plan
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users who don't have one
INSERT INTO public.user_profiles (user_id, email, name, role, plan_type)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', u.email),
  'user',
  'premium'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.user_id = u.id
);

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user_profiles entry when user signs up';
