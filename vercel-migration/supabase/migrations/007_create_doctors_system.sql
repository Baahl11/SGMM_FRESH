-- Migration: Create doctors and multi-doctor tables
-- Date: 2025-10-30
-- Description: Create doctors, consultorios, appointment_types, and doctor_schedules tables

-- ============================================
-- 1. DOCTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    especialidad VARCHAR(255),
    cedula_profesional VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(255),
    color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color for calendar
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_activo ON doctors(activo);

-- Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop first if they exist)
DROP POLICY IF EXISTS "Users can view their own doctors" ON doctors;
DROP POLICY IF EXISTS "Users can insert their own doctors" ON doctors;
DROP POLICY IF EXISTS "Users can update their own doctors" ON doctors;
DROP POLICY IF EXISTS "Users can delete their own doctors" ON doctors;

CREATE POLICY "Users can view their own doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own doctors"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own doctors"
  ON doctors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own doctors"
  ON doctors FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 2. CONSULTORIOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS consultorios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    ubicacion TEXT,
    capacidad INTEGER DEFAULT 1,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultorios_user_id ON consultorios(user_id);
CREATE INDEX IF NOT EXISTS idx_consultorios_activo ON consultorios(activo);

-- Enable RLS
ALTER TABLE consultorios ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop first if they exist)
DROP POLICY IF EXISTS "Users can view their own consultorios" ON consultorios;
DROP POLICY IF EXISTS "Users can insert their own consultorios" ON consultorios;
DROP POLICY IF EXISTS "Users can update their own consultorios" ON consultorios;
DROP POLICY IF EXISTS "Users can delete their own consultorios" ON consultorios;

CREATE POLICY "Users can view their own consultorios"
  ON consultorios FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own consultorios"
  ON consultorios FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own consultorios"
  ON consultorios FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own consultorios"
  ON consultorios FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 3. APPOINTMENT TYPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    duracion_minutos INTEGER DEFAULT 30,
    color VARCHAR(7) DEFAULT '#10b981',
    precio_default DECIMAL(10,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointment_types_user_id ON appointment_types(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_types_activo ON appointment_types(activo);

-- Enable RLS
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop first if they exist)
DROP POLICY IF EXISTS "Users can view their own appointment types" ON appointment_types;
DROP POLICY IF EXISTS "Users can insert their own appointment types" ON appointment_types;
DROP POLICY IF EXISTS "Users can update their own appointment types" ON appointment_types;
DROP POLICY IF EXISTS "Users can delete their own appointment types" ON appointment_types;

CREATE POLICY "Users can view their own appointment types"
  ON appointment_types FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own appointment types"
  ON appointment_types FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own appointment types"
  ON appointment_types FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own appointment types"
  ON appointment_types FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 4. DOCTOR SCHEDULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    consultorio_id UUID REFERENCES consultorios(id) ON DELETE SET NULL,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=Lunes, 6=Domingo
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_user_id ON doctor_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_dia_semana ON doctor_schedules(dia_semana);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_activo ON doctor_schedules(activo);

-- Enable RLS
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop first if they exist)
DROP POLICY IF EXISTS "Users can view their own doctor schedules" ON doctor_schedules;
DROP POLICY IF EXISTS "Users can insert their own doctor schedules" ON doctor_schedules;
DROP POLICY IF EXISTS "Users can update their own doctor schedules" ON doctor_schedules;
DROP POLICY IF EXISTS "Users can delete their own doctor schedules" ON doctor_schedules;

CREATE POLICY "Users can view their own doctor schedules"
  ON doctor_schedules FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own doctor schedules"
  ON doctor_schedules FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own doctor schedules"
  ON doctor_schedules FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own doctor schedules"
  ON doctor_schedules FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 5. UPDATE APPOINTMENTS TABLE
-- ============================================
-- Add doctor_id and consultorio_id if they don't exist
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultorio_id UUID REFERENCES consultorios(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type_id UUID REFERENCES appointment_types(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_consultorio_id ON appointments(consultorio_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_type_id ON appointments(appointment_type_id);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE doctors IS 'Doctors/physicians in the system';
COMMENT ON TABLE consultorios IS 'Consultation rooms/offices';
COMMENT ON TABLE appointment_types IS 'Types of appointments (consultation, follow-up, procedure, etc.)';
COMMENT ON TABLE doctor_schedules IS 'Working hours for doctors by day of week';

COMMENT ON COLUMN doctors.color IS 'Hex color code for calendar display';
COMMENT ON COLUMN doctor_schedules.dia_semana IS '0=Monday, 1=Tuesday, ..., 6=Sunday';
