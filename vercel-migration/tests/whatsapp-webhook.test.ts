import { beforeEach, describe, expect, it, vi } from 'vitest'

// fable C10: antes, sin WHATSAPP_APP_SECRET el webhook procesaba todo (fail-open).
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-dummy'
process.env.ANTHROPIC_API_KEY = 'sk-dummy'

vi.mock('@anthropic-ai/sdk', () => ({ default: class { constructor(_: unknown) {} } }))

function waRequest(body: string, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/webhooks/whatsapp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  })
}

describe('POST /api/webhooks/whatsapp (fable C10)', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.WHATSAPP_APP_SECRET
    delete process.env.WEBHOOKS_ALLOW_UNSIGNED
  })

  it('fail-closed: sin WHATSAPP_APP_SECRET responde 401', async () => {
    const { POST } = await import('@/app/api/webhooks/whatsapp/route')
    const res = await POST(waRequest('{"object":"whatsapp_business_account","entry":[]}') as never)
    expect(res.status).toBe(401)
  })

  it('con secret configurado, firma inválida ⇒ 401', async () => {
    process.env.WHATSAPP_APP_SECRET = 'meta-secret'
    const { POST } = await import('@/app/api/webhooks/whatsapp/route')
    const res = await POST(
      waRequest('{"object":"whatsapp_business_account","entry":[]}', {
        'x-hub-signature-256': 'sha256=' + '0'.repeat(64),
      }) as never
    )
    expect(res.status).toBe(401)
  })
})
