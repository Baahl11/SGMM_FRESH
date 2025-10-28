-- Create patient_notes table for personal notes/reminders
CREATE TABLE IF NOT EXISTS patient_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_nota VARCHAR(20) NOT NULL CHECK (tipo_nota IN ('pendiente', 'idea', 'importante', 'general', 'completada')),
  titulo VARCHAR(255),
  contenido TEXT NOT NULL,
  completada BOOLEAN DEFAULT false,
  fecha_completada TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_id ON patient_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_user_id ON patient_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_tipo ON patient_notes(tipo_nota);
CREATE INDEX IF NOT EXISTS idx_patient_notes_completada ON patient_notes(completada);

-- Add RLS policies
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notes
CREATE POLICY "Users can view their own patient notes"
  ON patient_notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own notes
CREATE POLICY "Users can insert their own patient notes"
  ON patient_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notes
CREATE POLICY "Users can update their own patient notes"
  ON patient_notes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notes
CREATE POLICY "Users can delete their own patient notes"
  ON patient_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patient_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patient_notes_updated_at_trigger
  BEFORE UPDATE ON patient_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_notes_updated_at();
