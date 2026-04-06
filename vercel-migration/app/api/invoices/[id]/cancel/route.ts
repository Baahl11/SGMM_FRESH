// API Route: Cancel Invoice
// DELETE /api/invoices/[id]/cancel

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import FacturamaClient, { SAT_CANCELLATION_MOTIVES } from '@/lib/facturama/client';

interface CancelInvoiceRequest {
  motive: '01' | '02' | '03' | '04';
  uuid_replacement?: string;
  reason?: string;
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = params.id;
    const body: CancelInvoiceRequest = await request.json();
    const { motive, uuid_replacement, reason } = body;

    // Validate motive
    if (!motive || !['01', '02', '03', '04'].includes(motive)) {
      return NextResponse.json(
        { error: 'Motivo de cancelación inválido' },
        { status: 400 }
      );
    }

    // Motive 01 requires replacement UUID
    if (motive === '01' && !uuid_replacement) {
      return NextResponse.json(
        { error: 'Motivo 01 requiere UUID de reemplazo' },
        { status: 400 }
      );
    }

    // 1. Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    if (invoice.status === 'cancelled') {
      return NextResponse.json({ error: 'Factura ya está cancelada' }, { status: 400 });
    }

    if (!invoice.facturama_id) {
      return NextResponse.json({ error: 'Factura no tiene ID de Facturama' }, { status: 400 });
    }

    // 2. Get Facturama configuration
    const { data: config, error: configError } = await supabaseAdmin
      .from('facturama_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !config) {
      return NextResponse.json({ error: 'Configuración de Facturama no encontrada' }, { status: 400 });
    }

    // 3. Create Facturama client
    const facturamaClient = new FacturamaClient({
      api_user: config.api_user,
      api_password_encrypted: config.api_password_encrypted,
      api_password_iv: config.api_password_iv,
      api_password_tag: config.api_password_tag,
      is_sandbox: config.is_sandbox,
    });

    // 4. Cancel invoice in Facturama
    const cancelResult = await facturamaClient.cancelInvoice(
      invoice.facturama_id,
      motive,
      uuid_replacement
    );

    if (!cancelResult.success) {
      return NextResponse.json(
        { error: `Error al cancelar en Facturama: ${cancelResult.error}` },
        { status: 500 }
      );
    }

    // 5. Update invoice in database
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || SAT_CANCELLATION_MOTIVES[motive],
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      return NextResponse.json({ error: 'Error al actualizar factura' }, { status: 500 });
    }

    // 6. Optionally mark records as pending again
    const { data: invoiceRecords } = await supabase
      .from('invoice_records')
      .select('record_id')
      .eq('invoice_id', invoiceId);

    if (invoiceRecords && invoiceRecords.length > 0) {
      const recordIds = invoiceRecords.map(ir => ir.record_id);
      await supabase
        .from('records')
        .update({ pendiente_facturar: true })
        .in('id', recordIds);
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: 'Factura cancelada exitosamente',
    });
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
