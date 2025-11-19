-- ============================================================================
-- FIX: Modificar trigger de locations para crear user_profile primero
-- ============================================================================
-- Issue: El trigger create_default_location_on_signup intenta actualizar
--        user_profiles.default_location_id pero user_profiles no existe aún
-- Solution: Modificar la función para crear user_profile ANTES de location
-- ============================================================================

-- Modificar función existente para crear user_profile si no existe
CREATE OR REPLACE FUNCTION create_default_location_for_user()
RETURNS TRIGGER AS $$
DECLARE
  v_location_id UUID;
  v_profile_exists BOOLEAN;
BEGIN
  -- 1. Verificar si ya existe user_profile
  SELECT EXISTS(
    SELECT 1 FROM user_profiles WHERE user_id = NEW.id
  ) INTO v_profile_exists;
  
  -- 2. Crear user_profile si no existe
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
  
  -- 3. Crear una ubicación principal por defecto
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
  
  -- 4. Actualizar el user_profile con la ubicación principal
  UPDATE user_profiles
  SET default_location_id = v_location_id
  WHERE user_id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero no fallar el signup
    RAISE NOTICE 'Failed to create location for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario
COMMENT ON FUNCTION create_default_location_for_user() IS 
'Crea user_profile (si no existe) y location principal automáticamente al signup';
