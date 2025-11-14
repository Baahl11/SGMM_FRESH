-- ============================================================================
-- ADD PERSONALIZATION FIELDS TO MESSAGING CONFIG
-- ============================================================================
-- Created: 2025-11-13
-- Description: Adds fields for personalizing WhatsApp messages with doctor
--              and clinic information
-- ============================================================================

-- Add personalization columns to messaging_config table
ALTER TABLE messaging_config
ADD COLUMN IF NOT EXISTS doctor_name TEXT,
ADD COLUMN IF NOT EXISTS clinic_name TEXT,
ADD COLUMN IF NOT EXISTS clinic_address TEXT,
ADD COLUMN IF NOT EXISTS clinic_phone TEXT,
ADD COLUMN IF NOT EXISTS custom_message_signature TEXT;

-- Add comments for documentation
COMMENT ON COLUMN messaging_config.doctor_name IS 
  'Name of the doctor to appear in WhatsApp messages (e.g., "Dr. Juan Pérez")';

COMMENT ON COLUMN messaging_config.clinic_name IS 
  'Name of the clinic/office to appear in messages (e.g., "Clínica Dental Sonrisas")';

COMMENT ON COLUMN messaging_config.clinic_address IS 
  'Full address shown in appointment reminders for patient reference';

COMMENT ON COLUMN messaging_config.clinic_phone IS 
  'Contact phone number for patients to call';

COMMENT ON COLUMN messaging_config.custom_message_signature IS 
  'Optional custom signature appearing at the end of messages';
