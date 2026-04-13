-- =========================================================
-- LIMPIAR SUSCRIPCIONES HUÉRFANAS - SELECTIVO
-- EXCLUYE: lopezduranfabiola@gmail.com, umepuebla@gmail.com, balancewck@gmail.com
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
    'balancewck@gmail.com'
  )
ORDER BY u.email;

-- PASO 2: Contar cuántas se eliminarán
SELECT 
  '📊 RESUMEN' as reporte,
  COUNT(*) as total_a_eliminar
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.stripe_subscription_id IS NULL
  AND u.email NOT IN (
    'lopezduranfabiola@gmail.com',
    'umepuebla@gmail.com',
    'balancewck@gmail.com'
  );

-- =========================================================
-- ⚠️  EJECUTAR SOLO SI ESTÁS SEGURO
-- =========================================================

-- PASO 3: ELIMINAR suscripciones huérfanas (excepto las 3 excluidas)
/*
DELETE FROM subscriptions
WHERE stripe_subscription_id IS NULL
  AND user_id IN (
    SELECT id FROM auth.users 
    WHERE email NOT IN (
      'lopezduranfabiola@gmail.com',
      'umepuebla@gmail.com',
      'balancewck@gmail.com'
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

-- =========================================================
-- RESULTADO ESPERADO DESPUÉS DE LIMPIEZA:
-- - Total suscripciones: ~5 (Juan + gmelgarejom + 3 excluidas)
-- - Huérfanas restantes: 3 (lopezduranfabiola, umepuebla, balancewck)
-- - Sincronizadas: 2 (Juan + gmelgarejom)
-- =========================================================
