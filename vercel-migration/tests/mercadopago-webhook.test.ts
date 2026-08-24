import { beforeEach, describe, expect, it, vi } from 'vitest'

// fable C9: el webhook de MP no verificaba x-signature ni deduplicaba eventos.
const paymentGetMock = vi.fn()
const insertMock = vi.fn()

vi.mock('@/lib/mercadopago/server', () => ({
  paymentClient: { get: paymentGetMock },
  PLAN_LIMITS: { basico: {}, pro: {}, enterprise: {} },
}))
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => ({
      insert: (...args: unknown[]) => insertMock(table, ...args),
      update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }),
    }),
  }),
  supabaseAdmin: {},
}))

function mpRequest(headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/mercadopago/webhook?data.id=123', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ type: 'payment', action: 'payment.updated', data: { id: '123' } }),
  })
}

describe('POST /api/mercadopago/webhook (fable C9)', () => {
  beforeEach(() => {
    vi.resetModules()
    paymentGetMock.mockReset()
    insertMock.mockReset()
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET
    delete process.env.WEBHOOKS_ALLOW_UNSIGNED
  })

  it('fail-closed: sin MERCADOPAGO_WEBHOOK_SECRET responde 401 y no consulta MP', async () => {
    const { POST } = await import('@/app/api/mercadopago/webhook/route')
    const res = await POST(mpRequest() as never)
    expect(res.status).toBe(401)
    expect(paymentGetMock).not.toHaveBeenCalled()
  })

  it('idempotencia: 23505 en webhook_events ⇒ duplicate sin reprocesar el pago', async () => {
    // Sin secret + WEBHOOKS_ALLOW_UNSIGNED en entorno no-producción ⇒ la ruta
    // permite el evento sin firma (modo dev documentado) y ejercita la idempotencia.
    process.env.WEBHOOKS_ALLOW_UNSIGNED = 'true'
    insertMock.mockResolvedValue({ error: { code: '23505' } })
    const { POST } = await import('@/app/api/mercadopago/webhook/route')
    const res = await POST(mpRequest() as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.duplicate).toBe(true)
    expect(paymentGetMock).not.toHaveBeenCalled()
    expect(insertMock).toHaveBeenCalledWith('webhook_events', expect.objectContaining({
      provider: 'mercadopago',
    }))
  })
})
