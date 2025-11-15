-- =========================================================
-- SCRIPT SQL FINAL PARA SINCRONIZAR gmelgarejom@gmail.com
-- Ejecutar en Supabase SQL Editor
-- Fecha: 14 Noviembre 2025
-- =========================================================

-- =========================================================
-- PASO 1: VERIFICAR USUARIO EN SUPABASE
-- =========================================================

SELECT 
  '📋 PASO 1: Buscar user_id de gmelgarejom' as paso,
  id as user_id,
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '⚠️ Email NO confirmado'
  END as estado_email
FROM auth.users 
WHERE email = 'gmelgarejom@gmail.com';

-- 👆 COPIAR el user_id de arriba para usar en los siguientes pasos

-- =========================================================
-- PASO 2: VERIFICAR SI YA TIENE SUSCRIPCIÓN
-- =========================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obtener user_id
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'gmelgarejom@gmail.com';
  
  -- Mostrar resultado
  RAISE NOTICE '📋 PASO 2: Verificar suscripciones existentes';
  RAISE NOTICE 'User ID: %', v_user_id;
  
  -- Verificar suscripciones
  PERFORM * FROM subscriptions WHERE user_id = v_user_id;
  
  IF FOUND THEN
    RAISE NOTICE '⚠️ Este usuario YA tiene suscripción. Ver detalles:';
  ELSE
    RAISE NOTICE '✅ Usuario NO tiene suscripción. Proceder a insertar.';
  END IF;
END $$;

-- Ver detalles si ya existe
SELECT 
  '🔍 Suscripciones actuales de gmelgarejom' as verificacion,
  s.id,
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.plan_tier,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'gmelgarejom@gmail.com';

-- =========================================================
-- PASO 3: INSERTAR SUSCRIPCIÓN DESDE STRIPE
-- =========================================================
-- ⚠️ IMPORTANTE: Primero obtener datos exactos de Stripe Dashboard
-- 
-- 1. Ir a: https://dashboard.stripe.com/subscriptions/sub_1SJ4LyCpe9CE4d2lkHcbdgRl
-- 2. Copiar los siguientes datos:
--    - Customer ID (cus_XXXXXXXXXX)
--    - Status (active/trialing/past_due/canceled)
--    - Current period start (fecha exacta)
--    - Current period end (fecha exacta)
-- 3. Reemplazar en el INSERT de abajo

/*
-- TEMPLATE PARA INSERTAR (reemplazar valores con datos de Stripe):

INSERT INTO subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  plan_tier,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
)
SELECT
  (SELECT id FROM auth.users WHERE email = 'gmelgarejom@gmail.com'),
  'sub_1SJ4LyCpe9CE4d2lkHcbdgRl',
  'REEMPLAZAR_CON_CUSTOMER_ID_DE_STRIPE', -- Ejemplo: cus_R12345678
  'basico', -- Plan Básico $499 MXN
  'REEMPLAZAR_CON_STATUS_DE_STRIPE', -- Ejemplo: active, trialing, past_due
  'REEMPLAZAR_CON_FECHA_START'::timestamptz, -- Ejemplo: 2025-10-16 00:00:00+00
  'REEMPLAZAR_CON_FECHA_END'::timestamptz, -- Ejemplo: 2025-11-16 00:00:00+00
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions 
  WHERE stripe_subscription_id = 'sub_1SJ4LyCpe9CE4d2lkHcbdgRl'
);
*/

-- =========================================================
-- PASO 4: VERIFICACIÓN FINAL
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
    WHEN s.current_period_end < NOW() THEN '⚠️ VENCIDO'
    WHEN s.current_period_end > NOW() THEN '✅ ACTIVO'
  END as estado,
  s.created_at
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email IN ('gmelgarejom@gmail.com', 'camarillojuan@hotmail.com', 'asc.admon23@gmail.com')
ORDER BY u.email, s.created_at DESC;

-- =========================================================
-- RESUMEN DE SUSCRIPCIONES EN SUPABASE
-- =========================================================

SELECT 
  '📊 RESUMEN GENERAL' as reporte,
  plan_tier,
  status,
  COUNT(*) as cantidad,
  SUM(CASE WHEN current_period_end > NOW() THEN 1 ELSE 0 END) as activas,
  SUM(CASE WHEN current_period_end <= NOW() THEN 1 ELSE 0 END) as vencidas
FROM subscriptions
GROUP BY plan_tier, status
ORDER BY plan_tier, status;

-- =========================================================
-- NOTAS IMPORTANTES
-- =========================================================
/*
PARA OBTENER DATOS DE STRIPE MANUALMENTE:

1. Ir a Stripe Dashboard: https://dashboard.stripe.com
2. Click en "Customers" en el menú lateral
3. Buscar por email: gmelgarejom@gmail.com
4. Click en el customer
5. Ir a pestaña "Subscriptions"
6. Click en la suscripción: sub_1SJ4LyCpe9CE4d2lkHcbdgRl
7. Copiar:
   - Customer ID: está en la parte superior (cus_XXXXX)
   - Status: badge de color (active/trialing/etc)
   - Current period: Start date y End date
   - Amount: debería ser $499 MXN para Plan Básico

8. Reemplazar en el INSERT de PASO 3
9. Descomentar el INSERT
10. Ejecutar en Supabase SQL Editor
11. Ejecutar PASO 4 para verificar
*/
