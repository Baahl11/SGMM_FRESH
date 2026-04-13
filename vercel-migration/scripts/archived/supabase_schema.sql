-- SGMM Pro Database Schema for Supabase
-- This schema replicates the SQLite structure from the MSI version

-- Enable RLS (Row Level Security) for multi-tenancy
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE treatment_status AS ENUM ('active', 'completed', 'suspended', 'cancelled');
CREATE TYPE gender_type AS ENUM ('M', 'F', 'Other');
CREATE TYPE appointment_type AS ENUM ('consultation', 'treatment', 'follow_up', 'emergency');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'cancelled');
CREATE TYPE movement_type AS ENUM ('income', 'expense');

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    date_of_birth DATE,
    gender gender_type,
    medical_history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- For multi-tenancy
);

-- Create treatments table
CREATE TABLE IF NOT EXISTS treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    treatment_type VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status treatment_status DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- For multi-tenancy
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
    scheduled_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    appointment_type appointment_type DEFAULT 'consultation',
    duration_minutes INTEGER DEFAULT 30,
    status appointment_status DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- For multi-tenancy
);

-- Create invoice table
CREATE TABLE IF NOT EXISTS invoice (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status payment_status DEFAULT 'pending',
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- For multi-tenancy
);

-- Create inventorymovement table
CREATE TABLE IF NOT EXISTS inventorymovement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create record table (medical records)
CREATE TABLE IF NOT EXISTS record (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
    record_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    record_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- For multi-tenancy
);

-- Create gastofijo table (fixed expenses)
CREATE TABLE IF NOT EXISTS gastofijo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(50) DEFAULT 'monthly', -- monthly, weekly, yearly
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- For multi-tenancy
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_user_id ON treatments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_datetime ON appointments(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_patient_id ON invoice(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoice_user_id ON invoice(user_id);
CREATE INDEX IF NOT EXISTS idx_record_patient_id ON record(patient_id);
CREATE INDEX IF NOT EXISTS idx_record_user_id ON record(user_id);
CREATE INDEX IF NOT EXISTS idx_inventorymovement_user_id ON inventorymovement(user_id);
CREATE INDEX IF NOT EXISTS idx_gastofijo_user_id ON gastofijo(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE record ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventorymovement ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastofijo ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenancy
-- Users can only access their own data

-- Patients policies
CREATE POLICY "Users can view own patients" ON patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patients" ON patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patients" ON patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patients" ON patients FOR DELETE USING (auth.uid() = user_id);

-- Treatments policies
CREATE POLICY "Users can view own treatments" ON treatments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own treatments" ON treatments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own treatments" ON treatments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own treatments" ON treatments FOR DELETE USING (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own appointments" ON appointments FOR DELETE USING (auth.uid() = user_id);

-- Invoice policies
CREATE POLICY "Users can view own invoices" ON invoice FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON invoice FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON invoice FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON invoice FOR DELETE USING (auth.uid() = user_id);

-- Record policies
CREATE POLICY "Users can view own records" ON record FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own records" ON record FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own records" ON record FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own records" ON record FOR DELETE USING (auth.uid() = user_id);

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
CREATE TRIGGER set_user_id_appointments BEFORE INSERT ON appointments FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER set_user_id_invoice BEFORE INSERT ON invoice FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER set_user_id_record BEFORE INSERT ON record FOR EACH ROW EXECUTE FUNCTION set_user_id();
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
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_updated_at BEFORE UPDATE ON invoice FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_record_updated_at BEFORE UPDATE ON record FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventorymovement_updated_at BEFORE UPDATE ON inventorymovement FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gastofijo_updated_at BEFORE UPDATE ON gastofijo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();