import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendWithUserEmailConfig } from '@/lib/email/user-config';
import { signStoredObject } from '@/lib/storage/signed';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invoice_id } = body;

    if (!invoice_id) {
      return NextResponse.json(
        { error: 'invoice_id is required' },
        { status: 400 }
      );
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        patient:patients!patient_id (
          id,
          nombre,
          apellido,
          email
        ),
        fiscal_data:patient_fiscal_data!fiscal_data_id (
          rfc,
          razon_social,
          email_facturacion
        )
      `)
      .eq('id', invoice_id)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Verify invoice has XML and PDF
    if (!invoice.xml_url || !invoice.pdf_url) {
      return NextResponse.json(
        { error: 'Invoice does not have XML/PDF files' },
        { status: 400 }
      );
    }

    // Determine recipient email
    const patientEmail = invoice.patient?.email;
    const fiscalEmail = invoice.fiscal_data?.email_facturacion;
    const recipientEmail = fiscalEmail || patientEmail;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Patient does not have an email address' },
        { status: 400 }
      );
    }

    // Get clinic/user config for clinic name
    const { data: config } = await supabase
      .from('facturama_config')
      .select('emisor_razon_social, emisor_email')
      .eq('user_id', user.id)
      .single();

    const clinicName = config?.emisor_razon_social || 'Su Clínica';
    const clinicEmail = config?.emisor_email || undefined;

    const { data: emailConfig } = await supabase
      .from('email_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!emailConfig?.email_enabled) {
      return NextResponse.json(
        { error: 'Configura y activa un proveedor de email antes de enviar facturas' },
        { status: 400 }
      );
    }

    // Format invoice data for email
    const patientName = `${invoice.patient?.nombre || ''} ${invoice.patient?.apellido || ''}`.trim() || 'Cliente';
    const invoiceDate = format(new Date(invoice.fecha_emision), 'dd/MM/yyyy', { locale: es });
    const total = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(invoice.total);

    const [xmlUrl, pdfUrl] = await Promise.all([
      signStoredObject(supabaseAdmin, 'invoices', invoice.xml_url),
      signStoredObject(supabaseAdmin, 'invoices', invoice.pdf_url),
    ]);
    if (!xmlUrl || !pdfUrl) {
      return NextResponse.json(
        { error: 'No se pudieron preparar los archivos de la factura' },
        { status: 500 }
      );
    }

    const [xmlResponse, pdfResponse] = await Promise.all([
      fetch(xmlUrl),
      fetch(pdfUrl),
    ]);
    if (!xmlResponse.ok || !pdfResponse.ok) {
      return NextResponse.json(
        { error: 'No se pudieron descargar los archivos de la factura' },
        { status: 500 }
      );
    }

    const [xmlBuffer, pdfBuffer] = await Promise.all([
      xmlResponse.arrayBuffer(),
      pdfResponse.arrayBuffer(),
    ]);

    const result = await sendWithUserEmailConfig(emailConfig, {
      to: recipientEmail,
      subject: `Factura electrónica ${invoice.serie}-${invoice.folio_number} - ${clinicName}`,
      html: `<p>Hola ${patientName},</p><p>Adjuntamos tu factura electrónica ${invoice.serie}-${invoice.folio_number}, emitida el ${invoiceDate}, por un total de <strong>${total}</strong>.</p><p>Atentamente,<br>${clinicName}</p>`,
      text: `Hola ${patientName}. Adjuntamos tu factura electrónica ${invoice.serie}-${invoice.folio_number}, emitida el ${invoiceDate}, por un total de ${total}.`,
      attachments: [
        {
          filename: `Factura_${invoice.serie}-${invoice.folio_number}.xml`,
          content: Buffer.from(xmlBuffer),
          contentType: 'application/xml',
        },
        {
          filename: `Factura_${invoice.serie}-${invoice.folio_number}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf',
        },
      ],
    });

    // Update invoice to mark as emailed
    await supabase
      .from('invoices')
      .update({
        emailed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice_id);

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
      recipient: recipientEmail,
      provider: result.provider,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('[API /api/invoices/send-email] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
