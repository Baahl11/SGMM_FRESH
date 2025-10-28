-- Migration: Create SGMM Pro tables
-- This migration creates all the tables needed for the SGMM Pro application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(255),
  fecha_nacimiento DATE,
  direccion TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create treatments table
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio_base DECIMAL(10,2) DEFAULT 0,
  duracion_minutos INTEGER DEFAULT 60,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create records table
CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  monto_pagado DECIMAL(10,2) DEFAULT 0,
  monto_neto DECIMAL(10,2) DEFAULT 0,
  costo_unitario DECIMAL(10,2) DEFAULT 0,
  ganancia DECIMAL(10,2) DEFAULT 0,
  metodo_pago VARCHAR(50) DEFAULT 'efectivo',
  tipo_tarjeta VARCHAR(50),
  meses_sin_intereses INTEGER DEFAULT 0,
  tasa_comision DECIMAL(5,2) DEFAULT 0,
  comision_monto DECIMAL(10,2) DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create gastos_fijos table
CREATE TABLE IF NOT EXISTS gastos_fijos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concepto VARCHAR(255) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  frecuencia VARCHAR(20) DEFAULT 'mensual',
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  stock_actual INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 0,
  stock_maximo INTEGER DEFAULT 0,
  precio_unitario DECIMAL(10,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory_movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL, -- 'entrada', 'salida', 'ajuste'
  cantidad INTEGER NOT NULL,
  motivo VARCHAR(255),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  fecha_hora TIMESTAMPTZ NOT NULL,
  duracion_minutos INTEGER DEFAULT 60,
  estado VARCHAR(20) DEFAULT 'programada', -- 'programada', 'confirmada', 'completada', 'cancelada'
  notas TEXT,
  precio_acordado DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_nombre ON patients(nombre);
CREATE INDEX IF NOT EXISTS idx_patients_apellido ON patients(apellido);
CREATE INDEX IF NOT EXISTS idx_patients_activo ON patients(activo);

CREATE INDEX IF NOT EXISTS idx_records_patient_id ON records(patient_id);
CREATE INDEX IF NOT EXISTS idx_records_treatment_id ON records(treatment_id);
CREATE INDEX IF NOT EXISTS idx_records_fecha ON records(fecha);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_fecha_hora ON appointments(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_appointments_estado ON appointments(estado);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_fecha ON inventory_movements(fecha);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_treatments_updated_at ON treatments;
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_records_updated_at ON records;
CREATE TRIGGER update_records_updated_at BEFORE UPDATE ON records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gastos_fijos_updated_at ON gastos_fijos;
CREATE TRIGGER update_gastos_fijos_updated_at BEFORE UPDATE ON gastos_fijos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO treatments (nombre, descripcion, precio_base, duracion_minutos) VALUES
('Limpieza Dental', 'Limpieza dental básica', 800.00, 60),
('Extracción Dental', 'Extracción de pieza dental', 1200.00, 45),
('Blanqueamiento', 'Blanqueamiento dental profesional', 2500.00, 90),
('Ortodoncia', 'Consulta y tratamiento ortodóntico', 3500.00, 120)
ON CONFLICT DO NOTHING;

INSERT INTO gastos_fijos (concepto, monto, frecuencia) VALUES
('Renta del consultorio', 15000.00, 'mensual'),
('Servicios (luz, agua, internet)', 2500.00, 'mensual'),
('Material odontológico básico', 3000.00, 'mensual'),
('Seguros', 1200.00, 'mensual')
ON CONFLICT DO NOTHING;

INSERT INTO inventory_items (nombre, descripcion, stock_actual, stock_minimo, precio_unitario) VALUES
('Anestesia local', 'Anestesia dental lidocaína 2%', 25, 10, 45.00),
('Guantes desechables', 'Guantes de nitrilo talla M', 500, 100, 2.50),
('Mascarillas desechables', 'Mascarillas quirúrgicas de 3 capas', 200, 50, 3.00),
('Amalgama dental', 'Amalgama dental para obturaciones', 15, 5, 180.00)
ON CONFLICT DO NOTHING;