-- SINCRONIZAR LAS 3 SUSCRIPCIONES HUÉRFANAS DE STRIPE

-- 1. JUAN CAMARILLO - Mantener solo UNA suscripción Pro (la primera)
-- Primero verificar su user_id
SELECT id, email FROM auth.users WHERE email = 'camarillojuan@hotmail.com' OR email = 'asc.admon23@gmail.com';

-- Usar el UUID que ya sabemos: 35b8c48e-44a2-4d7d-beb9-767b8a35b8db
-- Actualizar su suscripción existente con los datos de Stripe
UPDATE subscriptions
SET 
  stripe_subscription_id = 'sub_1SQYowCpe9CE4d2laNm6C3nA',
  stripe_price_id = 'price_1SJ3dDCpe9CE4d2lqT0oNxHm',
  plan_tier = 'pro',
  max_locations = 5,
  max_doctors = 10,
  status = 'active',
  current_period_start = to_timestamp(1730914002),
  current_period_end = to_timestamp(1733506002),
  updated_at = NOW()
WHERE user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db'
  AND plan_tier = 'pro';

-- 2. GUILLERMO (gmelgarejom@gmail.com) - Plan Básico
-- Buscar user_id
SELECT id, email FROM auth.users WHERE email = 'gmelgarejom@gmail.com';

-- Después de obtener el UUID, ejecutar (reemplaza USER_ID_AQUI con el UUID real):
-- INSERT INTO subscriptions (
--   user_id,
--   stripe_customer_id,
--   stripe_subscription_id,
--   stripe_price_id,
--   status,
--   plan_tier,
--   max_locations,
--   max_doctors,
--   current_period_start,
--   current_period_end,
--   created_at,
--   updated_at
-- )
-- VALUES (
--   'USER_ID_AQUI',
--   'cus_XXXXX', -- Obtener de Stripe
--   'sub_1SJ4LyCpe9CE4d2lkHcbdgRl',
--   'price_1SJ3d1Cpe9CE4d2lVCrSfaVm',
--   'active',
--   'basico',
--   1,
--   2,
--   to_timestamp(1729117758),
--   to_timestamp(1731796158),
--   to_timestamp(1729117758),
--   NOW()
-- );

-- 3. CANCELAR LA SUSCRIPCIÓN DUPLICADA DE JUAN EN STRIPE
-- Ve a Stripe Dashboard y cancela: sub_1SQYaOCpe9CE4d2luZTbzd5L
