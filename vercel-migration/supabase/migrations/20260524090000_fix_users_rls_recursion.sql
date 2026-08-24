-- ============================================================================
-- Fix: Prevent recursive RLS policies on public.users (42P17)
-- Created: 2026-05-24
-- Purpose: Replace unknown/legacy users policies with non-recursive policies
-- ============================================================================

BEGIN;

-- SECURITY DEFINER avoids policy recursion when checking admin role.
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.current_user_is_admin() IS
  'Returns true when auth.uid() is admin via user_profiles; designed for safe RLS checks.';

DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE NOTICE 'Skipping users RLS fix: public.users does not exist.';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';

  -- Remove any legacy policy definitions to eliminate recursive policy conditions.
  FOR policy_rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policy_rec.policyname);
  END LOOP;

  EXECUTE '
    CREATE POLICY users_select_self_or_admin
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
      id = auth.uid() OR public.current_user_is_admin()
    )
  ';

  EXECUTE '
    CREATE POLICY users_insert_self_or_admin
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (
      id = auth.uid() OR public.current_user_is_admin()
    )
  ';

  EXECUTE '
    CREATE POLICY users_update_self_or_admin
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (
      id = auth.uid() OR public.current_user_is_admin()
    )
    WITH CHECK (
      id = auth.uid() OR public.current_user_is_admin()
    )
  ';
END $$;

COMMIT;
