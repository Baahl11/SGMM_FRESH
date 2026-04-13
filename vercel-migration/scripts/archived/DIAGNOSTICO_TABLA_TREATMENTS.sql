-- DIAGNÓSTICO: Ver todas las columnas de la tabla treatments
-- Ejecuta esto en Supabase SQL Editor para ver qué columnas existen

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'treatments'
ORDER BY 
    ordinal_position;

-- También verifica si hay datos en la tabla
SELECT COUNT(*) as total_treatments FROM treatments;

-- Muestra un ejemplo de registro (si existe)
SELECT * FROM treatments LIMIT 1;
