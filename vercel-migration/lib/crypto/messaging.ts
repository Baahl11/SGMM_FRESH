import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { EncryptedSecretEnvelope } from '@/types/messaging';

const ENVELOPE_VERSION = 1;
const ALGORITHM: EncryptedSecretEnvelope['algorithm'] = 'chacha20poly1305';
const KEY_LENGTH = 32; // 256 bits
const NONCE_LENGTH = 12; // 96 bits required by chacha20-poly1305
const AUTH_TAG_LENGTH = 16;

export type MessagingSecretPayload = Record<string, unknown>;

function normalizeKey(key: string | Buffer): Buffer {
  if (typeof key === 'string') {
    return Buffer.from(key, 'base64');
  }
  return key;
}

function assertKeyLength(key: Buffer) {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Messaging cipher key must be ${KEY_LENGTH} bytes; received ${key.length}.`);
  }
}

export async function encryptMessagingSecret(
  payload: MessagingSecretPayload,
  key: string | Buffer,
): Promise<EncryptedSecretEnvelope> {
  const normalizedKey = normalizeKey(key);
  assertKeyLength(normalizedKey);

  const message = Buffer.from(JSON.stringify(payload), 'utf8');
  const nonce = randomBytes(NONCE_LENGTH);
  
  // Using chacha20-poly1305 (Node.js doesn't support xchacha20 directly, but chacha20-poly1305 is very similar)
  const cipher = createCipheriv('chacha20-poly1305', normalizedKey, nonce, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  const ciphertext = Buffer.concat([cipher.update(message), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Combine ciphertext and auth tag
  const combined = Buffer.concat([ciphertext, authTag]);

  return {
    version: ENVELOPE_VERSION,
    algorithm: ALGORITHM,
    nonce: nonce.toString('base64'),
    ciphertext: combined.toString('base64'),
    created_at: new Date().toISOString(),
  };
}

export async function decryptMessagingSecret<T extends MessagingSecretPayload>(
  envelope: EncryptedSecretEnvelope,
  key: string | Buffer,
): Promise<T> {
  if (envelope.algorithm !== ALGORITHM) {
    if (envelope.algorithm === 'xchacha20poly1305') {
      throw new Error('Legacy xchacha20poly1305 data found. Please re-save messaging credentials.');
    }
    throw new Error(`Unsupported algorithm ${envelope.algorithm}`);
  }

  const normalizedKey = normalizeKey(key);
  assertKeyLength(normalizedKey);

  const nonce = Buffer.from(envelope.nonce, 'base64');
  const combined = Buffer.from(envelope.ciphertext, 'base64');
  
  // Split combined buffer into ciphertext and auth tag
  const ciphertext = combined.subarray(0, combined.length - AUTH_TAG_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv('chacha20-poly1305', normalizedKey, nonce, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const json = decrypted.toString('utf8');
  return JSON.parse(json) as T;
}

export function isEncryptedSecretEnvelope(value: unknown): value is EncryptedSecretEnvelope {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<EncryptedSecretEnvelope>;
  return (
    typeof candidate.version === 'number' &&
    typeof candidate.algorithm === 'string' &&
    typeof candidate.nonce === 'string' &&
    typeof candidate.ciphertext === 'string'
  );
}
