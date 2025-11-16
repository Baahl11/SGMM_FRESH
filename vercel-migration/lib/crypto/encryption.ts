/**
 * AES-256-GCM Encryption Utilities
 * For secure storage of sensitive credentials (Facturama, OpenPay, WhatsApp tokens)
 * 
 * Security Standards:
 * - AES-256-GCM (Authenticated Encryption with Associated Data)
 * - Random IV (Initialization Vector) per encryption
 * - Authentication tag validation on decryption
 * - Master key stored in environment variable
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * CRITICAL: This key must be 32 bytes (64 hex characters)
 * Generate with: openssl rand -hex 32
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_MASTER_KEY;
  
  if (!key) {
    throw new Error(
      'ENCRYPTION_MASTER_KEY not found in environment. ' +
      'Generate with: openssl rand -hex 32'
    );
  }

  if (key.length !== 64) {
    throw new Error(
      `ENCRYPTION_MASTER_KEY must be 64 hex characters (32 bytes). Current length: ${key.length}`
    );
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  encrypted: string; // Hex-encoded ciphertext
  iv: string; // Hex-encoded initialization vector
  tag: string; // Hex-encoded authentication tag
}

/**
 * Encrypt plaintext using AES-256-GCM
 * 
 * @param plaintext - Text to encrypt (e.g., password, API key)
 * @returns Object with encrypted data, IV, and authentication tag
 * 
 * @example
 * const encrypted = encrypt('my-secret-password');
 * // Save encrypted.encrypted, encrypted.iv, encrypted.tag to database
 */
export function encrypt(plaintext: string): EncryptedData {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty plaintext');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  } catch (error) {
    console.error('[Encryption] Error:', error);
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * 
 * @param encrypted - Hex-encoded ciphertext
 * @param iv - Hex-encoded initialization vector
 * @param tag - Hex-encoded authentication tag
 * @returns Decrypted plaintext
 * 
 * @example
 * const password = decrypt(encrypted.encrypted, encrypted.iv, encrypted.tag);
 */
export function decrypt(encrypted: string, iv: string, tag: string): string {
  if (!encrypted || !iv || !tag) {
    throw new Error('Encrypted data, IV, and tag are all required for decryption');
  }

  try {
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[Decryption] Error:', error);
    
    // Common errors
    if (error instanceof Error) {
      if (error.message.includes('auth')) {
        throw new Error('Decryption failed: Authentication tag mismatch (data may be corrupted)');
      }
      if (error.message.includes('key')) {
        throw new Error('Decryption failed: Invalid encryption key');
      }
    }
    
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate that encryption key is properly configured
 * Call this on server startup
 */
export function validateEncryptionSetup(): { valid: boolean; error?: string } {
  try {
    getEncryptionKey();
    
    // Test encryption/decryption
    const testData = 'test-encryption-' + Date.now();
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted.encrypted, encrypted.iv, encrypted.tag);
    
    if (decrypted !== testData) {
      return {
        valid: false,
        error: 'Encryption test failed: Decrypted data does not match original',
      };
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Migrate from base64 encoding to AES-256-GCM encryption
 * ONLY use this for one-time migration of existing data
 * 
 * @param base64Encoded - Base64-encoded password (OLD format)
 * @returns Encrypted data (NEW format)
 */
export function migrateFromBase64(base64Encoded: string): EncryptedData {
  try {
    // Decode base64 to get plaintext
    const plaintext = Buffer.from(base64Encoded, 'base64').toString('utf8');
    
    // Encrypt with AES-256-GCM
    return encrypt(plaintext);
  } catch (error) {
    throw new Error(`Base64 migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Type guard to check if data is in new encrypted format
 */
export function isEncryptedFormat(data: any): data is EncryptedData {
  return (
    typeof data === 'object' &&
    typeof data.encrypted === 'string' &&
    typeof data.iv === 'string' &&
    typeof data.tag === 'string'
  );
}

/**
 * Helper to safely decrypt database field
 * Handles both old base64 format and new encrypted format during migration
 * 
 * @param encryptedField - Database field value
 * @param ivField - IV field value (null for base64 format)
 * @param tagField - Tag field value (null for base64 format)
 * @returns Decrypted plaintext
 */
export function decryptDatabaseField(
  encryptedField: string,
  ivField: string | null,
  tagField: string | null
): string {
  // New format: has IV and tag
  if (ivField && tagField) {
    return decrypt(encryptedField, ivField, tagField);
  }
  
  // Old format: base64 only (INSECURE - should migrate)
  console.warn('[Security] Decrypting base64-encoded field. MIGRATE TO AES-256-GCM ASAP!');
  try {
    return Buffer.from(encryptedField, 'base64').toString('utf8');
  } catch (error) {
    throw new Error('Failed to decode base64 field. Data may be corrupted.');
  }
}
