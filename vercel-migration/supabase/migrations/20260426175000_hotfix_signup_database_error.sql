-- ============================================================================
-- HOTFIX: Prevent "Database error saving new user" during signup
-- Date: 2026-04-26
--
-- This patch hardens all auth.users signup triggers so auth user creation
-- never aborts if downstream profile/subscription/location writes fail.
-- ============================================================================

-- 1) Profile trigger: idempotent + defensive
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
    RAISE NOTICE '[handle_new_user] Skipping profile creation for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- 2) Subscription trigger: service_role context + defensive
CREATE OR REPLACE FUNCTION create_subscription_on_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  trial_start TIMESTAMPTZ;
  trial_end TIMESTAMPTZ;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  trial_start := NOW();
  trial_end := trial_start + INTERVAL '7 days';

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
    RAISE NOTICE '[create_subscription_on_user_signup] Skipping auto-create for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS auto_create_subscription_on_signup ON auth.users;
CREATE TRIGGER auto_create_subscription_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_on_user_signup();


-- 3) Default location trigger: create profile if missing + defensive
CREATE OR REPLACE FUNCTION create_default_location_for_user()
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
    RAISE NOTICE '[create_default_location_for_user] Failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS create_default_location_on_signup ON auth.users;
CREATE TRIGGER create_default_location_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_location_for_user();
