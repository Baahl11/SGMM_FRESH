-- LIMPIAR Y CORREGIR SUSCRIPCIONES DE JUAN CAMARILLO
-- Tiene 2 suscripciones: Plan Pro (trial) y Plan Básico (duplicada de Stripe)

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

-- 2. ELIMINAR la suscripción del Plan Pro (trial) porque la de Stripe es la real
-- Buscar el ID de la suscripción con stripe_subscription_id = NULL
DELETE FROM subscriptions
WHERE user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db'
  AND stripe_subscription_id IS NULL;

-- 3. ACTUALIZAR la suscripción de Stripe con fechas correctas
UPDATE subscriptions
SET 
  current_period_start = to_timestamp(1730940062),  -- 6 nov 2024 20:41
  current_period_end = to_timestamp(1731544862),     -- 13 nov 2024 20:41 (7 días después)
  status = 'active',
  updated_at = NOW()
WHERE user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db'
  AND stripe_subscription_id = 'sub_1SQYowCpe9CE4d2laNm6C3nA';

-- 4. Verificar resultado final
SELECT 
  u.email,
  s.stripe_subscription_id,
  s.plan_tier,
  s.status,
  s.current_period_start,
  s.current_period_end,
  CASE 
    WHEN s.current_period_end < NOW() THEN 'VENCIDO - Debe cobrar'
    ELSE 'Activo'
  END as estado_cobro
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db';
