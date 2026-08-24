-- Resolve role checks outside user_profiles RLS to avoid policy recursion.
CREATE OR REPLACE FUNCTION public.current_user_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role
  FROM public.user_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_profile_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_profile_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_profile_role() TO service_role;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (public.current_user_profile_role() = 'admin');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = public.current_user_profile_role()
  );
