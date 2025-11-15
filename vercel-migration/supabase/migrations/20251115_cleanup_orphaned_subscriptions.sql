-- =========================================================
-- LIMPIEZA AUTOMÁTICA DE SUSCRIPCIONES HUÉRFANAS VENCIDAS
-- Ejecutar como CRON JOB diario en Supabase
-- =========================================================

-- Función para limpiar suscripciones huérfanas vencidas
CREATE OR REPLACE FUNCTION cleanup_orphaned_subscriptions()
RETURNS TABLE (
  deleted_count INTEGER,
  user_emails TEXT[]
) 
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_emails TEXT[];
  deleted_total INTEGER;
BEGIN
  -- Obtener emails de las suscripciones que se eliminarán
  SELECT ARRAY_AGG(u.email)
  INTO deleted_emails
  FROM subscriptions s
  JOIN auth.users u ON u.id = s.user_id
  WHERE s.stripe_subscription_id IS NULL
    AND s.trial_end < (NOW() - INTERVAL '7 days')  -- 7 días de gracia después de vencer
    AND s.status = 'trialing';

  -- Eliminar suscripciones huérfanas vencidas
  WITH deleted AS (
    DELETE FROM subscriptions
    WHERE stripe_subscription_id IS NULL
      AND trial_end < (NOW() - INTERVAL '7 days')
      AND status = 'trialing'
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_total FROM deleted;

  -- Log de la limpieza
  INSERT INTO cleanup_logs (cleaned_at, subscriptions_deleted, user_emails)
  VALUES (NOW(), deleted_total, deleted_emails);

  RETURN QUERY SELECT deleted_total, deleted_emails;
END;
$$;

-- Tabla para registrar limpiezas (opcional)
CREATE TABLE IF NOT EXISTS cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscriptions_deleted INTEGER NOT NULL,
  user_emails TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- CONFIGURAR CRON JOB EN SUPABASE (pg_cron)
-- =========================================================

-- Ejecutar todos los días a las 3:00 AM
/*
SELECT cron.schedule(
  'cleanup-orphaned-subscriptions',  -- nombre del job
  '0 3 * * *',                        -- cron expression (3 AM diario)
  $$
  SELECT cleanup_orphaned_subscriptions();
  $$
);
*/

-- Ver jobs activos
-- SELECT * FROM cron.job;

-- Eliminar job si necesitas
-- SELECT cron.unschedule('cleanup-orphaned-subscriptions');

-- =========================================================
-- PRUEBA MANUAL (ejecutar primero para ver qué se eliminaría)
-- =========================================================

-- Ver qué suscripciones se eliminarían
SELECT 
  '⚠️ SUSCRIPCIONES QUE SE ELIMINARÍAN' as reporte,
  u.email,
  s.id,
  s.trial_end,
  s.status,
  NOW() - s.trial_end as dias_vencido
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.stripe_subscription_id IS NULL
  AND s.trial_end < (NOW() - INTERVAL '7 days')
  AND s.status = 'trialing'
ORDER BY s.trial_end;

-- Ejecutar limpieza manual
-- SELECT * FROM cleanup_orphaned_subscriptions();
