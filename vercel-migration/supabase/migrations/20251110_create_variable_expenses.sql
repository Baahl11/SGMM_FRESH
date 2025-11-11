-- ============================================
-- MIGRATION: Variable Expenses (Gastos Variables)
-- Date: 2025-11-10
-- Description: Sistema completo de gastos variables/ocasionales
-- Author: AgendaMedPro Team
-- ============================================

-- ============================================
-- 1. CREATE TABLE: variable_expenses
-- ============================================
CREATE TABLE IF NOT EXISTS variable_expenses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información básica del gasto
  concepto VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(100) NOT NULL,
  
  -- Categorías disponibles:
  -- 'reparacion'             - Reparación de equipos
  -- 'mantenimiento'          - Mantenimiento preventivo/correctivo
  -- 'compras_equipo'         - Adquisición de equipo médico/mobiliario
  -- 'insumos_extraordinarios' - Compra especial de insumos
  -- 'servicios_profesionales' - Contador, abogado, consultor
  -- 'marketing'              - Publicidad, redes sociales
  -- 'capacitacion'           - Cursos, certificaciones
  -- 'tecnologia'             - Software, licencias, IT
  -- 'viajes'                 - Viáticos, transporte, hospedaje
  -- 'otros'                  - Gastos varios
  
  -- Información financiera
  monto DECIMAL(10,2) NOT NULL CHECK (monto >= 0),
  fecha DATE NOT NULL,
  metodo_pago VARCHAR(50),
  -- 'efectivo', 'tarjeta', 'transferencia', 'cheque'
  
  -- Proveedor/Vendedor
  proveedor VARCHAR(255),
  proveedor_rfc VARCHAR(13),
  proveedor_telefono VARCHAR(20),
  proveedor_email VARCHAR(255),
  
  -- Facturación
  factura_numero VARCHAR(100),
  factura_url TEXT,
  factura_tipo VARCHAR(50),
  -- 'fiscal' (con RFC/CFDI), 'simple' (ticket), 'ninguna'
  es_deducible BOOLEAN DEFAULT true,
  -- Si el gasto es deducible de impuestos
  
  -- Notas y metadatos
  notas TEXT,
  tags TEXT[],
  -- Array de tags custom: ['urgente', 'capital', 'garantia', 'recurrente']
  
  -- Sistema de aprobación
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
  -- 'pendiente', 'aprobado', 'rechazado', 'pagado'
  aprobado_por UUID REFERENCES auth.users(id),
  aprobado_fecha TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  -- Soft delete para auditoría
  
  -- Constraints
  CONSTRAINT valid_categoria CHECK (
    categoria IN (
      'reparacion',
      'mantenimiento',
      'compras_equipo',
      'insumos_extraordinarios',
      'servicios_profesionales',
      'marketing',
      'capacitacion',
      'tecnologia',
      'viajes',
      'otros'
    )
  ),
  CONSTRAINT valid_metodo_pago CHECK (
    metodo_pago IS NULL OR 
    metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'cheque')
  ),
  CONSTRAINT valid_estado CHECK (
    estado IN ('pendiente', 'aprobado', 'rechazado', 'pagado')
  ),
  CONSTRAINT valid_factura_tipo CHECK (
    factura_tipo IS NULL OR 
    factura_tipo IN ('fiscal', 'simple', 'ninguna')
  )
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- Índice principal por usuario (RLS)
CREATE INDEX idx_variable_expenses_user_id 
  ON variable_expenses(user_id) 
  WHERE deleted_at IS NULL;

-- Índice por fecha (búsqueda temporal)
CREATE INDEX idx_variable_expenses_fecha 
  ON variable_expenses(fecha DESC) 
  WHERE deleted_at IS NULL;

-- Índice por categoría (filtros)
CREATE INDEX idx_variable_expenses_categoria 
  ON variable_expenses(categoria) 
  WHERE deleted_at IS NULL;

-- Índice por proveedor (búsqueda de gastos por proveedor)
CREATE INDEX idx_variable_expenses_proveedor 
  ON variable_expenses(proveedor) 
  WHERE deleted_at IS NULL AND proveedor IS NOT NULL;

-- Índice por estado (filtrar pendientes/aprobados)
CREATE INDEX idx_variable_expenses_estado 
  ON variable_expenses(estado) 
  WHERE deleted_at IS NULL;

-- Índice compuesto user + fecha (consultas más comunes)
CREATE INDEX idx_variable_expenses_user_fecha 
  ON variable_expenses(user_id, fecha DESC) 
  WHERE deleted_at IS NULL;

-- Índice GIN para búsqueda de tags
CREATE INDEX idx_variable_expenses_tags 
  ON variable_expenses USING GIN(tags) 
  WHERE deleted_at IS NULL;

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo ven sus propios gastos
CREATE POLICY "Users can view own variable expenses"
  ON variable_expenses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden insertar sus propios gastos
CREATE POLICY "Users can insert own variable expenses"
  ON variable_expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Los usuarios pueden actualizar sus propios gastos
CREATE POLICY "Users can update own variable expenses"
  ON variable_expenses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Los usuarios pueden eliminar (soft delete) sus propios gastos
CREATE POLICY "Users can delete own variable expenses"
  ON variable_expenses
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. TRIGGER: Updated_at automático
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_variable_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_variable_expenses_updated_at
  BEFORE UPDATE ON variable_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_variable_expenses_updated_at();

-- ============================================
-- 5. COMMENTS (Documentación)
-- ============================================

COMMENT ON TABLE variable_expenses IS 
  'Gastos variables/ocasionales de la clínica (reparaciones, compras, marketing, etc.)';

COMMENT ON COLUMN variable_expenses.concepto IS 
  'Nombre descriptivo del gasto (ej: "Reparación equipo láser")';

COMMENT ON COLUMN variable_expenses.categoria IS 
  'Categoría del gasto para reportes y análisis';

COMMENT ON COLUMN variable_expenses.monto IS 
  'Monto total del gasto en MXN (pesos mexicanos)';

COMMENT ON COLUMN variable_expenses.fecha IS 
  'Fecha en que se realizó el gasto';

COMMENT ON COLUMN variable_expenses.factura_url IS 
  'URL del PDF/imagen de la factura en Supabase Storage';

COMMENT ON COLUMN variable_expenses.es_deducible IS 
  'Indica si el gasto es deducible de impuestos (para reportes al contador)';

COMMENT ON COLUMN variable_expenses.estado IS 
  'Estado del gasto en el flujo de aprobación';

COMMENT ON COLUMN variable_expenses.deleted_at IS 
  'Soft delete: fecha de eliminación lógica (NULL = activo)';

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

-- Dar permisos a usuarios autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON variable_expenses TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE variable_expenses_id_seq TO authenticated;

-- ============================================
-- 7. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully: variable_expenses table created';
  RAISE NOTICE '📊 Features enabled:';
  RAISE NOTICE '   - Gastos variables/ocasionales';
  RAISE NOTICE '   - Sistema de aprobación';
  RAISE NOTICE '   - Gestión de proveedores';
  RAISE NOTICE '   - Upload de facturas';
  RAISE NOTICE '   - Tags personalizados';
  RAISE NOTICE '   - Soft delete para auditoría';
  RAISE NOTICE '   - RLS habilitado para multi-tenancy';
END $$;
