-- ============================================================================
-- Messaging Core Schema (Multi-Channel)
-- Date: 2025-11-07
-- Description: Introduces provider-agnostic messaging tables to support SMS,
--              WhatsApp Business y Email con un modelo unificado.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ENUM-LIKE CHECK CONSTRAINTS (usamos TEXT + CHECK para flexibilidad futura)
-- ---------------------------------------------------------------------------

-- Helper domains (opcional). Preferimos TEXT con CHECK para facilitar extensiones
-- en deploys futuros sin requerir ALTER TYPE downtime.

-- ---------------------------------------------------------------------------
-- TABLE: messaging_providers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messaging_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email')),
  provider TEXT NOT NULL CHECK (provider IN ('twilio', 'messagebird', 'plivo', 'meta_whatsapp', 'sendgrid', 'resend')),
  credentials_encrypted TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disabled')),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, channel)
);

COMMENT ON TABLE messaging_providers IS 'Stores BYOK credentials per channel (SMS/WhatsApp/Email) for each user.';
COMMENT ON COLUMN messaging_providers.account_id IS 'Optional future hook for multi-clinic accounts.';
COMMENT ON COLUMN messaging_providers.credentials_encrypted IS 'Encrypted JSON payload with provider secrets.';

CREATE INDEX IF NOT EXISTS idx_messaging_providers_user_channel
  ON messaging_providers(user_id, channel);

-- Trigger para mantener updated_at
CREATE TRIGGER trg_messaging_providers_updated_at
  BEFORE UPDATE ON messaging_providers
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp();

-- ---------------------------------------------------------------------------
-- TABLE: messaging_templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messaging_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES messaging_providers(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email')),
  trigger_name TEXT NOT NULL,
  name TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'es-MX',
  body TEXT NOT NULL,
  rich_content JSONB,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, channel, trigger_name, locale, version)
);

COMMENT ON TABLE messaging_templates IS 'Message templates per channel and trigger with versioning support.';
COMMENT ON COLUMN messaging_templates.trigger_name IS 'Business trigger (e.g., confirmation, reminder_24h).';
COMMENT ON COLUMN messaging_templates.rich_content IS 'Structured payload for rich channels (WhatsApp interactive, Email HTML).';

CREATE INDEX IF NOT EXISTS idx_messaging_templates_user_channel
  ON messaging_templates(user_id, channel);

CREATE TRIGGER trg_messaging_templates_updated_at
  BEFORE UPDATE ON messaging_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp();

-- ---------------------------------------------------------------------------
-- TABLE: messaging_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messaging_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES messaging_providers(id) ON DELETE SET NULL,
  template_id UUID REFERENCES messaging_templates(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email')),
  provider TEXT CHECK (provider IN ('twilio', 'messagebird', 'plivo', 'meta_whatsapp', 'sendgrid', 'resend')),
  to_contact JSONB NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'delivered', 'read', 'failed', 'cancelled')),
  error_code TEXT,
  error_message TEXT,
  provider_message_id TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE messaging_messages IS 'Unified outbound message log across SMS, WhatsApp and Email.';
COMMENT ON COLUMN messaging_messages.to_contact IS 'JSON payload with destination data (phone/email).';
COMMENT ON COLUMN messaging_messages.payload IS 'Provider-specific metadata (media URLs, button payloads, etc.).';

CREATE INDEX IF NOT EXISTS idx_messaging_messages_user_channel
  ON messaging_messages(user_id, channel);

CREATE INDEX IF NOT EXISTS idx_messaging_messages_status
  ON messaging_messages(status);

CREATE INDEX IF NOT EXISTS idx_messaging_messages_provider_message_id
  ON messaging_messages(provider_message_id);

CREATE INDEX IF NOT EXISTS idx_messaging_messages_scheduled_at
  ON messaging_messages(scheduled_at);

CREATE TRIGGER trg_messaging_messages_updated_at
  BEFORE UPDATE ON messaging_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp();

-- ---------------------------------------------------------------------------
-- TABLE: messaging_jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messaging_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messaging_messages(id) ON DELETE CASCADE,
  run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE messaging_jobs IS 'Internal job queue for scheduling and retrying outbound messages.';
COMMENT ON COLUMN messaging_jobs.locked_by IS 'Identifier for the worker processing the job.';

CREATE INDEX IF NOT EXISTS idx_messaging_jobs_status_run_at
  ON messaging_jobs(status, run_at);

CREATE TRIGGER trg_messaging_jobs_updated_at
  BEFORE UPDATE ON messaging_jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
-- ---------------------------------------------------------------------------

-- messaging_providers RLS
ALTER TABLE messaging_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own messaging providers" ON messaging_providers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- messaging_templates RLS
ALTER TABLE messaging_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own messaging templates" ON messaging_templates
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- messaging_messages RLS
ALTER TABLE messaging_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own messages" ON messaging_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own messages" ON messaging_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own messages" ON messaging_messages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages messages" ON messaging_messages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- messaging_jobs RLS (solo service role)
ALTER TABLE messaging_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages messaging jobs" ON messaging_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- NOTES
-- ---------------------------------------------------------------------------
-- 1. Existing tables `messaging_config` y `whatsapp_messages` permanecen
--    intactos. Se planeará migración de datos hacia las nuevas tablas en fases
--    posteriores.
-- 2. `account_id` actúa como extensión futura para clínicas multi-sede; hoy se
--    mantiene NULL.
-- 3. `set_timestamp` es reutilizada por todas las tablas nuevas. Si ya existía
--    con la misma firma, esta instrucción la reemplaza de forma idempotente.
-- ============================================================================
