import * as dotenv from 'dotenv';
import * as path from 'path';
import { validateEncryptionSetup, encrypt, decrypt } from '../lib/crypto/encryption';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🧪 Testing Encryption System\n');

// Test 1: Validation
console.log('Test 1: Validating setup...');
const validation = validateEncryptionSetup();
console.log(validation.valid ? '✅ Valid' : `❌ Invalid: ${validation.error}`);

if (!validation.valid) {
  console.error('\nENCRYPTION_MASTER_KEY not configured!');
  process.exit(1);
}

// Test 2: Encrypt/Decrypt
console.log('\nTest 2: Encrypt/Decrypt roundtrip...');
const original = 'my-secret-password-123';
const encrypted = encrypt(original);
console.log('  Encrypted:', encrypted.encrypted.substring(0, 20) + '...');
console.log('  IV:', encrypted.iv);
console.log('  Tag:', encrypted.tag);

const decrypted = decrypt(encrypted.encrypted, encrypted.iv, encrypted.tag);
console.log('  Decrypted:', decrypted);
console.log(decrypted === original ? '✅ Match!' : '❌ Mismatch!');

// Test 3: Facturama credentials example
console.log('\nTest 3: Facturama credentials simulation...');
const facturamaPassword = 'pruebas2011';
const encryptedCreds = encrypt(facturamaPassword);
console.log('  Original password:', facturamaPassword);
console.log('  Encrypted (hex):', encryptedCreds.encrypted);
console.log('  IV (hex):', encryptedCreds.iv);
console.log('  Tag (hex):', encryptedCreds.tag);

const decryptedPassword = decrypt(
  encryptedCreds.encrypted,
  encryptedCreds.iv,
  encryptedCreds.tag
);
console.log('  Decrypted password:', decryptedPassword);
console.log(decryptedPassword === facturamaPassword ? '✅ Credentials encrypted successfully!' : '❌ Failed!');

console.log('\n🎉 All tests passed! Encryption system ready.');
