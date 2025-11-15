-- LIMPIAR SUSCRIPCIÓN BÁSICA Y MANTENER PRO PARA JUAN CAMARILLO
-- Juan quiere Plan Pro, no Básico

-- 1. Ver todas sus suscripciones actuales
SELECT 
  id,
  stripe_subscription_id,
  plan_tier,
  status,
  current_period_end,
  created_at
FROM subscriptions
WHERE user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db'
ORDER BY created_at DESC;

-- 2. ELIMINAR la suscripción Básica de Stripe de la BD
DELETE FROM subscriptions
WHERE user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db'
  AND stripe_subscription_id = 'sub_1SQYowCpe9CE4d2laNm6C3nA';

-- 3. Verificar que solo queda la suscripción Pro
SELECT 
  u.email,
  s.stripe_subscription_id,
  s.plan_tier,
  s.status,
  s.current_period_end,
  CASE 
    WHEN s.current_period_end < NOW() THEN 'VENCIDO'
    WHEN s.current_period_end > NOW() THEN 'ACTIVO'
  END as estado
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db';
