-- ============================================================================
-- Data Migration: user_sms_credentials → messaging_providers
-- Date: 2025-11-07
-- Description: Migrates legacy SMS credentials to the new encrypted messaging
--              provider schema. Run AFTER applying 20251107_messaging_core.sql
--              and configuring MESSAGING_CIPHER_KEY.
-- ============================================================================

-- PREREQUISITES:
-- 1. messaging_providers table exists (run 20251107_messaging_core.sql first)
-- 2. MESSAGING_CIPHER_KEY is configured in your application environment
-- 3. Run the TypeScript migration script instead of this SQL for proper encryption:
--    npm run migrate:sms-providers

-- This SQL file is provided for reference and manual verification only.
-- The actual migration MUST use the TypeScript script to properly encrypt credentials.

-- Verify legacy table exists and has data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'user_sms_credentials'
  ) THEN
    RAISE NOTICE 'Table user_sms_credentials does not exist. Nothing to migrate.';
  ELSE
    RAISE NOTICE 'Found user_sms_credentials table with % rows', 
      (SELECT COUNT(*) FROM user_sms_credentials);
  END IF;
END $$;

-- Verify target table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'messaging_providers'
  ) THEN
    RAISE EXCEPTION 'Table messaging_providers does not exist. Run 20251107_messaging_core.sql first.';
  END IF;
END $$;

-- MANUAL VERIFICATION QUERIES (run these before migration):

-- Check how many credentials will be migrated
SELECT 
  provider,
  COUNT(*) as count
FROM user_sms_credentials
GROUP BY provider
ORDER BY count DESC;

-- Preview what will be migrated (without encryption)
SELECT 
  user_id,
  provider,
  created_at,
  updated_at
FROM user_sms_credentials
ORDER BY created_at DESC
LIMIT 10;

-- After running TypeScript migration, verify results:

-- Check migrated providers
SELECT 
  channel,
  provider,
  status,
  COUNT(*) as count
FROM messaging_providers
GROUP BY channel, provider, status
ORDER BY channel, provider;

-- Verify specific user migration
-- SELECT 
--   mp.user_id,
--   mp.channel,
--   mp.provider,
--   mp.status,
--   mp.created_at as mp_created,
--   usc.created_at as legacy_created
-- FROM messaging_providers mp
-- LEFT JOIN user_sms_credentials usc ON usc.user_id = mp.user_id
-- WHERE mp.channel = 'sms'
-- ORDER BY mp.created_at DESC
-- LIMIT 10;

-- ============================================================================
-- IMPORTANT: DO NOT RUN THIS SQL DIRECTLY
-- Use the TypeScript migration script instead:
--   npm run migrate:sms-providers
-- ============================================================================
