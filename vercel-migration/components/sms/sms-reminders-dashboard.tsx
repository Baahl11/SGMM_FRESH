"use client";

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Send, 
  XCircle, 
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import {
  SmsReminder,
  REMINDER_STATUS_LABELS,
  getReminderStatusColor,
  getReminderStats,
  TIMING_OPTIONS
} from '@/lib/utils/sms-reminders';

interface SmsRemindersDashboardProps {
  reminders: SmsReminder[];
  onSend: (reminderId: string) => void;
  onCancel: (reminderId: string) => void;
  onRetry: (reminderId: string) => void;
  onDelete: (reminderId: string) => void;
  onConfirm?: (reminderId: string, response: string) => void;
}

export function SmsRemindersDashboard({
  reminders,
  onSend,
  onCancel,
  onRetry,
  onDelete,
  onConfirm
}: SmsRemindersDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');

  // Filter reminders
  const filteredReminders = reminders.filter(reminder => {
    if (filter === 'all') return true;
    if (filter === 'pending') return reminder.status === 'pending';
    if (filter === 'sent') return reminder.status === 'sent' || reminder.status === 'delivered';
    if (filter === 'failed') return reminder.status === 'failed';
    return true;
  });

  // Sort by scheduled send time (upcoming first)
  const sortedReminders = filteredReminders.sort((a, b) => {
    return new Date(a.scheduled_send_time).getTime() - new Date(b.scheduled_send_time).getTime();
  });

  // Calculate stats
  const stats = getReminderStats(reminders);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilSend = (scheduledTime: string): string => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffMs = scheduled.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Debería enviarse ahora';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return `En ${days} día${days > 1 ? 's' : ''}`;
    }
    
    if (diffHours > 0) {
      return `En ${diffHours}h ${diffMinutes}m`;
    }
    
    return `En ${diffMinutes} minutos`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Por enviar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_sent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total procesados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Tasa de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.delivery_rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total_delivered} entregados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Confirmaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.confirmation_rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pacientes confirmaron
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todos ({reminders.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pendientes ({stats.total_pending})
        </Button>
        <Button
          variant={filter === 'sent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('sent')}
        >
          Enviados ({stats.total_sent})
        </Button>
        <Button
          variant={filter === 'failed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('failed')}
        >
          Fallidos ({stats.total_failed})
        </Button>
      </div>

      {/* Reminders Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Cita</TableHead>
                <TableHead>Momento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Programado</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay recordatorios SMS
                  </TableCell>
                </TableRow>
              ) : (
                sortedReminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reminder.patient_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {reminder.patient_phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{reminder.appointment_date}</div>
                        <div className="text-muted-foreground">{reminder.appointment_time}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {reminder.timing === 'custom' 
                          ? `${reminder.custom_hours}h antes`
                          : TIMING_OPTIONS[reminder.timing]?.label || reminder.timing
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge 
                          variant="outline"
                          className={getReminderStatusColor(reminder.status)}
                        >
                          {REMINDER_STATUS_LABELS[reminder.status]}
                        </Badge>
                        {reminder.confirmed_at && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Confirmado
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDateTime(reminder.scheduled_send_time)}</div>
                        {reminder.status === 'pending' && (
                          <div className="text-xs text-muted-foreground">
                            {getTimeUntilSend(reminder.scheduled_send_time)}
                          </div>
                        )}
                        {reminder.actual_send_time && (
                          <div className="text-xs text-green-600">
                            Enviado: {formatDateTime(reminder.actual_send_time)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {reminder.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {reminder.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => onSend(reminder.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                Enviar Ahora
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onCancel(reminder.id)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                            </>
                          )}
                          {reminder.status === 'failed' && (
                            <DropdownMenuItem onClick={() => onRetry(reminder.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reintentar
                            </DropdownMenuItem>
                          )}
                          {(reminder.status === 'sent' || reminder.status === 'delivered') && !reminder.confirmed_at && onConfirm && (
                            <DropdownMenuItem onClick={() => onConfirm(reminder.id, 'SI')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar Confirmado
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDelete(reminder.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
