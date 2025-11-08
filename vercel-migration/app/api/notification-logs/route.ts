/**
 * Notification Logs API
 * GET /api/notification-logs
 * Ver historial completo de notificaciones enviadas con filtros
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // email, whatsapp, sms
    const status = searchParams.get('status'); // pending, sent, delivered, failed
    const provider = searchParams.get('provider'); // smtp, resend, whatsapp_business
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const search = searchParams.get('search'); // buscar por email o teléfono
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir query
    let query = supabase
      .from('notification_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (type) {
      query = query.eq('notification_type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (provider) {
      query = query.eq('provider', provider);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Búsqueda por email o teléfono
    if (search) {
      query = query.or(`recipient_email.ilike.%${search}%,recipient_phone.ilike.%${search}%`);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Error fetching notification logs:', error);
      return NextResponse.json(
        { error: 'Error al obtener logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error('Error in notification logs API:', error);
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}
