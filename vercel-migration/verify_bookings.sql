-- ============================================
-- VERIFICAR BOOKINGS CREADOS
-- ============================================

-- Ver todos los bookings
SELECT 
  id,
  patient_name,
  patient_email,
  patient_phone,
  service_name,
  service_price,
  booking_date,
  booking_time,
  status,
  patient_notes,
  created_at
FROM public_bookings
ORDER BY created_at DESC
LIMIT 10;

-- Ver booking con detalles de la clínica
SELECT 
  pb.id,
  pb.patient_name,
  pb.patient_email,
  pb.service_name,
  pb.booking_date,
  pb.booking_time,
  pb.status,
  up.name as clinic_name,
  up.email as clinic_email,
  up.booking_slug
FROM public_bookings pb
JOIN user_profiles up ON pb.clinic_user_id = up.user_id
ORDER BY pb.created_at DESC
LIMIT 10;
