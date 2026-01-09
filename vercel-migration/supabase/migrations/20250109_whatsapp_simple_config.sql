-- ============================================================================
-- WHATSAPP SIMPLE CONFIGURATION (Direct Link Method)
-- ============================================================================
-- Created: 2025-01-09
-- Description: Simple WhatsApp configuration for direct links (no API needed)
-- ============================================================================

-- Add WhatsApp fields to user_profiles for simple direct link method
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_default_message TEXT DEFAULT '¡Hola! Me contacto desde AgendaMedPro',
ADD COLUMN IF NOT EXISTS whatsapp_config_level TEXT DEFAULT 'basic' CHECK (whatsapp_config_level IN ('basic', 'intermediate', 'advanced'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_whatsapp_phone ON user_profiles(whatsapp_phone) WHERE whatsapp_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_whatsapp_enabled ON user_profiles(whatsapp_enabled) WHERE whatsapp_enabled = true;

-- Comment the columns
COMMENT ON COLUMN user_profiles.whatsapp_phone IS 'WhatsApp number for direct link method (includes country code, e.g., +5215512345678)';
COMMENT ON COLUMN user_profiles.whatsapp_enabled IS 'Whether WhatsApp integration is enabled';
COMMENT ON COLUMN user_profiles.whatsapp_default_message IS 'Default message that appears when patients contact via WhatsApp';
COMMENT ON COLUMN user_profiles.whatsapp_config_level IS 'Configuration level: basic (direct link), intermediate (guided API), advanced (manual API)';
