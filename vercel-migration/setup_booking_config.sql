-- ============================================
-- ACTIVAR BOOKING PARA TU USUARIO
-- ============================================

-- 1. Activar booking y asignar slug
UPDATE user_profiles 
SET 
  booking_enabled = true,
  booking_slug = 'dr-melgarejo'
WHERE email = 'guillermo.melgarejo.m@gmail.com';

-- 2. Verificar que se aplicó
SELECT 
  booking_slug, 
  booking_enabled, 
  email,
  name
FROM user_profiles 
WHERE email = 'guillermo.melgarejo.m@gmail.com';

-- ============================================
-- CREAR CONFIGURACIÓN INICIAL DE BOOKING
-- ============================================

-- 3. Insertar configuración de horarios y servicios
INSERT INTO booking_settings (
  user_id,
  available_days,
  time_ranges,
  slot_duration_minutes,
  buffer_time_minutes,
  services,
  page_title,
  welcome_message,
  show_prices,
  auto_confirm,
  min_advance_hours,
  max_advance_days
)
SELECT 
  user_id,
  '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
  '{"monday": [{"start": "09:00", "end": "13:00"}, {"start": "15:00", "end": "19:00"}], "tuesday": [{"start": "09:00", "end": "13:00"}, {"start": "15:00", "end": "19:00"}], "wednesday": [{"start": "09:00", "end": "13:00"}, {"start": "15:00", "end": "19:00"}], "thursday": [{"start": "09:00", "end": "13:00"}, {"start": "15:00", "end": "19:00"}], "friday": [{"start": "09:00", "end": "13:00"}, {"start": "15:00", "end": "19:00"}]}'::jsonb,
  30,
  5,
  '[
    {
      "id": "1", 
      "name": "Consulta general", 
      "duration": 30, 
      "price": 500,
      "description": "Consulta médica general"
    }, 
    {
      "id": "2", 
      "name": "Tratamiento facial", 
      "duration": 60, 
      "price": 800,
      "description": "Tratamiento facial completo"
    },
    {
      "id": "3", 
      "name": "Seguimiento", 
      "duration": 20, 
      "price": 300,
      "description": "Consulta de seguimiento"
    }
  ]'::jsonb,
  'Agendar cita - Dr. Melgarejo',
  'Bienvenido. Selecciona el servicio y horario que mejor te convenga. Te confirmaremos tu cita a la brevedad.',
  true,
  false,
  2,
  60
FROM user_profiles
WHERE email = 'guillermo.melgarejo.m@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  available_days = EXCLUDED.available_days,
  time_ranges = EXCLUDED.time_ranges,
  services = EXCLUDED.services,
  page_title = EXCLUDED.page_title,
  welcome_message = EXCLUDED.welcome_message;

-- 4. Verificar configuración creada
SELECT 
  bs.page_title,
  bs.slot_duration_minutes,
  bs.auto_confirm,
  jsonb_array_length(bs.services) as num_services,
  up.booking_slug,
  up.email
FROM booking_settings bs
JOIN user_profiles up ON bs.user_id = up.user_id
WHERE up.email = 'guillermo.melgarejo.m@gmail.com';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Tu URL pública será:
-- https://agendamedpro.com/book/dr-melgarejo
