-- Migration: Demo mode foundation
-- Run this in Supabase SQL editor
-- Purpose: Enable demo accounts with simulated external integrations.

CREATE TABLE IF NOT EXISTS demo_mode_config (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_demo_account BOOLEAN NOT NULL DEFAULT false,
  audit_label TEXT NOT NULL DEFAULT 'DEMO',
  seed_profile TEXT NOT NULL DEFAULT 'STANDARD' CHECK (seed_profile IN ('LIGHT', 'STANDARD', 'ENTERPRISE')),
  created_by TEXT,
  notes TEXT,
  integrations JSONB NOT NULL DEFAULT '{
    "email": {"enabled": false, "mock": true},
    "whatsapp": {"enabled": false, "mock": true},
    "sms": {"enabled": false, "mock": true},
    "stripe": {"enabled": false, "mock": true},
    "facturama": {"enabled": false, "mock": true},
    "google_calendar": {"enabled": false, "mock": true},
    "mercadopago": {"enabled": false, "mock": true}
  }'::jsonb,
  demo_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  demo_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demo_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  integration TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  status TEXT NOT NULL DEFAULT 'simulated' CHECK (status IN ('simulated', 'success', 'failed')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_mode_config_is_demo_account
  ON demo_mode_config(is_demo_account)
  WHERE is_demo_account = true;

CREATE INDEX IF NOT EXISTS idx_demo_audit_log_user_created
  ON demo_audit_log(user_id, created_at DESC);

ALTER TABLE demo_mode_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own demo mode config" ON demo_mode_config;
CREATE POLICY "Users view own demo mode config" ON demo_mode_config
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own demo mode config" ON demo_mode_config;
CREATE POLICY "Users insert own demo mode config" ON demo_mode_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own demo mode config" ON demo_mode_config;
CREATE POLICY "Users update own demo mode config" ON demo_mode_config
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages demo mode config" ON demo_mode_config;
CREATE POLICY "Service role manages demo mode config" ON demo_mode_config
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users view own demo audit log" ON demo_audit_log;
CREATE POLICY "Users view own demo audit log" ON demo_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own demo audit log" ON demo_audit_log;
CREATE POLICY "Users insert own demo audit log" ON demo_audit_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages demo audit log" ON demo_audit_log;
CREATE POLICY "Service role manages demo audit log" ON demo_audit_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
