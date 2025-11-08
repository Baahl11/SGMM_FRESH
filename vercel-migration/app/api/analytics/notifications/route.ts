/**
 * Analytics API - Notification Metrics
 * GET /api/analytics/notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getNotificationMetrics,
  getTimeSeriesData,
  getTopRecipients,
  getComparativeMetrics,
  getEstimatedCosts,
  getDateRange,
} from '@/lib/analytics/notification-metrics';

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
    const period = searchParams.get('period') || 'month'; // today, week, month, custom
    const customStart = searchParams.get('start_date');
    const customEnd = searchParams.get('end_date');
    const includeComparative = searchParams.get('comparative') === 'true';
    const includeCosts = searchParams.get('costs') === 'true';
    const includeTopRecipients = searchParams.get('top_recipients') === 'true';

    // Calcular rango de fechas
    let dateRange;
    try {
      dateRange = getDateRange(
        period as any,
        customStart ? new Date(customStart) : undefined,
        customEnd ? new Date(customEnd) : undefined
      );
    } catch (error) {
      return NextResponse.json(
        { error: 'Rango de fechas inválido' },
        { status: 400 }
      );
    }

    const { start, end } = dateRange;

    // Obtener métricas básicas
    const metrics = await getNotificationMetrics(user.id, start, end);
    
    // Obtener serie temporal
    const timeSeries = await getTimeSeriesData(user.id, start, end);

    // Objeto de respuesta
    const response: any = {
      period,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      metrics,
      time_series: timeSeries,
    };

    // Agregar métricas comparativas si se solicita
    if (includeComparative) {
      const comparative = await getComparativeMetrics(user.id, start, end);
      response.comparative = comparative;
    }

    // Agregar costos si se solicita
    if (includeCosts) {
      const costs = await getEstimatedCosts(user.id, start, end);
      response.costs = costs;
    }

    // Agregar top recipients si se solicita
    if (includeTopRecipients) {
      const topRecipients = await getTopRecipients(user.id, start, end);
      response.top_recipients = topRecipients;
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Error al obtener analytics', details: error.message },
      { status: 500 }
    );
  }
}
