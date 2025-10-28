# 🔧 INSTRUCCIONES - Crear Tabla patient_notes en Supabase

## ⚠️ IMPORTANTE: Ejecuta esto AHORA para que funcionen las notas

### 📍 Dónde ejecutar:
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Click en **SQL Editor** (menú izquierdo)
4. Click en **New Query**
5. Copia y pega el siguiente SQL:

---

## 📝 SQL A EJECUTAR:

```sql
-- ============================================
-- TABLA PATIENT_NOTES
-- Sistema de notas personales para pacientes
-- ============================================

-- Crear tabla
CREATE TABLE IF NOT EXISTS patient_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_nota VARCHAR(20) NOT NULL CHECK (tipo_nota IN ('pendiente', 'idea', 'importante', 'general', 'completada')),
  titulo VARCHAR(255),
  contenido TEXT NOT NULL,
  completada BOOLEAN DEFAULT false,
  fecha_completada TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_id ON patient_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_user_id ON patient_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_tipo ON patient_notes(tipo_nota);
CREATE INDEX IF NOT EXISTS idx_patient_notes_completada ON patient_notes(completada);

-- Habilitar Row Level Security
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad

-- Ver solo tus propias notas
CREATE POLICY "Users can view their own patient notes"
  ON patient_notes 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Insertar solo tus propias notas
CREATE POLICY "Users can insert their own patient notes"
  ON patient_notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Actualizar solo tus propias notas
CREATE POLICY "Users can update their own patient notes"
  ON patient_notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Eliminar solo tus propias notas
CREATE POLICY "Users can delete their own patient notes"
  ON patient_notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_patient_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función
DROP TRIGGER IF EXISTS update_patient_notes_updated_at_trigger ON patient_notes;

CREATE TRIGGER update_patient_notes_updated_at_trigger
  BEFORE UPDATE ON patient_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_notes_updated_at();

-- ============================================
-- ✅ LISTO! Ejecuta este query completo
-- ============================================
```

---

## ✅ Después de ejecutar:

1. Deberías ver: **Success. No rows returned**
2. Ve a **Table Editor** (menú izquierdo)
3. Busca la tabla **patient_notes**
4. Deberías ver las columnas creadas

---

## 🧪 Para probar:

1. Recarga **agendamedpro.com**
2. Ve a un paciente
3. Click en tab **"📝 Notas"**
4. Click en **"Nueva Nota"**
5. ¡Debería funcionar!

---

## ❌ Si hay error:

Puede ser que las policies ya existan. Ejecuta esto primero:

```sql
-- Eliminar policies existentes
DROP POLICY IF EXISTS "Users can view their own patient notes" ON patient_notes;
DROP POLICY IF EXISTS "Users can insert their own patient notes" ON patient_notes;
DROP POLICY IF EXISTS "Users can update their own patient notes" ON patient_notes;
DROP POLICY IF EXISTS "Users can delete their own patient notes" ON patient_notes;

-- Luego ejecuta el SQL completo de arriba
```
