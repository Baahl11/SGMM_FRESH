import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendInvoiceEmail } from '@/lib/email/resend';
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

    // Format invoice data for email
    const patientName = `${invoice.patient?.nombre || ''} ${invoice.patient?.apellido || ''}`.trim() || 'Cliente';
    const invoiceDate = format(new Date(invoice.fecha_emision), 'dd/MM/yyyy', { locale: es });
    const total = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(invoice.total);

    // Send email
    const result = await sendInvoiceEmail({
      to: recipientEmail,
      patientName,
      invoiceNumber: `${invoice.serie}-${invoice.folio_number}`,
      invoiceDate,
      total,
      xmlUrl: invoice.xml_url,
      pdfUrl: invoice.pdf_url,
      clinicName,
      clinicEmail,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

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
      data: result.data,
    });

  } catch (error) {
    console.error('[API /api/invoices/send-email] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
