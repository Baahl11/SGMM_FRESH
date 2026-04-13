-- Tabla para registrar conversaciones de WhatsApp
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

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user_id ON whatsapp_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_patient_id ON whatsapp_conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_created_at ON whatsapp_conversations(created_at DESC);

-- RLS Policies
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON whatsapp_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON whatsapp_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Función para estadísticas de conversaciones
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
    COUNT(*)::BIGINT as total_conversations,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as conversations_today,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE))::BIGINT as conversations_this_week,
    COUNT(DISTINCT patient_id)::BIGINT as unique_patients,
    COUNT(*) FILTER (WHERE responded_by = 'ai')::BIGINT as ai_responses,
    COUNT(*) FILTER (WHERE responded_by = 'manual')::BIGINT as manual_responses
  FROM whatsapp_conversations
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
