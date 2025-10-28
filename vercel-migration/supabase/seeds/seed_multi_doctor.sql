-- Seed Data: Datos iniciales para multi-doctor system
-- Ejecutar DESPUÉS de la migración principal
-- Nota: Reemplazar 'YOUR_USER_ID' con el UUID real del usuario

-- ============================================================================
-- IMPORTANTE: Configurar el user_id correcto
-- ============================================================================
-- Para obtener tu user_id, ejecuta en Supabase SQL Editor:
-- SELECT id FROM auth.users LIMIT 1;

-- Ejemplo de uso:
-- Reemplaza '00000000-0000-0000-0000-000000000000' con tu user_id real

DO $$
DECLARE
    default_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- REEMPLAZAR CON TU USER_ID
    doctor_id UUID;
    consultorio_id UUID;
BEGIN
    -- Insertar doctor por defecto
    INSERT INTO doctors (nombre, especialidad, color, activo, user_id)
    VALUES ('Dr. General', 'Medicina General', '#3b82f6', true, default_user_id)
    RETURNING id INTO doctor_id;
    
    RAISE NOTICE 'Doctor creado con ID: %', doctor_id;
    
    -- Insertar consultorio por defecto
    INSERT INTO consultorios (nombre, ubicacion, capacidad, activo, user_id)
    VALUES ('Consultorio Principal', 'Planta Baja', 1, true, default_user_id)
    RETURNING id INTO consultorio_id;
    
    RAISE NOTICE 'Consultorio creado con ID: %', consultorio_id;
    
    -- Insertar tipos de cita por defecto
    INSERT INTO appointment_types (nombre, descripcion, duracion_minutos, color, precio_default, activo, user_id)
    VALUES 
        ('Consulta General', 'Consulta médica estándar', 30, '#10b981', 500.00, true, default_user_id),
        ('Primera Vez', 'Primera consulta con historial completo', 45, '#f59e0b', 700.00, true, default_user_id),
        ('Seguimiento', 'Consulta de seguimiento rápida', 15, '#6366f1', 300.00, true, default_user_id),
        ('Procedimiento', 'Procedimiento médico especializado', 60, '#ef4444', 1500.00, true, default_user_id);
    
    RAISE NOTICE 'Tipos de cita creados';
    
    -- Insertar horarios por defecto (Lunes a Viernes 9:00-18:00)
    INSERT INTO doctor_schedules (doctor_id, consultorio_id, dia_semana, hora_inicio, hora_fin, activo, user_id)
    VALUES 
        (doctor_id, consultorio_id, 0, '09:00', '18:00', true, default_user_id), -- Lunes
        (doctor_id, consultorio_id, 1, '09:00', '18:00', true, default_user_id), -- Martes
        (doctor_id, consultorio_id, 2, '09:00', '18:00', true, default_user_id), -- Miércoles
        (doctor_id, consultorio_id, 3, '09:00', '18:00', true, default_user_id), -- Jueves
        (doctor_id, consultorio_id, 4, '09:00', '18:00', true, default_user_id); -- Viernes
    
    RAISE NOTICE 'Horarios creados para Lun-Vie 9:00-18:00';
END $$;

-- ============================================================================
-- VERIFICACIÓN: Queries para confirmar datos insertados
-- ============================================================================

-- Ver doctores creados
-- SELECT * FROM doctors;

-- Ver consultorios creados
-- SELECT * FROM consultorios;

-- Ver tipos de cita creados
-- SELECT * FROM appointment_types;

-- Ver horarios creados
-- SELECT 
--     ds.*,
--     d.nombre as doctor_nombre,
--     c.nombre as consultorio_nombre,
--     CASE ds.dia_semana
--         WHEN 0 THEN 'Lunes'
--         WHEN 1 THEN 'Martes'
--         WHEN 2 THEN 'Miércoles'
--         WHEN 3 THEN 'Jueves'
--         WHEN 4 THEN 'Viernes'
--         WHEN 5 THEN 'Sábado'
--         WHEN 6 THEN 'Domingo'
--     END as dia_nombre
-- FROM doctor_schedules ds
-- JOIN doctors d ON ds.doctor_id = d.id
-- LEFT JOIN consultorios c ON ds.consultorio_id = c.id
-- ORDER BY ds.dia_semana, ds.hora_inicio;
