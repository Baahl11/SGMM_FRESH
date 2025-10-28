import { Resend } from 'resend';

// Initialize Resend client with fallback for build time
const resendApiKey = process.env.RESEND_API_KEY || 'dummy-key-for-build';
const resend = new Resend(resendApiKey);

// Configuration
const FROM_EMAIL = 'AgendaMedPro <facturas@agendamedpro.com>';
const FROM_NAME = 'AgendaMedPro';

export interface SendInvoiceEmailParams {
  to: string;
  patientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  total: string;
  xmlUrl: string;
  pdfUrl: string;
  clinicName?: string;
  clinicEmail?: string;
}

/**
 * Send invoice email with XML and PDF attachments
 */
export async function sendInvoiceEmail(params: SendInvoiceEmailParams) {
  const {
    to,
    patientName,
    invoiceNumber,
    invoiceDate,
    total,
    xmlUrl,
    pdfUrl,
    clinicName = 'Su Clínica',
    clinicEmail,
  } = params;

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key-for-build') {
    console.error('[ResendEmail] RESEND_API_KEY not configured');
    return {
      success: false,
      error: 'Email service not configured. Please set RESEND_API_KEY environment variable.',
    };
  }

  try {
    // Download files to attach
    const [xmlResponse, pdfResponse] = await Promise.all([
      fetch(xmlUrl),
      fetch(pdfUrl),
    ]);

    if (!xmlResponse.ok || !pdfResponse.ok) {
      throw new Error('Failed to download invoice files');
    }

    const [xmlBuffer, pdfBuffer] = await Promise.all([
      xmlResponse.arrayBuffer(),
      pdfResponse.arrayBuffer(),
    ]);

    const emailHtml = generateInvoiceEmailHTML({
      patientName,
      invoiceNumber,
      invoiceDate,
      total,
      clinicName,
    });

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: clinicEmail || undefined,
      subject: `Factura Electrónica ${invoiceNumber} - ${clinicName}`,
      html: emailHtml,
      attachments: [
        {
          filename: `Factura_${invoiceNumber}.xml`,
          content: Buffer.from(xmlBuffer),
        },
        {
          filename: `Factura_${invoiceNumber}.pdf`,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[ResendEmail] Error sending invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error sending email',
    };
  }
}

/**
 * Generate HTML template for invoice email
 */
function generateInvoiceEmailHTML(params: {
  patientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  total: string;
  clinicName: string;
}) {
  const { patientName, invoiceNumber, invoiceDate, total, clinicName } = params;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura Electrónica</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Factura Electrónica
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                ${clinicName}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Estimado(a) <strong>${patientName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #666666; font-size: 15px; line-height: 1.6;">
                Le enviamos su factura electrónica (CFDI 4.0) con validez fiscal ante el SAT.
              </p>

              <!-- Invoice Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin: 30px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                          <strong>Número de Factura:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">
                          ${invoiceNumber}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                          <strong>Fecha de Emisión:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">
                          ${invoiceDate}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; border-top: 1px solid #dee2e6; padding-top: 16px;">
                          <strong>Total:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #667eea; font-size: 20px; font-weight: 600; text-align: right; border-top: 1px solid #dee2e6; padding-top: 16px;">
                          ${total}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Attachments Info -->
              <div style="background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 16px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1565C0; font-size: 14px; font-weight: 500;">
                  📎 Archivos adjuntos:
                </p>
                <ul style="margin: 8px 0 0; padding-left: 20px; color: #1976D2; font-size: 14px;">
                  <li>Factura_${invoiceNumber}.xml (Archivo XML para el SAT)</li>
                  <li>Factura_${invoiceNumber}.pdf (Representación impresa)</li>
                </ul>
              </div>

              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Si tiene alguna duda o requiere asistencia, no dude en contactarnos.
              </p>

              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Atentamente,<br>
                <strong>${clinicName}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                Este correo fue generado automáticamente por AgendaMedPro.<br>
                Por favor no responda a este mensaje.
              </p>
              <p style="margin: 8px 0 0; color: #999999; font-size: 12px;">
                <a href="https://agendamedpro.com" style="color: #667eea; text-decoration: none;">agendamedpro.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send test email (for debugging)
 */
export async function sendTestEmail(to: string) {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key-for-build') {
    console.error('[ResendEmail] RESEND_API_KEY not configured');
    return {
      success: false,
      error: 'Email service not configured. Please set RESEND_API_KEY environment variable.',
    };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Prueba de Configuración - AgendaMedPro',
      html: '<h1>✅ Configuración de Email Correcta</h1><p>El sistema de envío de emails está funcionando correctamente.</p>',
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[ResendEmail] Error sending test email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error sending email',
    };
  }
}
