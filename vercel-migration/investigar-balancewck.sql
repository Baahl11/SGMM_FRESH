-- =========================================================
-- INVESTIGAR balancewck@gmail.com
-- =========================================================

SELECT 
  '🔍 INVESTIGACIÓN BALANCEWCK' as reporte,
  u.id as user_id,
  u.email,
  u.created_at as usuario_creado,
  s.id as subscription_id,
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.plan_tier,
  s.status,
  s.trial_start,
  s.trial_end,
  CASE 
    WHEN s.trial_end IS NULL THEN '❓ Sin trial definido'
    WHEN s.trial_end > NOW() THEN '✅ Trial activo hasta ' || s.trial_end::date
    WHEN s.trial_end < NOW() THEN '❌ Trial VENCIDO desde ' || s.trial_end::date || ' (hace ' || EXTRACT(DAY FROM NOW() - s.trial_end) || ' días)'
  END as estado_trial,
  s.current_period_start,
  s.current_period_end,
  s.created_at as suscripcion_creada,
  CASE 
    WHEN s.stripe_subscription_id IS NULL THEN '⚠️ HUÉRFANA - No existe en Stripe'
    ELSE '✅ Sincronizada con Stripe'
  END as sync_status
FROM auth.users u
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'balancewck@gmail.com';

-- =========================================================
-- VERIFICAR SI TIENE DATOS EN OTRAS TABLAS
-- =========================================================

SELECT 
  '👥 PACIENTES CREADOS' as tabla,
  COUNT(*) as cantidad
FROM patients
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'balancewck@gmail.com');

SELECT 
  '📅 CITAS CREADAS' as tabla,
  COUNT(*) as cantidad
FROM appointments
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'balancewck@gmail.com');

SELECT 
  '💉 TRATAMIENTOS CREADOS' as tabla,
  COUNT(*) as cantidad
FROM treatments
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'balancewck@gmail.com');

-- =========================================================
-- BUSCAR PACIENTES DETALLADOS
-- =========================================================

SELECT 
  '👥 PACIENTES DETALLADOS' as reporte,
  p.*
FROM patients p
WHERE p.user_id = 'fff54bcd-357f-44cc-8186-e12ecf059342'
ORDER BY p.created_at DESC
LIMIT 10;
