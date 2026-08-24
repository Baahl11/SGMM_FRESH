import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUserMock = vi.fn()
const persistMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: getUserMock } }),
}))
vi.mock('@/lib/marketing/attribution-server', () => ({
  persistMarketingAttribution: persistMock,
}))

function request(body: unknown) {
  return new Request('http://localhost/api/marketing/attribution', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/marketing/attribution', () => {
  beforeEach(() => {
    getUserMock.mockReset()
    persistMock.mockReset()
  })

  it('rechaza sin sesión y no escribe', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('@/app/api/marketing/attribution/route')
    const response = await POST(request({ event: 'signup_created' }) as never)

    expect(response.status).toBe(401)
    expect(persistMock).not.toHaveBeenCalled()
  })

  it('no permite que el cliente marque trial_started', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const { POST } = await import('@/app/api/marketing/attribution/route')
    const response = await POST(request({ event: 'trial_started', context: {} }) as never)

    expect(response.status).toBe(400)
    expect(persistMock).not.toHaveBeenCalled()
  })
})
