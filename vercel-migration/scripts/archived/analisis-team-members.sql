-- =========================================================
-- ANÁLISIS COMPLETO DE TEAM_MEMBERS Y SUSCRIPCIONES
-- =========================================================

-- PASO 1: Ver TODOS los miembros de equipo con sus suscripciones
SELECT 
  '👥 TODOS LOS MIEMBROS DE EQUIPO' as reporte,
  owner.email as dueno,
  member.email as miembro,
  tm.role,
  tm.status as estado_invitacion,
  tm.accepted_at,
  s.id as tiene_suscripcion,
  s.stripe_subscription_id,
  CASE 
    WHEN s.stripe_subscription_id IS NULL AND s.id IS NOT NULL THEN '⚠️ Huérfana'
    WHEN s.stripe_subscription_id IS NOT NULL THEN '✅ Sincronizada'
    WHEN s.id IS NULL THEN '❌ Sin suscripción'
  END as estado_sub
FROM team_members tm
JOIN auth.users owner ON owner.id = tm.owner_user_id
LEFT JOIN auth.users member ON member.id = tm.member_user_id
LEFT JOIN subscriptions s ON s.user_id = tm.member_user_id
WHERE tm.status = 'active'  -- Solo los que aceptaron
ORDER BY owner.email, member.email;

-- PASO 2: ¿Cuáles suscripciones huérfanas SON de miembros de equipo?
SELECT 
  '🔍 HUÉRFANAS QUE SON MIEMBROS DE EQUIPO' as reporte,
  u.email as miembro_email,
  s.id as subscription_id,
  s.plan_tier,
  owner.email as dueno_cuenta,
  tm.role,
  tm.status as estado_invitacion
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
JOIN team_members tm ON tm.member_user_id = u.id
JOIN auth.users owner ON owner.id = tm.owner_user_id
WHERE s.stripe_subscription_id IS NULL
  AND tm.status = 'active';

-- PASO 3: ¿Cuáles suscripciones huérfanas NO son miembros de equipo?
SELECT 
  '🗑️ HUÉRFANAS QUE NO SON MIEMBROS (SE PUEDEN ELIMINAR)' as reporte,
  u.email,
  s.id as subscription_id,
  s.plan_tier,
  s.status,
  s.created_at
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.stripe_subscription_id IS NULL
  AND u.id NOT IN (
    SELECT member_user_id 
    FROM team_members 
    WHERE status = 'active' 
      AND member_user_id IS NOT NULL
  )
  AND u.email NOT IN (
    'lopezduranfabiola@gmail.com',
    'umepuebla@gmail.com',
    'balancewck@gmail.com',
    'gm_melgarejo@hotmail.com'  -- Este está pending
  )
ORDER BY u.email;
