-- ============================================================================
-- EXTEND USER PROFILES WITH COMPLETE INFORMATION
-- ============================================================================
-- Created: 2025-11-13
-- Description: Adds fields for doctor/clinic information, avatar, contact details
-- ============================================================================

-- Add new columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS specialty TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,

-- Clinic information
ADD COLUMN IF NOT EXISTS clinic_name TEXT,
ADD COLUMN IF NOT EXISTS clinic_address TEXT,
ADD COLUMN IF NOT EXISTS clinic_phone TEXT,
ADD COLUMN IF NOT EXISTS clinic_email TEXT,
ADD COLUMN IF NOT EXISTS clinic_website TEXT,

-- Professional information
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS education TEXT,

-- Social media / professional networks
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.avatar_url IS 'Profile picture URL (can be from Gravatar, Google, or uploaded)';
COMMENT ON COLUMN user_profiles.phone IS 'Personal/mobile phone number';
COMMENT ON COLUMN user_profiles.specialty IS 'Medical specialty (e.g., Dentist, Dermatologist, etc.)';
COMMENT ON COLUMN user_profiles.license_number IS 'Professional license/cedula number';
COMMENT ON COLUMN user_profiles.clinic_name IS 'Name of clinic/practice';
COMMENT ON COLUMN user_profiles.clinic_address IS 'Full clinic address';
COMMENT ON COLUMN user_profiles.clinic_phone IS 'Clinic main phone number';
COMMENT ON COLUMN user_profiles.clinic_email IS 'Clinic contact email';
COMMENT ON COLUMN user_profiles.bio IS 'Professional biography/description';
COMMENT ON COLUMN user_profiles.years_experience IS 'Years of professional experience';
