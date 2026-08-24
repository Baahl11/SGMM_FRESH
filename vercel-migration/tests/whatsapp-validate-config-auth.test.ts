import { beforeEach, describe, expect, it, vi } from 'vitest'

// HANDOFF_MAESTRO_V2 sección 3 (P0 — validate-config sin auth ni rate limit):
// cualquiera podía usar esta ruta como oráculo/proxy no autenticado hacia la
// Graph API de Meta. Fija el contrato: 401 sin sesión, 429 tras exceder el
// límite por usuario, y que el bypass WHATSAPP_DRY_RUN siga funcionando una
// vez autenticado.

const getAuthUserMock = vi.fn()

vi.mock('@/lib/auth-server', () => ({
  getAuthUser: () => getAuthUserMock(),
}))

function postRequest(body: unknown) {
  return new Request('http://localhost/api/whatsapp/validate-config', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/whatsapp/validate-config', () => {
  beforeEach(() => {
    getAuthUserMock.mockReset()
    vi.resetModules()
  })

  it('rechaza con 401 sin usuario autenticado', async () => {
    getAuthUserMock.mockResolvedValue(null)
    const { POST } = await import('@/app/api/whatsapp/validate-config/route')
    const res = await POST(postRequest({ phone_number_id: 'x', access_token: 'y' }) as never)
    expect(res.status).toBe(401)
  })

  it('con sesión y WHATSAPP_DRY_RUN=true responde dry_run sin llamar a Meta', async () => {
    process.env.WHATSAPP_DRY_RUN = 'true'
    getAuthUserMock.mockResolvedValue({ id: `user-${Math.random()}`, email: 'doc@example.com' })
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { POST } = await import('@/app/api/whatsapp/validate-config/route')
    const res = await POST(postRequest({ phone_number_id: 'x', access_token: 'y' }) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.dry_run).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
    delete process.env.WHATSAPP_DRY_RUN
  })

  it('bloquea con 429 tras exceder el límite de intentos del mismo usuario', async () => {
    process.env.WHATSAPP_DRY_RUN = 'true'
    const userId = `user-rate-${Math.random()}`
    getAuthUserMock.mockResolvedValue({ id: userId, email: 'doc@example.com' })
    const { POST } = await import('@/app/api/whatsapp/validate-config/route')
    let lastStatus = 0
    for (let i = 0; i < 6; i++) {
      const res = await POST(postRequest({ phone_number_id: 'x', access_token: 'y' }) as never)
      lastStatus = res.status
    }
    expect(lastStatus).toBe(429)
    delete process.env.WHATSAPP_DRY_RUN
  })
})
