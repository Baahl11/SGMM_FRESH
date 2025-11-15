-- =========================================================
-- SINCRONIZAR SUSCRIPCIÓN DE gmelgarejom@gmail.com
-- Datos obtenidos de Stripe: sub_1SJ4LyCpe9CE4d2lkHcbdgRl
-- Fecha: 14 Noviembre 2025 23:30
-- =========================================================

-- PASO 1: Obtener user_id de gmelgarejom
SELECT 
  '📋 PASO 1: User ID de gmelgarejom' as paso,
  id as user_id,
  email,
  created_at
FROM auth.users 
WHERE email = 'gmelgarejom@gmail.com';

-- RESULTADO ESPERADO: Copiar el UUID para usar en PASO 3

-- =========================================================
-- PASO 2: Verificar que NO tenga suscripción actualmente
-- =========================================================

SELECT 
  '🔍 PASO 2: Verificar suscripciones actuales' as paso,
  COUNT(*) as total_suscripciones
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'gmelgarejom@gmail.com';

-- RESULTADO ESPERADO: 0 suscripciones

-- =========================================================
-- PASO 3: INSERTAR SUSCRIPCIÓN CON DATOS EXACTOS DE STRIPE
-- =========================================================
-- Datos confirmados de Stripe API:
-- - Customer ID: cus_TFZSDH4K4o2i7L
-- - Plan: Básico ($499 MXN/mes)
-- - Status: active
-- - Periodo: 2025-10-17 → 2025-11-17
-- =========================================================

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
SELECT
  u.id, -- User ID de gmelgarejom
  'sub_1SJ4LyCpe9CE4d2lkHcbdgRl',
  'cus_TFZSDH4K4o2i7L',
  'price_1SO7NSCpe9CE4d2l5TOfOGw5', -- Plan Básico Monthly
  'basico',
  2, -- Plan Básico: 2 doctores
  1, -- Plan Básico: 1 ubicación
  '[]'::jsonb, -- Features básicas
  'active',
  '2025-10-17 03:29:18+00'::timestamptz,
  '2025-11-17 03:29:18+00'::timestamptz, -- ⚠️ YA VENCIÓ (17 nov)
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'gmelgarejom@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE stripe_subscription_id = 'sub_1SJ4LyCpe9CE4d2lkHcbdgRl'
  );

-- =========================================================
-- PASO 4: VERIFICAR INSERCIÓN EXITOSA
-- =========================================================

SELECT 
  '✅ PASO 4: Verificación final' as paso,
  u.email,
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.plan_tier,
  s.status,
  s.current_period_start,
  s.current_period_end,
  CASE 
    WHEN s.current_period_end < NOW() THEN '⚠️ VENCIDA - Renovar en Stripe'
    WHEN s.current_period_end > NOW() THEN '✅ ACTIVA'
  END as estado,
  s.created_at
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'gmelgarejom@gmail.com';

-- =========================================================
-- NOTA IMPORTANTE
-- =========================================================
/*
⚠️ La suscripción de gmelgarejom YA VENCIÓ el 17 de noviembre 2025.

Próximos pasos:
1. Verificar en Stripe Dashboard si se renovó automáticamente
2. Si se renovó, actualizar current_period_end en Supabase:
   
   UPDATE subscriptions 
   SET 
     current_period_start = '2025-11-17 03:29:18+00'::timestamptz,
     current_period_end = '2025-12-17 03:29:18+00'::timestamptz,
     updated_at = NOW()
   WHERE stripe_subscription_id = 'sub_1SJ4LyCpe9CE4d2lkHcbdgRl';

3. Si NO se renovó, verificar por qué (método de pago fallido, cancelada, etc)

4. De ahora en adelante, los webhooks deberían actualizar automáticamente
*/

-- =========================================================
-- RESUMEN FINAL - TODAS LAS SUSCRIPCIONES
-- =========================================================

SELECT 
  '📊 RESUMEN GENERAL' as reporte,
  u.email,
  s.stripe_subscription_id,
  s.plan_tier,
  s.status,
  s.current_period_end,
  CASE 
    WHEN s.current_period_end < NOW() THEN '⚠️ VENCIDA'
    WHEN s.current_period_end > NOW() THEN '✅ ACTIVA'
  END as estado
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY 
  CASE WHEN s.current_period_end > NOW() THEN 0 ELSE 1 END,
  s.current_period_end DESC;
