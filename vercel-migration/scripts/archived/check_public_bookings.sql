-- Verificar reservas públicas en la base de datos
SELECT 
  id,
  patient_name,
  patient_email,
  service_name,
  booking_datetime,
  status,
  created_at
FROM public_bookings
WHERE booking_datetime >= NOW()
ORDER BY booking_datetime;
