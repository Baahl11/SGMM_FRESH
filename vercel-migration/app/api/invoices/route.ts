// API Route: Generate Invoice
// POST /api/invoices

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import FacturamaClient, { buildInvoiceItems } from '@/lib/facturama/client';
import { sendInvoiceEmail } from '@/lib/email/resend';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FacturamaCreateInvoiceRequest, InvoiceGenerationResult } from '@/lib/types/facturama';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: FacturamaCreateInvoiceRequest = await request.json();
    const { patient_id, fiscal_data_id, record_ids, forma_pago, metodo_pago = 'PUE', notas, send_email = true } = body;

    // Validate required fields
    if (!patient_id || !fiscal_data_id || !record_ids || record_ids.length === 0 || !forma_pago) {
      return NextResponse.json(
        { error: 'Missing required fields: patient_id, fiscal_data_id, record_ids, forma_pago' },
        { status: 400 }
      );
    }

    // 1. Get Facturama configuration for this user
    const { data: config, error: configError } = await supabaseAdmin
      .from('facturama_config')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { error: 'Facturama no configurado. Por favor configure sus credenciales primero.' },
        { status: 400 }
      );
    }

    if (!config.is_configured) {
      return NextResponse.json(
        { error: 'Configuración de Facturama incompleta. Verifique todos los campos requeridos.' },
        { status: 400 }
      );
    }

    // 2. Get patient fiscal data
    const { data: fiscalData, error: fiscalError } = await supabase
      .from('patient_fiscal_data')
      .select('*')
      .eq('id', fiscal_data_id)
      .single();

    if (fiscalError || !fiscalData) {
      return NextResponse.json({ error: 'Datos fiscales del paciente no encontrados' }, { status: 404 });
    }

    // 3. Get treatment records
    const { data: records, error: recordsError } = await supabase
      .from('records')
      .select('id, treatment_name, price, cantidad')
      .in('id', record_ids);

    if (recordsError || !records || records.length === 0) {
      return NextResponse.json({ error: 'Tratamientos no encontrados' }, { status: 404 });
    }

    // 4. Build invoice items
    const items = buildInvoiceItems(records, true); // Include IVA

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.Subtotal, 0);
    const iva = items.reduce((sum, item) => {
      const tax = item.Taxes?.find(t => t.Name === '002');
      return sum + (tax?.Total || 0);
    }, 0);
    const total = subtotal + iva;

    // 5. Create Facturama client
    const facturamaClient = new FacturamaClient({
      api_user: config.api_user,
      api_password_encrypted: config.api_password_encrypted,
      api_password_iv: config.api_password_iv,
      api_password_tag: config.api_password_tag,
      is_sandbox: config.is_sandbox,
    });

    // 6. Build Facturama payload
    const facturamaPayload = {
      Serie: config.serie_default,
      Currency: 'MXN',
      ExpeditionPlace: config.emisor_codigo_postal,
      CfdiType: 'I', // Ingreso
      PaymentForm: forma_pago,
      PaymentMethod: metodo_pago,
      Receiver: {
        Rfc: fiscalData.rfc,
        Name: fiscalData.razon_social,
        CfdiUse: fiscalData.uso_cfdi,
        FiscalRegime: fiscalData.regimen_fiscal,
        TaxZipCode: fiscalData.codigo_postal,
        Email: fiscalData.email_facturacion,
      },
      Items: items,
      ObservationsNotes: notas,
    };

    console.log('Facturama payload:', JSON.stringify(facturamaPayload, null, 2));

    // 7. Generate invoice through Facturama
    let facturamaResponse;
    try {
      facturamaResponse = await facturamaClient.createInvoice(facturamaPayload);
    } catch (facturamaError) {
      console.error('Facturama API error:', facturamaError);
      return NextResponse.json(
        { error: `Error al generar factura en Facturama: ${facturamaError}` },
        { status: 500 }
      );
    }

    // 8. Download XML and PDF
    let xmlUrl: string | undefined;
    let pdfUrl: string | undefined;

    try {
      const xml = await facturamaClient.downloadXML(facturamaResponse.Id);
      const pdf = await facturamaClient.downloadPDF(facturamaResponse.Id);

      // Upload XML to Supabase Storage
      const xmlFileName = `${facturamaResponse.Complement.TaxStamp.Uuid}.xml`;
      const { data: xmlUpload, error: xmlError } = await supabaseAdmin.storage
        .from('invoices')
        .upload(`${user.id}/${xmlFileName}`, xml, {
          contentType: 'application/xml',
          upsert: true,
        });

      if (!xmlError && xmlUpload) {
        const { data: xmlPublicUrl } = supabaseAdmin.storage
          .from('invoices')
          .getPublicUrl(`${user.id}/${xmlFileName}`);
        xmlUrl = xmlPublicUrl.publicUrl;
      }

      // Upload PDF to Supabase Storage
      const pdfFileName = `${facturamaResponse.Complement.TaxStamp.Uuid}.pdf`;
      const { data: pdfUpload, error: pdfError } = await supabaseAdmin.storage
        .from('invoices')
        .upload(`${user.id}/${pdfFileName}`, pdf, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (!pdfError && pdfUpload) {
        const { data: pdfPublicUrl } = supabaseAdmin.storage
          .from('invoices')
          .getPublicUrl(`${user.id}/${pdfFileName}`);
        pdfUrl = pdfPublicUrl.publicUrl;
      }
    } catch (downloadError) {
      console.error('Error downloading/uploading files:', downloadError);
      // Continue anyway - we have the invoice data
    }

    // 9. Save invoice to database
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        patient_id,
        fiscal_data_id,
        facturama_id: facturamaResponse.Id,
        folio_number: facturamaResponse.Folio,
        serie: facturamaResponse.Serie,
        uuid: facturamaResponse.Complement.TaxStamp.Uuid,
        fecha_emision: new Date(facturamaResponse.Date).toISOString(),
        fecha_timbrado: new Date(facturamaResponse.Complement.TaxStamp.Date).toISOString(),
        subtotal,
        iva,
        total,
        moneda: 'MXN',
        tipo_comprobante: 'I',
        forma_pago,
        metodo_pago,
        xml_url: xmlUrl,
        pdf_url: pdfUrl,
        status: 'issued',
        notas,
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error saving invoice to database:', invoiceError);
      return NextResponse.json(
        { error: 'Factura generada pero error al guardar en base de datos' },
        { status: 500 }
      );
    }

    // 10. Link invoice to records
    const invoiceRecords = record_ids.map(record_id => {
      const record = records.find(r => r.id === record_id);
      return {
        invoice_id: invoice.id,
        record_id,
        monto: record?.price || 0,
      };
    });

    const { error: linkError } = await supabase
      .from('invoice_records')
      .insert(invoiceRecords);

    if (linkError) {
      console.error('Error linking invoice to records:', linkError);
    }

    // 11. Update records to mark as billed
    const { error: updateError } = await supabase
      .from('records')
      .update({ pendiente_facturar: false })
      .in('id', record_ids);

    if (updateError) {
      console.error('Error updating records:', updateError);
    }

    // 12. Send email if auto_send_email is enabled in config
    if (config.auto_send_email && send_email) {
      try {
        // Get patient info for email
        const { data: patient } = await supabase
          .from('patients')
          .select('nombre, apellido, email')
          .eq('id', patient_id)
          .single();

        const recipientEmail = fiscalData.email_facturacion || patient?.email;

        if (recipientEmail && xmlUrl && pdfUrl) {
          const patientName = `${patient?.nombre || ''} ${patient?.apellido || ''}`.trim() || 'Cliente';
          const invoiceDate = format(new Date(), 'dd/MM/yyyy', { locale: es });
          const totalFormatted = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
          }).format(total);

          const emailResult = await sendInvoiceEmail({
            to: recipientEmail,
            patientName,
            invoiceNumber: `${invoice.serie}-${invoice.folio_number}`,
            invoiceDate,
            total: totalFormatted,
            xmlUrl,
            pdfUrl,
            clinicName: config.emisor_razon_social,
            clinicEmail: config.emisor_email,
          });

          if (emailResult.success) {
            // Update invoice with emailed_at timestamp
            await supabaseAdmin
              .from('invoices')
              .update({ emailed_at: new Date().toISOString() })
              .eq('id', invoice.id);
          } else {
            console.error('[Invoice Generation] Error sending email:', emailResult.error);
          }
        }
      } catch (emailError) {
        console.error('[Invoice Generation] Error sending email:', emailError);
        // Don't fail the request if email fails
      }
    }

    const result: InvoiceGenerationResult = {
      success: true,
      invoice_id: invoice.id,
      xml_url: xmlUrl,
      pdf_url: pdfUrl,
      uuid: facturamaResponse.Complement.TaxStamp.Uuid,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/invoices - List invoices
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patient_id = searchParams.get('patient_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('invoices')
      .select(`
        *,
        patient:patients(id, nombre, apellido, email),
        fiscal_data:patient_fiscal_data(rfc, razon_social),
        invoice_records(id, record_id, monto)
      `)
      .order('fecha_emision', { ascending: false });

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invoices, error } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: 'Error fetching invoices' }, { status: 500 });
    }

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error in GET /api/invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
