-- =========================================================
-- LIMPIAR SUSCRIPCIONES HUÉRFANAS
-- Eliminar suscripciones sin stripe_subscription_id
-- Fecha: 15 Noviembre 2025
-- =========================================================

-- PASO 1: Ver todas las suscripciones huérfanas
SELECT 
  '⚠️ SUSCRIPCIONES HUÉRFANAS A ELIMINAR' as paso,
  u.email,
  s.id,
  s.plan_tier,
  s.status,
  s.trial_end,
  s.created_at,
  CASE 
    WHEN s.trial_end < NOW() THEN '❌ Trial vencido'
    WHEN s.trial_end > NOW() THEN '⏰ Trial activo'
    WHEN s.trial_end IS NULL THEN '❓ Sin trial'
  END as estado_trial
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.stripe_subscription_id IS NULL
ORDER BY s.created_at DESC;

-- PASO 2: ELIMINAR todas las suscripciones huérfanas
-- Estas son suscripciones que nunca se conectaron a Stripe
-- (trials automáticos que nunca se convirtieron en pagos)

DELETE FROM subscriptions
WHERE stripe_subscription_id IS NULL;

-- PASO 3: Verificar que quedaron solo las reales
SELECT 
  '✅ SUSCRIPCIONES REALES RESTANTES' as verificacion,
  u.email,
  s.stripe_subscription_id,
  s.plan_tier,
  s.status,
  s.current_period_end
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY u.email;

-- PASO 4: Resumen final
SELECT 
  '📊 RESUMEN DESPUÉS DE LIMPIEZA' as reporte,
  COUNT(*) as total_suscripciones,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activas,
  SUM(CASE WHEN status = 'trialing' THEN 1 ELSE 0 END) as en_trial,
  SUM(CASE WHEN stripe_subscription_id IS NULL THEN 1 ELSE 0 END) as huerfanas
FROM subscriptions;

-- =========================================================
-- RESULTADO ESPERADO
-- =========================================================
/*
Después de ejecutar:
- Total suscripciones: 2
- Activas: 2
- En trial: 0  
- Huérfanas: 0

Solo deben quedar:
1. Juan Camarillo - sub_1SQYowCpe9CE4d2laNm6C3nA - Pro
2. gmelgarejom@gmail.com - sub_1SJ4LyCpe9CE4d2lkHcbdgRl - Básico
*/
