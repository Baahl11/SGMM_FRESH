-- ============================================
-- MIGRACIÓN: Sistema Multi-ubicación
-- Fecha: 2025-11-14
-- Descripción: 
--   - Crea tabla locations para gestión de múltiples sedes
--   - Agrega location_id a tablas existentes
--   - Implementa validación de límites por plan
--   - Plan Básico: 1 ubicación
--   - Plan Pro: 5 ubicaciones
--   - Plan Enterprise: 999 ubicaciones
-- ============================================

-- ============================================
-- 1. CREAR TABLA LOCATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información básica
  nombre VARCHAR(200) NOT NULL,
  codigo VARCHAR(50), -- Código interno opcional (ej: "CDMX-ROMA", "MTY-CENTRO")
  
  -- Dirección completa
  direccion TEXT,
  ciudad VARCHAR(100),
  estado VARCHAR(100),
  pais VARCHAR(100) DEFAULT 'México',
  codigo_postal VARCHAR(20),
  
  -- Contacto
  telefono VARCHAR(50),
  email VARCHAR(255),
  
  -- Timezone (IANA timezone database)
  timezone VARCHAR(100) NOT NULL DEFAULT 'America/Mexico_City',
  
  -- Estado y configuración
  activo BOOLEAN NOT NULL DEFAULT true,
  es_principal BOOLEAN NOT NULL DEFAULT false, -- Solo una ubicación puede ser principal
  
  -- Horarios laborales por día (JSON)
  -- Ejemplo: {"monday": {"start": "09:00", "end": "18:00"}, ...}
  horarios_laborales JSONB DEFAULT '{}',
  
  -- Configuración adicional (logo, colores específicos por ubicación, etc.)
  configuracion JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_timezone CHECK (timezone IS NOT NULL AND timezone != ''),
  CONSTRAINT valid_nombre CHECK (nombre IS NOT NULL AND LENGTH(TRIM(nombre)) > 0)
);

-- ============================================
-- 2. ÍNDICES PARA LOCATIONS
-- ============================================

CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_activo ON locations(user_id, activo) WHERE activo = true;
CREATE INDEX idx_locations_principal ON locations(user_id, es_principal) WHERE es_principal = true;
CREATE INDEX idx_locations_ciudad ON locations(ciudad) WHERE ciudad IS NOT NULL;

-- ============================================
-- 3. ROW LEVEL SECURITY PARA LOCATIONS
-- ============================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver sus propias ubicaciones
CREATE POLICY "Users can view own locations"
  ON locations FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden insertar ubicaciones (con límite validado por trigger)
CREATE POLICY "Users can insert own locations"
  ON locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Los usuarios pueden actualizar sus propias ubicaciones
CREATE POLICY "Users can update own locations"
  ON locations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Los usuarios pueden eliminar sus propias ubicaciones (excepto si es la principal)
CREATE POLICY "Users can delete own locations"
  ON locations FOR DELETE
  USING (auth.uid() = user_id AND es_principal = false);

-- ============================================
-- 4. FUNCIÓN: Validar límite de ubicaciones por plan
-- ============================================

CREATE OR REPLACE FUNCTION check_location_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_tier TEXT;
  v_location_count INT;
  v_max_locations INT;
BEGIN
  -- Obtener el plan del usuario desde la tabla subscriptions
  SELECT plan_tier INTO v_plan_tier
  FROM subscriptions
  WHERE user_id = NEW.user_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Si no tiene suscripción, usar plan básico por defecto
  IF v_plan_tier IS NULL THEN
    v_plan_tier := 'basico';
  END IF;
  
  -- Contar ubicaciones ACTIVAS actuales del usuario
  SELECT COUNT(*) INTO v_location_count
  FROM locations
  WHERE user_id = NEW.user_id 
    AND activo = true
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid); -- Excluir el registro actual en UPDATE
  
  -- Determinar límite según el plan
  v_max_locations := CASE
    WHEN v_plan_tier = 'basico' THEN 1
    WHEN v_plan_tier = 'pro' THEN 5
    WHEN v_plan_tier = 'enterprise' THEN 999
    ELSE 1 -- Default a básico
  END;
  
  -- Validar límite solo si está activando una ubicación
  IF NEW.activo = true AND v_location_count >= v_max_locations THEN
    RAISE EXCEPTION 'Has alcanzado el límite de ubicaciones para tu plan % (máximo: %). Actualiza a un plan superior para agregar más ubicaciones.', 
      v_plan_tier, v_max_locations
      USING HINT = 'Plan Pro permite hasta 5 ubicaciones. Plan Enterprise permite ubicaciones ilimitadas.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGER: Validar límite antes de INSERT o UPDATE
-- ============================================

DROP TRIGGER IF EXISTS enforce_location_limit ON locations;
CREATE TRIGGER enforce_location_limit
  BEFORE INSERT OR UPDATE ON locations
  FOR EACH ROW
  WHEN (NEW.activo = true)
  EXECUTE FUNCTION check_location_limit();

-- ============================================
-- 6. FUNCIÓN: Asegurar solo una ubicación principal por usuario
-- ============================================

CREATE OR REPLACE FUNCTION ensure_single_principal_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está marcando como principal, desmarcar las demás
  IF NEW.es_principal = true THEN
    UPDATE locations
    SET es_principal = false, updated_at = NOW()
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND es_principal = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_single_principal ON locations;
CREATE TRIGGER ensure_single_principal
  BEFORE INSERT OR UPDATE ON locations
  FOR EACH ROW
  WHEN (NEW.es_principal = true)
  EXECUTE FUNCTION ensure_single_principal_location();

-- ============================================
-- 7. FUNCIÓN: Actualizar timestamp automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_locations_timestamp ON locations;
CREATE TRIGGER update_locations_timestamp
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_locations_updated_at();

-- ============================================
-- 8. AGREGAR COLUMNA location_id A TABLAS EXISTENTES
-- ============================================

-- 8.1 Tabla appointments (citas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_appointments_location ON appointments(location_id);
    
    COMMENT ON COLUMN appointments.location_id IS 'Ubicación donde se realizará la cita';
  END IF;
END $$;

-- 8.2 Tabla consultorios (ahora pertenecen a una ubicación)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultorios' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE consultorios 
    ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_consultorios_location ON consultorios(location_id);
    
    COMMENT ON COLUMN consultorios.location_id IS 'Ubicación a la que pertenece el consultorio';
  END IF;
END $$;

-- 8.3 Tabla inventory_items (inventario por ubicación)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_items' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE inventory_items 
    ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_inventory_location ON inventory_items(location_id);
    
    COMMENT ON COLUMN inventory_items.location_id IS 'Ubicación donde se almacena el inventario';
  END IF;
END $$;

-- 8.4 Tabla gastos_fijos (gastos por ubicación)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gastos_fijos' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE gastos_fijos 
    ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_gastos_fijos_location ON gastos_fijos(location_id);
    
    COMMENT ON COLUMN gastos_fijos.location_id IS 'Ubicación asociada al gasto fijo (opcional)';
  END IF;
END $$;

-- 8.5 Tabla user_profiles (ubicación principal del usuario)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'default_location_id'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN default_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN user_profiles.default_location_id IS 'Ubicación predeterminada del usuario';
  END IF;
END $$;

-- ============================================
-- 9. FUNCIÓN: Crear ubicación principal automática para nuevos usuarios
-- ============================================

CREATE OR REPLACE FUNCTION create_default_location_for_user()
RETURNS TRIGGER AS $$
DECLARE
  v_location_id UUID;
BEGIN
  -- Crear una ubicación principal por defecto
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
  
  -- Actualizar el user_profile con la ubicación principal
  UPDATE user_profiles
  SET default_location_id = v_location_id
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger solo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_default_location_on_signup'
  ) THEN
    CREATE TRIGGER create_default_location_on_signup
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_default_location_for_user();
  END IF;
END $$;

-- ============================================
-- 10. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE locations IS 'Ubicaciones físicas de la clínica (multi-sede)';
COMMENT ON COLUMN locations.user_id IS 'Propietario de la ubicación';
COMMENT ON COLUMN locations.nombre IS 'Nombre de la ubicación/sucursal';
COMMENT ON COLUMN locations.codigo IS 'Código interno para identificación rápida';
COMMENT ON COLUMN locations.timezone IS 'Zona horaria IANA (ej: America/Mexico_City)';
COMMENT ON COLUMN locations.es_principal IS 'Indica si es la ubicación principal del usuario';
COMMENT ON COLUMN locations.horarios_laborales IS 'Horarios de trabajo por día en formato JSON';
COMMENT ON COLUMN locations.configuracion IS 'Configuración personalizada (logo, colores, etc.)';

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================

-- NOTAS DE DESPLIEGUE:
-- 1. Esta migración es segura para ejecutar en producción
-- 2. Usa DO blocks para evitar errores si las columnas ya existen
-- 3. Los triggers validan límites según el plan de suscripción
-- 4. Cada usuario nuevo tendrá automáticamente una ubicación "Mi Consultorio Principal"
-- 5. Los datos existentes NO se verán afectados (location_id es nullable)
