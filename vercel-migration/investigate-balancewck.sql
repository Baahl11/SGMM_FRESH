-- =========================================================
-- INVESTIGAR EMAIL: balancewck@gmail.com
-- Verificar si existe en Supabase y qué datos tiene
-- =========================================================

-- 1. Buscar en auth.users
SELECT 
  '🔍 Usuario en auth.users' as verificacion,
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '⚠️ Email NO confirmado'
  END as estado_email
FROM auth.users 
WHERE email = 'balancewck@gmail.com';

-- 2. Buscar suscripciones asociadas
SELECT 
  '📋 Suscripciones' as verificacion,
  s.*
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'balancewck@gmail.com';

-- 3. Buscar en user_profiles
SELECT 
  '👤 Perfil de usuario' as verificacion,
  up.*
FROM user_profiles up
JOIN auth.users u ON u.id = up.user_id
WHERE u.email = 'balancewck@gmail.com';

-- 4. Ver todos los emails en Supabase para contexto
SELECT 
  '📊 Todos los usuarios registrados' as verificacion,
  u.email,
  u.created_at,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ Tiene suscripción'
    ELSE '❌ Sin suscripción'
  END as tiene_sub,
  s.plan_tier,
  s.status
FROM auth.users u
LEFT JOIN subscriptions s ON s.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 20;
