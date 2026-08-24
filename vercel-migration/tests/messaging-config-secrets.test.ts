import { beforeEach, describe, expect, it, vi } from 'vitest'

// HANDOFF_MAESTRO_V2 sección 3 (P0 — messaging/config con select('*')): GET y
// POST devolvían la fila completa de messaging_config, incluidos
// whatsapp_access_token y whatsapp_webhook_verify_token. Fija el contrato:
// la respuesta JSON nunca contiene esas dos claves, sin importar qué
// devuelva la base de datos.

const getAuthUserMock = vi.fn()
const getSessionMock = vi.fn()

const ROW_WITH_SECRETS = {
  id: 'cfg-1',
  user_id: 'tenant-A',
  whatsapp_business_id: 'biz-1',
  whatsapp_phone_number_id: 'phone-1',
  whatsapp_access_token: 'EAAG_super_secreto_no_debe_salir',
  whatsapp_webhook_verify_token: 'verify_secreto_no_debe_salir',
  whatsapp_phone_number: '+5215500000000',
  whatsapp_verified: true,
  whatsapp_enabled: true,
  auto_reminders_enabled: false,
  reminder_24h_enabled: true,
  reminder_1h_enabled: false,
  daily_message_limit: 1000,
  current_daily_usage: 3,
  usage_reset_date: '2026-08-24',
  connection_status: 'connected',
  last_connection_test: '2026-08-20T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-08-20T00:00:00.000Z',
}

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

vi.mock('@/lib/auth-server', () => ({
  getAuthUser: () => getAuthUserMock(),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getSession: () => getSessionMock() },
    from: () => makeChain({ data: ROW_WITH_SECRETS, error: null }),
  }),
}))

describe('GET/POST /api/messaging/config nunca exponen tokens', () => {
  beforeEach(() => {
    getAuthUserMock.mockReset()
    getSessionMock.mockReset()
    getAuthUserMock.mockResolvedValue({ id: 'tenant-A', email: 'doc@example.com' })
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'tenant-A' } } } })
  })

  it('GET nunca incluye whatsapp_access_token ni whatsapp_webhook_verify_token', async () => {
    const { GET } = await import('@/app/api/messaging/config/route')
    const res = await GET()
    const body = await res.json()
    const raw = JSON.stringify(body)
    // Nota: se verifica la clave JSON exacta (con comillas y ':') en vez de
    // substring simple, porque 'has_whatsapp_access_token' (el flag booleano
    // seguro pedido por el contrato) contiene 'whatsapp_access_token' como
    // substring. Lo que nunca debe aparecer es la CLAVE secreta original ni
    // su valor.
    expect(raw).not.toContain('"whatsapp_access_token":')
    expect(raw).not.toContain('"whatsapp_webhook_verify_token":')
    expect(raw).not.toContain('super_secreto')
    expect(body.config.has_whatsapp_access_token).toBe(true)
    expect(body.config.whatsapp_business_id).toBe('biz-1')
  })

  it('POST nunca incluye whatsapp_access_token en la respuesta aunque la BD lo devuelva', async () => {
    const { POST } = await import('@/app/api/messaging/config/route')
    const req = new Request('http://localhost/api/messaging/config', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        whatsapp_business_id: 'biz-1',
        whatsapp_phone_number_id: 'phone-1',
        whatsapp_access_token: 'nuevo_token_del_usuario',
        whatsapp_enabled: true,
      }),
    })
    const res = await POST(req as never)
    const body = await res.json()
    const raw = JSON.stringify(body)
    // Ver nota arriba: se compara la clave JSON exacta, no un substring,
    // porque 'has_whatsapp_access_token' contiene 'whatsapp_access_token'.
    expect(raw).not.toContain('"whatsapp_access_token":')
    expect(raw).not.toContain('super_secreto')
    expect(raw).not.toContain('nuevo_token_del_usuario')
  })
})
