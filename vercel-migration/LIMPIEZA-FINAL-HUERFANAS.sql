-- =========================================================
-- LIMPIEZA FINAL DE SUSCRIPCIONES HUÉRFANAS
-- EXCLUYE: lopezduranfabiola, umepuebla, balancewck, instapost01, gm_melgarejo
-- Fecha: 15 Noviembre 2025
-- =========================================================

-- PASO 1: Ver qué se va a eliminar
SELECT 
  '🗑️ SUSCRIPCIONES QUE SE ELIMINARÁN' as reporte,
  u.email,
  s.id as subscription_id,
  s.plan_tier,
  s.status,
  s.trial_end,
  s.created_at,
  CASE 
    WHEN s.trial_end < NOW() THEN '❌ Trial vencido'
    WHEN s.trial_end > NOW() THEN '✅ Trial activo'
    ELSE '❓ Sin trial'
  END as estado_trial
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.stripe_subscription_id IS NULL
  AND u.email NOT IN (
    'lopezduranfabiola@gmail.com',
    'umepuebla@gmail.com', 
    'balancewck@gmail.com',
    'instapost01@hotmail.com',
    'gm_melgarejo@hotmail.com'
  )
ORDER BY u.email;

-- PASO 2: Contar cuántas se eliminarán
SELECT 
  '📊 RESUMEN' as reporte,
  COUNT(*) as total_a_eliminar,
  SUM(CASE WHEN s.status = 'trialing' THEN 1 ELSE 0 END) as en_trial,
  SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as activas
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.stripe_subscription_id IS NULL
  AND u.email NOT IN (
    'lopezduranfabiola@gmail.com',
    'umepuebla@gmail.com',
    'balancewck@gmail.com',
    'instapost01@hotmail.com',
    'gm_melgarejo@hotmail.com'
  );

-- =========================================================
-- ⚠️  EJECUTAR SOLO SI ESTÁS SEGURO
-- =========================================================

-- PASO 3: ELIMINAR suscripciones huérfanas (excepto las 5 excluidas)
/*
DELETE FROM subscriptions
WHERE stripe_subscription_id IS NULL
  AND user_id IN (
    SELECT id FROM auth.users 
    WHERE email NOT IN (
      'lopezduranfabiola@gmail.com',
      'umepuebla@gmail.com',
      'balancewck@gmail.com',
      'instapost01@hotmail.com',
      'gm_melgarejo@hotmail.com'
    )
  );
*/

-- PASO 4: Verificar resultado después de eliminar
/*
SELECT 
  '✅ VERIFICACIÓN POST-LIMPIEZA' as reporte,
  COUNT(*) as suscripciones_totales,
  SUM(CASE WHEN stripe_subscription_id IS NULL THEN 1 ELSE 0 END) as huerfanas_restantes,
  SUM(CASE WHEN stripe_subscription_id IS NOT NULL THEN 1 ELSE 0 END) as sincronizadas
FROM subscriptions;
*/

-- PASO 5: Ver lista de suscripciones finales
/*
SELECT 
  '📋 SUSCRIPCIONES FINALES' as reporte,
  u.email,
  s.stripe_subscription_id,
  s.plan_tier,
  s.status,
  CASE 
    WHEN s.stripe_subscription_id IS NULL THEN '⚠️ Huérfana (tuya)'
    ELSE '✅ Sincronizada con Stripe'
  END as estado
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY estado DESC, u.email;
*/

-- =========================================================
-- RESULTADO ESPERADO DESPUÉS DE LIMPIEZA:
-- - Total suscripciones: 7 (Juan + gmelgarejom + 5 tuyas)
-- - Huérfanas restantes: 5 (tus usuarios)
-- - Sincronizadas: 2 (Juan + gmelgarejom)
-- =========================================================
