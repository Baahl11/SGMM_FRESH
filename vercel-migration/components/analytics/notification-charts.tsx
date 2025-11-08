/**
 * Notification Charts Component
 * Gráficas para el dashboard de analytics
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TimeSeriesData {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
}

interface ChartProps {
  data: TimeSeriesData[];
  title?: string;
  description?: string;
}

const COLORS = {
  sent: '#3b82f6', // blue
  delivered: '#10b981', // green
  failed: '#ef4444', // red
  email: '#8b5cf6', // purple
  whatsapp: '#22c55e', // green
  sms: '#f59e0b', // amber
};

/**
 * Gráfica de línea temporal
 */
export function TimeSeriesChart({ data, title, description }: ChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Notificaciones por día'}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('es-MX', { 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                });
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="sent" 
              name="Enviados"
              stroke={COLORS.sent} 
              strokeWidth={2}
              dot={{ fill: COLORS.sent }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="delivered" 
              name="Entregados"
              stroke={COLORS.delivered} 
              strokeWidth={2}
              dot={{ fill: COLORS.delivered }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="failed" 
              name="Fallidos"
              stroke={COLORS.failed} 
              strokeWidth={2}
              dot={{ fill: COLORS.failed }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Gráfica de área para tendencias
 */
export function AreaSeriesChart({ data, title, description }: ChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Tendencia de envíos'}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.sent} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.sent} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.delivered} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.delivered} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('es-MX', { 
                  day: 'numeric', 
                  month: 'long'
                });
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="sent" 
              name="Enviados"
              stroke={COLORS.sent} 
              fillOpacity={1} 
              fill="url(#colorSent)" 
            />
            <Area 
              type="monotone" 
              dataKey="delivered" 
              name="Entregados"
              stroke={COLORS.delivered} 
              fillOpacity={1} 
              fill="url(#colorDelivered)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Gráfica de pastel para distribución por tipo
 */
interface PieChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  title?: string;
  description?: string;
}

export function TypeDistributionPie({ data, title, description }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Distribución por tipo'}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => 
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} (${((value as number) / total * 100).toFixed(1)}%)`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Gráfica de barras para comparación por proveedor
 */
interface BarChartProps {
  data: {
    name: string;
    value: number;
  }[];
  title?: string;
  description?: string;
}

export function ProviderComparisonBar({ data, title, description }: BarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Mensajes por proveedor'}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" name="Cantidad" fill={COLORS.sent} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Funnel de conversión (Enviado -> Entregado -> Leído)
 */
interface FunnelData {
  sent: number;
  delivered: number;
  read?: number;
}

export function DeliveryFunnel({ data, title }: { data: FunnelData; title?: string }) {
  const deliveryRate = data.sent > 0 ? (data.delivered / data.sent) * 100 : 0;
  const readRate = data.delivered > 0 && data.read ? (data.read / data.delivered) * 100 : 0;

  const funnelData = [
    { stage: 'Enviados', value: data.sent, percentage: 100, color: COLORS.sent },
    { stage: 'Entregados', value: data.delivered, percentage: deliveryRate, color: COLORS.delivered },
  ];

  if (data.read) {
    funnelData.push({
      stage: 'Leídos',
      value: data.read,
      percentage: readRate,
      color: '#8b5cf6',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Funnel de conversión'}</CardTitle>
        <CardDescription>Del envío hasta la entrega</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelData.map((stage, index) => (
            <div key={stage.stage} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.stage}</span>
                <span className="text-muted-foreground">
                  {stage.value.toLocaleString()} ({stage.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 flex items-center justify-center text-white font-semibold transition-all duration-500"
                  style={{
                    width: `${stage.percentage}%`,
                    backgroundColor: stage.color,
                    minWidth: stage.percentage > 10 ? 'auto' : '60px',
                  }}
                >
                  {stage.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
