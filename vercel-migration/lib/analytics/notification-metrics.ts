/**
 * Notification Analytics Service
 * Calcula métricas y estadísticas de notificaciones
 */

import { createClient } from '@/lib/supabase/server';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface NotificationMetrics {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  failure_rate: number;
  by_type: {
    email: number;
    whatsapp: number;
    sms: number;
  };
  by_status: {
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  };
  by_provider: {
    smtp: number;
    resend: number;
    whatsapp_business: number;
  };
}

export interface TimeSeriesData {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
}

export interface TopRecipient {
  patient_id: string;
  recipient_email?: string;
  recipient_phone?: string;
  count: number;
}

/**
 * Obtiene métricas generales de notificaciones para un período
 */
export async function getNotificationMetrics(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<NotificationMetrics> {
  const supabase = await createClient();

  // Query principal
  const { data: logs, error } = await supabase
    .from('notification_logs')
    .select('notification_type, status, provider')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error || !logs) {
    console.error('Error fetching notification metrics:', error);
    return {
      total_sent: 0,
      total_delivered: 0,
      total_failed: 0,
      delivery_rate: 0,
      failure_rate: 0,
      by_type: { email: 0, whatsapp: 0, sms: 0 },
      by_status: { pending: 0, sent: 0, delivered: 0, failed: 0 },
      by_provider: { smtp: 0, resend: 0, whatsapp_business: 0 },
    };
  }

  // Calcular métricas
  const total_sent = logs.filter((l: any) => l.status !== 'pending').length;
  const total_delivered = logs.filter((l: any) => l.status === 'delivered' || l.status === 'sent').length;
  const total_failed = logs.filter((l: any) => l.status === 'failed').length;

  const delivery_rate = total_sent > 0 ? (total_delivered / total_sent) * 100 : 0;
  const failure_rate = total_sent > 0 ? (total_failed / total_sent) * 100 : 0;

  // Por tipo
  const by_type = {
    email: logs.filter((l: any) => l.notification_type === 'email').length,
    whatsapp: logs.filter((l: any) => l.notification_type === 'whatsapp').length,
    sms: logs.filter((l: any) => l.notification_type === 'sms').length,
  };

  // Por estado
  const by_status = {
    pending: logs.filter((l: any) => l.status === 'pending').length,
    sent: logs.filter((l: any) => l.status === 'sent').length,
    delivered: logs.filter((l: any) => l.status === 'delivered').length,
    failed: logs.filter((l: any) => l.status === 'failed').length,
  };

  // Por proveedor
  const by_provider = {
    smtp: logs.filter((l: any) => l.provider === 'smtp').length,
    resend: logs.filter((l: any) => l.provider === 'resend').length,
    whatsapp_business: logs.filter((l: any) => l.provider === 'whatsapp_business').length,
  };

  return {
    total_sent,
    total_delivered,
    total_failed,
    delivery_rate: Math.round(delivery_rate * 100) / 100,
    failure_rate: Math.round(failure_rate * 100) / 100,
    by_type,
    by_status,
    by_provider,
  };
}

/**
 * Obtiene datos de serie temporal (por día) para gráficas
 */
export async function getTimeSeriesData(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<TimeSeriesData[]> {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from('notification_logs')
    .select('created_at, status')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (error || !logs) {
    console.error('Error fetching time series:', error);
    return [];
  }

  // Agrupar por día
  const groupedByDay = logs.reduce((acc: Record<string, TimeSeriesData>, log: any) => {
    const day = format(new Date(log.created_at), 'yyyy-MM-dd');
    if (!acc[day]) {
      acc[day] = { date: day, sent: 0, delivered: 0, failed: 0 };
    }
    if (log.status !== 'pending') acc[day].sent++;
    if (log.status === 'delivered' || log.status === 'sent') acc[day].delivered++;
    if (log.status === 'failed') acc[day].failed++;
    return acc;
  }, {} as Record<string, TimeSeriesData>);

  // Convertir a array y ordenar
  return Object.values(groupedByDay).sort((a: TimeSeriesData, b: TimeSeriesData) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Obtiene los receptores más frecuentes
 */
export async function getTopRecipients(
  userId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 10
): Promise<TopRecipient[]> {
  const supabase = await createClient();

  // Query agrupado por receptor
  const { data, error } = await supabase
    .from('notification_logs')
    .select('patient_id, recipient_email, recipient_phone')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .not('patient_id', 'is', null);

  if (error || !data) {
    console.error('Error fetching top recipients:', error);
    return [];
  }

  // Contar por patient_id
  const counts = data.reduce((acc: Record<string, TopRecipient>, log: any) => {
    const key = log.patient_id || 'unknown';
    if (!acc[key]) {
      acc[key] = {
        patient_id: log.patient_id,
        recipient_email: log.recipient_email,
        recipient_phone: log.recipient_phone,
        count: 0,
      };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, TopRecipient>);

  // Ordenar y limitar
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Calcula métricas comparadas con período anterior
 */
export async function getComparativeMetrics(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const previousStart = subDays(startDate, periodDays);
  const previousEnd = subDays(endDate, periodDays);

  const [currentMetrics, previousMetrics] = await Promise.all([
    getNotificationMetrics(userId, startDate, endDate),
    getNotificationMetrics(userId, previousStart, previousEnd),
  ]);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    current: currentMetrics,
    previous: previousMetrics,
    changes: {
      total_sent: calculateChange(currentMetrics.total_sent, previousMetrics.total_sent),
      total_delivered: calculateChange(currentMetrics.total_delivered, previousMetrics.total_delivered),
      total_failed: calculateChange(currentMetrics.total_failed, previousMetrics.total_failed),
      delivery_rate: calculateChange(currentMetrics.delivery_rate, previousMetrics.delivery_rate),
    },
  };
}

/**
 * Calcula costos estimados basados en uso de proveedores
 */
export async function getEstimatedCosts(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from('notification_logs')
    .select('notification_type, provider, status')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .in('status', ['sent', 'delivered']);

  if (error || !logs) {
    return { total: 0, by_provider: {} };
  }

  // Precios estimados (ajustar según tu plan real)
  const pricing = {
    smtp: 0, // SMTP propio es gratis (solo límites diarios)
    resend: 0.0001, // ~$0.0001 por email con Resend
    whatsapp_business: 0.005, // ~$0.005 por mensaje WhatsApp
    sms: 0.05, // ~$0.05 por SMS (si se implementa)
  };

  let total = 0;
  const by_provider: Record<string, number> = {};

  logs.forEach((log: any) => {
    const cost = pricing[log.provider as keyof typeof pricing] || 0;
    total += cost;
    by_provider[log.provider] = (by_provider[log.provider] || 0) + cost;
  });

  return {
    total: Math.round(total * 100) / 100,
    by_provider,
    smtp_count: logs.filter((l: any) => l.provider === 'smtp').length,
    paid_count: logs.filter((l: any) => l.provider !== 'smtp').length,
  };
}

/**
 * Helper para obtener rangos de fecha predefinidos
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'custom', customStart?: Date, customEnd?: Date) {
  const now = new Date();

  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'custom':
      if (!customStart || !customEnd) throw new Error('Custom dates required');
      return { start: customStart, end: customEnd };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}
