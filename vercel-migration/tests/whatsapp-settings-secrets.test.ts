import { beforeEach, describe, expect, it, vi } from 'vitest'

// HANDOFF_MAESTRO_V2 sección 3 (P0 — whatsapp-settings loguea credenciales):
// POST hacía console.log del objeto updateData completo, que podía incluir
// whatsapp_access_token / whatsapp_twilio_auth_token / whatsapp_twilio_account_sid
// en texto plano en logs de servidor. Fija el contrato: ningún console.log
// de POST contiene esos valores, y GET expone un booleano en vez del token.

const getUserMock = vi.fn()

function makeChain(result: { data?: unknown; error?: unknown }) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_t, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(result)
      }
      return () => new Proxy({}, handler)
    },
  }
  return new Proxy({}, handler)
}

const PROFILE_ROW = {
  whatsapp_phone: '+5215500000000',
  whatsapp_enabled: true,
  whatsapp_default_message: 'hola',
  whatsapp_config_level: 'meta',
  whatsapp_provider: 'meta',
  whatsapp_phone_number_id: 'phone-1',
  whatsapp_business_account_id: 'biz-1',
  whatsapp_access_token: 'EAAG_super_secreto_no_debe_salir',
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: () => getUserMock() },
    from: (table: string) => {
      if (table === 'user_profiles') {
        return makeChain({ data: PROFILE_ROW, error: null })
      }
      return makeChain({ data: null, error: null })
    },
  }),
}))

describe('GET/POST /api/user/whatsapp-settings no exponen ni loguean tokens', () => {
  beforeEach(() => {
    getUserMock.mockReset()
    getUserMock.mockResolvedValue({ data: { user: { id: 'tenant-A' } }, error: null })
  })

  it('GET nunca incluye whatsapp_access_token; expone whatsapp_has_access_token', async () => {
    const { GET } = await import('@/app/api/user/whatsapp-settings/route')
    const res = await GET()
    const body = await res.json()
    expect(JSON.stringify(body)).not.toContain('super_secreto')
    expect(JSON.stringify(body)).not.toContain('whatsapp_access_token')
    expect(body.whatsapp_has_access_token).toBe(true)
    expect(body.whatsapp_phone_number_id).toBe('phone-1')
  })

  it('POST no loguea el token en consola', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const req = new Request('http://localhost/api/user/whatsapp-settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        whatsapp_provider: 'meta',
        whatsapp_phone_number_id: 'phone-1',
        whatsapp_business_account_id: 'biz-1',
        whatsapp_access_token: 'nuevo_token_secreto_no_debe_loguearse',
      }),
    })
    const { POST } = await import('@/app/api/user/whatsapp-settings/route')
    await POST(req as never)
    const loggedText = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n')
    expect(loggedText).not.toContain('nuevo_token_secreto_no_debe_loguearse')
    consoleSpy.mockRestore()
  })
})
