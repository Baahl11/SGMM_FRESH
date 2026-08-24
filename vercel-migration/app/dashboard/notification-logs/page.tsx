/**
 * Notification Logs Page
 * Historial completo de notificaciones enviadas
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Download,
  RefreshCw,
  Filter,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationLog {
  id: string;
  notification_type: string;
  status: string;
  provider: string;
  recipient_email?: string;
  recipient_phone?: string;
  subject?: string;
  message_body?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
}

export default function NotificationLogsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filtros
  const [type, setType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [provider, setProvider] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // Paginación
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    loadLogs();
  }, [type, status, provider, page]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * limit;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (type !== 'all') params.append('type', type);
      if (status !== 'all') params.append('status', status);
      if (provider !== 'all') params.append('provider', provider);
      if (search) params.append('search', search);

      const response = await fetch(`/api/notification-logs?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Error al cargar historial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadLogs();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const params = new URLSearchParams();
      if (type !== 'all') params.append('type', type);
      if (status !== 'all') params.append('status', status);
      if (provider !== 'all') params.append('provider', provider);

      const response = await fetch(`/api/notification-logs/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al exportar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notification-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Logs exportados correctamente');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Error al exportar logs');
    } finally {
      setIsExporting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; icon: any; className: string }> = {
      pending: {
        label: 'Pendiente',
        icon: Clock,
        className: 'border border-amber-300/40 bg-amber-400/10 text-amber-100'
      },
      sent: {
        label: 'Enviado',
        icon: CheckCircle2,
        className: 'border border-cyan-300/40 bg-cyan-400/10 text-cyan-100'
      },
      delivered: {
        label: 'Entregado',
        icon: CheckCircle2,
        className: 'border border-emerald-300/40 bg-emerald-400/10 text-emerald-100'
      },
      failed: {
        label: 'Fallido',
        icon: XCircle,
        className: 'border border-rose-300/40 bg-rose-500/10 text-rose-100'
      },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge className={cn('flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs', config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const logInsights = useMemo(() => {
    let deliveredCount = 0;
    let sentCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let retryTotal = 0;
    const providersSet = new Set<string>();

    logs.forEach((log) => {
      if (log.status === 'delivered') deliveredCount += 1;
      if (log.status === 'sent') sentCount += 1;
      if (log.status === 'pending') pendingCount += 1;
      if (log.status === 'failed') failedCount += 1;

      retryTotal += Number(log.retry_count || 0);

      if (log.provider) {
        providersSet.add(log.provider);
      }
    });

    const processed = deliveredCount + sentCount + failedCount;
    const successRate = processed > 0 ? ((deliveredCount + sentCount) / processed) * 100 : 100;

    return {
      deliveredCount,
      sentCount,
      pendingCount,
      failedCount,
      retryTotal,
      providersActive: providersSet.size,
      successRate,
    };
  }, [logs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <AppLayout>
      <div className="space-y-6">
        <GlassPanel className="relative overflow-hidden p-6 sm:p-8 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-cyan-400/30 blur-[140px]" />
            <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-[150px]" />
          </div>
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Mensajería</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Historial de notificaciones</h1>
              <p className="mt-2 text-sm text-white/70">Bitácora completa de envíos por email, WhatsApp y SMS con filtros avanzados.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={loadLogs} variant="outline" size="icon" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={handleExport} disabled={isExporting} className="border-0 bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 text-black hover:from-emerald-200 hover:via-cyan-200 hover:to-sky-200">
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exportando...' : 'Exportar CSV'}
              </Button>
            </div>
          </div>
        </GlassPanel>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/55">Entregadas + enviadas</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-100">{logInsights.deliveredCount + logInsights.sentCount}</p>
            <p className="text-xs text-white/65">Tasa de éxito visible: {logInsights.successRate.toFixed(1)}%</p>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/55">Pendientes</p>
            <p className="mt-2 text-3xl font-semibold text-amber-100">{logInsights.pendingCount}</p>
            <p className="text-xs text-white/65">Items por revisar en cola</p>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/55">Fallidas</p>
            <p className="mt-2 text-3xl font-semibold text-rose-100">{logInsights.failedCount}</p>
            <p className="text-xs text-white/65">Reintentos acumulados: {logInsights.retryTotal}</p>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/5 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/55">Proveedores activos</p>
            <p className="mt-2 text-3xl font-semibold text-cyan-100">{logInsights.providersActive}</p>
            <p className="text-xs text-white/65">Canales reportados en esta página</p>
          </GlassPanel>
        </div>

        <GlassPanel className="border-white/10 bg-white/5 p-6 text-white">
          <div className="mb-5 flex items-center gap-2">
            <Filter className="h-5 w-5 text-cyan-200" />
            <p className="text-lg font-semibold">Filtros</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-white/60">Tipo</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="border-white/20 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-slate-950 text-white">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-white/60">Estado</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="border-white/20 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-slate-950 text-white">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-white/60">Proveedor</label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="border-white/20 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-slate-950 text-white">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="resend">Resend</SelectItem>
                  <SelectItem value="whatsapp_business">WhatsApp Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-white/60">Buscar</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Email o teléfono..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                />
                <Button onClick={handleSearch} size="icon" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="border-white/10 bg-white/5 p-6 text-white">
          <div className="mb-4">
            <p className="text-lg font-semibold">Logs ({total} total)</p>
            <p className="text-sm text-white/70">Mostrando {logs.length} de {total} registros</p>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-white/65">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Página {page} de {Math.max(totalPages, 1)}</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Límite por página: {limit}</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Filtro búsqueda: {search.trim() ? 'activo' : 'sin texto'}</span>
          </div>
          <div>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-white/70" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <AlertCircle className="mb-4 h-12 w-12 text-white/40" />
                <p className="text-white/60">No se encontraron registros</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/70">Fecha/Hora</TableHead>
                      <TableHead className="text-white/70">Tipo</TableHead>
                      <TableHead className="text-white/70">Destinatario</TableHead>
                      <TableHead className="text-white/70">Estado</TableHead>
                      <TableHead className="text-white/70">Proveedor</TableHead>
                      <TableHead className="text-white/70">Mensaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="border-white/10 transition hover:bg-white/[0.04]">
                        <TableCell className="text-sm text-white/80">
                          {format(new Date(log.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(log.notification_type)}
                            <span className="text-sm capitalize text-white">{log.notification_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate text-sm text-white/80">
                            {log.recipient_email || log.recipient_phone || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                          {log.retry_count > 0 && (
                            <span className="ml-2 text-xs text-white/60">
                              ({log.retry_count} reintentos)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm capitalize text-white/80">
                          {log.provider}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="truncate text-sm text-white/70">
                            {log.subject || log.message_body || '-'}
                          </div>
                          {log.error_message && (
                            <div className="mt-1 truncate text-xs text-rose-300">
                              Error: {log.error_message}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginación */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-white/60">
                    Página {page} de {totalPages} ({total} total)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                      className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || isLoading}
                      className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </GlassPanel>
      </div>
    </AppLayout>
  );
}
