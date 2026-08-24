import { beforeEach, describe, expect, it, vi } from 'vitest'

// fable C2: PUT /api/appointments/[id] no exigía auth ni filtraba por tenant.
// Estos tests fijan el contrato: 401 sin sesión; con sesión, TODO update va
// con doble filtro id + user_id sobre el cliente admin.

const getUserMock = vi.fn()
const chainCalls: Array<{ method: string; args: unknown[] }> = []

function makeChain(result: { data?: unknown; error?: unknown } = { data: { id: 'apt-1' }, error: null }) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_t, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(result)
      }
      return (...args: unknown[]) => {
        chainCalls.push({ method: prop, args })
        return new Proxy({}, handler)
      }
    },
  }
  return new Proxy({}, handler)
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: getUserMock } }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { from: (...args: unknown[]) => { chainCalls.push({ method: 'from', args }); return makeChain() } },
  getSupabaseAdmin: () => ({ from: (...args: unknown[]) => { chainCalls.push({ method: 'from', args }); return makeChain() } }),
}))

const VALID_UUID = '11111111-1111-4111-8111-111111111111'

function putRequest(body: unknown) {
  return new Request(`http://localhost/api/appointments/${VALID_UUID}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PUT /api/appointments/[id] (fable C2)', () => {
  beforeEach(() => {
    chainCalls.length = 0
    getUserMock.mockReset()
  })

  it('rechaza con 401 sin usuario autenticado', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null })
    const { PUT } = await import('@/app/api/appointments/[id]/route')
    const res = await PUT(putRequest({ estado: 'confirmada' }) as never, {
      params: Promise.resolve({ id: VALID_UUID }),
    } as never)
    expect(res.status).toBe(401)
    expect(chainCalls.find((c) => c.method === 'from')).toBeUndefined()
  })

  it('con sesión, el update filtra por id Y user_id del tenant', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'tenant-A' } }, error: null })
    const { PUT } = await import('@/app/api/appointments/[id]/route')
    const res = await PUT(putRequest({ estado: 'confirmada' }) as never, {
      params: Promise.resolve({ id: VALID_UUID }),
    } as never)
    expect(res.status).toBeLessThan(500)
    const eqCalls = chainCalls.filter((c) => c.method === 'eq').map((c) => c.args)
    expect(eqCalls).toEqual(
      expect.arrayContaining([
        ['id', VALID_UUID],
        ['user_id', 'tenant-A'],
      ])
    )
  })
})
