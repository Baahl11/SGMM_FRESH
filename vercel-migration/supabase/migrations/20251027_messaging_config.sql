-- ============================================================================
-- MESSAGING CONFIGURATION SYSTEM (BYOK - Bring Your Own Keys)
-- ============================================================================
-- Created: 2025-10-27
-- Description: Sistema de mensajería con modelo BYOK donde cada doctor
--              configura su propia cuenta de WhatsApp Business
-- ============================================================================

-- ============================================================================
-- 1. MESSAGING CONFIG TABLE
-- ============================================================================
-- Stores WhatsApp Business API credentials per user (doctor)
CREATE TABLE IF NOT EXISTS messaging_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- WhatsApp Business API Credentials (Direct from Meta)
  whatsapp_business_id TEXT,
  whatsapp_phone_number_id TEXT,
  whatsapp_access_token TEXT, -- TODO: Encrypt in production
  whatsapp_webhook_verify_token TEXT,
  
  -- Phone number verification
  whatsapp_phone_number TEXT, -- Format: +5215512345678
  whatsapp_verified BOOLEAN DEFAULT false,
  
  -- Configuration
  whatsapp_enabled BOOLEAN DEFAULT false,
  auto_reminders_enabled BOOLEAN DEFAULT false,
  reminder_24h_enabled BOOLEAN DEFAULT true,
  reminder_1h_enabled BOOLEAN DEFAULT false,
  
  -- Usage tracking (daily limits)
  daily_message_limit INTEGER DEFAULT 1000,
  current_daily_usage INTEGER DEFAULT 0,
  usage_reset_date DATE DEFAULT CURRENT_DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_connection_test TIMESTAMPTZ,
  connection_status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
  
  -- Ensure one config per user
  UNIQUE(user_id)
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_messaging_config_user_id 
  ON messaging_config(user_id);

-- ============================================================================
-- 2. WHATSAPP MESSAGES TABLE (History)
-- ============================================================================
-- Stores all WhatsApp messages sent (for auditing and analytics)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  
  -- Message content
  to_phone TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'template', -- 'template', 'text', 'media', 'interactive'
  template_name TEXT,
  template_language TEXT DEFAULT 'es_MX',
  message_body TEXT,
  media_url TEXT,
  
  -- Message status (WhatsApp Business API statuses)
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'queued', 'sent', 'delivered', 'read', 'failed'
  meta_message_id TEXT, -- WhatsApp message ID from Meta
  error_code TEXT,
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id 
  ON whatsapp_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_patient_id 
  ON whatsapp_messages(patient_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_appointment_id 
  ON whatsapp_messages(appointment_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status 
  ON whatsapp_messages(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at 
  ON whatsapp_messages(created_at DESC);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on messaging_config
ALTER TABLE messaging_config ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own messaging config
CREATE POLICY "Users can view own messaging config"
  ON messaging_config
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own messaging config
CREATE POLICY "Users can insert own messaging config"
  ON messaging_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own messaging config
CREATE POLICY "Users can update own messaging config"
  ON messaging_config
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own messaging config
CREATE POLICY "Users can delete own messaging config"
  ON messaging_config
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on whatsapp_messages
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own messages
CREATE POLICY "Users can view own whatsapp messages"
  ON whatsapp_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert own whatsapp messages"
  ON whatsapp_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own messages (for status updates)
CREATE POLICY "Users can update own whatsapp messages"
  ON whatsapp_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- Function: Reset daily usage counter
CREATE OR REPLACE FUNCTION reset_daily_message_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messaging_config
  SET 
    current_daily_usage = 0,
    usage_reset_date = CURRENT_DATE
  WHERE usage_reset_date < CURRENT_DATE;
END;
$$;

-- Function: Increment message counter
CREATE OR REPLACE FUNCTION increment_message_usage(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messaging_config
  SET 
    current_daily_usage = current_daily_usage + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Function: Update message status
CREATE OR REPLACE FUNCTION update_message_status(
  p_message_id UUID,
  p_status TEXT,
  p_meta_message_id TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE whatsapp_messages
  SET 
    status = p_status,
    meta_message_id = COALESCE(p_meta_message_id, meta_message_id),
    error_message = p_error_message,
    sent_at = CASE WHEN p_status = 'sent' THEN NOW() ELSE sent_at END,
    delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE delivered_at END,
    read_at = CASE WHEN p_status = 'read' THEN NOW() ELSE read_at END,
    failed_at = CASE WHEN p_status = 'failed' THEN NOW() ELSE failed_at END
  WHERE id = p_message_id;
END;
$$;

-- ============================================================================
-- 5. COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE messaging_config IS 
  'Stores WhatsApp Business API credentials per user. Each doctor brings their own keys (BYOK model).';

COMMENT ON COLUMN messaging_config.whatsapp_business_id IS 
  'WhatsApp Business Account ID from Facebook Business Manager';

COMMENT ON COLUMN messaging_config.whatsapp_phone_number_id IS 
  'Phone Number ID from WhatsApp Manager';

COMMENT ON COLUMN messaging_config.whatsapp_access_token IS 
  'Permanent Access Token generated for system user. TODO: Encrypt in production.';

COMMENT ON COLUMN messaging_config.daily_message_limit IS 
  'Maximum messages allowed per day per user (default: 1000). Prevents abuse and API throttling.';

COMMENT ON TABLE whatsapp_messages IS 
  'Audit log of all WhatsApp messages sent through the system. Used for analytics and compliance.';

COMMENT ON COLUMN whatsapp_messages.meta_message_id IS 
  'Message ID returned by WhatsApp Business API. Used for tracking delivery status.';

-- ============================================================================
-- 6. INITIAL DATA / SEED (Optional)
-- ============================================================================

-- Insert default config for existing users (optional)
-- INSERT INTO messaging_config (user_id, whatsapp_enabled, auto_reminders_enabled)
-- SELECT id, false, false FROM auth.users
-- ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
