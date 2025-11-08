import sodium from 'libsodium-wrappers';
import type { EncryptedSecretEnvelope } from '@/types/messaging';

const ENVELOPE_VERSION = 1;
const BASE64_VARIANT = sodium.base64_variants.ORIGINAL;
const ALGORITHM: EncryptedSecretEnvelope['algorithm'] = 'xchacha20poly1305';

export type MessagingSecretPayload = Record<string, unknown>;

function normalizeKey(key: string | Uint8Array): Uint8Array {
  if (typeof key === 'string') {
    return sodium.from_base64(key.trim(), BASE64_VARIANT);
  }
  return key;
}

function assertKeyLength(key: Uint8Array) {
  const required = sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES;
  if (key.length !== required) {
    throw new Error(`Messaging cipher key must be ${required} bytes; received ${key.length}.`);
  }
}

export async function encryptMessagingSecret(
  payload: MessagingSecretPayload,
  key: string | Uint8Array,
): Promise<EncryptedSecretEnvelope> {
  await sodium.ready;
  const normalizedKey = normalizeKey(key);
  assertKeyLength(normalizedKey);

  const message = new TextEncoder().encode(JSON.stringify(payload));
  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
  );
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    message,
    null,
    null,
    nonce,
    normalizedKey,
  );

  return {
    version: ENVELOPE_VERSION,
    algorithm: ALGORITHM,
    nonce: sodium.to_base64(nonce, BASE64_VARIANT),
    ciphertext: sodium.to_base64(ciphertext, BASE64_VARIANT),
    created_at: new Date().toISOString(),
  };
}

export async function decryptMessagingSecret<T extends MessagingSecretPayload>(
  envelope: EncryptedSecretEnvelope,
  key: string | Uint8Array,
): Promise<T> {
  await sodium.ready;
  if (envelope.algorithm !== ALGORITHM) {
    throw new Error(`Unsupported algorithm ${envelope.algorithm}`);
  }

  const normalizedKey = normalizeKey(key);
  assertKeyLength(normalizedKey);

  const nonce = sodium.from_base64(envelope.nonce, BASE64_VARIANT);
  const ciphertext = sodium.from_base64(envelope.ciphertext, BASE64_VARIANT);

  const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    ciphertext,
    null,
    nonce,
    normalizedKey,
  );

  const json = new TextDecoder().decode(decrypted);
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
