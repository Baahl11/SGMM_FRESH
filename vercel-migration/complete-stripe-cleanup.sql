-- =========================================================
-- CLEANUP COMPLETO DE SUSCRIPCIONES STRIPE
-- Fecha: 14 Noviembre 2025
-- =========================================================

-- =========================================================
-- PARTE 1: VERIFICAR ESTADO ACTUAL DE JUAN CAMARILLO
-- =========================================================
-- UUID: 35b8c48e-44a2-4d7d-beb9-767b8a35b8db
-- Email: camarillojuan@hotmail.com / asc.admon23@gmail.com

SELECT 
  'JUAN - ESTADO ACTUAL' as verificacion,
  s.id,
  s.stripe_subscription_id,
  s.plan_tier,
  s.status,
  s.current_period_end,
  s.created_at,
  CASE 
    WHEN s.current_period_end < NOW() THEN '⚠️ VENCIDO'
    WHEN s.current_period_end > NOW() THEN '✅ ACTIVO'
  END as estado_trial
FROM subscriptions s
WHERE s.user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db'
ORDER BY s.created_at DESC;

-- =========================================================
-- PARTE 2: BUSCAR USER_ID DE gmelgarejom@gmail.com
-- =========================================================

SELECT 
  'GMELGAREJOM - BUSCAR UUID' as verificacion,
  id as user_id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'gmelgarejom@gmail.com';

-- =========================================================
-- PARTE 3: VERIFICAR SI YA TIENE SUSCRIPCIÓN
-- =========================================================

SELECT 
  'GMELGAREJOM - SUSCRIPCIONES ACTUALES' as verificacion,
  s.id,
  s.stripe_subscription_id,
  s.plan_tier,
  s.status,
  s.current_period_end
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'gmelgarejom@gmail.com';

-- =========================================================
-- PARTE 4: INSERTAR SUSCRIPCIÓN HUÉRFANA DE gmelgarejom
-- =========================================================
-- ⚠️ SOLO EJECUTAR SI LA QUERY ANTERIOR NO DEVUELVE RESULTADOS
-- Suscripción: sub_1SJ4LyCpe9CE4d2lkHcbdgRl
-- Plan: Básico $499 MXN
-- Fecha creación en Stripe: 16 oct 2025

/*
-- DESCOMENTAR DESPUÉS DE OBTENER user_id REAL:

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
  created_at,
  updated_at
)
VALUES (
  'REEMPLAZAR_CON_USER_ID_REAL', -- Obtener de PARTE 2
  'sub_1SJ4LyCpe9CE4d2lkHcbdgRl',
  'REEMPLAZAR_CON_CUSTOMER_ID', -- Buscar en Stripe Dashboard
  'price_1SO7NSCpe9CE4d2l5TOfOGw5', -- Plan Básico Monthly
  'basico',
  2, -- Plan Básico: 2 doctores
  1, -- Plan Básico: 1 ubicación
  '[]'::jsonb,
  'active', -- O 'trialing' si aún está en trial
  '2025-10-16 00:00:00+00', -- Fecha aproximada de creación
  '2025-11-16 00:00:00+00', -- Fecha de renovación (ajustar según Stripe)
  NOW(),
  NOW()
)
ON CONFLICT (stripe_subscription_id) DO NOTHING;
*/

-- =========================================================
-- PARTE 5: VERIFICACIÓN FINAL - TODAS LAS SUSCRIPCIONES
-- =========================================================

SELECT 
  'VERIFICACIÓN FINAL - TODAS LAS SUSCRIPCIONES' as verificacion,
  u.email,
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.plan_tier,
  s.status,
  s.current_period_end,
  CASE 
    WHEN s.current_period_end < NOW() THEN '⚠️ VENCIDO'
    WHEN s.current_period_end > NOW() THEN '✅ ACTIVO'
  END as estado,
  s.created_at
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY s.created_at DESC;

-- =========================================================
-- RESUMEN DE ACCIONES MANUALES EN STRIPE DASHBOARD
-- =========================================================
/*
ACCIONES PENDIENTES EN STRIPE:

1. Juan Camarillo (camarillojuan@hotmail.com):
   ✅ Mantener: sub_1SQYowCpe9CE4d2laNm6C3nA (Plan Pro $999)
   ❌ CANCELAR: sub_1SQYaOCpe9CE4d2luZTbzd5L (DUPLICADA)
   
   Pasos:
   - Ir a https://dashboard.stripe.com/customers
   - Buscar: camarillojuan@hotmail.com
   - Ir a Subscriptions
   - Cancelar sub_1SQYaOCpe9CE4d2luZTbzd5L
   - Marcar: "Cancel immediately" (no esperar fin de periodo)

2. gmelgarejom@gmail.com:
   - Buscar customer en Stripe
   - Verificar datos de sub_1SJ4LyCpe9CE4d2lkHcbdgRl
   - Copiar:
     * stripe_customer_id (cus_XXXXXXXXXX)
     * current_period_start (fecha exacta)
     * current_period_end (fecha exacta)
     * status (active/trialing/past_due)
   - Actualizar SQL en PARTE 4 con datos reales
   - Ejecutar INSERT

3. Verificar en Stripe Dashboard > Webhooks:
   - URL: https://agendamedpro.com/api/stripe/webhook
   - Verificar que % de errores esté bajando
   - Debe mostrar eventos exitosos (200 OK)
*/
