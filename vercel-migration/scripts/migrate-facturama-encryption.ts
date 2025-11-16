/**
 * Facturama Password Migration Script
 * 
 * Migrates passwords from insecure base64 encoding to AES-256-GCM encryption
 * 
 * PREREQUISITES:
 * 1. Run SQL migration: 20251116_facturama_encryption_aes256.sql
 * 2. Set ENCRYPTION_MASTER_KEY in .env.local (generate with: openssl rand -hex 32)
 * 3. Backup database before running
 * 
 * USAGE:
 * node --loader ts-node/esm scripts/migrate-facturama-encryption.ts
 * or
 * tsx scripts/migrate-facturama-encryption.ts
 */

import { createClient } from '@supabase/supabase-js';
import { encrypt, validateEncryptionSetup } from '../lib/crypto/encryption';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in environment');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface FacturamaConfig {
  id: string;
  user_id: string;
  api_user: string;
  api_password_encrypted: string;
  api_password_iv: string | null;
  api_password_tag: string | null;
  certificate_password_encrypted: string | null;
  certificate_password_iv: string | null;
  certificate_password_tag: string | null;
  encryption_migrated: boolean;
}

async function migratePasswords() {
  console.log('🔐 Facturama Password Migration - Base64 → AES-256-GCM\n');

  // 1. Validate encryption setup
  console.log('Step 1: Validating encryption configuration...');
  const validation = validateEncryptionSetup();
  if (!validation.valid) {
    console.error('❌ Encryption setup invalid:', validation.error);
    console.error('\nGenerate ENCRYPTION_MASTER_KEY with: openssl rand -hex 32');
    process.exit(1);
  }
  console.log('✅ Encryption setup valid\n');

  // 2. Get all facturama configs that need migration
  console.log('Step 2: Finding configs that need migration...');
  const { data: configs, error: fetchError } = await supabase
    .from('facturama_config')
    .select('*')
    .eq('encryption_migrated', false);

  if (fetchError) {
    console.error('❌ Error fetching configs:', fetchError);
    process.exit(1);
  }

  if (!configs || configs.length === 0) {
    console.log('✅ No configs need migration (all already encrypted)\n');
    return;
  }

  console.log(`📋 Found ${configs.length} config(s) to migrate\n`);

  // 3. Migrate each config
  let successCount = 0;
  let errorCount = 0;

  for (const config of configs as FacturamaConfig[]) {
    console.log(`\n🔄 Migrating config ${config.id}`);
    console.log(`   User: ${config.user_id}`);
    console.log(`   API User: ${config.api_user}`);

    try {
      // Decrypt base64 password
      const base64Password = config.api_password_encrypted;
      let plainPassword: string;
      
      try {
        plainPassword = Buffer.from(base64Password, 'base64').toString('utf8');
        console.log(`   ✅ Decoded base64 password (length: ${plainPassword.length})`);
      } catch (decodeError) {
        console.error(`   ❌ Failed to decode base64:`, decodeError);
        errorCount++;
        continue;
      }

      // Encrypt with AES-256-GCM
      const encrypted = encrypt(plainPassword);
      console.log(`   ✅ Encrypted with AES-256-GCM`);

      // Update database
      const { error: updateError } = await supabase
        .from('facturama_config')
        .update({
          api_password_encrypted: encrypted.encrypted,
          api_password_iv: encrypted.iv,
          api_password_tag: encrypted.tag,
          encryption_migrated: true,
        })
        .eq('id', config.id);

      if (updateError) {
        console.error(`   ❌ Database update failed:`, updateError);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Database updated successfully`);

      // Migrate certificate password if exists
      if (config.certificate_password_encrypted) {
        try {
          const certPlainPassword = Buffer.from(
            config.certificate_password_encrypted,
            'base64'
          ).toString('utf8');
          
          const certEncrypted = encrypt(certPlainPassword);
          
          await supabase
            .from('facturama_config')
            .update({
              certificate_password_encrypted: certEncrypted.encrypted,
              certificate_password_iv: certEncrypted.iv,
              certificate_password_tag: certEncrypted.tag,
            })
            .eq('id', config.id);

          console.log(`   ✅ Certificate password also migrated`);
        } catch (certError) {
          console.warn(`   ⚠️  Certificate password migration failed (non-critical):`, certError);
        }
      }

      successCount++;
      console.log(`   ✅ Config ${config.id} migration COMPLETE`);

    } catch (error) {
      console.error(`   ❌ Migration failed:`, error);
      errorCount++;
    }
  }

  // 4. Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📋 Total: ${configs.length}`);
  console.log('='.repeat(60) + '\n');

  if (errorCount === 0) {
    console.log('🎉 All passwords migrated successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify FacturamaClient can decrypt passwords');
    console.log('2. Test connection with real Facturama API');
    console.log('3. Update all API endpoints to use encrypt() when saving new credentials\n');
  } else {
    console.log('⚠️  Some migrations failed. Review errors above and retry.');
    process.exit(1);
  }
}

// Run migration
migratePasswords().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
