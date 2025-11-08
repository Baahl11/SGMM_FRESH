/**
 * Export Notification Logs to CSV
 * GET /api/notification-logs/export
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener parámetros
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Construir query
    let query = supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1000); // Máximo 1000 registros por exportación

    // Aplicar filtros
    if (type) query = query.eq('notification_type', type);
    if (status) query = query.eq('status', status);
    if (provider) query = query.eq('provider', provider);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: logs, error } = await query;

    if (error || !logs) {
      return NextResponse.json(
        { error: 'Error al obtener logs' },
        { status: 500 }
      );
    }

    // Generar CSV
    const headers = [
      'Fecha/Hora',
      'Tipo',
      'Estado',
      'Proveedor',
      'Destinatario (Email)',
      'Destinatario (Teléfono)',
      'Asunto/Mensaje',
      'Error',
      'Reintentos',
    ];

    const rows = logs.map((log: any) => [
      format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
      log.notification_type || '',
      log.status || '',
      log.provider || '',
      log.recipient_email || '',
      log.recipient_phone || '',
      (log.subject || log.message_body || '').replace(/"/g, '""').substring(0, 100),
      (log.error_message || '').replace(/"/g, '""'),
      log.retry_count || 0,
    ]);

    // Construir CSV
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Agregar BOM para Excel
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // Generar nombre de archivo
    const filename = `notification-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('Error exporting logs:', error);
    return NextResponse.json(
      { error: 'Error al exportar', details: error.message },
      { status: 500 }
    );
  }
}
