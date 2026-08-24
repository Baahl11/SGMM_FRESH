-- ============================================================================
-- HOTFIX: Signup trigger observability and resilient logging
-- Date: 2026-04-26
--
-- Adds structured error logging for auth.users signup triggers so failures are
-- visible in DB while signup flow remains non-blocking.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'signup_trigger',
  function_name TEXT NOT NULL,
  user_id UUID,
  email TEXT,
  error_message TEXT NOT NULL,
  sqlstate TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_source_created_at
  ON public.error_logs (source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_user_created_at
  ON public.error_logs (user_id, created_at DESC);

COMMENT ON TABLE public.error_logs IS 'Operational errors captured from non-blocking server-side processes.';
COMMENT ON COLUMN public.error_logs.source IS 'Subsystem/source identifier (e.g. signup_trigger).';

REVOKE ALL ON TABLE public.error_logs FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_signup_trigger_error(
  p_function_name TEXT,
  p_user_id UUID,
  p_email TEXT,
  p_error_message TEXT,
  p_sqlstate TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.error_logs (
    source,
    function_name,
    user_id,
    email,
    error_message,
    sqlstate,
    metadata
  )
  VALUES (
    'signup_trigger',
    p_function_name,
    p_user_id,
    p_email,
    p_error_message,
    p_sqlstate,
    COALESCE(p_metadata, '{}'::jsonb)
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '[log_signup_trigger_error] Failed to persist log: %', SQLERRM;
END;
$$;

-- 1) Profile trigger with DB logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, name, role, plan_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user',
    'premium'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_signup_trigger_error(
      'handle_new_user',
      NEW.id,
      NEW.email,
      SQLERRM,
      SQLSTATE,
      jsonb_build_object('trigger', 'on_auth_user_created')
    );

    RAISE NOTICE '[handle_new_user] Skipping profile creation for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2) Subscription trigger with DB logging
CREATE OR REPLACE FUNCTION public.create_subscription_on_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  trial_start TIMESTAMPTZ;
  trial_end TIMESTAMPTZ;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  trial_start := NOW();
  trial_end := trial_start + INTERVAL '14 days';

  INSERT INTO subscriptions (
    user_id,
    plan_tier,
    max_doctors,
    max_locations,
    features,
    status,
    stripe_price_id,
    trial_start,
    trial_end,
    current_period_start,
    current_period_end
  )
  SELECT
    NEW.id,
    'basico',
    2,
    1,
    '["basic_scheduling", "basic_patients"]'::jsonb,
    'trialing',
    'price_basico_default',
    trial_start,
    trial_end,
    trial_start,
    trial_end
  WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE user_id = NEW.id
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_signup_trigger_error(
      'create_subscription_on_user_signup',
      NEW.id,
      NEW.email,
      SQLERRM,
      SQLSTATE,
      jsonb_build_object('trigger', 'auto_create_subscription_on_signup')
    );

    RAISE NOTICE '[create_subscription_on_user_signup] Skipping auto-create for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS auto_create_subscription_on_signup ON auth.users;
CREATE TRIGGER auto_create_subscription_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_subscription_on_user_signup();

-- 3) Default location trigger with DB logging
CREATE OR REPLACE FUNCTION public.create_default_location_for_user()
RETURNS TRIGGER AS $$
DECLARE
  v_location_id UUID;
  v_profile_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_profiles WHERE user_id = NEW.id
  ) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    INSERT INTO user_profiles (
      user_id,
      email,
      name,
      role,
      plan_type
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      'user',
      'premium'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  INSERT INTO locations (
    user_id,
    nombre,
    codigo,
    es_principal,
    activo,
    timezone
  ) VALUES (
    NEW.id,
    'Mi Consultorio Principal',
    'PRINCIPAL',
    true,
    true,
    'America/Mexico_City'
  )
  RETURNING id INTO v_location_id;

  UPDATE user_profiles
  SET default_location_id = v_location_id
  WHERE user_id = NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_signup_trigger_error(
      'create_default_location_for_user',
      NEW.id,
      NEW.email,
      SQLERRM,
      SQLSTATE,
      jsonb_build_object('trigger', 'create_default_location_on_signup')
    );

    RAISE NOTICE '[create_default_location_for_user] Failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS create_default_location_on_signup ON auth.users;
CREATE TRIGGER create_default_location_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_location_for_user();
