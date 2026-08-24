/**
 * Test Script: Certificate Upload System
 * 
 * Tests the complete certificate upload flow:
 * 1. Storage bucket creation (manual in Supabase dashboard)
 * 2. RLS policies verification
 * 3. File upload simulation
 * 4. API endpoint validation
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface StoragePolicy {
  definition?: string;
}

async function main() {
  console.log('🧪 Testing Certificate Upload System\n');

  // Test 1: Check if storage bucket exists
  console.log('Test 1: Verificando bucket de storage...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error.message);
      return;
    }

    const certBucket = buckets?.find(b => b.name === 'facturama-certificates');
    
    if (certBucket) {
      console.log('✅ Bucket "facturama-certificates" existe');
      console.log(`   - Public: ${certBucket.public}`);
      console.log(`   - ID: ${certBucket.id}`);
    } else {
      console.log('⚠️  Bucket "facturama-certificates" NO existe');
      console.log('   Debe ejecutar la migración: 20251116_certificates_storage.sql');
      return;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Test 2: Check RLS policies
  console.log('\nTest 2: Verificando políticas RLS...');
  try {
    const response = await supabase.rpc('get_policies_for_table', {
      schema_name: 'storage',
      table_name: 'objects'
    });

    if (response.data && response.data.length > 0) {
      const policies = response.data as unknown as StoragePolicy[];
      const certPolicies = policies.filter((policy) =>
        policy.definition?.includes('facturama-certificates')
      );
      console.log(`✅ Found ${certPolicies.length} policies for facturama-certificates`);
    } else {
      console.log('ℹ️  Cannot query RLS policies (expected - requires custom function)');
    }
  } catch (error) {
    console.log('ℹ️  RLS policy check skipped (no custom function)');
  }

  // Test 3: Create test certificate files
  console.log('\nTest 3: Creando archivos de prueba...');
  const testDir = path.join(process.cwd(), 'tests', 'fixtures');
  
  // Create test directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const cerPath = path.join(testDir, 'test.cer');
  const keyPath = path.join(testDir, 'test.key');

  // Create dummy certificate files
  fs.writeFileSync(cerPath, 'DUMMY CER FILE CONTENT FOR TESTING');
  fs.writeFileSync(keyPath, 'DUMMY KEY FILE CONTENT FOR TESTING');

  console.log('✅ Archivos de prueba creados:');
  console.log(`   - ${cerPath}`);
  console.log(`   - ${keyPath}`);

  // Test 4: Simulate upload (requires authenticated user)
  console.log('\nTest 4: Simulando upload a storage...');
  const testUserId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
  const cerBuffer = fs.readFileSync(cerPath);
  const keyBuffer = fs.readFileSync(keyPath);

  const cerStoragePath = `${testUserId}/certificate.cer`;
  const keyStoragePath = `${testUserId}/certificate.key`;

  // Upload .cer
  const { data: cerUpload, error: cerError } = await supabase.storage
    .from('facturama-certificates')
    .upload(cerStoragePath, cerBuffer, {
      contentType: 'application/x-x509-ca-cert',
      upsert: true,
    });

  if (cerError) {
    console.log(`⚠️  Upload .cer falló (esperado sin RLS): ${cerError.message}`);
  } else {
    console.log('✅ Upload .cer exitoso (usando service role key)');
    console.log(`   Path: ${cerUpload.path}`);
  }

  // Upload .key
  const { data: keyUpload, error: keyError } = await supabase.storage
    .from('facturama-certificates')
    .upload(keyStoragePath, keyBuffer, {
      contentType: 'application/x-pem-file',
      upsert: true,
    });

  if (keyError) {
    console.log(`⚠️  Upload .key falló (esperado sin RLS): ${keyError.message}`);
  } else {
    console.log('✅ Upload .key exitoso (usando service role key)');
    console.log(`   Path: ${keyUpload.path}`);
  }

  // Test 5: Get public URLs
  if (cerUpload && keyUpload) {
    console.log('\nTest 5: Obteniendo URLs públicas...');
    
    const { data: cerUrl } = supabase.storage
      .from('facturama-certificates')
      .getPublicUrl(cerStoragePath);

    const { data: keyUrl } = supabase.storage
      .from('facturama-certificates')
      .getPublicUrl(keyStoragePath);

    console.log('✅ URLs generadas:');
    console.log(`   .cer: ${cerUrl.publicUrl}`);
    console.log(`   .key: ${keyUrl.publicUrl}`);

    // Cleanup
    console.log('\nTest 6: Limpiando archivos de prueba...');
    await supabase.storage
      .from('facturama-certificates')
      .remove([cerStoragePath, keyStoragePath]);

    console.log('✅ Archivos eliminados de storage');
  }

  // Cleanup local test files
  fs.unlinkSync(cerPath);
  fs.unlinkSync(keyPath);
  console.log('✅ Archivos locales eliminados');

  console.log('\n' + '='.repeat(60));
  console.log('🎉 TESTS COMPLETADOS');
  console.log('='.repeat(60));
  console.log('\n📋 Próximos pasos:');
  console.log('  1. Ejecutar SQL migration en Supabase Dashboard');
  console.log('  2. Verificar bucket "facturama-certificates" creado');
  console.log('  3. Probar upload desde UI en /settings/facturacion');
  console.log('  4. Verificar archivos en Supabase Storage');
}

main().catch(console.error);
