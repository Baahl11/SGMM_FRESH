-- Fix Supabase schema to work with NextAuth instead of Supabase Auth
-- This script disables the automatic user_id triggers and allows manual user_id setting

-- Drop the automatic user_id triggers temporarily
DROP TRIGGER IF EXISTS set_user_id_patients ON patients;
DROP TRIGGER IF EXISTS set_user_id_treatments ON treatments;
DROP TRIGGER IF EXISTS set_user_id_appointments ON appointments;
DROP TRIGGER IF EXISTS set_user_id_invoice ON invoice;
DROP TRIGGER IF EXISTS set_user_id_record ON record;
DROP TRIGGER IF EXISTS set_user_id_inventorymovement ON inventorymovement;
DROP TRIGGER IF EXISTS set_user_id_gastofijo ON gastofijo;

-- Modify the patients table to allow NULL user_id temporarily
ALTER TABLE patients ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE treatments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE invoice ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE record ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE inventorymovement ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE gastofijo ALTER COLUMN user_id DROP NOT NULL;

-- Remove the foreign key constraint to auth.users for now
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_user_id_fkey;
ALTER TABLE treatments DROP CONSTRAINT IF EXISTS treatments_user_id_fkey;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_user_id_fkey;
ALTER TABLE invoice DROP CONSTRAINT IF EXISTS invoice_user_id_fkey;
ALTER TABLE record DROP CONSTRAINT IF EXISTS record_user_id_fkey;
ALTER TABLE inventorymovement DROP CONSTRAINT IF EXISTS inventorymovement_user_id_fkey;
ALTER TABLE gastofijo DROP CONSTRAINT IF EXISTS gastofijo_user_id_fkey;

-- Change user_id to TEXT to work with NextAuth user IDs
ALTER TABLE patients ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE treatments ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE appointments ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE invoice ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE record ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE inventorymovement ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE gastofijo ALTER COLUMN user_id TYPE TEXT;

-- Create a demo user entry for testing
-- This will be the user_id we use for the demo credentials
INSERT INTO auth.users (id, email, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@sgmm.pro',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Disable RLS temporarily for easier development
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatments DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice DISABLE ROW LEVEL SECURITY;
ALTER TABLE record DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventorymovement DISABLE ROW LEVEL SECURITY;
ALTER TABLE gastofijo DISABLE ROW LEVEL SECURITY;

-- Create some test data
INSERT INTO patients (name, email, phone, address, date_of_birth, user_id) VALUES
('Juan Pérez', 'juan.perez@email.com', '+1-555-0123', 'Calle 123, Ciudad', '1985-05-15', 'demo-user-1'),
('María García', 'maria.garcia@email.com', '+1-555-0124', 'Avenida 456, Ciudad', '1990-08-22', 'demo-user-1'),
('Carlos López', 'carlos.lopez@email.com', '+1-555-0125', 'Plaza 789, Ciudad', '1975-12-10', 'demo-user-1')
ON CONFLICT (email) DO NOTHING;

-- Verify the changes
SELECT 'patients' as table_name, count(*) as record_count FROM patients
UNION ALL
SELECT 'treatments', count(*) FROM treatments
UNION ALL
SELECT 'appointments', count(*) FROM appointments;