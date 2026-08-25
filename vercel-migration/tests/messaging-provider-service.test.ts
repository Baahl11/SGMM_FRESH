import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { getWhatsAppCredentials } from '@/lib/messaging/provider-service'
import { encryptMessagingSecret } from '@/lib/crypto/messaging'

// Fase 1 (consolidacion de mensajeria): facade de solo lectura -- primero
// intenta el almacen canonico (messaging_providers, cifrado), y si no hay
// fila cae al legacy (messaging_config), igual que el comportamiento actual
// de la ruta piloto (Task 3). No escribe nada en ningun almacen.

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => result,
  }
  return builder
}

function makeSupabase(byTable: Record<string, { data: unknown; error: unknown }>) {
  return {
    from: (table: string) => makeQueryBuilder(byTable[table] ?? { data: null, error: null }),
  } as any
}

const CIPHER_KEY = randomBytes(32).toString('base64')

describe('getWhatsAppCredentials', () => {
  it('usa messaging_providers cuando hay una fila activa (canonico)', async () => {
    process.env.MESSAGING_CIPHER_KEY = CIPHER_KEY
    const envelope = await encryptMessagingSecret(
      { phone_number_id: 'phone-canonico', access_token: 'token-canonico' },
      CIPHER_KEY
    )

    const supabase = makeSupabase({
      messaging_providers: {
        data: { credentials_encrypted: JSON.stringify(envelope), status: 'active' },
        error: null,
      },
    })

    const result = await getWhatsAppCredentials(supabase, 'user-1')

    expect(result).toEqual({ phone_number_id: 'phone-canonico', access_token: 'token-canonico' })
    delete process.env.MESSAGING_CIPHER_KEY
  })

  it('cae a messaging_config cuando no hay fila en messaging_providers', async () => {
    const supabase = makeSupabase({
      messaging_providers: { data: null, error: null },
      messaging_config: {
        data: {
          whatsapp_enabled: true,
          whatsapp_phone_number_id: 'phone-legacy',
          whatsapp_business_id: 'biz-legacy',
          whatsapp_access_token: 'token-legacy',
        },
        error: null,
      },
    })

    const result = await getWhatsAppCredentials(supabase, 'user-1')

    expect(result).toEqual({
      phone_number_id: 'phone-legacy',
      access_token: 'token-legacy',
      business_account_id: 'biz-legacy',
    })
  })

  it('retorna null cuando ninguna fuente tiene configuracion usable', async () => {
    const supabase = makeSupabase({
      messaging_providers: { data: null, error: null },
      messaging_config: { data: { whatsapp_enabled: false }, error: null },
    })

    const result = await getWhatsAppCredentials(supabase, 'user-1')

    expect(result).toBeNull()
  })
})
