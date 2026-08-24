import { beforeEach, describe, expect, it, vi } from 'vitest'

// fable C11: el endpoint aceptaba customerId arbitrario del cliente y filtraba
// el estado de pago de cualquier customer de Stripe. Contrato nuevo: 401 sin
// auth; el customer SIEMPRE se deriva de la suscripción del usuario.

const getUserMock = vi.fn()
const maybeSingleMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({
        eq: () => ({
          not: () => ({ order: () => ({ limit: () => ({ maybeSingle: maybeSingleMock }) }) }),
          order: () => ({ limit: () => ({ maybeSingle: maybeSingleMock }) }),
          maybeSingle: maybeSingleMock,
        }),
      }),
    }),
  }),
}))

function post(body: unknown) {
  return new Request('http://localhost/api/check-payment-method', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/check-payment-method (fable C11)', () => {
  beforeEach(() => {
    getUserMock.mockReset()
    maybeSingleMock.mockReset()
  })

  it('401 sin autenticación, aunque envíen customerId', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null })
    const { POST } = await import('@/app/api/check-payment-method/route')
    const res = await POST(post({ customerId: 'cus_victima' }) as never)
    expect(res.status).toBe(401)
  })

  it('usuario sin suscripción ⇒ hasPaymentMethod=false, sin tocar Stripe', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'tenant-A' } }, error: null })
    maybeSingleMock.mockResolvedValue({ data: null, error: null })
    const { POST } = await import('@/app/api/check-payment-method/route')
    const res = await POST(post({ customerId: 'cus_atacante_pone_otro' }) as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.hasPaymentMethod).toBe(false)
  })
})
