-- ============================================
-- MIGRATION: Online Booking System
-- Date: 2025-11-02
-- Purpose: Enables public booking pages for each clinic
-- ============================================

-- ============================================
-- 1. Add booking_slug to user_profiles
-- ============================================

-- Add slug column (URL-friendly unique identifier)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS booking_slug TEXT UNIQUE;

-- Add booking enabled flag
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT false;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_booking_slug ON user_profiles(booking_slug);

-- Function to generate slug from email
CREATE OR REPLACE FUNCTION generate_booking_slug(email_input TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract local part of email and clean it
  base_slug := LOWER(REGEXP_REPLACE(
    SPLIT_PART(email_input, '@', 1),
    '[^a-z0-9-]',
    '-',
    'g'
  ));
  
  -- Remove multiple consecutive dashes
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  
  -- Remove leading/trailing dashes
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- Try base slug first
  final_slug := base_slug;
  
  -- If slug exists, append counter
  WHILE EXISTS (SELECT 1 FROM user_profiles WHERE booking_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing users (if they don't have one)
UPDATE user_profiles 
SET booking_slug = generate_booking_slug(email)
WHERE booking_slug IS NULL AND email IS NOT NULL;

-- ============================================
-- 2. Create booking_settings table
-- ============================================

CREATE TABLE IF NOT EXISTS booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Available days (JSON array: ["monday", "tuesday", "wednesday"])
  available_days JSONB DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
  
  -- Time ranges per day (JSON object)
  -- Example: {"monday": [{"start": "09:00", "end": "13:00"}, {"start": "15:00", "end": "18:00"}]}
  time_ranges JSONB DEFAULT '{}'::jsonb,
  
  -- Slot configuration
  slot_duration_minutes INTEGER DEFAULT 30,
  buffer_time_minutes INTEGER DEFAULT 5,
  
  -- Advance booking limits
  min_advance_hours INTEGER DEFAULT 2, -- Can't book within 2 hours
  max_advance_days INTEGER DEFAULT 60, -- Can book up to 60 days ahead
  
  -- Services offered (JSON array of objects)
  -- Example: [{"id": "1", "name": "Consulta general", "duration": 30, "price": 500}]
  services JSONB DEFAULT '[]'::jsonb,
  
  -- Booking page customization
  page_title TEXT DEFAULT 'Agendar cita',
  welcome_message TEXT,
  show_prices BOOLEAN DEFAULT true,
  require_phone BOOLEAN DEFAULT true,
  
  -- Confirmation settings
  auto_confirm BOOLEAN DEFAULT false, -- If false, requires manual confirmation
  send_confirmation_email BOOLEAN DEFAULT true,
  send_confirmation_sms BOOLEAN DEFAULT false,
  send_confirmation_whatsapp BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own booking settings"
  ON booking_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own booking settings"
  ON booking_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own booking settings"
  ON booking_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_booking_settings_user_id ON booking_settings(user_id);

-- ============================================
-- 3. Create public_bookings table
-- ============================================

CREATE TABLE IF NOT EXISTS public_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Clinic that receives the booking
  clinic_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Patient information (no user account required)
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  
  -- Booking details
  service_name TEXT NOT NULL,
  service_price DECIMAL(10,2),
  service_duration_minutes INTEGER DEFAULT 30,
  
  -- Date and time
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  
  -- Confirmation tokens
  confirmation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  cancellation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Notifications
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  whatsapp_sent BOOLEAN DEFAULT false,
  
  -- Additional notes
  patient_notes TEXT,
  clinic_notes TEXT,
  
  -- Temporary lock to prevent double-booking
  locked_until TIMESTAMP WITH TIME ZONE,
  
  -- Link to created appointment (if confirmed)
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only clinic owner can see their bookings
CREATE POLICY "Clinics can view their own bookings"
  ON public_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = clinic_user_id);

CREATE POLICY "Clinics can update their own bookings"
  ON public_bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = clinic_user_id)
  WITH CHECK (auth.uid() = clinic_user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_bookings_clinic_user_id ON public_bookings(clinic_user_id);
CREATE INDEX IF NOT EXISTS idx_public_bookings_booking_date ON public_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_public_bookings_status ON public_bookings(status);
CREATE INDEX IF NOT EXISTS idx_public_bookings_confirmation_token ON public_bookings(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_public_bookings_cancellation_token ON public_bookings(cancellation_token);

-- Composite index for availability checks
CREATE INDEX IF NOT EXISTS idx_public_bookings_clinic_date_time 
  ON public_bookings(clinic_user_id, booking_date, booking_time) 
  WHERE status IN ('pending', 'confirmed');

-- ============================================
-- 4. Helper Functions
-- ============================================

-- Function to check if a time slot is available
CREATE OR REPLACE FUNCTION is_slot_available(
  p_clinic_user_id UUID,
  p_booking_date DATE,
  p_booking_time TIME,
  p_duration_minutes INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
DECLARE
  slot_end TIME;
  is_available BOOLEAN;
BEGIN
  -- Calculate end time of requested slot
  slot_end := p_booking_time + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Check if slot overlaps with existing bookings
  SELECT NOT EXISTS (
    SELECT 1
    FROM public_bookings
    WHERE clinic_user_id = p_clinic_user_id
      AND booking_date = p_booking_date
      AND status IN ('pending', 'confirmed')
      AND (
        -- New booking starts during existing booking
        (p_booking_time >= booking_time AND p_booking_time < booking_time + (service_duration_minutes || ' minutes')::INTERVAL)
        OR
        -- New booking ends during existing booking
        (slot_end > booking_time AND slot_end <= booking_time + (service_duration_minutes || ' minutes')::INTERVAL)
        OR
        -- New booking completely contains existing booking
        (p_booking_time <= booking_time AND slot_end >= booking_time + (service_duration_minutes || ' minutes')::INTERVAL)
      )
  ) INTO is_available;
  
  RETURN is_available;
END;
$$ LANGUAGE plpgsql;

-- Function to release expired slot locks
CREATE OR REPLACE FUNCTION release_expired_slot_locks()
RETURNS void AS $$
BEGIN
  UPDATE public_bookings
  SET locked_until = NULL
  WHERE locked_until < NOW()
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_public_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS trigger_update_public_bookings_updated_at ON public_bookings;
CREATE TRIGGER trigger_update_public_bookings_updated_at
  BEFORE UPDATE ON public_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_public_bookings_updated_at();

-- ============================================
-- 5. Initialize default settings for existing users
-- ============================================

-- Create default booking settings for existing users
INSERT INTO booking_settings (user_id)
SELECT id FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM booking_settings 
  WHERE booking_settings.user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE booking_settings IS 'Configuration for each clinic''s public booking page';
COMMENT ON TABLE public_bookings IS 'Bookings made by patients through public booking pages';
COMMENT ON COLUMN user_profiles.booking_slug IS 'Unique URL-friendly identifier (e.g., "dr-lopez")';
COMMENT ON COLUMN user_profiles.booking_enabled IS 'Whether public booking page is active';
COMMENT ON COLUMN public_bookings.locked_until IS 'Temporary lock to prevent double-booking during checkout';
COMMENT ON COLUMN public_bookings.confirmation_token IS 'Token for patients to confirm their booking';
COMMENT ON COLUMN public_bookings.cancellation_token IS 'Token for patients to cancel their booking';
COMMENT ON FUNCTION is_slot_available IS 'Checks if a time slot is available for booking';

