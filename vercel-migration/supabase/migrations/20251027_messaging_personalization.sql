-- ============================================================================
-- MESSAGING PERSONALIZATION FIELDS
-- ============================================================================
-- Add fields for clinic/doctor info used in WhatsApp messages
-- Migration: 20251027_messaging_personalization
-- ============================================================================

-- Add personalization fields to messaging_config
ALTER TABLE messaging_config 
ADD COLUMN IF NOT EXISTS doctor_name TEXT,
ADD COLUMN IF NOT EXISTS clinic_name TEXT,
ADD COLUMN IF NOT EXISTS clinic_address TEXT,
ADD COLUMN IF NOT EXISTS clinic_phone TEXT,
ADD COLUMN IF NOT EXISTS custom_message_signature TEXT;

-- Add comments for documentation
COMMENT ON COLUMN messaging_config.doctor_name IS 
  'Doctor name shown in WhatsApp messages (e.g., "Dr. Juan Pérez")';

COMMENT ON COLUMN messaging_config.clinic_name IS 
  'Clinic/office name shown in messages (e.g., "Clínica Dental Sonrisas")';

COMMENT ON COLUMN messaging_config.clinic_address IS 
  'Physical address shown in messages (e.g., "Av. Reforma 123, Col. Centro")';

COMMENT ON COLUMN messaging_config.clinic_phone IS 
  'Contact phone for patients to call (e.g., "55 1234 5678")';

COMMENT ON COLUMN messaging_config.custom_message_signature IS 
  'Optional custom signature for messages (e.g., "Equipo Médico Integral")';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
