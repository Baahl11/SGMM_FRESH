-- ============================================================================
-- Migración: webhook_events (idempotencia de webhooks)
-- Auditoría fable 2026-06-11 — hallazgo C9 (Mercado Pago sin idempotencia)
-- ----------------------------------------------------------------------------
-- ANTES DE APLICAR EN PRODUCCIÓN:
--   1. Backup completo:  ver doc 16_RELEASE_DEPLOYMENT_ROLLBACK.md, paso 1
--      (pg_dump o snapshot del proyecto Supabase).
--   2. Aplicar primero en STAGING y correr el smoke test de webhooks.
-- ROLLBACK (sólo si nada ha escrito aún en la tabla):
--   DROP TABLE IF EXISTS public.webhook_events;
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     text NOT NULL,            -- 'mercadopago' | 'stripe' | 'whatsapp' | ...
  event_id     text NOT NULL,            -- identificador idempotente por proveedor
  event_type   text,
  resource_id  text,
  received_at  timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  result       text,                     -- 'ok' | 'skipped_no_user' | 'error_...' | ...
  retry_count  integer NOT NULL DEFAULT 0,
  payload_hash text,
  tenant       uuid,                     -- opcional: user_id afectado, para auditoría
  CONSTRAINT webhook_events_provider_event_unique UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at
  ON public.webhook_events (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider
  ON public.webhook_events (provider, received_at DESC);

-- Solo el service role (webhooks server-side) toca esta tabla: RLS habilitado
-- SIN políticas = ningún rol anon/authenticated puede leer ni escribir.
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.webhook_events IS
  'Registro idempotente de webhooks entrantes (fable C9). UNIQUE(provider,event_id) garantiza no-reproceso.';
