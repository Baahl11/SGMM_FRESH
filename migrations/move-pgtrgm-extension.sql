-- Migration: Move pg_trgm Extension from Public Schema
-- Description: Move pg_trgm extension to extensions schema for better security isolation
-- Date: 2026-02-03

-- IMPORTANT: Moving extensions requires careful handling of dependencies
-- The pg_trgm extension is used for text similarity searches (trigram indexes)
-- Moving it may break existing indexes/functions that depend on it

-- Step 1: Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 2: Drop the extension from public schema
-- WARNING: This will cascade drop all dependent objects (indexes, functions)
-- Make sure to recreate them after moving the extension
DROP EXTENSION IF EXISTS pg_trgm CASCADE;

-- Step 3: Create the extension in the extensions schema
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Step 4: Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Step 5: If you had trigram indexes, you'll need to recreate them
-- Example (uncomment and adjust if you have trigram indexes):
-- CREATE INDEX idx_patients_name_trgm ON public.patients USING gin (name extensions.gin_trgm_ops);
-- CREATE INDEX idx_doctors_name_trgm ON public.doctors USING gin (name extensions.gin_trgm_ops);

-- Verification: Check that pg_trgm is now in extensions schema
SELECT 
    e.extname AS extension_name,
    n.nspname AS schema_name,
    e.extversion AS version
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'pg_trgm';

-- IMPORTANT NOTES:
-- 1. If this migration breaks your application, you may have trigram indexes
--    that need to be recreated with the new schema-qualified operator classes
-- 2. Alternative approach: Keep pg_trgm in public if it causes issues
--    (this warning is low priority and may not be worth the effort)
-- 3. Test thoroughly in a development environment before applying to production
