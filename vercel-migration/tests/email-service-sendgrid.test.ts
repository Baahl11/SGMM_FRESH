import { afterEach, describe, expect, it, vi } from 'vitest'

import emailService from '@/lib/email-service'

describe('EmailService.sendViaSendGrid', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends with tenant credentials and encodes attachments', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 202,
        headers: { 'x-message-id': 'sg-message-id' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await emailService.sendViaSendGrid(
      {
        api_key: 'SG.tenant-key',
        from_email: 'doctor@example.com',
        from_name: 'Clinica QA',
      },
      {
        to: 'patient@example.com',
        subject: 'Factura QA',
        html: '<p>Factura</p>',
        text: 'Factura',
        attachments: [
          {
            filename: 'factura.xml',
            content: Buffer.from('<xml/>'),
            contentType: 'application/xml',
          },
        ],
      }
    )

    expect(result).toMatchObject({
      success: true,
      provider: 'sendgrid',
      messageId: 'sg-message-id',
    })
    expect(fetchMock).toHaveBeenCalledOnce()

    const [, request] = fetchMock.mock.calls[0]
    expect(request.headers.Authorization).toBe('Bearer SG.tenant-key')
    const body = JSON.parse(request.body)
    expect(body.from.email).toBe('doctor@example.com')
    expect(body.attachments[0].content).toBe(Buffer.from('<xml/>').toString('base64'))
  })

  it('surfaces provider errors without reporting a false success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{"errors":[{"message":"invalid key"}]}', { status: 401 })
      )
    )

    await expect(
      emailService.sendViaSendGrid(
        {
          api_key: 'SG.invalid',
          from_email: 'doctor@example.com',
          from_name: 'Clinica QA',
        },
        {
          to: 'patient@example.com',
          subject: 'Prueba',
          html: '<p>Prueba</p>',
        }
      )
    ).rejects.toThrow('SendGrid rechazó el envío (401)')
  })
})
