-- SGMM Pro Database Schema for Supabase (MSI Compatible)
-- This schema replicates the SQLite structure from the MSI version with exact field names

-- Enable RLS (Row Level Security) for multi-tenancy
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS record CASCADE;
DROP TABLE IF EXISTS invoice CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS treatments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS inventorymovement CASCADE;
DROP TABLE IF EXISTS gastofijo CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS treatment_status CASCADE;
DROP TYPE IF EXISTS gender_type CASCADE;
DROP TYPE IF EXISTS appointment_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS movement_type CASCADE;

-- Create enum types for better data integrity
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE treatment_status AS ENUM ('active', 'completed', 'suspended', 'cancelled');
CREATE TYPE gender_type AS ENUM ('M', 'F', 'Other');
CREATE TYPE appointment_type AS ENUM ('consultation', 'treatment', 'follow_up', 'emergency');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'cancelled');
CREATE TYPE movement_type AS ENUM ('income', 'expense');

-- Create patients table with MSI field names
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE,
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    requiere_factura BOOLEAN DEFAULT FALSE,
    fotos TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- For multi-tenancy
);

-- Create treatments table (MSI compatible)
CREATE TABLE IF NOT EXISTS treatments (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0,
    descripcion TEXT,
    comision_porcentaje DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- For multi-tenancy
);

-- Create records table (MSI compatible - for patient treatments/appointments)
CREATE TABLE IF NOT EXISTS records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    treatment_id INTEGER REFERENCES treatments(id) ON DELETE SET NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    monto_pagado DECIMAL(10,2) DEFAULT 0,
    notas TEXT,
    treatment_name VARCHAR(255), -- Denormalized for quick access
    patient_name VARCHAR(255), -- Denormalized for quick access
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- For multi-tenancy
);

-- Create appointments table (MSI compatible)
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    treatment_id INTEGER REFERENCES treatments(id) ON DELETE SET NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    duracion_minutos INTEGER DEFAULT 30,
    estado appointment_status DEFAULT 'scheduled',
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- For multi-tenancy
);

-- Create inventorymovement table (MSI compatible)
CREATE TABLE IF NOT EXISTS inventorymovement (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    movement_type movement_type NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_value DECIMAL(10,2),
    notes TEXT,
    movement_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- For multi-tenancy
);

-- Create gastofijo table (fixed expenses - MSI compatible)
CREATE TABLE IF NOT EXISTS gastofijo (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(50) DEFAULT 'monthly',
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- For multi-tenancy
);

-- Insert default treatments (MSI compatible)
INSERT INTO treatments (nombre, precio, descripcion, comision_porcentaje) VALUES
('Consulta General', 800.00, 'Consulta médica general', 10.00),
('Limpieza Dental', 1200.00, 'Limpieza dental profunda', 15.00),
('Extracción Dental', 1500.00, 'Extracción de pieza dental', 20.00),
('Crown Dental', 3500.00, 'Corona dental completa', 25.00),
('Ortodoncia Consulta', 1000.00, 'Consulta de ortodoncia', 12.00),
('Brackets', 15000.00, 'Instalación de brackets completo', 30.00),
('Endodoncia', 2500.00, 'Tratamiento de conducto', 22.00),
('Blanqueamiento', 2000.00, 'Blanqueamiento dental', 18.00);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_nombre ON patients(nombre);
CREATE INDEX IF NOT EXISTS idx_treatments_user_id ON treatments(user_id);
CREATE INDEX IF NOT EXISTS idx_records_patient_id ON records(patient_id);
CREATE INDEX IF NOT EXISTS idx_records_user_id ON records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_fecha ON records(fecha);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_fecha_hora ON appointments(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_inventorymovement_user_id ON inventorymovement(user_id);
CREATE INDEX IF NOT EXISTS idx_gastofijo_user_id ON gastofijo(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventorymovement ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastofijo ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenancy
-- Users can only access their own data

-- Patients policies
CREATE POLICY "Users can view own patients" ON patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patients" ON patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patients" ON patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patients" ON patients FOR DELETE USING (auth.uid() = user_id);

-- Treatments policies (treatments are shared across users for now)
CREATE POLICY "Users can view treatments" ON treatments FOR SELECT USING (true);
CREATE POLICY "Users can insert treatments" ON treatments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own treatments" ON treatments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own treatments" ON treatments FOR DELETE USING (auth.uid() = user_id);

-- Records policies
CREATE POLICY "Users can view own records" ON records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own records" ON records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own records" ON records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own records" ON records FOR DELETE USING (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own appointments" ON appointments FOR DELETE USING (auth.uid() = user_id);

-- Inventory movement policies
CREATE POLICY "Users can view own inventory movements" ON inventorymovement FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory movements" ON inventorymovement FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory movements" ON inventorymovement FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory movements" ON inventorymovement FOR DELETE USING (auth.uid() = user_id);

-- Fixed expenses policies
CREATE POLICY "Users can view own fixed expenses" ON gastofijo FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fixed expenses" ON gastofijo FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fixed expenses" ON gastofijo FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fixed expenses" ON gastofijo FOR DELETE USING (auth.uid() = user_id);

-- Create functions to automatically set user_id
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id on insert
CREATE TRIGGER set_user_id_patients BEFORE INSERT ON patients FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER set_user_id_treatments BEFORE INSERT ON treatments FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER set_user_id_records BEFORE INSERT ON records FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER set_user_id_appointments BEFORE INSERT ON appointments FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER set_user_id_inventorymovement BEFORE INSERT ON inventorymovement FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER set_user_id_gastofijo BEFORE INSERT ON gastofijo FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_records_updated_at BEFORE UPDATE ON records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventorymovement_updated_at BEFORE UPDATE ON inventorymovement FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gastofijo_updated_at BEFORE UPDATE ON gastofijo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update denormalized fields in records
CREATE OR REPLACE FUNCTION update_record_denormalized_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Update treatment_name if treatment_id is provided
    IF NEW.treatment_id IS NOT NULL THEN
        SELECT nombre INTO NEW.treatment_name 
        FROM treatments 
        WHERE id = NEW.treatment_id;
    END IF;
    
    -- Update patient_name if patient_id is provided
    IF NEW.patient_id IS NOT NULL THEN
        SELECT nombre INTO NEW.patient_name 
        FROM patients 
        WHERE id = NEW.patient_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_record_denormalized_fields_trigger 
    BEFORE INSERT OR UPDATE ON records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_record_denormalized_fields();