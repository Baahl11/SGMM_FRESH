import 'server-only'
import crypto from 'crypto'

/**
 * Verificación de firmas de webhooks (auditoría fable 2026-06-11, C8/C9/C10).
 *
 * Política fail-closed: en producción, si falta el secreto del proveedor el
 * webhook se rechaza con 401 en lugar de procesarse sin verificar.
 * En desarrollo se permite continuar sólo si WEBHOOKS_ALLOW_UNSIGNED=true.
 */

export function allowUnsignedInDev(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.WEBHOOKS_ALLOW_UNSIGNED === 'true'
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

/**
 * Meta / WhatsApp Cloud API: header `x-hub-signature-256` = `sha256=` + HMAC-SHA256(appSecret, rawBody).
 */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header || !header.startsWith('sha256=')) return false
  const expected =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')
  return safeEqual(expected, header)
}

/**
 * Twilio: header `X-Twilio-Signature` = Base64(HMAC-SHA1(authToken, url + paramsOrdenadosConcatenados)).
 * Referencia: documentación oficial de seguridad de Twilio ("Validating Signatures").
 */
export function verifyTwilioSignature(
  authToken: string,
  signatureHeader: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  if (!signatureHeader) return false
  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join('')
  const expected = crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf8')).digest('base64')
  return safeEqual(expected, signatureHeader)
}

export interface MercadoPagoSignatureInput {
  /** Header `x-signature`, formato: `ts=...,v1=...` */
  xSignature: string | null
  /** Header `x-request-id` */
  xRequestId: string | null
  /** `data.id` recibido en query (`?data.id=...`) o en el body del evento */
  dataId: string | null
  secret: string
  /** Tolerancia de reloj en segundos para mitigar replay (default 300). */
  toleranceSeconds?: number
  nowMs?: number
}

/**
 * Mercado Pago: manifest oficial `id:{data.id};request-id:{x-request-id};ts:{ts};`
 * firmado con HMAC-SHA256(secret) y comparado contra `v1`.
 * Referencia: documentación oficial de Mercado Pago, sección Webhooks → validación de origen.
 * Nota: `data.id` alfanumérico debe ir en minúsculas según la documentación.
 */
export function verifyMercadoPagoSignature(input: MercadoPagoSignatureInput): {
  valid: boolean
  reason?: string
} {
  const { xSignature, xRequestId, dataId, secret } = input
  if (!xSignature) return { valid: false, reason: 'missing x-signature' }
  if (!xRequestId) return { valid: false, reason: 'missing x-request-id' }
  if (!dataId) return { valid: false, reason: 'missing data.id' }

  const parts: Record<string, string> = {}
  for (const segment of xSignature.split(',')) {
    const [k, ...rest] = segment.split('=')
    if (!k || rest.length === 0) continue
    parts[k.trim()] = rest.join('=').trim()
  }
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return { valid: false, reason: 'malformed x-signature' }

  const tolerance = (input.toleranceSeconds ?? 300) * 1000
  const now = input.nowMs ?? Date.now()
  const tsMs = Number(ts) * (ts.length <= 10 ? 1000 : 1)
  if (!Number.isFinite(tsMs) || Math.abs(now - tsMs) > tolerance) {
    return { valid: false, reason: 'timestamp outside tolerance (possible replay)' }
  }

  const normalizedId = /[a-zA-Z]/.test(dataId) ? dataId.toLowerCase() : dataId
  const manifest = `id:${normalizedId};request-id:${xRequestId};ts:${ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  return safeEqual(expected, v1) ? { valid: true } : { valid: false, reason: 'signature mismatch' }
}
