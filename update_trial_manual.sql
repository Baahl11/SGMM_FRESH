-- Script para actualizar período de prueba a 7 días
-- Ejecutar en SQL Editor de Supabase Dashboard

-- 1. Ver usuarios con trial activo y sin fechas
SELECT 
  user_id,
  plan_tier,
  status,
  trial_start,
  trial_end,
  created_at
FROM subscriptions
WHERE status = 'trialing';

-- 2. Actualizar usuarios con trial activo que no tienen trial_end
UPDATE subscriptions
SET 
  trial_start = COALESCE(trial_start, created_at, NOW()),
  trial_end = COALESCE(trial_start, created_at, NOW()) + INTERVAL '7 days'
WHERE status = 'trialing'
  AND (trial_end IS NULL OR trial_start IS NULL);

-- 3. Verificar actualización
SELECT 
  user_id,
  plan_tier,
  status,
  trial_start,
  trial_end,
  (trial_end - NOW()) as tiempo_restante
FROM subscriptions
WHERE status = 'trialing'
ORDER BY trial_end;

-- 4. Contar usuarios actualizados
SELECT 
  COUNT(*) as total_trialing,
  COUNT(CASE WHEN trial_end IS NOT NULL THEN 1 END) as con_fecha_fin,
  COUNT(CASE WHEN trial_end IS NULL THEN 1 END) as sin_fecha_fin
FROM subscriptions
WHERE status = 'trialing';
