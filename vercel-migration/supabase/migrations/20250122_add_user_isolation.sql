-- Migration: Add user isolation to all tables
-- Created: 2025-01-22
-- Purpose: Ensure each user only sees their own data

-- ============================================
-- 1. ADD user_id COLUMNS TO ALL TABLES
-- ============================================

-- Patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- Treatments  
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_treatments_user_id ON treatments(user_id);

-- Records
ALTER TABLE records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_records_user_id ON records(user_id);

-- Gastos Fijos
ALTER TABLE gastos_fijos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_gastos_fijos_user_id ON gastos_fijos(user_id);

-- Inventory Items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);

-- Inventory Movements
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_id ON inventory_movements(user_id);

-- Appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);

-- Patient Records (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_records') THEN
    ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_patient_records_user_id ON patient_records(user_id);
  END IF;
END $$;

-- Invoices
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
  END IF;
END $$;

-- Certificates
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
  END IF;
END $$;

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_fijos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Enable for conditional tables
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_records') THEN
    ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
    ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- 3. CREATE RLS POLICIES - PATIENTS
-- ============================================

DROP POLICY IF EXISTS "Users can view own patients" ON patients;
DROP POLICY IF EXISTS "Users can insert own patients" ON patients;
DROP POLICY IF EXISTS "Users can update own patients" ON patients;
DROP POLICY IF EXISTS "Users can delete own patients" ON patients;

CREATE POLICY "Users can view own patients"
  ON patients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own patients"
  ON patients FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 4. CREATE RLS POLICIES - TREATMENTS
-- ============================================

DROP POLICY IF EXISTS "Users can view own treatments" ON treatments;
DROP POLICY IF EXISTS "Users can insert own treatments" ON treatments;
DROP POLICY IF EXISTS "Users can update own treatments" ON treatments;
DROP POLICY IF EXISTS "Users can delete own treatments" ON treatments;

CREATE POLICY "Users can view own treatments"
  ON treatments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own treatments"
  ON treatments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own treatments"
  ON treatments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own treatments"
  ON treatments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 5. CREATE RLS POLICIES - RECORDS
-- ============================================

DROP POLICY IF EXISTS "Users can view own records" ON records;
DROP POLICY IF EXISTS "Users can insert own records" ON records;
DROP POLICY IF EXISTS "Users can update own records" ON records;
DROP POLICY IF EXISTS "Users can delete own records" ON records;

CREATE POLICY "Users can view own records"
  ON records FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own records"
  ON records FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records"
  ON records FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own records"
  ON records FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 6. CREATE RLS POLICIES - GASTOS FIJOS
-- ============================================

DROP POLICY IF EXISTS "Users can view own gastos" ON gastos_fijos;
DROP POLICY IF EXISTS "Users can insert own gastos" ON gastos_fijos;
DROP POLICY IF EXISTS "Users can update own gastos" ON gastos_fijos;
DROP POLICY IF EXISTS "Users can delete own gastos" ON gastos_fijos;

CREATE POLICY "Users can view own gastos"
  ON gastos_fijos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own gastos"
  ON gastos_fijos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own gastos"
  ON gastos_fijos FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own gastos"
  ON gastos_fijos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 7. CREATE RLS POLICIES - INVENTORY ITEMS
-- ============================================

DROP POLICY IF EXISTS "Users can view own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can insert own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can update own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete own inventory" ON inventory_items;

CREATE POLICY "Users can view own inventory"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own inventory"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own inventory"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own inventory"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 8. CREATE RLS POLICIES - INVENTORY MOVEMENTS
-- ============================================

DROP POLICY IF EXISTS "Users can view own movements" ON inventory_movements;
DROP POLICY IF EXISTS "Users can insert own movements" ON inventory_movements;
DROP POLICY IF EXISTS "Users can update own movements" ON inventory_movements;
DROP POLICY IF EXISTS "Users can delete own movements" ON inventory_movements;

CREATE POLICY "Users can view own movements"
  ON inventory_movements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own movements"
  ON inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own movements"
  ON inventory_movements FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own movements"
  ON inventory_movements FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 9. CREATE RLS POLICIES - APPOINTMENTS
-- ============================================

DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON appointments;

CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 10. CREATE RLS POLICIES - PATIENT RECORDS (conditional)
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_records') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own patient_records" ON patient_records';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own patient_records" ON patient_records';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own patient_records" ON patient_records';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own patient_records" ON patient_records';
    
    EXECUTE 'CREATE POLICY "Users can view own patient_records" ON patient_records FOR SELECT TO authenticated USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Users can insert own patient_records" ON patient_records FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Users can update own patient_records" ON patient_records FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Users can delete own patient_records" ON patient_records FOR DELETE TO authenticated USING (user_id = auth.uid())';
  END IF;
END $$;

-- ============================================
-- 11. CREATE RLS POLICIES - INVOICES (conditional)
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own invoices" ON invoices';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own invoices" ON invoices';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices';
    
    -- Drop old policies with different names
    EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated read invoices" ON invoices';
    EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated insert invoices" ON invoices';
    EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated update invoices" ON invoices';
    
    EXECUTE 'CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT TO authenticated USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE TO authenticated USING (user_id = auth.uid())';
  END IF;
END $$;

-- ============================================
-- 12. CREATE RLS POLICIES - CERTIFICATES (conditional)
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own certificates" ON certificates';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own certificates" ON certificates';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own certificates" ON certificates';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own certificates" ON certificates';
    
    EXECUTE 'CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT TO authenticated USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Users can insert own certificates" ON certificates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Users can update own certificates" ON certificates FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Users can delete own certificates" ON certificates FOR DELETE TO authenticated USING (user_id = auth.uid())';
  END IF;
END $$;

-- ============================================
-- 13. ASSIGN EXISTING DATA TO ADMIN USER
-- ============================================

-- Get the admin user ID (first user with role='admin')
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT user_id INTO admin_user_id
  FROM user_profiles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    -- Assign all existing data to admin
    UPDATE patients SET user_id = admin_user_id WHERE user_id IS NULL;
    UPDATE treatments SET user_id = admin_user_id WHERE user_id IS NULL;
    UPDATE records SET user_id = admin_user_id WHERE user_id IS NULL;
    UPDATE gastos_fijos SET user_id = admin_user_id WHERE user_id IS NULL;
    UPDATE inventory_items SET user_id = admin_user_id WHERE user_id IS NULL;
    UPDATE inventory_movements SET user_id = admin_user_id WHERE user_id IS NULL;
    UPDATE appointments SET user_id = admin_user_id WHERE user_id IS NULL;
    
    -- Conditional updates
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_records') THEN
      EXECUTE 'UPDATE patient_records SET user_id = $1 WHERE user_id IS NULL' USING admin_user_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
      EXECUTE 'UPDATE invoices SET user_id = $1 WHERE user_id IS NULL' USING admin_user_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
      EXECUTE 'UPDATE certificates SET user_id = $1 WHERE user_id IS NULL' USING admin_user_id;
    END IF;
    
    RAISE NOTICE 'All existing data assigned to admin user: %', admin_user_id;
  ELSE
    RAISE WARNING 'No admin user found - data not assigned';
  END IF;
END $$;

-- ============================================
-- 14. MAKE user_id NOT NULL (after assigning data)
-- ============================================

ALTER TABLE patients ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE treatments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE records ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE gastos_fijos ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE inventory_items ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE inventory_movements ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN user_id SET NOT NULL;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN patients.user_id IS 'User who owns this patient record';
COMMENT ON COLUMN treatments.user_id IS 'User who owns this treatment';
COMMENT ON COLUMN records.user_id IS 'User who owns this medical record';
COMMENT ON COLUMN gastos_fijos.user_id IS 'User who owns this expense';
COMMENT ON COLUMN inventory_items.user_id IS 'User who owns this inventory item';
COMMENT ON COLUMN inventory_movements.user_id IS 'User who owns this movement';
COMMENT ON COLUMN appointments.user_id IS 'User who owns this appointment';
