/**
 * Notification Analytics Dashboard
 * Dashboard completo con métricas y gráficas
 */

'use client';

import { useState, useEffect } from 'react';
import { MainNav } from '@/components/layout/main-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TimeSeriesChart,
  AreaSeriesChart,
  TypeDistributionPie,
  ProviderComparisonBar,
  DeliveryFunnel,
} from '@/components/analytics/notification-charts';
import { 
  TrendingUp, 
  TrendingDown, 
  Send, 
  CheckCircle2, 
  XCircle, 
  DollarSign,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  period: string;
  start_date: string;
  end_date: string;
  metrics: {
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
  };
  time_series: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;
  comparative?: {
    current: any;
    previous: any;
    changes: {
      total_sent: number;
      total_delivered: number;
      total_failed: number;
      delivery_rate: number;
    };
  };
  costs?: {
    total: number;
    by_provider: Record<string, number>;
    smtp_count: number;
    paid_count: number;
  };
  top_recipients?: Array<{
    patient_id: string;
    recipient_email?: string;
    recipient_phone?: string;
    count: number;
  }>;
}

export default function NotificationAnalyticsPage() {
  const [period, setPeriod] = useState<string>('month');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/analytics/notifications?period=${period}&comparative=true&costs=true&top_recipients=true`
      );

      if (!response.ok) {
        throw new Error('Error al cargar analytics');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error al cargar las métricas');
    } finally {
      setIsLoading(false);
    }
  };

  const formatChange = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  const getChangeColor = (value: number, inverse = false) => {
    if (inverse) {
      return value > 0 ? 'text-red-600' : 'text-green-600';
    }
    return value > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (value: number, inverse = false) => {
    if (inverse) {
      return value > 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />;
    }
    return value > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="bg-white border-b">
          <div className="container mx-auto px-6 py-4">
            <MainNav />
          </div>
        </div>
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Cargando analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Preparar datos para gráficas
  const typeData = [
    { name: 'Email', value: data.metrics.by_type.email, color: '#8b5cf6' },
    { name: 'WhatsApp', value: data.metrics.by_type.whatsapp, color: '#22c55e' },
    { name: 'SMS', value: data.metrics.by_type.sms, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  const providerData = [
    { name: 'SMTP', value: data.metrics.by_provider.smtp },
    { name: 'Resend', value: data.metrics.by_provider.resend },
    { name: 'WhatsApp', value: data.metrics.by_provider.whatsapp_business },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Main Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <MainNav />
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics de Notificaciones</h1>
            <p className="text-muted-foreground">
              Métricas y estadísticas de tus notificaciones
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadAnalytics} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Enviados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.metrics.total_sent.toLocaleString()}</div>
              {data.comparative && (
                <p className={`text-xs flex items-center gap-1 mt-1 ${getChangeColor(data.comparative.changes.total_sent)}`}>
                  {getChangeIcon(data.comparative.changes.total_sent)}
                  {formatChange(data.comparative.changes.total_sent)} vs período anterior
                </p>
              )}
            </CardContent>
          </Card>

          {/* Total Entregados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.metrics.total_delivered.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.metrics.delivery_rate.toFixed(1)}% tasa de entrega
              </p>
            </CardContent>
          </Card>

          {/* Fallidos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {data.metrics.total_failed.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.metrics.failure_rate.toFixed(1)}% tasa de fallo
              </p>
            </CardContent>
          </Card>

          {/* Costos */}
          {data.costs && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costo Estimado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data.costs.total.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.costs.smtp_count} gratis, {data.costs.paid_count} pagos
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Funnel de conversión */}
        <DeliveryFunnel 
          data={{
            sent: data.metrics.total_sent,
            delivered: data.metrics.total_delivered,
          }}
        />

        {/* Gráficas principales */}
        <div className="grid gap-6 md:grid-cols-2">
          <TimeSeriesChart 
            data={data.time_series}
            title="Tendencia de envíos"
            description="Notificaciones enviadas por día"
          />
          
          <AreaSeriesChart 
            data={data.time_series}
            title="Área de entrega"
            description="Comparativa de enviados vs entregados"
          />
        </div>

        {/* Distribuciones */}
        <div className="grid gap-6 md:grid-cols-2">
          {typeData.length > 0 && (
            <TypeDistributionPie 
              data={typeData}
              title="Distribución por tipo"
              description="Email, WhatsApp y SMS"
            />
          )}
          
          {providerData.length > 0 && (
            <ProviderComparisonBar 
              data={providerData}
              title="Mensajes por proveedor"
              description="SMTP, Resend y WhatsApp Business"
            />
          )}
        </div>

        {/* Top Recipients */}
        {data.top_recipients && data.top_recipients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Receptores más frecuentes</CardTitle>
              <CardDescription>Pacientes que más notificaciones han recibido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.top_recipients.slice(0, 5).map((recipient, index) => (
                  <div key={recipient.patient_id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {recipient.recipient_email || recipient.recipient_phone || 'Sin identificar'}
                        </p>
                        <p className="text-xs text-muted-foreground">ID: {recipient.patient_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{recipient.count}</p>
                      <p className="text-xs text-muted-foreground">mensajes</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
