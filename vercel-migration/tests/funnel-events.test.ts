import { describe, expect, it } from 'vitest'
import { normalizeFunnelEventPayload } from '@/lib/analytics/funnel'

describe('funnel event normalization', () => {
  it('acepta eventos permitidos y limita metadata', () => {
    const event = normalizeFunnelEventPayload({
      eventName: 'calculator_cta',
      path: '/calculadora-inasistencias?x=1',
      metadata: {
        monthly_loss: 1234.56,
        label: 'x'.repeat(300),
        ok: true,
        ignored: { nested: true },
      },
    })

    expect(event).toMatchObject({
      eventName: 'calculator_cta',
      path: '/calculadora-inasistencias?x=1',
      metadata: {
        monthly_loss: 1235,
        label: 'x'.repeat(255),
        ok: true,
      },
    })
    expect(event?.metadata).not.toHaveProperty('ignored')
  })

  it('rechaza eventos no permitidos', () => {
    expect(normalizeFunnelEventPayload({ eventName: 'delete_everything' })).toBeNull()
  })
})
