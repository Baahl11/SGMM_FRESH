'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FileText, Download, X, Loader2, Receipt, AlertCircle, ExternalLink, Mail, Filter, CalendarIcon, Search, XCircle, Check, CheckSquare, Square, Send, FileSpreadsheet, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import type { Invoice } from '@/lib/types/facturama';
import { SAT_CANCELLATION_MOTIVES } from '@/lib/facturama/client';
import { exportInvoicesToExcel } from '@/lib/utils/excel-export';
import { downloadInvoicePDFsAsZip } from '@/lib/utils/zip-download';

interface InvoiceHistoryProps {
  patientId?: string; // Optional - if not provided, shows all invoices
}

export default function InvoiceHistory({ patientId }: InvoiceHistoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
  const [cancelMotive, setCancelMotive] = useState<'01' | '02' | '03' | '04'>('02');
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);

  // Multi-select state
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [patientId, statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      
      let url = '/api/invoices';
      const params = new URLSearchParams();
      
      if (patientId) {
        params.append('patient_id', patientId);
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      } else {
        toast.error('Error al cargar facturas');
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices based on all active filters
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(inv => new Date(inv.fecha_emision) >= dateFrom);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => new Date(inv.fecha_emision) <= endOfDay);
    }

    // Amount range filter
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(inv => inv.total >= min);
      }
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) {
        filtered = filtered.filter(inv => inv.total <= max);
      }
    }

    // Patient name search filter
    if (patientSearch) {
      const search = patientSearch.toLowerCase();
      filtered = filtered.filter(inv => {
        const patientName = `${inv.patient?.nombre || ''} ${inv.patient?.apellido || ''}`.toLowerCase();
        return patientName.includes(search);
      });
    }

    // Status filter (multi-select)
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(inv => {
        if (selectedStatuses.includes('sent') && inv.emailed_at) return true;
        if (selectedStatuses.includes(inv.status || '')) return true;
        return false;
      });
    }

    // Series filter (multi-select)
    if (selectedSeries.length > 0) {
      filtered = filtered.filter(inv => selectedSeries.includes(inv.serie || ''));
    }

    return filtered;
  }, [invoices, dateFrom, dateTo, minAmount, maxAmount, patientSearch, selectedStatuses, selectedSeries]);

  // Get unique series from all invoices
  const availableSeries = useMemo(() => {
    const series = new Set<string>();
    invoices.forEach(inv => {
      if (inv.serie) series.add(inv.serie);
    });
    return Array.from(series).sort();
  }, [invoices]);

  // Clear all filters
  const handleClearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinAmount('');
    setMaxAmount('');
    setPatientSearch('');
    setSelectedStatuses([]);
    setSelectedSeries([]);
    toast.info('Filtros limpiados');
  };

  // Multi-select functions
  const toggleSelectInvoice = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const selectAllInvoices = () => {
    const allIds = new Set(filteredInvoices.map(inv => inv.id));
    setSelectedInvoices(allIds);
    toast.success(`${allIds.size} facturas seleccionadas`);
  };

  const deselectAllInvoices = () => {
    setSelectedInvoices(new Set());
    toast.info('Selección limpiada');
  };

  const handleBulkSendEmail = async () => {
    if (selectedInvoices.size === 0) {
      toast.error('Selecciona al menos una factura');
      return;
    }

    const selectedIds = Array.from(selectedInvoices);
    const invoicesToSend = invoices.filter(inv => selectedIds.includes(inv.id));
    
    // Filter invoices that can be sent (have XML and PDF)
    const sendableInvoices = invoicesToSend.filter(inv => inv.xml_url && inv.pdf_url);
    
    if (sendableInvoices.length === 0) {
      toast.error('Ninguna de las facturas seleccionadas tiene archivos XML/PDF');
      return;
    }

    if (!window.confirm(`¿Enviar ${sendableInvoices.length} factura(s) por email?`)) {
      return;
    }

    setBulkProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const invoice of sendableInvoices) {
      try {
        const response = await fetch('/api/invoices/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoice_id: invoice.id }),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setBulkProcessing(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} factura(s) enviada(s) correctamente`);
      await loadInvoices();
    }
    
    if (errorCount > 0) {
      toast.error(`${errorCount} factura(s) fallaron al enviar`);
    }

    deselectAllInvoices();
  };

  const handleBulkExportExcel = async () => {
    if (selectedInvoices.size === 0) {
      toast.error('Selecciona al menos una factura');
      return;
    }

    const selectedIds = Array.from(selectedInvoices);
    const invoicesToExport = invoices.filter(inv => selectedIds.includes(inv.id));

    try {
      toast.info('Generando archivo Excel...');
      await exportInvoicesToExcel(invoicesToExport);
      toast.success(`${invoicesToExport.length} factura(s) exportadas a Excel`);
      deselectAllInvoices();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Error al exportar a Excel');
    }
  };

  const handleBulkDownloadPDF = async () => {
    if (selectedInvoices.size === 0) {
      toast.error('Selecciona al menos una factura');
      return;
    }

    const selectedIds = Array.from(selectedInvoices);
    const invoicesToDownload = invoices.filter(inv => selectedIds.includes(inv.id) && inv.pdf_url);

    if (invoicesToDownload.length === 0) {
      toast.error('Ninguna de las facturas seleccionadas tiene PDF disponible');
      return;
    }

    if (invoicesToDownload.length === 1) {
      // Single PDF, download directly
      const invoice = invoicesToDownload[0];
      window.open(invoice.pdf_url, '_blank');
      toast.success('Descargando PDF...');
      deselectAllInvoices();
      return;
    }

    // Multiple PDFs - create ZIP
    try {
      setBulkProcessing(true);
      toast.info(`Descargando ${invoicesToDownload.length} PDFs y creando ZIP...`);
      
      const result = await downloadInvoicePDFsAsZip(invoicesToDownload, {
        onProgress: (current, total) => {
          toast.info(`Descargando PDF ${current} de ${total}...`, { id: 'zip-progress' });
        },
      });

      toast.success(
        `ZIP creado: ${result.successCount} PDFs descargados${
          result.errorCount > 0 ? `, ${result.errorCount} fallidos` : ''
        }`,
        { id: 'zip-progress' }
      );
      deselectAllInvoices();
    } catch (error: any) {
      console.error('Error creating ZIP:', error);
      toast.error(error.message || 'Error al crear ZIP de PDFs');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Quick date presets
  const setDatePreset = (preset: 'today' | 'week' | 'month' | '3months') => {
    const now = new Date();
    const from = new Date();
    
    switch (preset) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        setDateFrom(from);
        setDateTo(now);
        break;
      case 'week':
        from.setDate(now.getDate() - 7);
        setDateFrom(from);
        setDateTo(now);
        break;
      case 'month':
        from.setMonth(now.getMonth() - 1);
        setDateFrom(from);
        setDateTo(now);
        break;
      case '3months':
        from.setMonth(now.getMonth() - 3);
        setDateFrom(from);
        setDateTo(now);
        break;
    }
  };

  const handleDownloadXML = (invoice: Invoice) => {
    if (invoice.xml_url) {
      window.open(invoice.xml_url, '_blank');
    } else {
      toast.error('XML no disponible');
    }
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, '_blank');
    } else {
      toast.error('PDF no disponible');
    }
  };

  const handleSendEmail = async (invoice: Invoice) => {
    try {
      setSendingEmailId(invoice.id);

      const response = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoice.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Factura enviada a ${data.recipient}`);
        loadInvoices(); // Reload to update emailed_at timestamp
      } else {
        toast.error(data.error || 'Error al enviar factura');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error al enviar factura por email');
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleCancelInvoice = (invoice: Invoice) => {
    setInvoiceToCancel(invoice);
    setShowCancelDialog(true);
  };

  const confirmCancelInvoice = async () => {
    if (!invoiceToCancel) return;

    try {
      setCancelingId(invoiceToCancel.id);
      
      const response = await fetch(`/api/invoices/${invoiceToCancel.id}/cancel`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motive: cancelMotive,
          reason: SAT_CANCELLATION_MOTIVES[cancelMotive],
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Factura cancelada exitosamente');
        loadInvoices();
      } else {
        toast.error(data.error || 'Error al cancelar factura');
      }
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast.error('Error al cancelar factura');
    } finally {
      setCancelingId(null);
      setShowCancelDialog(false);
      setInvoiceToCancel(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', variant: 'secondary' as const },
      issued: { label: 'Emitida', variant: 'default' as const },
      sent: { label: 'Enviada', variant: 'default' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.issued;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalFacturado = filteredInvoices
    .filter(inv => inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + inv.total, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-green-600" />
                Historial de Facturas
              </CardTitle>
              <CardDescription>
                Facturas electrónicas (CFDI) generadas
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
                {(dateFrom || dateTo || minAmount || maxAmount || patientSearch || selectedStatuses.length > 0 || selectedSeries.length > 0) && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {[dateFrom, dateTo, minAmount, maxAmount, patientSearch, ...selectedStatuses, ...selectedSeries].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              {filteredInvoices.length > 0 && (
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Facturado</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${totalFacturado.toLocaleString()}
                  </div>
                </div>
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="issued">Emitidas</SelectItem>
                  <SelectItem value="sent">Enviadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Rango de Fechas</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "dd MMM yyyy", { locale: es }) : "Desde"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <DayPicker
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "dd MMM yyyy", { locale: es }) : "Hasta"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <DayPicker
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setDatePreset('today')}>Hoy</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDatePreset('week')}>7d</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDatePreset('month')}>30d</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDatePreset('3months')}>90d</Button>
                  </div>
                </div>

                {/* Amount Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Rango de Montos</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Mínimo"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full"
                    />
                    <Input
                      type="number"
                      placeholder="Máximo"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Patient Search Filter */}
                {!patientId && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Buscar Paciente</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Nombre del paciente..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}

                {/* Status Filter (Multi-select) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estados</Label>
                  <div className="space-y-2">
                    {['issued', 'sent', 'cancelled'].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={(checked) => {
                            setSelectedStatuses(prev =>
                              checked
                                ? [...prev, status]
                                : prev.filter(s => s !== status)
                            );
                          }}
                        />
                        <label
                          htmlFor={`status-${status}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {status === 'issued' && 'Emitidas'}
                          {status === 'sent' && 'Enviadas'}
                          {status === 'cancelled' && 'Canceladas'}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Series Filter (Multi-select) */}
                {availableSeries.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Series</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {availableSeries.map((serie) => (
                        <div key={serie} className="flex items-center space-x-2">
                          <Checkbox
                            id={`serie-${serie}`}
                            checked={selectedSeries.includes(serie)}
                            onCheckedChange={(checked) => {
                              setSelectedSeries(prev =>
                                checked
                                  ? [...prev, serie]
                                  : prev.filter(s => s !== serie)
                              );
                            }}
                          />
                          <label
                            htmlFor={`serie-${serie}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer font-mono"
                          >
                            {serie}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Mostrando <span className="font-semibold">{filteredInvoices.length}</span> de <span className="font-semibold">{invoices.length}</span> facturas
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Receipt className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No hay facturas
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {statusFilter === 'all'
                  ? 'Aún no se han generado facturas para este paciente.'
                  : `No hay facturas con estado: ${statusFilter}`}
              </p>
            </div>
          ) : (
            <>
              {/* Bulk Actions Toolbar */}
              {selectedInvoices.size > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        {selectedInvoices.size} factura(s) seleccionada(s)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllInvoices}
                      className="text-blue-700 hover:text-blue-900"
                    >
                      Limpiar selección
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkSendEmail}
                      disabled={bulkProcessing}
                      className="flex items-center gap-2"
                    >
                      {bulkProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Enviar Emails
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkExportExcel}
                      className="flex items-center gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Exportar Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkDownloadPDF}
                      className="flex items-center gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      Descargar PDFs
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectAllInvoices();
                          } else {
                            deselectAllInvoices();
                          }
                        }}
                        aria-label="Seleccionar todas"
                      />
                    </TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Folio</TableHead>
                    <TableHead>UUID</TableHead>
                    {!patientId && <TableHead>Paciente</TableHead>}
                    <TableHead>RFC</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">IVA</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedInvoices.has(invoice.id)}
                          onCheckedChange={() => toggleSelectInvoice(invoice.id)}
                          aria-label={`Seleccionar factura ${invoice.serie}-${invoice.folio_number}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {new Date(invoice.fecha_emision).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {invoice.serie}-{invoice.folio_number}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-gray-600">
                          {invoice.uuid?.substring(0, 8)}...
                        </span>
                      </TableCell>
                      {!patientId && (
                        <TableCell>
                          {invoice.patient?.nombre} {invoice.patient?.apellido}
                        </TableCell>
                      )}
                      <TableCell>
                        <span className="font-mono text-sm">
                          {invoice.fiscal_data?.rfc}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        ${invoice.subtotal.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${invoice.iva.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${invoice.total.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadXML(invoice)}
                            disabled={!invoice.xml_url}
                            title="Descargar XML"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPDF(invoice)}
                            disabled={!invoice.pdf_url}
                            title="Descargar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendEmail(invoice)}
                            disabled={sendingEmailId === invoice.id || !invoice.xml_url || !invoice.pdf_url}
                            title={invoice.emailed_at ? 'Reenviar por Email' : 'Enviar por Email'}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {sendingEmailId === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                          {invoice.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelInvoice(invoice)}
                              disabled={cancelingId === invoice.id}
                              title="Cancelar Factura"
                              className="text-red-600 hover:text-red-700"
                            >
                              {cancelingId === invoice.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancel Invoice Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Cancelar Factura
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                ¿Está seguro que desea cancelar la factura{' '}
                <strong className="font-mono">
                  {invoiceToCancel?.serie}-{invoiceToCancel?.folio_number}
                </strong>
                ?
              </p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Motivo de cancelación (SAT):
                </label>
                <Select value={cancelMotive} onValueChange={(v) => setCancelMotive(v as typeof cancelMotive)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SAT_CANCELLATION_MOTIVES).map(([code, desc]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-gray-500">
                Esta acción no se puede deshacer. La factura será cancelada ante el SAT.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelInvoice}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelingId !== null}
            >
              {cancelingId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
