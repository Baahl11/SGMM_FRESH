// tests/messaging-whatsapp-send-route.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Fase 1 (consolidacion de mensajeria): app/api/messaging/whatsapp/send/route.ts
// deja de hacer fetch() directo a Graph API y usa MetaWhatsAppAdapter +
// getWhatsAppCredentials(). Esta suite fija que el comportamiento externo
// (shape de respuesta, codigos de estado, limite diario, WHATSAPP_DRY_RUN)
// no cambio -- es una prueba de regresion, no de la implementacion nueva.

const getAuthUserMock = vi.fn()

// UPDATEs observados durante un test, para poder afirmar tanto que la ruta
// marca la fila como 'failed' cuando Meta rechaza, como que NO la toca cuando
// el fallo fue de red (el adaptador no devuelve httpStatus).
let recordedUpdates: Array<{ table: string; patch: { status?: string } }> = []

function makeChain(table: string, result: { data: unknown; error: unknown }) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    insert: () => chain,
    update: (patch: { status?: string }) => {
      recordedUpdates.push({ table, patch })
      return chain
    },
    maybeSingle: async () => result,
    single: async () => result,
  }
  return chain
}

const MESSAGING_CONFIG_ROW = {
  whatsapp_enabled: true,
  current_daily_usage: 0,
  daily_message_limit: 1000,
  whatsapp_phone_number_id: 'phone-1',
  whatsapp_business_id: 'biz-1',
  whatsapp_access_token: 'token-1',
}

function makeSupabase(overrides: Record<string, { data: unknown; error: unknown }> = {}) {
  const tables: Record<string, { data: unknown; error: unknown }> = {
    messaging_config: { data: MESSAGING_CONFIG_ROW, error: null },
    messaging_providers: { data: null, error: null },
    whatsapp_messages: { data: { id: 'msg-1' }, error: null },
    ...overrides,
  }
  return {
    from: (table: string) => makeChain(table, tables[table] ?? { data: null, error: null }),
    rpc: async () => ({ data: null, error: null }),
  }
}

// Overrides de tablas para el supabase mockeado, leidos por el factory de
// vi.mock() de abajo en cada createClient(). Se usa una variable mutable en
// vez de vi.doMock() por-test: vi.doMock() registra un factory que sobrevive
// a vi.resetModules() y compite de forma no determinista con el vi.mock()
// hoisted de este mismo modulo cuando ambos se registran en la misma
// ejecucion (se observo un fallo intermitente en el import dinamico segun
// cual de los dos "ganara"). Este patron replica el que ya usa
// getAuthUserMock arriba: un closure sincrono, sin timing de por medio.
let supabaseOverrides: Record<string, { data: unknown; error: unknown }> = {}

vi.mock('@/lib/auth-server', () => ({
  getAuthUser: () => getAuthUserMock(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => makeSupabase(supabaseOverrides),
}))

function postRequest(body: unknown) {
  return new Request('http://localhost/api/messaging/whatsapp/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/messaging/whatsapp/send (Fase 1: usa MetaWhatsAppAdapter)', () => {
  beforeEach(() => {
    getAuthUserMock.mockReset()
    getAuthUserMock.mockResolvedValue({ id: 'user-1', email: 'doc@example.com' })
    supabaseOverrides = {}
    recordedUpdates = []
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.WHATSAPP_DRY_RUN
  })

  it('rechaza con 401 sin sesion', async () => {
    getAuthUserMock.mockResolvedValue(null)
    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)
    expect(res.status).toBe(401)
  })

  it('envia exitosamente via el adaptador y conserva el shape de respuesta', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ messages: [{ id: 'wamid.789' }] }),
    } as Response)

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({
      success: true,
      message_id: 'msg-1',
      meta_message_id: 'wamid.789',
      dry_run: false,
      demo_mode: false,
      message: 'Mensaje enviado exitosamente',
    })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('usa sendTemplate cuando el body incluye template_name', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ messages: [{ id: 'wamid.tpl' }] }),
    } as Response)

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(
      postRequest({ to_phone: '5215500000000', message_body: 'hola', template_name: 'recordatorio_cita' }) as never
    )
    const body = await res.json()
    const [, options] = fetchSpy.mock.calls[0]
    const sentPayload = JSON.parse((options as RequestInit).body as string)

    expect(res.status).toBe(200)
    expect(body.meta_message_id).toBe('wamid.tpl')
    expect(sentPayload.type).toBe('template')
    expect(sentPayload.template.name).toBe('recordatorio_cita')
  })

  it('respeta WHATSAPP_DRY_RUN sin llamar a Meta', async () => {
    process.env.WHATSAPP_DRY_RUN = 'true'
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.dry_run).toBe(true)
    expect(body.meta_message_id).toMatch(/^dryrun_/)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('bloquea con 429 al alcanzar el limite diario, sin llamar a Meta', async () => {
    supabaseOverrides = {
      messaging_config: {
        data: { ...MESSAGING_CONFIG_ROW, current_daily_usage: 1000 },
        error: null,
      },
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)

    expect(res.status).toBe(429)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('responde 404 si no hay configuracion de WhatsApp', async () => {
    supabaseOverrides = { messaging_config: { data: null, error: null } }

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)

    expect(res.status).toBe(404)
  })

  it('responde 400 si faltan credenciales aunque whatsapp_enabled sea true', async () => {
    supabaseOverrides = {
      messaging_config: {
        data: { ...MESSAGING_CONFIG_ROW, whatsapp_access_token: null },
        error: null,
      },
    }

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)

    expect(res.status).toBe(400)
  })

  it('responde 400 (no 429) si faltan credenciales Y ya se alcanzo el limite diario -- preserva la precedencia de la ruta original', async () => {
    supabaseOverrides = {
      messaging_config: {
        data: {
          ...MESSAGING_CONFIG_ROW,
          whatsapp_access_token: null,
          current_daily_usage: 1000,
        },
        error: null,
      },
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)

    expect(res.status).toBe(400)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('propaga un error de Graph API como fallo 400 con el mensaje sanitizado', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: { message: 'Invalid OAuth access token' } }),
    } as Response)

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.details).toBe('Invalid OAuth access token')
    // Meta si respondio: la fila si se marca 'failed'.
    expect(
      recordedUpdates.some((u) => u.table === 'whatsapp_messages' && u.patch.status === 'failed')
    ).toBe(true)
  })

  it('un fallo de red (sin respuesta HTTP) responde 500 y no marca la fila como failed', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network down'))

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Error interno del servidor', success: false })
    // Comportamiento previo a Fase 1: el fetch lanzaba y la fila quedaba
    // 'pending'; un 400 seria mentir al llamador ("no reintentes").
    expect(recordedUpdates.filter((u) => u.table === 'whatsapp_messages')).toHaveLength(0)
  })

  it('responde 403 si el paciente revoco el consentimiento, sin llamar a Meta', async () => {
    supabaseOverrides = {
      patient_whatsapp_consent: {
        data: { has_consented: true, opted_out: true },
        error: null,
      },
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(
      postRequest({ to_phone: '5215500000000', message_body: 'hola', patient_id: 'pac-1' }) as never
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe(
      'El paciente no ha dado consentimiento para recibir mensajes de WhatsApp'
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('en demo mode simula el envio (demo_mode: true) sin llamar a Meta', async () => {
    supabaseOverrides = {
      demo_mode_config: {
        data: {
          user_id: 'user-1',
          is_demo_account: true,
          audit_label: 'demo',
          seed_profile: null,
          // shouldSimulate = !(enabled === true && mock === false) => true
          integrations: { whatsapp: { enabled: true, mock: true } },
          demo_expires_at: null,
        },
        error: null,
      },
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({
      success: true,
      message_id: 'msg-1',
      meta_message_id: expect.stringMatching(/^demo_wa_\d+$/),
      demo_mode: true,
      message: 'Mensaje simulado exitosamente (demo mode)',
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
