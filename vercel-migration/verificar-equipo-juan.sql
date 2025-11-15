-- =========================================================
-- VERIFICAR SI SUSCRIPCIONES HUÉRFANAS SON MIEMBROS DE EQUIPO
-- =========================================================

-- PASO 1: Ver todas las suscripciones huérfanas con su relación a equipos
SELECT 
  '🔍 SUSCRIPCIONES HUÉRFANAS Y SU RELACIÓN CON EQUIPOS' as reporte,
  u.email,
  s.id as subscription_id,
  s.plan_tier,
  s.status,
  s.created_at,
  CASE 
    WHEN tm.id IS NOT NULL THEN '👥 ES MIEMBRO DE EQUIPO'
    ELSE '❌ NO ES MIEMBRO DE EQUIPO'
  END as es_miembro,
  tm.role as rol_en_equipo,
  tm.status as estado_invitacion,
  owner.email as dueno_cuenta
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
LEFT JOIN team_members tm ON tm.member_user_id = u.id
LEFT JOIN auth.users owner ON owner.id = tm.owner_user_id
WHERE s.stripe_subscription_id IS NULL
ORDER BY es_miembro DESC, u.email;

-- PASO 2: ¿Cuántos son miembros de equipo vs usuarios independientes?
SELECT 
  '📊 RESUMEN HUÉRFANAS' as categoria,
  COUNT(*) as total,
  SUM(CASE WHEN tm.id IS NOT NULL THEN 1 ELSE 0 END) as miembros_equipo,
  SUM(CASE WHEN tm.id IS NULL THEN 1 ELSE 0 END) as usuarios_independientes
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
LEFT JOIN team_members tm ON tm.member_user_id = u.id
WHERE s.stripe_subscription_id IS NULL;

-- PASO 3: Ver equipo de Juan específicamente
SELECT 
  '👥 EQUIPO DE JUAN CAMARILLO' as reporte,
  u.email,
  tm.role,
  tm.status as estado_invitacion,
  tm.created_at as agregado_al_equipo,
  s.id as tiene_suscripcion,
  s.stripe_subscription_id,
  CASE 
    WHEN s.stripe_subscription_id IS NULL THEN '⚠️ Huérfana'
    WHEN s.stripe_subscription_id IS NOT NULL THEN '✅ Sincronizada'
    WHEN s.id IS NULL THEN '❌ Sin suscripción'
  END as estado_sub
FROM team_members tm
JOIN auth.users owner ON owner.id = tm.owner_user_id
JOIN auth.users u ON u.id = tm.member_user_id
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE owner.email = 'asc.admon23@gmail.com'
ORDER BY tm.created_at DESC;
