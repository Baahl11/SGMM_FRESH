-- Tabla para tracking de recordatorios enviados
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  phone VARCHAR(20),
  message_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  method VARCHAR(20) DEFAULT 'whatsapp', -- 'whatsapp', 'sms', 'email'
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  response_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_reminder_logs_appointment ON reminder_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_patient ON reminder_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON reminder_logs(sent_at);

-- RLS policies
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminder logs"
  ON reminder_logs FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM appointments WHERE id = reminder_logs.appointment_id
  ));
