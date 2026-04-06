-- Agregar columnas para sistema de recordatorios
-- EJECUTAR EN: Supabase SQL Editor

-- 1. Agregar columna para marcar si se envió recordatorio
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS recordatorio_enviado BOOLEAN DEFAULT false;

-- 2. Agregar columnas para registrar cuándo se enviaron los recordatorios
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS recordatorio_24h_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS recordatorio_2h_at TIMESTAMPTZ;

-- 3. Crear índices para mejorar queries de recordatorios
CREATE INDEX IF NOT EXISTS idx_appointments_reminders 
ON appointments(fecha_hora, recordatorio_enviado, estado) 
WHERE estado IN ('programada', 'confirmada');

-- 4. Comentarios para documentación
COMMENT ON COLUMN appointments.recordatorio_enviado IS 'Indica si se envió al menos un recordatorio para esta cita';
COMMENT ON COLUMN appointments.recordatorio_24h_at IS 'Timestamp cuando se envió el recordatorio de 24 horas';
COMMENT ON COLUMN appointments.recordatorio_2h_at IS 'Timestamp cuando se envió el recordatorio de 2 horas';

-- Verificar que se aplicaron los cambios
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
AND column_name LIKE 'recordatorio%'
ORDER BY ordinal_position;
