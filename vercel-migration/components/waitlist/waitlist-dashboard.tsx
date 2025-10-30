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
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MoreHorizontal, 
  Search, 
  Bell, 
  CalendarCheck, 
  Trash2, 
  XCircle,
  Clock,
  AlertCircle,
  Filter
} from 'lucide-react';
import {
  WaitlistEntry,
  WaitlistStatus,
  WaitlistPriority,
  STATUS_LABELS,
  PRIORITY_CONFIG,
  getPriorityColorClass,
  getStatusColorClass,
  calculateWaitlistPosition,
  sortWaitlistByPriority
} from '@/lib/utils/waitlist';

interface WaitlistDashboardProps {
  entries: WaitlistEntry[];
  onNotify: (entry: WaitlistEntry) => void;
  onBook: (entry: WaitlistEntry) => void;
  onCancel: (entry: WaitlistEntry) => void;
  onDelete: (entry: WaitlistEntry) => void;
}

export function WaitlistDashboard({
  entries,
  onNotify,
  onBook,
  onCancel,
  onDelete
}: WaitlistDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WaitlistStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<WaitlistPriority | 'all'>('all');

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = entry.patient_name.toLowerCase().includes(query);
      const matchesReason = entry.reason?.toLowerCase().includes(query);
      if (!matchesName && !matchesReason) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && entry.status !== statusFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && entry.priority !== priorityFilter) {
      return false;
    }

    return true;
  });

  // Sort filtered entries
  const sortedEntries = sortWaitlistByPriority(filteredEntries);

  // Calculate stats
  const stats = {
    active: entries.filter(e => e.status === 'active').length,
    notified: entries.filter(e => e.status === 'notified').length,
    urgent: entries.filter(e => e.priority === 'urgent' && e.status === 'active').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En Espera Activa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Esperando notificación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.notified}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Esperando respuesta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.urgent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o motivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as WaitlistStatus | 'all')}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as WaitlistPriority | 'all')}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Agregado</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No hay pacientes en la lista de espera
                  </TableCell>
                </TableRow>
              ) : (
                sortedEntries.map((entry, index) => {
                  const position = calculateWaitlistPosition(entry, entries);
                  const priorityConfig = PRIORITY_CONFIG[entry.priority];
                  
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{position}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.patient_name}</div>
                          {entry.doctor_name && (
                            <div className="text-sm text-muted-foreground">
                              Dr. {entry.doctor_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getPriorityColorClass(entry.priority)}
                        >
                          {priorityConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={getStatusColorClass(entry.status)}
                        >
                          {STATUS_LABELS[entry.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {entry.reason || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatTime(entry.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {entry.patient_phone && (
                            <div>{entry.patient_phone}</div>
                          )}
                          {entry.patient_email && (
                            <div className="text-muted-foreground text-xs truncate max-w-[150px]">
                              {entry.patient_email}
                            </div>
                          )}
                          {!entry.patient_phone && !entry.patient_email && '—'}
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
                            {entry.status === 'active' && (
                              <>
                                <DropdownMenuItem onClick={() => onNotify(entry)}>
                                  <Bell className="h-4 w-4 mr-2" />
                                  Notificar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onBook(entry)}>
                                  <CalendarCheck className="h-4 w-4 mr-2" />
                                  Agendar Cita
                                </DropdownMenuItem>
                              </>
                            )}
                            {(entry.status === 'active' || entry.status === 'notified') && (
                              <DropdownMenuItem onClick={() => onCancel(entry)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDelete(entry)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
