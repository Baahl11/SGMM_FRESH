import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'

// HANDOFF_MAESTRO_V2 seccion 14 (Aceptacion de Fase 0 -- "confirmar cifrado
// canonico"): lib/crypto/messaging.ts (chacha20-poly1305, usado por el
// esquema de messaging_providers) no tenia ninguna prueba en el repo. Este
// test SOLO confirma que el primitivo de cifrado funciona correctamente;
// NO implica migrar user_profiles.whatsapp_access_token /
// messaging_config.whatsapp_access_token a este cifrado -- eso es Fase 1
// (ver docs/reception-ai/current-messaging-map.md, seccion "Fuera de
// alcance").

import {
  decryptMessagingSecret,
  encryptMessagingSecret,
  isEncryptedSecretEnvelope,
} from '@/lib/crypto/messaging'
import type { EncryptedSecretEnvelope } from '@/types/messaging'

describe('lib/crypto/messaging.ts (cifrado canonico de messaging_providers)', () => {
  it('cifra y descifra un payload real haciendo round-trip con una key de 32 bytes', async () => {
    const key = randomBytes(32)
    const payload = { access_token: 'EAAG_secreto_de_prueba', phone_number_id: 'phone-1' }

    const envelope = await encryptMessagingSecret(payload, key)

    expect(envelope.algorithm).toBe('chacha20poly1305')
    expect(JSON.stringify(envelope)).not.toContain('EAAG_secreto_de_prueba')

    const decrypted = await decryptMessagingSecret(envelope, key)
    expect(decrypted).toEqual(payload)
  })

  it('isEncryptedSecretEnvelope reconoce un envelope valido y rechaza uno invalido', async () => {
    const key = randomBytes(32)
    const envelope = await encryptMessagingSecret({ foo: 'bar' }, key)

    expect(isEncryptedSecretEnvelope(envelope)).toBe(true)
    expect(isEncryptedSecretEnvelope({ foo: 'bar' })).toBe(false)
    expect(isEncryptedSecretEnvelope(null)).toBe(false)
  })

  it('rechaza un envelope con la key equivocada (auth tag no valida)', async () => {
    const key = randomBytes(32)
    const otherKey = randomBytes(32)
    const envelope = await encryptMessagingSecret({ access_token: 'x' }, key)

    await expect(decryptMessagingSecret(envelope, otherKey)).rejects.toThrow()
  })

  it('rechaza el algoritmo legacy xchacha20poly1305 pidiendo re-guardar las credenciales', async () => {
    const key = randomBytes(32)
    const legacyEnvelope: EncryptedSecretEnvelope = {
      version: 1,
      algorithm: 'xchacha20poly1305',
      nonce: Buffer.alloc(12).toString('base64'),
      ciphertext: Buffer.alloc(16).toString('base64'),
    }

    await expect(decryptMessagingSecret(legacyEnvelope, key)).rejects.toThrow(
      /Legacy xchacha20poly1305 data found/
    )
  })
})
