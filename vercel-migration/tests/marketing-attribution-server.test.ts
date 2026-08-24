import { describe, expect, it } from 'vitest'
import { persistMarketingAttribution } from '@/lib/marketing/attribution-server'

function createClient(existing: Record<string, unknown> | null) {
  const writes: Array<{ method: string; payload: Record<string, unknown> }> = []
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: existing, error: null }),
        }),
      }),
      update: (payload: Record<string, unknown>) => {
        writes.push({ method: 'update', payload })
        return { eq: async () => ({ error: null }) }
      },
      insert: async (payload: Record<string, unknown>) => {
        writes.push({ method: 'insert', payload })
        return { error: null }
      },
    }),
  }

  return { client, writes }
}

describe('persistMarketingAttribution', () => {
  it('no reemplaza signup_created_at durante un reintento', async () => {
    const { client, writes } = createClient({
      id: 'attr-1',
      signup_created_at: '2026-06-15T00:00:00.000Z',
      checkout_started_at: null,
      trial_started_at: null,
      subscription_started_at: null,
    })

    await persistMarketingAttribution({
      userId: 'user-1',
      event: 'signup_created',
      client: client as never,
    })

    expect(writes[0].payload).not.toHaveProperty('signup_created_at')
  })

  it('marca checkout sin tocar columnas first_touch existentes', async () => {
    const { client, writes } = createClient({
      id: 'attr-1',
      signup_created_at: '2026-06-15T00:00:00.000Z',
      checkout_started_at: null,
      trial_started_at: null,
      subscription_started_at: null,
    })

    await persistMarketingAttribution({
      userId: 'user-1',
      event: 'checkout_started',
      stripeCheckoutSessionId: 'cs_test_1',
      client: client as never,
    })

    expect(writes[0].payload).toMatchObject({
      stripe_checkout_session_id: 'cs_test_1',
    })
    expect(writes[0].payload.checkout_started_at).toEqual(expect.any(String))
    expect(Object.keys(writes[0].payload).some((key) => key.startsWith('first_touch_'))).toBe(false)
  })
})
