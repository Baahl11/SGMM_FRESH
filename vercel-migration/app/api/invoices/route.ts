// API Route: Generate Invoice
// POST /api/invoices

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import FacturamaClient, { buildInvoiceItems } from '@/lib/facturama/client';
import { sendWithUserEmailConfig } from '@/lib/email/user-config';
import { signStoredObject } from '@/lib/storage/signed';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FacturamaCreateInvoiceRequest, InvoiceGenerationResult } from '@/lib/types/facturama';
import {
  getDemoIntegrationPolicy,
  logDemoAuditEvent,
  resolveDemoModeConfig,
} from '@/lib/demo-mode';

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

    const demoConfig = await resolveDemoModeConfig(supabase, user.id);
    const facturamaPolicy = getDemoIntegrationPolicy(demoConfig, 'facturama');

    if (facturamaPolicy.shouldSimulate) {
      const { data: fiscalData, error: fiscalError } = await supabase
        .from('patient_fiscal_data')
        .select('*')
        .eq('id', fiscal_data_id)
        .single();

      if (fiscalError || !fiscalData) {
        return NextResponse.json({ error: 'Datos fiscales del paciente no encontrados' }, { status: 404 });
      }

      const { data: records, error: recordsError } = await supabase
        .from('records')
        .select('id, monto_pagado, treatment:treatments(nombre)')
        .in('id', record_ids);

      if (recordsError || !records || records.length === 0) {
        return NextResponse.json({ error: 'Tratamientos no encontrados' }, { status: 404 });
      }

      const invoiceItems = records.map((record: any) => ({
        id: record.id,
        treatment_name: record.treatment?.nombre || 'Servicio médico',
        price: Number(record.monto_pagado || 0),
        cantidad: 1,
      }));
      const items = buildInvoiceItems(invoiceItems, true);
      const subtotal = items.reduce((sum, item) => sum + item.Subtotal, 0);
      const iva = items.reduce((sum, item) => {
        const tax = item.Taxes?.find(t => t.Name === '002');
        return sum + (tax?.Total || 0);
      }, 0);
      const total = subtotal + iva;

      const now = Date.now();
      const demoFacturamaId = `demo_facturama_${now}`;
      const demoUuid = `DEMO-${now}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const demoSerie = 'D';
      const demoFolio = String(now).slice(-6);
      const demoAssetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/facturacion?demo=1`;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          patient_id,
          fiscal_data_id,
          facturama_id: demoFacturamaId,
          folio_number: demoFolio,
          serie: demoSerie,
          uuid: demoUuid,
          fecha_emision: new Date().toISOString(),
          fecha_timbrado: new Date().toISOString(),
          subtotal,
          iva,
          total,
          moneda: 'MXN',
          tipo_comprobante: 'I',
          forma_pago,
          metodo_pago,
          xml_url: demoAssetUrl,
          pdf_url: demoAssetUrl,
          status: 'issued',
          notas: notas || '[DEMO] Factura simulada en modo demo',
          created_by: user.id,
          user_id: user.id, // fable C3: requerido por las nuevas políticas RLS por tenant
        })
        .select()
        .single();

      if (invoiceError || !invoice) {
        console.error('Error saving simulated invoice:', invoiceError);
        return NextResponse.json(
          { error: 'Error al guardar factura simulada' },
          { status: 500 }
        );
      }

      const invoiceRecords = record_ids.map(record_id => {
        const record = records.find(r => r.id === record_id);
        return {
          invoice_id: invoice.id,
          record_id,
          monto: Number(record?.monto_pagado || 0),
        };
      });

      await supabase.from('invoice_records').insert(invoiceRecords);
      await supabase
        .from('records')
        .update({ pendiente_facturar: false })
        .in('id', record_ids);

      if (send_email) {
        await supabase
          .from('invoices')
          .update({ emailed_at: new Date().toISOString() })
          .eq('id', invoice.id);
      }

      await logDemoAuditEvent(supabase, user.id, {
        eventType: 'facturama_invoice_simulated',
        integration: 'facturama',
        resourceType: 'invoice',
        resourceId: invoice.id,
        status: 'simulated',
        payload: {
          patient_id,
          fiscal_data_id,
          record_ids,
          total,
          send_email,
        },
      });

      const simulatedResult: InvoiceGenerationResult = {
        success: true,
        invoice_id: invoice.id,
        xml_url: invoice.xml_url || demoAssetUrl,
        pdf_url: invoice.pdf_url || demoAssetUrl,
        uuid: demoUuid,
      };

      return NextResponse.json({
        ...simulatedResult,
        demo_mode: true,
      });
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
      .select('id, monto_pagado, treatment:treatments(nombre)')
      .in('id', record_ids);

    if (recordsError || !records || records.length === 0) {
      return NextResponse.json({ error: 'Tratamientos no encontrados' }, { status: 404 });
    }

    // 4. Build invoice items
    const invoiceItems = records.map((record: any) => ({
      id: record.id,
      treatment_name: record.treatment?.nombre || 'Servicio médico',
      price: Number(record.monto_pagado || 0),
      cantidad: 1,
    }));
    const items = buildInvoiceItems(invoiceItems, true); // Include IVA

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
        // fable C4: el bucket `invoices` es privado; se guarda la RUTA del
        // objeto y las lecturas generan signed URLs (lib/storage/signed.ts).
        xmlUrl = `${user.id}/${xmlFileName}`;
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
        pdfUrl = `${user.id}/${pdfFileName}`; // fable C4
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
        user_id: user.id, // fable C3: requerido por las nuevas políticas RLS por tenant
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
        monto: Number(record?.monto_pagado || 0),
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

        const { data: emailConfig } = await supabase
          .from('email_config')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (recipientEmail && emailConfig?.email_enabled) {
          const [xmlSignedForEmail, pdfSignedForEmail] = await Promise.all([
            signStoredObject(supabaseAdmin, 'invoices', xmlUrl),
            signStoredObject(supabaseAdmin, 'invoices', pdfUrl),
          ]);

          if (!xmlSignedForEmail || !pdfSignedForEmail) {
            throw new Error('No se pudieron preparar los archivos de la factura');
          }

          const [xmlResponse, pdfResponse] = await Promise.all([
            fetch(xmlSignedForEmail),
            fetch(pdfSignedForEmail),
          ]);

          if (!xmlResponse.ok || !pdfResponse.ok) {
            throw new Error('No se pudieron descargar los archivos de la factura');
          }

          const [xmlBuffer, pdfBuffer] = await Promise.all([
            xmlResponse.arrayBuffer(),
            pdfResponse.arrayBuffer(),
          ]);
          const patientName = `${patient?.nombre || ''} ${patient?.apellido || ''}`.trim() || 'Cliente';
          const invoiceDate = format(new Date(), 'dd/MM/yyyy', { locale: es });
          const totalFormatted = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
          }).format(total);
          const invoiceNumber = `${invoice.serie}-${invoice.folio_number}`;

          await sendWithUserEmailConfig(emailConfig, {
            to: recipientEmail,
            subject: `Factura electrónica ${invoiceNumber} - ${config.emisor_razon_social}`,
            html: `<p>Hola ${patientName},</p><p>Adjuntamos tu factura electrónica ${invoiceNumber}, emitida el ${invoiceDate}, por un total de <strong>${totalFormatted}</strong>.</p><p>Atentamente,<br>${config.emisor_razon_social}</p>`,
            text: `Hola ${patientName}. Adjuntamos tu factura electrónica ${invoiceNumber}, emitida el ${invoiceDate}, por un total de ${totalFormatted}.`,
            attachments: [
              {
                filename: `Factura_${invoiceNumber}.xml`,
                content: Buffer.from(xmlBuffer),
                contentType: 'application/xml',
              },
              {
                filename: `Factura_${invoiceNumber}.pdf`,
                content: Buffer.from(pdfBuffer),
                contentType: 'application/pdf',
              },
            ],
          });

          await supabaseAdmin
            .from('invoices')
            .update({ emailed_at: new Date().toISOString() })
            .eq('id', invoice.id);
        }
      } catch (emailError) {
        console.error('[Invoice Generation] Error sending email:', emailError);
        // Don't fail the request if email fails
      }
    }

    const result: InvoiceGenerationResult = {
      success: true,
      invoice_id: invoice.id,
      // fable C4: la respuesta entrega signed URLs (1h); la BD guarda rutas.
      xml_url: (await signStoredObject(supabaseAdmin, 'invoices', xmlUrl)) ?? undefined,
      pdf_url: (await signStoredObject(supabaseAdmin, 'invoices', pdfUrl)) ?? undefined,
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

    // fable C4: firmar xml_url/pdf_url en lectura. Funciona tanto para filas
    // nuevas (ruta) como históricas (URL pública completa del bucket).
    const signedInvoices = await Promise.all(
      (invoices ?? []).map(async (inv) => ({
        ...inv,
        xml_url: await signStoredObject(supabaseAdmin, 'invoices', inv.xml_url),
        pdf_url: await signStoredObject(supabaseAdmin, 'invoices', inv.pdf_url),
      }))
    );

    return NextResponse.json({ invoices: signedInvoices });
  } catch (error) {
    console.error('Error in GET /api/invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
