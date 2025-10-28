-- Migration: Add notifications system
-- Created: 2025-01-20
-- Purpose: Notifications, reminders, and user preferences

-- 1. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error', 'reminder')),
  category TEXT NOT NULL CHECK (category IN ('invoice', 'appointment', 'payment', 'certificate', 'system')),
  
  -- Related entities (nullable - not all notifications link to something)
  related_invoice_id TEXT,
  related_patient_id UUID,
  related_appointment_id UUID,
  
  -- Action URL (where to navigate when clicked)
  action_url TEXT,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Auto-delete after this date
  
  -- Index for performance
  CONSTRAINT fk_patient FOREIGN KEY (related_patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 2. Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Browser notifications
  browser_enabled BOOLEAN DEFAULT true,
  
  -- Email notifications
  email_enabled BOOLEAN DEFAULT false,
  email_address TEXT,
  
  -- Notification types (which ones to receive)
  notify_unsent_invoices BOOLEAN DEFAULT true,
  notify_unpaid_invoices BOOLEAN DEFAULT true,
  notify_expiring_certificates BOOLEAN DEFAULT true,
  notify_upcoming_appointments BOOLEAN DEFAULT true,
  notify_low_inventory BOOLEAN DEFAULT false,
  
  -- Do Not Disturb hours (24h format, nullable = disabled)
  dnd_start_hour INTEGER CHECK (dnd_start_hour >= 0 AND dnd_start_hour <= 23),
  dnd_end_hour INTEGER CHECK (dnd_end_hour >= 0 AND dnd_end_hour <= 23),
  
  -- Days to wait before reminder
  unsent_invoice_days INTEGER DEFAULT 3,
  unpaid_invoice_days INTEGER DEFAULT 7,
  certificate_expiry_days INTEGER DEFAULT 30,
  appointment_reminder_hours INTEGER DEFAULT 24,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Reminders log (track when reminders were sent to avoid duplicates)
CREATE TABLE IF NOT EXISTS reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  related_entity_id TEXT NOT NULL, -- invoice_id, certificate_id, etc.
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_date DATE DEFAULT CURRENT_DATE -- Store date separately for unique constraint
);

CREATE INDEX IF NOT EXISTS idx_reminder_log_user ON reminder_log(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_log_type ON reminder_log(reminder_type);

-- Prevent duplicate reminders on the same day
DROP INDEX IF EXISTS idx_reminder_log_unique_per_day;
CREATE UNIQUE INDEX idx_reminder_log_unique_per_day 
  ON reminder_log(user_id, reminder_type, related_entity_id, sent_date);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can view their own reminder log" ON reminder_log;
DROP POLICY IF EXISTS "System can insert reminder log" ON reminder_log;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for reminder_log
CREATE POLICY "Users can view their own reminder log"
  ON reminder_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert reminder log"
  ON reminder_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at
DROP FUNCTION IF EXISTS update_notification_preferences_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Function to auto-delete expired notifications
DROP FUNCTION IF EXISTS delete_expired_notifications() CASCADE;
CREATE OR REPLACE FUNCTION delete_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert default preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Comments
COMMENT ON TABLE notifications IS 'Stores in-app notifications for users';
COMMENT ON TABLE notification_preferences IS 'User preferences for notifications';
COMMENT ON TABLE reminder_log IS 'Tracks sent reminders to avoid duplicates';
COMMENT ON COLUMN notifications.expires_at IS 'Notifications auto-deleted after this date';
COMMENT ON COLUMN notification_preferences.dnd_start_hour IS '24h format, NULL = disabled';
