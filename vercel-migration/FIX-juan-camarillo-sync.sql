-- =========================================================
-- SINCRONIZAR SUSCRIPCIÓN DE JUAN CAMARILLO
-- Email: asc.admon23@gmail.com
-- Stripe Sub: sub_1SQYowCpe9CE4d2laNm6C3nA
-- Fecha: 14 Noviembre 2025 23:50
-- =========================================================

-- PROBLEMA DETECTADO:
-- Juan tiene una suscripción "trialing" con stripe_subscription_id = NULL en Supabase
-- Pero en Stripe tiene sub_1SQYowCpe9CE4d2laNm6C3nA ACTIVA (ya pasó el trial)

-- PASO 1: Ver estado actual de Juan en Supabase
SELECT 
  '🔍 PASO 1: Estado actual de Juan' as paso,
  id,
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  plan_tier,
  status,
  current_period_start,
  current_period_end,
  trial_start,
  trial_end
FROM subscriptions
WHERE user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db'
ORDER BY created_at DESC;

-- PASO 2: ELIMINAR la suscripción trial huérfana (sin stripe_subscription_id)
DELETE FROM subscriptions
WHERE user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db'
  AND stripe_subscription_id IS NULL;

-- PASO 3: INSERTAR la suscripción real de Stripe
-- Datos confirmados de Stripe:
-- - Subscription: sub_1SQYowCpe9CE4d2laNm6C3nA
-- - Customer: cus_TNJR4FrB18TbhM
-- - Plan: Pro $999 MXN/mes
-- - Status: active (trial terminó el 13 nov)
-- - Periodo actual: 13 nov → 13 dic 2025

INSERT INTO subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  stripe_price_id,
  plan_tier,
  max_doctors,
  max_locations,
  features,
  status,
  current_period_start,
  current_period_end,
  trial_start,
  trial_end,
  created_at,
  updated_at
)
VALUES (
  '35b8c48e-44a2-4d7d-beb9-767b8a35b8db', -- UUID de Juan
  'sub_1SQYowCpe9CE4d2laNm6C3nA',
  'cus_TNJR4FrB18TbhM',
  'price_1SLqrRCpe9CE4d2l8pOKM3jT', -- Plan Pro Monthly
  'pro',
  10, -- Plan Pro: 10 doctores
  5,  -- Plan Pro: 5 ubicaciones
  '["multi_location", "advanced_reports", "team_management"]'::jsonb,
  'active', -- YA NO está en trial
  '2025-11-13 19:26:07+00'::timestamptz, -- Inicio periodo actual
  '2025-12-13 19:26:07+00'::timestamptz, -- Fin periodo actual (próximo cobro)
  '2025-11-06 19:26:07+00'::timestamptz, -- Inicio trial
  '2025-11-13 19:26:07+00'::timestamptz, -- Fin trial
  NOW(),
  NOW()
)
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET
  status = 'active',
  current_period_start = '2025-11-13 19:26:07+00'::timestamptz,
  current_period_end = '2025-12-13 19:26:07+00'::timestamptz,
  updated_at = NOW();

-- PASO 4: Verificar inserción
SELECT 
  '✅ PASO 4: Verificación final de Juan' as paso,
  u.email,
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.plan_tier,
  s.status,
  s.trial_end,
  s.current_period_start,
  s.current_period_end,
  CASE 
    WHEN s.status = 'trialing' THEN '🆓 EN TRIAL'
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN '💰 DEBE PAGAR'
    WHEN s.current_period_end < NOW() THEN '⚠️ VENCIDA'
  END as estado_pago
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db';

-- =========================================================
-- RESUMEN FINAL - TODAS LAS SUSCRIPCIONES ACTIVAS
-- =========================================================

SELECT 
  '📊 RESUMEN GENERAL' as reporte,
  u.email,
  s.stripe_subscription_id,
  s.plan_tier,
  s.status,
  s.trial_end,
  s.current_period_end,
  CASE 
    WHEN s.status = 'trialing' AND s.trial_end > NOW() THEN '🆓 TRIAL ACTIVO'
    WHEN s.status = 'trialing' AND s.trial_end < NOW() THEN '⚠️ TRIAL VENCIDO - SINCRONIZAR'
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN '💰 PAGANDO'
    WHEN s.status = 'active' AND s.current_period_end < NOW() THEN '⚠️ VENCIDA'
  END as estado
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY s.status, s.current_period_end DESC;

-- =========================================================
-- NOTAS IMPORTANTES
-- =========================================================
/*
✅ DESPUÉS DE EJECUTAR ESTE SCRIPT:

1. Juan Camarillo (asc.admon23@gmail.com):
   - Tendrá suscripción Pro activa
   - Status: active (no trialing)
   - Próximo cobro: 13 dic 2025
   - Monto: $999 MXN

2. La suscripción trial huérfana será eliminada

3. Stripe cobrará automáticamente el 13 dic 2025

4. Los webhooks mantendrán sincronizada la info de ahora en adelante
*/
