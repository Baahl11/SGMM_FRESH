-- =========================================================
-- LIMPIEZA DEFINITIVA - SOLO 3 SUSCRIPCIONES TEST
-- Fecha: 15 Noviembre 2025
-- =========================================================

-- PASO 1: Ver exactamente qué se eliminará (solo tests de mailinator)
SELECT 
  '🗑️ SUSCRIPCIONES A ELIMINAR (SOLO TESTS)' as reporte,
  u.email,
  s.id as subscription_id,
  s.plan_tier,
  s.status,
  s.created_at
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.id IN (
  'e96ce039-a070-408c-a2d5-9851959411a3',  -- test-owner+1763065121354@mailinator.com
  '49503f47-4480-489c-8137-67c4101cd1cc',  -- test-owner+1763065224979@mailinator.com
  '8025a101-2587-4434-87c6-779e70156571'   -- test-owner+1763065277224@mailinator.com
)
ORDER BY u.email;

-- =========================================================
-- ⚠️  EJECUTAR PARA ELIMINAR SOLO LAS 3 SUSCRIPCIONES TEST
-- =========================================================

-- PASO 2: ELIMINAR solo las 3 suscripciones de mailinator (tests)
/*
DELETE FROM subscriptions
WHERE id IN (
  'e96ce039-a070-408c-a2d5-9851959411a3',
  '49503f47-4480-489c-8137-67c4101cd1cc',
  '8025a101-2587-4434-87c6-779e70156571'
);
*/

-- PASO 3: Verificar resultado
/*
SELECT 
  '✅ ESTADO FINAL' as reporte,
  COUNT(*) as suscripciones_totales,
  SUM(CASE WHEN stripe_subscription_id IS NULL THEN 1 ELSE 0 END) as huerfanas,
  SUM(CASE WHEN stripe_subscription_id IS NOT NULL THEN 1 ELSE 0 END) as sincronizadas
FROM subscriptions;
*/

-- PASO 4: Ver lista completa final
/*
SELECT 
  '📋 TODAS LAS SUSCRIPCIONES FINALES' as reporte,
  u.email,
  s.stripe_subscription_id,
  s.plan_tier,
  s.status,
  CASE 
    WHEN s.stripe_subscription_id IS NULL THEN '⚠️ Huérfana (tu usuario o miembro de equipo)'
    ELSE '✅ Sincronizada con Stripe'
  END as estado,
  CASE
    WHEN tm.id IS NOT NULL THEN '👥 Miembro de equipo de ' || owner.email
    ELSE '👤 Usuario independiente'
  END as tipo_usuario
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
LEFT JOIN team_members tm ON tm.member_user_id = u.id AND tm.status = 'active'
LEFT JOIN auth.users owner ON owner.id = tm.owner_user_id
ORDER BY estado DESC, u.email;
*/

-- =========================================================
-- RESULTADO ESPERADO:
-- - Total: 10 suscripciones
-- - Huérfanas: 6 (instapost01, instapost03, gm_melgarejo, lopezduranfabiola, umepuebla, balancewck)
-- - Sincronizadas: 2 (Juan + gmelgarejom)
-- - Miembros de equipo: 1 (instapost01@hotmail.com)
-- =========================================================
