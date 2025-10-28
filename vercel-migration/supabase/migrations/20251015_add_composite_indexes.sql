-- =====================================================
-- MIGRATION: Add Composite Indexes (Safe Version)
-- Date: 2025-10-15
-- Purpose: Optimize common queries for existing tables only
-- =====================================================

-- ====================
-- APPOINTMENTS TABLE
-- ====================

-- Composite index for appointments filtering by doctor + date (common query)
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_fecha 
  ON appointments(doctor_id, fecha_hora) 
  WHERE doctor_id IS NOT NULL;

-- Composite index for appointments filtering by consultorio + date
CREATE INDEX IF NOT EXISTS idx_appointments_consultorio_fecha 
  ON appointments(consultorio_id, fecha_hora) 
  WHERE consultorio_id IS NOT NULL;

-- Composite index for appointments filtering by patient + date (duplicate detection)
CREATE INDEX IF NOT EXISTS idx_appointments_patient_fecha 
  ON appointments(patient_id, fecha_hora);

-- Composite index for appointments by type + date
CREATE INDEX IF NOT EXISTS idx_appointments_type_fecha 
  ON appointments(appointment_type_id, fecha_hora) 
  WHERE appointment_type_id IS NOT NULL;

-- Composite index for appointments by status + date
CREATE INDEX IF NOT EXISTS idx_appointments_status_fecha 
  ON appointments(estado, fecha_hora);

-- Partial index for only active appointments (most queries filter by active)
CREATE INDEX IF NOT EXISTS idx_appointments_active_fecha 
  ON appointments(fecha_hora) 
  WHERE estado != 'cancelada';

-- ====================
-- DOCTORS TABLE
-- ====================

-- Composite index for active doctors by user
CREATE INDEX IF NOT EXISTS idx_doctors_user_activo 
  ON doctors(user_id, activo);

-- ====================
-- CONSULTORIOS TABLE
-- ====================

-- Composite index for active consultorios by user
CREATE INDEX IF NOT EXISTS idx_consultorios_user_activo 
  ON consultorios(user_id, activo);

-- ====================
-- APPOINTMENT_TYPES TABLE
-- ====================

-- Composite index for active appointment types by user
CREATE INDEX IF NOT EXISTS idx_appointment_types_user_activo 
  ON appointment_types(user_id, activo);

-- ====================
-- ANALYZE TABLES
-- ====================

-- Update statistics for query planner optimization
ANALYZE appointments;
ANALYZE doctors;
ANALYZE consultorios;
ANALYZE appointment_types;
