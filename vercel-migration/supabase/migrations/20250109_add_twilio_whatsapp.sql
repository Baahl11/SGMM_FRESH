-- ============================================================================
-- ADD META CLOUD API WHATSAPP CONFIGURATION
-- ============================================================================
-- Adds Meta WhatsApp Cloud API credentials (official from Meta/Facebook)
-- Only 3 fields needed - super simple!
-- ============================================================================

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS whatsapp_provider VARCHAR(20) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_business_account_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT;

COMMENT ON COLUMN user_profiles.whatsapp_provider IS 'WhatsApp provider: basic (links only), meta (Cloud API oficial)';
COMMENT ON COLUMN user_profiles.whatsapp_phone_number_id IS 'Meta Cloud API - Phone Number ID';
COMMENT ON COLUMN user_profiles.whatsapp_business_account_id IS 'Meta Cloud API - WhatsApp Business Account ID';
COMMENT ON COLUMN user_profiles.whatsapp_access_token IS 'Meta Cloud API - Access Token permanente';
