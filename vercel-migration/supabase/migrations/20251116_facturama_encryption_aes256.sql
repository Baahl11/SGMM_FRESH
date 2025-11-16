-- Migration: Add AES-256-GCM encryption fields to facturama_config
-- Created: 2025-11-16
-- Purpose: Migrate from insecure base64 encoding to proper AES-256-GCM encryption

-- ===== STEP 1: Add new encryption fields =====

ALTER TABLE facturama_config
  ADD COLUMN IF NOT EXISTS api_password_iv TEXT,
  ADD COLUMN IF NOT EXISTS api_password_tag TEXT;

ALTER TABLE facturama_config
  ADD COLUMN IF NOT EXISTS certificate_password_iv TEXT,
  ADD COLUMN IF NOT EXISTS certificate_password_tag TEXT;

-- ===== STEP 2: Add comments =====

COMMENT ON COLUMN facturama_config.api_password_encrypted IS 'AES-256-GCM encrypted Facturama API password (hex-encoded ciphertext)';
COMMENT ON COLUMN facturama_config.api_password_iv IS 'Initialization vector for api_password encryption (hex-encoded, 12 bytes)';
COMMENT ON COLUMN facturama_config.api_password_tag IS 'Authentication tag for api_password encryption (hex-encoded, 16 bytes)';

COMMENT ON COLUMN facturama_config.certificate_password_encrypted IS 'AES-256-GCM encrypted .key certificate password (hex-encoded ciphertext)';
COMMENT ON COLUMN facturama_config.certificate_password_iv IS 'Initialization vector for certificate_password encryption (hex-encoded, 12 bytes)';
COMMENT ON COLUMN facturama_config.certificate_password_tag IS 'Authentication tag for certificate_password encryption (hex-encoded, 16 bytes)';

-- ===== STEP 3: Add migration status tracking =====

ALTER TABLE facturama_config
  ADD COLUMN IF NOT EXISTS encryption_migrated BOOLEAN DEFAULT false;

COMMENT ON COLUMN facturama_config.encryption_migrated IS 'true = passwords migrated from base64 to AES-256-GCM, false = still using legacy base64';

-- ===== STEP 4: Create index for migration tracking =====

CREATE INDEX IF NOT EXISTS idx_facturama_config_encryption_migrated 
  ON facturama_config(encryption_migrated) 
  WHERE encryption_migrated = false;

-- ===== NOTES =====
-- After this migration runs:
-- 1. Run the data migration script: node scripts/migrate-facturama-encryption.js
-- 2. The script will:
--    - Read base64 passwords from api_password_encrypted
--    - Decode base64 to plaintext
--    - Encrypt with AES-256-GCM
--    - Store ciphertext, IV, and tag in new columns
--    - Set encryption_migrated = true
-- 3. Update FacturamaClient to use decrypt() function
-- 4. Once all records are migrated, api_password_encrypted will contain hex ciphertext instead of base64

-- Security improvement:
-- BEFORE: api_password_encrypted contained base64(password) - EASILY REVERSIBLE
-- AFTER:  api_password_encrypted contains AES-256-GCM ciphertext
--         api_password_iv contains random IV (different per record)
--         api_password_tag contains authentication tag
--         Requires ENCRYPTION_MASTER_KEY from environment to decrypt
--         Authentication tag prevents tampering

COMMENT ON TABLE facturama_config IS 'Stores user/clinic Facturama API credentials with AES-256-GCM encryption (multi-tenant)';
