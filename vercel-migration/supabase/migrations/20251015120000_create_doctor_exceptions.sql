-- Migration: Create doctor_exceptions table for managing vacation, holidays, and time blocks
-- Created: 2025-10-15

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS doctor_exceptions CASCADE;

-- Create doctor_exceptions table
CREATE TABLE doctor_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('vacaciones', 'festivo', 'bloqueo')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  motivo TEXT,
  activo BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: fecha_fin debe ser >= fecha_inicio
  CONSTRAINT valid_date_range CHECK (fecha_fin >= fecha_inicio)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_doctor_exceptions_doctor_id ON doctor_exceptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_exceptions_fecha_range ON doctor_exceptions(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_doctor_exceptions_activo ON doctor_exceptions(activo);
CREATE INDEX IF NOT EXISTS idx_doctor_exceptions_user_id ON doctor_exceptions(user_id);

-- Composite index for active exceptions within date range
CREATE INDEX IF NOT EXISTS idx_doctor_exceptions_active_dates 
  ON doctor_exceptions(doctor_id, activo, fecha_inicio, fecha_fin)
  WHERE activo = true;

-- Enable Row Level Security (RLS)
ALTER TABLE doctor_exceptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own doctor exceptions
CREATE POLICY "Users can view their own doctor exceptions"
  ON doctor_exceptions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own doctor exceptions
CREATE POLICY "Users can insert their own doctor exceptions"
  ON doctor_exceptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own doctor exceptions
CREATE POLICY "Users can update their own doctor exceptions"
  ON doctor_exceptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own doctor exceptions
CREATE POLICY "Users can delete their own doctor exceptions"
  ON doctor_exceptions FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doctor_exceptions_updated_at
  BEFORE UPDATE ON doctor_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE doctor_exceptions IS 'Stores doctor schedule exceptions like vacations, holidays, and blocks';
COMMENT ON COLUMN doctor_exceptions.tipo IS 'Type of exception: vacaciones (vacation), festivo (holiday), bloqueo (manual block)';
COMMENT ON COLUMN doctor_exceptions.fecha_inicio IS 'Start date of the exception (inclusive)';
COMMENT ON COLUMN doctor_exceptions.fecha_fin IS 'End date of the exception (inclusive)';
