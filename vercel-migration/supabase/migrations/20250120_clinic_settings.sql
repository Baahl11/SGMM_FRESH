-- Migration: Add clinic_settings table for PDF customization
-- Created: 2025-01-20
-- Purpose: Store branding configuration (logos, colors, templates) for invoice PDFs

-- Create clinic_settings table
CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Logo configuration
  logo_url TEXT, -- URL from Supabase Storage
  logo_width INTEGER DEFAULT 150, -- Width in pixels for PDF
  logo_position TEXT DEFAULT 'left' CHECK (logo_position IN ('left', 'center', 'right')),
  
  -- Brand colors (hex format)
  primary_color TEXT DEFAULT '#7C3AED', -- Purple default
  secondary_color TEXT DEFAULT '#A78BFA', -- Light purple
  accent_color TEXT DEFAULT '#5B21B6', -- Dark purple
  text_color TEXT DEFAULT '#1F2937', -- Dark gray
  
  -- Template selection
  template TEXT DEFAULT 'modern' CHECK (template IN ('modern', 'classic', 'minimalist', 'professional')),
  
  -- Additional styling options
  font_family TEXT DEFAULT 'Inter',
  show_logo BOOLEAN DEFAULT true,
  show_clinic_name BOOLEAN DEFAULT true,
  footer_text TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One config per user
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/edit their own settings
CREATE POLICY "Users can view their own clinic settings"
  ON clinic_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clinic settings"
  ON clinic_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clinic settings"
  ON clinic_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clinic settings"
  ON clinic_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_clinic_settings_user_id ON clinic_settings(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clinic_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_clinic_settings_updated_at
  BEFORE UPDATE ON clinic_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_clinic_settings_updated_at();

-- Insert default settings for existing users
INSERT INTO clinic_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE clinic_settings IS 'Stores PDF branding configuration per user (logos, colors, templates)';
COMMENT ON COLUMN clinic_settings.logo_url IS 'URL from Supabase Storage bucket: clinic-logos';
COMMENT ON COLUMN clinic_settings.primary_color IS 'Main brand color used in headers and accents';
COMMENT ON COLUMN clinic_settings.template IS 'PDF layout template: modern, classic, minimalist, or professional';
