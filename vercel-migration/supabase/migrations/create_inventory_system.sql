-- ============================================================================
-- MIGRATION: Sistema de Inventario Completo con Descuento Automático
-- Fecha: Octubre 2025
-- Descripción: Crea tablas para relacionar tratamientos con consumibles
--              y registrar movimientos automáticos de inventario
-- ============================================================================

-- Si la tabla existe pero con columnas BIGINT, eliminarla (solo si está vacía) para recrearla con UUID
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'treatment_inventory_items' AND column_name = 'treatment_id' AND data_type <> 'uuid') THEN
    PERFORM 1 FROM treatment_inventory_items LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION '❌ La tabla treatment_inventory_items contiene datos con tipos BIGINT. Migración manual requerida antes de convertir a UUID.';
    ELSE
      RAISE NOTICE 'ℹ️ Eliminando tabla treatment_inventory_items para recrearla con columnas UUID';
      DROP TABLE treatment_inventory_items CASCADE;
    END IF;
  END IF;
END $$;

-- Recrear tabla con columnas UUID alineadas con esquema principal (treatments.id e inventory_items.id son UUID)
CREATE TABLE IF NOT EXISTS treatment_inventory_items (
  id BIGSERIAL PRIMARY KEY,
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  cantidad_requerida DECIMAL(10,2) DEFAULT 1.0 CHECK (cantidad_requerida > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Constraint: Un tratamiento no puede tener el mismo item duplicado
  CONSTRAINT unique_treatment_item_per_user UNIQUE(treatment_id, inventory_item_id, user_id)
);

-- Comentarios descriptivos
COMMENT ON TABLE treatment_inventory_items IS 'Relación entre tratamientos y consumibles de inventario';
COMMENT ON COLUMN treatment_inventory_items.treatment_id IS 'ID del tratamiento (treatments.id UUID)';
COMMENT ON COLUMN treatment_inventory_items.inventory_item_id IS 'ID del item de inventario (inventory_items.id UUID)';
COMMENT ON COLUMN treatment_inventory_items.cantidad_requerida IS 'Cantidad de consumible usado por aplicación del tratamiento';

-- Índices para mejorar performance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_treatment_inventory_treatment') THEN
    CREATE INDEX idx_treatment_inventory_treatment ON treatment_inventory_items(treatment_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_treatment_inventory_item') THEN
    CREATE INDEX idx_treatment_inventory_item ON treatment_inventory_items(inventory_item_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_treatment_inventory_user') THEN
    CREATE INDEX idx_treatment_inventory_user ON treatment_inventory_items(user_id);
  END IF;
END $$;

-- RLS: Row Level Security Policies
ALTER TABLE treatment_inventory_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own treatment inventory items' 
                 AND tablename = 'treatment_inventory_items') THEN
    CREATE POLICY "Users can view their own treatment inventory items"
      ON treatment_inventory_items FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own treatment inventory items' 
                 AND tablename = 'treatment_inventory_items') THEN
    CREATE POLICY "Users can insert their own treatment inventory items"
      ON treatment_inventory_items FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own treatment inventory items' 
                 AND tablename = 'treatment_inventory_items') THEN
    CREATE POLICY "Users can update their own treatment inventory items"
      ON treatment_inventory_items FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own treatment inventory items' 
                 AND tablename = 'treatment_inventory_items') THEN
    CREATE POLICY "Users can delete their own treatment inventory items"
      ON treatment_inventory_items FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================================
-- 2. TABLA: inventory_movements
--    Auditoría completa de todos los movimientos de inventario
--    Registra entradas, salidas, ajustes con trazabilidad
-- ============================================================================

-- Primero verificar si la tabla existe y agregar columnas faltantes
DO $$
BEGIN
  -- Si la tabla no existe, crearla completa
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_movements') THEN
    CREATE TABLE inventory_movements (
      id BIGSERIAL PRIMARY KEY,
      item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
      tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
      cantidad DECIMAL(10,2) NOT NULL,
      cantidad_anterior DECIMAL(10,2),
      cantidad_nueva DECIMAL(10,2),
      motivo TEXT,
      related_record_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
    );
    RAISE NOTICE '✅ Tabla inventory_movements creada';
  ELSE
    RAISE NOTICE 'ℹ️ Tabla inventory_movements ya existe, verificando columnas...';
    
    -- Si la columna item_id sigue siendo BIGINT, convertirla a UUID (solo si no hay datos)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='inventory_movements' AND column_name='item_id' AND data_type <> 'uuid') THEN
      PERFORM 1 FROM inventory_movements LIMIT 1;
      IF FOUND THEN
        RAISE EXCEPTION '❌ La tabla inventory_movements contiene datos con item_id BIGINT. Migración manual requerida antes de convertir a UUID.';
      ELSE
        RAISE NOTICE 'ℹ️ Eliminando tabla inventory_movements para recrearla con columnas UUID';
        DROP TABLE inventory_movements CASCADE;
        CREATE TABLE inventory_movements (
          id BIGSERIAL PRIMARY KEY,
          item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
          tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
          cantidad DECIMAL(10,2) NOT NULL,
          cantidad_anterior DECIMAL(10,2),
          cantidad_nueva DECIMAL(10,2),
          motivo TEXT,
          related_record_id UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
        );
      END IF;
    END IF;

    -- Agregar columnas faltantes si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='inventory_movements' AND column_name='cantidad_anterior') THEN
      ALTER TABLE inventory_movements ADD COLUMN cantidad_anterior DECIMAL(10,2);
      RAISE NOTICE '✅ Columna cantidad_anterior agregada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='inventory_movements' AND column_name='cantidad_nueva') THEN
      ALTER TABLE inventory_movements ADD COLUMN cantidad_nueva DECIMAL(10,2);
      RAISE NOTICE '✅ Columna cantidad_nueva agregada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='inventory_movements' AND column_name='related_record_id') THEN
      ALTER TABLE inventory_movements ADD COLUMN related_record_id UUID;
      RAISE NOTICE '✅ Columna related_record_id agregada';
    END IF;
    
    -- Verificar constraint de tipo
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_tipo_check') THEN
      ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_tipo_check 
        CHECK (tipo IN ('entrada', 'salida', 'ajuste'));
      RAISE NOTICE '✅ Constraint tipo agregado';
    END IF;
  END IF;
END $$;

-- Comentarios descriptivos
COMMENT ON TABLE inventory_movements IS 'Historial completo de movimientos de inventario con auditoría';
COMMENT ON COLUMN inventory_movements.item_id IS 'ID del item de inventario (inventory_items.id UUID)';
COMMENT ON COLUMN inventory_movements.tipo IS 'Tipo de movimiento: entrada (compra), salida (uso), ajuste (corrección)';
COMMENT ON COLUMN inventory_movements.cantidad IS 'Cantidad del movimiento (positivo o negativo)';
COMMENT ON COLUMN inventory_movements.cantidad_anterior IS 'Stock antes del movimiento';
COMMENT ON COLUMN inventory_movements.cantidad_nueva IS 'Stock después del movimiento';
COMMENT ON COLUMN inventory_movements.motivo IS 'Razón del movimiento (ej: "Usado en tratamiento Botox paciente María López")';
COMMENT ON COLUMN inventory_movements.related_record_id IS 'ID del record de tratamiento (records.id UUID) que causó este movimiento (si aplica)';

-- Índices para mejorar performance en consultas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inventory_movements_item') THEN
    CREATE INDEX idx_inventory_movements_item ON inventory_movements(item_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inventory_movements_record') THEN
    CREATE INDEX idx_inventory_movements_record ON inventory_movements(related_record_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inventory_movements_created') THEN
    CREATE INDEX idx_inventory_movements_created ON inventory_movements(created_at DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inventory_movements_user') THEN
    CREATE INDEX idx_inventory_movements_user ON inventory_movements(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inventory_movements_tipo') THEN
    CREATE INDEX idx_inventory_movements_tipo ON inventory_movements(tipo);
  END IF;
END $$;

-- RLS: Row Level Security Policies
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own inventory movements' 
                 AND tablename = 'inventory_movements') THEN
    CREATE POLICY "Users can view their own inventory movements"
      ON inventory_movements FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create inventory movements' 
                 AND tablename = 'inventory_movements') THEN
    CREATE POLICY "Users can create inventory movements"
      ON inventory_movements FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- No permitir UPDATE/DELETE en inventory_movements (auditoría inmutable)
-- Solo lectura y creación


-- ============================================================================
-- 3. FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para treatment_inventory_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_treatment_inventory_items_updated_at') THEN
    CREATE TRIGGER update_treatment_inventory_items_updated_at
      BEFORE UPDATE ON treatment_inventory_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


-- ============================================================================
-- 4. DATOS DE EJEMPLO (Opcional - Para testing)
-- ============================================================================
-- Descomentar para crear datos de ejemplo

/*
-- Asumiendo que ya existen:
-- - treatments con id 1 (Aplicación Botox)
-- - inventory_items con id 1 (Botox Allergan 100U), id 2 (Jeringa), id 3 (Toallitas)
-- - user_id de ejemplo

-- Insertar relaciones tratamiento-inventario
INSERT INTO treatment_inventory_items (treatment_id, inventory_item_id, cantidad_requerida, user_id)
VALUES
  (1, 1, 50, 'user-uuid-aqui'),  -- Aplicación Botox usa 50 unidades de Botox
  (1, 2, 1, 'user-uuid-aqui'),   -- Aplicación Botox usa 1 jeringa
  (1, 3, 2, 'user-uuid-aqui');   -- Aplicación Botox usa 2 toallitas
*/


-- ============================================================================
-- 5. VERIFICACIÓN DE MIGRACIÓN
-- ============================================================================
DO $$
BEGIN
  -- Verificar que las tablas se crearon correctamente
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'treatment_inventory_items') THEN
    RAISE NOTICE '✅ Tabla treatment_inventory_items creada exitosamente';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Tabla treatment_inventory_items no fue creada';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_movements') THEN
    RAISE NOTICE '✅ Tabla inventory_movements creada exitosamente';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Tabla inventory_movements no fue creada';
  END IF;

  RAISE NOTICE '🎉 MIGRACIÓN COMPLETADA - Sistema de inventario listo';
END $$;
