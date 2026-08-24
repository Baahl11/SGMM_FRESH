import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  verifyMetaSignature,
  verifyMercadoPagoSignature,
  verifyTwilioSignature,
} from '@/lib/security/webhook-signatures'

describe('firmas de webhooks (fable C8/C9/C10)', () => {
  it('Meta: acepta firma sha256 válida y rechaza inválida', () => {
    const secret = 'meta-secret'
    const body = '{"object":"whatsapp_business_account"}'
    const sig = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex')
    expect(verifyMetaSignature(body, sig, secret)).toBe(true)
    expect(verifyMetaSignature(body, 'sha256=' + '0'.repeat(64), secret)).toBe(false)
    expect(verifyMetaSignature(body, null, secret)).toBe(false)
  })

  it('Twilio: vector autoconsistente válido y alterado', () => {
    const token = 'twilio-token'
    const url = 'https://app.example.com/api/messaging/webhooks/twilio'
    const params = { MessageSid: 'SM123', MessageStatus: 'delivered' }
    const data = url + Object.keys(params).sort().map((k) => k + params[k as keyof typeof params]).join('')
    const sig = createHmac('sha1', token).update(data).digest('base64')
    expect(verifyTwilioSignature(token, sig, url, params)).toBe(true)
    expect(verifyTwilioSignature(token, sig, url, { ...params, MessageStatus: 'failed' })).toBe(false)
  })

  it('Mercado Pago: manifest válido, firma alterada y timestamp viejo', () => {
    const secret = 'mp-secret'
    const dataId = 'abc123'
    const requestId = 'req-1'
    const ts = Math.floor(Date.now() / 1000).toString()
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
    const v1 = createHmac('sha256', secret).update(manifest).digest('hex')
    const header = `ts=${ts},v1=${v1}`
    expect(verifyMercadoPagoSignature({ xSignature: header, xRequestId: requestId, dataId, secret }).valid).toBe(true)
    expect(
      verifyMercadoPagoSignature({ xSignature: `ts=${ts},v1=${'0'.repeat(64)}`, xRequestId: requestId, dataId, secret }).valid
    ).toBe(false)
    const oldTs = (Math.floor(Date.now() / 1000) - 3600).toString()
    const oldManifest = `id:${dataId};request-id:${requestId};ts:${oldTs};`
    const oldV1 = createHmac('sha256', secret).update(oldManifest).digest('hex')
    const stale = verifyMercadoPagoSignature({ xSignature: `ts=${oldTs},v1=${oldV1}`, xRequestId: requestId, dataId, secret })
    expect(stale.valid).toBe(false)
    expect(stale.reason).toMatch(/replay|tolerance/)
  })
})
