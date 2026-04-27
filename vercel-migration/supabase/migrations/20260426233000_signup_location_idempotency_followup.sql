-- ============================================================================
-- HOTFIX FOLLOW-UP: Harden principal location idempotency on signup
-- Date: 2026-04-26
--
-- Ensures signup trigger reuses existing PRINCIPAL location when present and
-- only creates it when missing, even under repeated/retried execution paths.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_locations_user_codigo
  ON public.locations (user_id, codigo);

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

  SELECT id
  INTO v_location_id
  FROM locations
  WHERE user_id = NEW.id
    AND codigo = 'PRINCIPAL'
  ORDER BY id
  LIMIT 1;

  IF v_location_id IS NULL THEN
    INSERT INTO locations (
      user_id,
      nombre,
      codigo,
      es_principal,
      activo,
      timezone
    )
    SELECT
      NEW.id,
      'Mi Consultorio Principal',
      'PRINCIPAL',
      true,
      true,
      'America/Mexico_City'
    WHERE NOT EXISTS (
      SELECT 1
      FROM locations
      WHERE user_id = NEW.id
        AND codigo = 'PRINCIPAL'
    )
    RETURNING id INTO v_location_id;

    IF v_location_id IS NULL THEN
      SELECT id
      INTO v_location_id
      FROM locations
      WHERE user_id = NEW.id
        AND codigo = 'PRINCIPAL'
      ORDER BY id
      LIMIT 1;
    END IF;
  END IF;

  IF v_location_id IS NOT NULL THEN
    UPDATE user_profiles
    SET default_location_id = v_location_id
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    BEGIN
      PERFORM public.log_signup_trigger_error(
        'create_default_location_for_user',
        NEW.id,
        NEW.email,
        SQLERRM,
        SQLSTATE,
        jsonb_build_object(
          'trigger', 'create_default_location_on_signup',
          'phase', 'location-idempotency-followup'
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '[create_default_location_for_user] Failed to persist error log: %', SQLERRM;
    END;

    RAISE NOTICE '[create_default_location_for_user] Failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS create_default_location_on_signup ON auth.users;
CREATE TRIGGER create_default_location_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_location_for_user();
