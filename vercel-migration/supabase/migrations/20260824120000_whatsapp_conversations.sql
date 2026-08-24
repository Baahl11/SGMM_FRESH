-- supabase/migrations/20260824120000_whatsapp_conversations.sql
-- ============================================================================
-- Reconciliación de esquema — Recepción IA Fase 0 (2026-08-24)
-- ----------------------------------------------------------------------------
-- whatsapp_conversations ya se usa en producción por
-- app/api/webhooks/whatsapp/route.ts, pero su única migración vivía en
-- mcp-server/migrations/002_whatsapp_conversations.sql, fuera del set
-- "oficial" de supabase/migrations (HANDOFF_MAESTRO_V2, sección 3, P0 —
-- Deriva de esquema). Esta migración es una copia idempotente (CREATE TABLE
-- IF NOT EXISTS) para que un deploy que solo aplique supabase/migrations no
-- rompa el insert del webhook. No reemplaza ni borra el archivo original de
-- mcp-server/migrations — ver docs/reception-ai/schema-reconciliation.md.
-- ROLLBACK (solo si nada ha escrito aún en la tabla en este entorno):
--   DROP TABLE IF EXISTS public.whatsapp_conversations;
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message_in TEXT NOT NULL,
  message_out TEXT NOT NULL,
  message_id TEXT,
  responded_by TEXT DEFAULT 'ai', -- 'ai' o 'manual'
  action_taken TEXT, -- 'confirmed_appointment', 'cancelled_appointment', 'created_appointment', NULL
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user_id ON whatsapp_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_patient_id ON whatsapp_conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_created_at ON whatsapp_conversations(created_at DESC);

ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_conversations' AND policyname = 'Users can view their own conversations'
  ) THEN
    CREATE POLICY "Users can view their own conversations"
      ON whatsapp_conversations FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_conversations' AND policyname = 'Users can insert their own conversations'
  ) THEN
    CREATE POLICY "Users can insert their own conversations"
      ON whatsapp_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION get_whatsapp_stats(user_uuid UUID)
RETURNS TABLE (
  total_conversations BIGINT,
  conversations_today BIGINT,
  conversations_this_week BIGINT,
  unique_patients BIGINT,
  ai_responses BIGINT,
  manual_responses BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE))::BIGINT,
    COUNT(DISTINCT patient_id)::BIGINT,
    COUNT(*) FILTER (WHERE responded_by = 'ai')::BIGINT,
    COUNT(*) FILTER (WHERE responded_by = 'manual')::BIGINT
  FROM whatsapp_conversations
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE whatsapp_conversations IS
  'Reconciliada en supabase/migrations el 2026-08-24 (Recepción IA Fase 0). Fuente original: mcp-server/migrations/002_whatsapp_conversations.sql.';
