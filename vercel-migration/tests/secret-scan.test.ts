import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanContent } from '../scripts/secret-scan.mjs'

describe('secret-scan (Recepción IA Fase 0)', () => {
  it('detecta un Twilio Account SID con forma real', () => {
    const hits = scanContent(`TWILIO_ACCOUNT_SID=AC${'a'.repeat(32)}`)
    expect(hits.some((h) => h.name === 'Twilio Account SID')).toBe(true)
  })

  it('detecta un Twilio Messaging Service SID con forma real', () => {
    const hits = scanContent(`TWILIO_MESSAGING_SERVICE_SID=MG${'b'.repeat(32)}`)
    expect(hits.some((h) => h.name.includes('Twilio Messaging Service'))).toBe(true)
  })

  it('detecta una Stripe live secret key', () => {
    const hits = scanContent(`STRIPE_SECRET_KEY=sk_live_${'1'.repeat(24)}`)
    expect(hits.some((h) => h.name.includes('Stripe'))).toBe(true)
  })

  it('no marca los dummies conocidos que usa el job de build en CI', () => {
    const hits = scanContent('STRIPE_SECRET_KEY=sk_test_dummy\nWHATSAPP_APP_SECRET=dummy')
    expect(hits).toHaveLength(0)
  })

  it('no marca texto sin forma de secreto', () => {
    const hits = scanContent('const clinicName = "Harmonizarte"')
    expect(hits).toHaveLength(0)
  })

  it('el .env.whatsapp.example del repo ya no contiene secretos con forma real', () => {
    const content = readFileSync(path.resolve(__dirname, '..', '.env.whatsapp.example'), 'utf8')
    // Nota de seguridad: comparamos .length (un número) en vez de usar
    // toHaveLength() sobre el array de hallazgos. Si este archivo alguna vez
    // contuviera un secreto real y el test fallara, toHaveLength(0) haría que
    // Vitest imprima el array completo -incluyendo el string del secreto- en
    // el mensaje de fallo. Comparar un número nunca expone ese contenido.
    expect(scanContent(content).length).toBe(0)
  })
})
