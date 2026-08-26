import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAdapter } from '@/lib/messaging/adapters'
import { MetaWhatsAppAdapter, GRAPH_API_VERSION } from '@/lib/messaging/adapters/meta-whatsapp'

// Fase 1 (consolidacion de mensajeria): adaptador nuevo para WhatsApp via
// Meta Cloud API. Implementa MessagingAdapter (send/validateCredentials/
// getProviderName) para que createAdapter()/MessagingWorker lo reconozcan
// sin cambios, mas metodos propios. De esos metodos propios, la ruta piloto
// (Task 3) solo llama sendText()/sendTemplate(); validateConfiguration() y
// classifyError() no tienen consumidor en produccion todavia (quedan
// reservados para el cableado de Fase 2) y aqui se prueban de forma directa.
// Sin credenciales reales de Meta -- todo con fetch mockeado.

function mockFetchOnce(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'status text',
    json: async () => body,
  } as Response)
}

const credentials = { phone_number_id: 'phone-1', access_token: 'token-1' }

describe('MetaWhatsAppAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getProviderName retorna meta_whatsapp', () => {
    const adapter = new MetaWhatsAppAdapter(credentials)
    expect(adapter.getProviderName()).toBe('meta_whatsapp')
  })

  it('validateCredentials exige phone_number_id y access_token', () => {
    const adapter = new MetaWhatsAppAdapter(credentials)
    expect(adapter.validateCredentials({ phone_number_id: 'x', access_token: 'y' })).toBe(true)
    expect(adapter.validateCredentials({ phone_number_id: 'x' })).toBe(false)
    expect(adapter.validateCredentials({})).toBe(false)
  })

  it('send() (interfaz MessagingAdapter) envia texto exitosamente', async () => {
    const fetchSpy = mockFetchOnce(200, { messages: [{ id: 'wamid.123' }] })
    const adapter = new MetaWhatsAppAdapter(credentials)

    const result = await adapter.send({ to: '5215500000000', message: 'hola' })

    expect(result).toEqual({
      success: true,
      messageId: 'wamid.123',
      provider: 'meta_whatsapp',
      rawResponse: { messages: [{ id: 'wamid.123' }] },
    })
    expect(fetchSpy).toHaveBeenCalledWith(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/phone-1/messages`,
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('sendTemplate() envia una plantilla con el nombre e idioma correctos', async () => {
    const fetchSpy = mockFetchOnce(200, { messages: [{ id: 'wamid.456' }] })
    const adapter = new MetaWhatsAppAdapter(credentials)

    const result = await adapter.sendTemplate({ to: '5215500000000', templateName: 'recordatorio_cita' })

    expect(result.success).toBe(true)
    expect(result.messageId).toBe('wamid.456')
    const [, options] = fetchSpy.mock.calls[0]
    const sentPayload = JSON.parse((options as RequestInit).body as string)
    expect(sentPayload.type).toBe('template')
    expect(sentPayload.template).toEqual({ name: 'recordatorio_cita', language: { code: 'es_MX' } })
  })

  it('send() reporta un error de Graph API como fallo con detalle', async () => {
    mockFetchOnce(401, { error: { message: 'Invalid OAuth access token' } })
    const adapter = new MetaWhatsAppAdapter(credentials)

    const result = await adapter.send({ to: '5215500000000', message: 'hola' })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid OAuth access token')
    expect(result.provider).toBe('meta_whatsapp')
  })

  it('classifyError marca 429/5xx como retryable', async () => {
    mockFetchOnce(429, { error: { message: 'Rate limited' } })
    const adapter = new MetaWhatsAppAdapter(credentials)
    const result = await adapter.send({ to: '5215500000000', message: 'hola' })

    expect(adapter.classifyError(result)).toBe('retryable')
  })

  it('classifyError marca 401/400 como non_retryable', async () => {
    mockFetchOnce(401, { error: { message: 'Invalid OAuth access token' } })
    const adapter = new MetaWhatsAppAdapter(credentials)
    const result = await adapter.send({ to: '5215500000000', message: 'hola' })

    expect(adapter.classifyError(result)).toBe('non_retryable')
  })

  it('un fallo de red (fetch que lanza) no produce httpStatus y se clasifica como retryable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network down'))
    const adapter = new MetaWhatsAppAdapter(credentials)

    const result = await adapter.send({ to: '5215500000000', message: 'hola' })

    expect(result.success).toBe(false)
    expect(result.httpStatus).toBeUndefined()
    expect(result.rawResponse).toBeUndefined()
    expect(result.error).toBe('network down')
    expect(adapter.classifyError(result)).toBe('retryable')
  })

  it('un error de Graph API expone httpStatus y deja rawResponse como el body crudo', async () => {
    mockFetchOnce(400, { status: 'sent', error: { message: 'Invalid parameter', code: 100 } })
    const adapter = new MetaWhatsAppAdapter(credentials)

    const result = await adapter.send({ to: '5215500000000', message: 'hola' })

    expect(result.httpStatus).toBe(400)
    // rawResponse es el body tal cual: un campo `status` propio de Meta ya no
    // queda pisado por el codigo HTTP (ese vive ahora en httpStatus).
    expect(result.rawResponse).toEqual({ status: 'sent', error: { message: 'Invalid parameter', code: 100 } })
  })

  it('validateConfiguration() exitoso retorna nombre verificado y numero', async () => {
    mockFetchOnce(200, { verified_name: 'Harmonizarte', display_phone_number: '+52 55 0000 0000' })
    const adapter = new MetaWhatsAppAdapter(credentials)

    const result = await adapter.validateConfiguration()

    expect(result).toEqual({ valid: true, verifiedName: 'Harmonizarte', phoneNumber: '+52 55 0000 0000' })
  })

  it('validateConfiguration() con error retorna valid:false y el mensaje', async () => {
    mockFetchOnce(400, { error: { message: 'Invalid parameter' } })
    const adapter = new MetaWhatsAppAdapter(credentials)

    const result = await adapter.validateConfiguration()

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid parameter')
  })

  it('createAdapter("meta_whatsapp", ...) construye un MetaWhatsAppAdapter', () => {
    const adapter = createAdapter('meta_whatsapp' as never, credentials)
    expect(adapter).toBeInstanceOf(MetaWhatsAppAdapter)
  })
})
