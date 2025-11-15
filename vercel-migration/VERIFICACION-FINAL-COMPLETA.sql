-- =========================================================
-- VERIFICACIÓN FINAL COMPLETA
-- Confirmar que todo esté sincronizado correctamente
-- Fecha: 15 Noviembre 2025
-- =========================================================

-- =========================================================
-- 1. VERIFICAR SUSCRIPCIONES EN SUPABASE
-- =========================================================

SELECT 
  '📊 TODAS LAS SUSCRIPCIONES EN SUPABASE' as verificacion,
  u.email,
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.plan_tier,
  s.status,
  s.current_period_end,
  CASE 
    WHEN s.status = 'trialing' AND s.trial_end > NOW() THEN '🆓 TRIAL ACTIVO'
    WHEN s.status = 'trialing' AND s.trial_end < NOW() THEN '⚠️ TRIAL VENCIDO'
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN '✅ ACTIVA - PAGANDO'
    WHEN s.status = 'active' AND s.current_period_end < NOW() THEN '⚠️ VENCIDA'
  END as estado,
  s.created_at
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY u.email, s.created_at DESC;

-- =========================================================
-- 2. VERIFICAR JUAN CAMARILLO ESPECÍFICAMENTE
-- =========================================================

SELECT 
  '👤 JUAN CAMARILLO - DETALLE COMPLETO' as verificacion,
  u.email,
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.plan_tier,
  s.status,
  s.max_doctors,
  s.max_locations,
  s.features,
  s.trial_start,
  s.trial_end,
  s.current_period_start,
  s.current_period_end,
  CASE 
    WHEN s.trial_end < NOW() THEN '✅ Trial terminó - Debe pagar'
    WHEN s.trial_end > NOW() THEN '🆓 Aún en trial'
  END as estado_trial,
  CASE 
    WHEN s.current_period_end > NOW() THEN '✅ Periodo activo'
    WHEN s.current_period_end < NOW() THEN '⚠️ Periodo vencido'
  END as estado_periodo
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email IN ('asc.admon23@gmail.com', 'camarillojuan@hotmail.com');

-- =========================================================
-- 3. VERIFICAR gmelgarejom@gmail.com
-- =========================================================

SELECT 
  '👤 GMELGAREJOM - DETALLE COMPLETO' as verificacion,
  u.email,
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.plan_tier,
  s.status,
  s.current_period_start,
  s.current_period_end,
  CASE 
    WHEN s.current_period_end < NOW() THEN '⚠️ VENCIDA - Verificar renovación en Stripe'
    WHEN s.current_period_end > NOW() THEN '✅ ACTIVA'
  END as estado
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'gmelgarejom@gmail.com';

-- =========================================================
-- 4. BUSCAR SUSCRIPCIONES HUÉRFANAS (sin stripe_subscription_id)
-- =========================================================

SELECT 
  '⚠️ SUSCRIPCIONES HUÉRFANAS (SIN STRIPE ID)' as verificacion,
  u.email,
  s.id,
  s.plan_tier,
  s.status,
  s.created_at
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.stripe_subscription_id IS NULL;

-- Debe devolver 0 resultados

-- =========================================================
-- 5. RESUMEN EJECUTIVO
-- =========================================================

SELECT 
  '📈 RESUMEN EJECUTIVO' as reporte,
  COUNT(*) as total_suscripciones,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activas,
  SUM(CASE WHEN status = 'trialing' THEN 1 ELSE 0 END) as en_trial,
  SUM(CASE WHEN stripe_subscription_id IS NULL THEN 1 ELSE 0 END) as huerfanas,
  SUM(CASE WHEN plan_tier = 'basico' THEN 1 ELSE 0 END) as plan_basico,
  SUM(CASE WHEN plan_tier = 'pro' THEN 1 ELSE 0 END) as plan_pro,
  SUM(CASE WHEN plan_tier = 'enterprise' THEN 1 ELSE 0 END) as plan_enterprise
FROM subscriptions;

-- =========================================================
-- RESULTADOS ESPERADOS
-- =========================================================
/*
✅ ESTADO ESPERADO:

1. Juan Camarillo (asc.admon23@gmail.com):
   - stripe_subscription_id: sub_1SQYowCpe9CE4d2laNm6C3nA
   - plan_tier: pro
   - status: active
   - Trial terminó: 13 nov 2025
   - Periodo: 13 nov → 13 dic 2025
   - Cobrado: $999 MXN (15 nov 2025)
   - Próximo cobro: 15 dic 2025

2. gmelgarejom@gmail.com:
   - stripe_subscription_id: sub_1SJ4LyCpe9CE4d2lkHcbdgRl
   - plan_tier: basico
   - status: active
   - Periodo: 17 oct → 17 nov 2025 (vencida, verificar renovación)

3. Suscripciones huérfanas: 0

4. Total suscripciones: 2
   - Activas: 2
   - En trial: 0
   - Huérfanas: 0
*/
