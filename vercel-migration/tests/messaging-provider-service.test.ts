import { randomBytes } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getWhatsAppCredentials } from '@/lib/messaging/provider-service'
import { encryptMessagingSecret } from '@/lib/crypto/messaging'

// Fase 1 (consolidacion de mensajeria): facade de solo lectura -- primero
// intenta el almacen canonico (messaging_providers, cifrado), y si no hay
// fila cae al legacy (messaging_config), igual que el comportamiento actual
// de la ruta piloto (Task 3). No escribe nada en ningun almacen.

type EqCall = [string, unknown]

function makeQueryBuilder(result: { data: unknown; error: unknown }, eqCalls: EqCall[]) {
  const builder: any = {
    select: () => builder,
    // Se registran columna y valor para poder afirmar sobre los filtros
    // reales que aplica provider-service.ts, no solo sobre su resultado.
    eq: (column: string, value: unknown) => {
      eqCalls.push([column, value])
      return builder
    },
    maybeSingle: async () => result,
  }
  return builder
}

function makeSupabase(byTable: Record<string, { data: unknown; error: unknown }>) {
  const eqCalls: Record<string, EqCall[]> = {}
  const client = {
    from: (table: string) => {
      const calls = (eqCalls[table] ??= [])
      return makeQueryBuilder(byTable[table] ?? { data: null, error: null }, calls)
    },
  } as any
  return { client, eqCalls }
}

const CIPHER_KEY = randomBytes(32).toString('base64')

const LEGACY_ROW = {
  data: {
    whatsapp_enabled: true,
    whatsapp_phone_number_id: 'phone-legacy',
    whatsapp_business_id: 'biz-legacy',
    whatsapp_access_token: 'token-legacy',
  },
  error: null,
}

const LEGACY_CREDENTIALS = {
  phone_number_id: 'phone-legacy',
  access_token: 'token-legacy',
  business_account_id: 'biz-legacy',
}

describe('getWhatsAppCredentials', () => {
  afterEach(() => {
    delete process.env.MESSAGING_CIPHER_KEY
    vi.restoreAllMocks()
  })

  it('usa messaging_providers cuando hay una fila activa (canonico)', async () => {
    process.env.MESSAGING_CIPHER_KEY = CIPHER_KEY
    const envelope = await encryptMessagingSecret(
      { phone_number_id: 'phone-canonico', access_token: 'token-canonico' },
      CIPHER_KEY
    )

    const { client: supabase, eqCalls } = makeSupabase({
      messaging_providers: {
        data: { credentials_encrypted: JSON.stringify(envelope), status: 'active' },
        error: null,
      },
    })

    const result = await getWhatsAppCredentials(supabase, 'user-1')

    expect(result).toEqual({ phone_number_id: 'phone-canonico', access_token: 'token-canonico' })
    // El camino canonico debe filtrar por usuario, canal, proveedor y estado.
    expect(eqCalls.messaging_providers).toEqual([
      ['user_id', 'user-1'],
      ['channel', 'whatsapp'],
      ['provider', 'meta_whatsapp'],
      ['status', 'active'],
    ])
    // Al resolverse por el canonico, el legacy ni se consulta.
    expect(eqCalls.messaging_config).toBeUndefined()
    delete process.env.MESSAGING_CIPHER_KEY
  })

  it('cae a messaging_config cuando no hay fila en messaging_providers', async () => {
    const { client: supabase, eqCalls } = makeSupabase({
      messaging_providers: { data: null, error: null },
      messaging_config: LEGACY_ROW,
    })

    const result = await getWhatsAppCredentials(supabase, 'user-1')

    expect(result).toEqual(LEGACY_CREDENTIALS)
    expect(eqCalls.messaging_config).toEqual([['user_id', 'user-1']])
  })

  it('retorna null cuando ninguna fuente tiene configuracion usable', async () => {
    const { client: supabase } = makeSupabase({
      messaging_providers: { data: null, error: null },
      messaging_config: { data: { whatsapp_enabled: false }, error: null },
    })

    const result = await getWhatsAppCredentials(supabase, 'user-1')

    expect(result).toBeNull()
  })

  it('cae al legacy cuando credentials_encrypted no es JSON valido (no lanza)', async () => {
    process.env.MESSAGING_CIPHER_KEY = CIPHER_KEY
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { client: supabase } = makeSupabase({
      messaging_providers: {
        data: { credentials_encrypted: 'no-es-json{{', status: 'active' },
        error: null,
      },
      messaging_config: LEGACY_ROW,
    })

    const result = await getWhatsAppCredentials(supabase, 'user-1')

    expect(result).toEqual(LEGACY_CREDENTIALS)
    expect(warnSpy).toHaveBeenCalled()
    // El warning no debe filtrar el payload almacenado. Ojo: el mensaje
    // nativo de JSON.parse SI incluye un fragmento de la entrada, por eso
    // provider-service.ts lo reemplaza por un texto fijo.
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain('no-es-json')
  })

  it('cae al legacy cuando el envelope canonico no se puede descifrar (clave equivocada)', async () => {
    const otherKey = randomBytes(32).toString('base64')
    const envelope = await encryptMessagingSecret(
      { phone_number_id: 'phone-canonico', access_token: 'token-canonico' },
      otherKey
    )
    process.env.MESSAGING_CIPHER_KEY = CIPHER_KEY
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { client: supabase } = makeSupabase({
      messaging_providers: {
        data: { credentials_encrypted: JSON.stringify(envelope), status: 'active' },
        error: null,
      },
      messaging_config: LEGACY_ROW,
    })

    const result = await getWhatsAppCredentials(supabase, 'user-1')

    expect(result).toEqual(LEGACY_CREDENTIALS)
    expect(warnSpy).toHaveBeenCalled()
  })
})
