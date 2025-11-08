-- ============================================
-- CREAR TRIAL PARA USUARIOS EXISTENTES
-- ============================================
-- Este script crea trials de 7 días para todos los usuarios
-- que existen en la tabla 'users' pero NO tienen suscripción

-- Insertar trials para usuarios sin suscripción
INSERT INTO subscriptions (
  user_id,
  status,
  plan,
  plan_tier,
  billing_cycle,
  trial_end_date,
  trial_ends_at,
  current_period_start,
  current_period_end,
  created_at
)
SELECT 
  u.id as user_id,
  'trialing' as status,
  'basico' as plan,
  'basico' as plan_tier,
  'monthly' as billing_cycle,
  NOW() + INTERVAL '7 days' as trial_end_date,
  NOW() + INTERVAL '7 days' as trial_ends_at,
  NOW() as current_period_start,
  NOW() + INTERVAL '7 days' as current_period_end,
  NOW() as created_at
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE s.user_id IS NULL  -- Solo usuarios sin suscripción
ON CONFLICT (user_id) DO NOTHING;

-- Verificar cuántos trials se crearon
SELECT 
  COUNT(*) as trials_creados,
  (SELECT COUNT(*) FROM users) as total_usuarios,
  (SELECT COUNT(*) FROM subscriptions) as total_subscripciones
FROM subscriptions
WHERE status = 'trialing';

-- Ver los trials creados
SELECT 
  u.email,
  u.name,
  s.status,
  s.plan_tier,
  s.trial_end_date,
  s.created_at
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.status = 'trialing'
ORDER BY s.created_at DESC;
