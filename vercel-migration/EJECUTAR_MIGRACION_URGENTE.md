# MIGRACIÓN URGENTE - Agregar costo_unitario a tabla treatments

## 🚨 EJECUTAR INMEDIATAMENTE EN SUPABASE

### Paso 1: Ve a tu proyecto en Supabase
https://app.supabase.com

### Paso 2: Ve a SQL Editor
Click en "SQL Editor" en el menú lateral

### Paso 3: Crea una nueva query y pega esto:

```sql
-- Add costo_unitario column to treatments table
ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(10,2) DEFAULT 0;

-- Add duracion_minutos column if it doesn't exist
ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER DEFAULT 30;

-- Add activo column if it doesn't exist
ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Add comments
COMMENT ON COLUMN treatments.costo_unitario IS 'Costo unitario del tratamiento (materiales y recursos)';
COMMENT ON COLUMN treatments.duracion_minutos IS 'Duración estimada del tratamiento en minutos';
COMMENT ON COLUMN treatments.activo IS 'Indica si el tratamiento está activo';
```

### Paso 4: Click en "Run" (Ejecutar)

### Paso 5: Verifica que se ejecutó correctamente
Deberías ver un mensaje de éxito. Si ves "column already exists", está bien, significa que ya existía.

## ✅ DESPUÉS DE EJECUTAR

Una vez ejecutada la migración, el sistema de tratamientos funcionará correctamente:
- Se guardará el costo_unitario ✅
- Se guardará duracion_minutos ✅ 
- Se guardará el estado activo ✅
- Se calculará correctamente el margen de ganancia ✅

## 🔍 Verificación

Para verificar que las columnas se agregaron, ejecuta:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'treatments' 
ORDER BY ordinal_position;
```

Deberías ver las columnas:
- costo_unitario (DECIMAL)
- duracion_minutos (INTEGER)
- activo (BOOLEAN)
