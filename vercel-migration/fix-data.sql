-- Script para arreglar datos de inventario (valores NULL) y verificar timezone de citas
-- Usuario: gmelgarejom@gmail.com (86cbe61c-8829-41a2-aa29-81e11844f83e)

-- 1. Actualizar inventario: Convertir NULL a 0 en cantidad_actual
UPDATE inventory_items
SET cantidad_actual = 0
WHERE cantidad_actual IS NULL 
  AND user_id = '86cbe61c-8829-41a2-aa29-81e11844f83e';

-- 2. Verificar las fechas de las citas de hoy
SELECT 
  id,
  fecha_hora,
  fecha_hora AT TIME ZONE 'America/Mexico_City' as hora_mexico,
  duracion_minutos,
  estado,
  patient_id
FROM appointments
WHERE user_id = '86cbe61c-8829-41a2-aa29-81e11844f83e'
  AND fecha_hora::date = CURRENT_DATE
ORDER BY fecha_hora;

-- 3. Verificar inventario actualizado
SELECT 
  nombre,
  cantidad_actual,
  stock_minimo,
  precio_unitario
FROM inventory_items
WHERE user_id = '86cbe61c-8829-41a2-aa29-81e11844f83e'
ORDER BY nombre;
