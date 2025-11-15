-- SINCRONIZAR SUSCRIPCIÓN DE JUAN CAMARILLO
-- Email en Supabase: asc.admon23@gmail.com
-- UUID CORRECTO: 35b8c48e-44a2-4d7d-beb9-767b8a35b8db
-- Fecha registro: 2025-11-10 16:47

-- Paso 1: Verificar si ya existe
SELECT * FROM subscriptions WHERE user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db';

-- Paso 2: Insertar suscripción (ejecutar solo si el SELECT anterior no devolvió nada)
INSERT INTO subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  plan_tier,
  max_locations,
  max_doctors,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
)
VALUES (
  '35b8c48e-44a2-4d7d-beb9-767b8a35b8db',
  'cus_RKCnYiMD22hfWC',
  'sub_1SQYowCpe9CE4d2laNm6C3nA',
  'price_1SJ3d1Cpe9CE4d2lVCrSfaVm',
  'active',
  'basico',
  1,
  2,
  to_timestamp(1730940062),
  to_timestamp(1731544862),
  to_timestamp(1730940062),
  NOW()
);

-- Paso 3: Verificar que se creó correctamente
SELECT 
  u.email as email_supabase,
  s.stripe_subscription_id,
  s.plan_tier,
  s.status,
  s.current_period_end,
  CASE 
    WHEN s.current_period_end < NOW() THEN 'VENCIDO'
    ELSE 'Activo'
  END as estado
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db';
