'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  SAT_FORMA_PAGO,
  SAT_METODO_PAGO,
  SAT_USO_CFDI,
  SAT_REGIMEN_FISCAL,
  isValidRFC,
  isValidCodigoPostal,
} from '@/lib/types/facturama';
import type { PatientFiscalData, PatientFiscalDataInput } from '@/lib/types/facturama';

interface GenerateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  records: Array<{
    id: string;
    treatment_name: string;
    price: number;
    fecha: string;
  }>;
  onSuccess?: (invoiceId: string, xmlUrl?: string, pdfUrl?: string) => void;
}

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: number) => currencyFormatter.format(value || 0);

export default function GenerateInvoiceModal({
  open,
  onOpenChange,
  patientId,
  patientName,
  patientEmail,
  records,
  onSuccess,
}: GenerateInvoiceModalProps) {
  const [step, setStep] = useState<'fiscal-data' | 'invoice'>('fiscal-data');
  const [fiscalDataList, setFiscalDataList] = useState<PatientFiscalData[]>([]);
  const [selectedFiscalDataId, setSelectedFiscalDataId] = useState<string | null>(null);
  const [showNewFiscalForm, setShowNewFiscalForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [newFiscalData, setNewFiscalData] = useState<PatientFiscalDataInput>({
    patient_id: patientId,
    rfc: '',
    razon_social: '',
    regimen_fiscal: '612',
    codigo_postal: '',
    uso_cfdi: 'D01', // Honorarios médicos
    email_facturacion: patientEmail || '',
    is_default: true,
  });

  const [invoiceData, setInvoiceData] = useState({
    forma_pago: '04', // Tarjeta de crédito
    metodo_pago: 'PUE', // Pago en una exhibición
    notas: '',
    send_email: true,
  });

  useEffect(() => {
    if (open) {
      loadFiscalData();
      setStep('fiscal-data');
      setShowNewFiscalForm(false);
      setInvoiceData({
        forma_pago: '04',
        metodo_pago: 'PUE',
        notas: '',
        send_email: true,
      });
      setNewFiscalData({
        patient_id: patientId,
        rfc: '',
        razon_social: patientName,
        regimen_fiscal: '612',
        codigo_postal: '',
        uso_cfdi: 'D01',
        email_facturacion: patientEmail || '',
        is_default: true,
      });
    }
  }, [open, patientId, patientName, patientEmail]);

  const loadFiscalData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/fiscal-data`);
      if (response.ok) {
        const data = await response.json();
        setFiscalDataList(data.fiscal_data || []);
        
        // Auto-select default fiscal data
        const defaultData = data.fiscal_data?.find((fd: PatientFiscalData) => fd.is_default);
        if (defaultData) {
          setSelectedFiscalDataId(defaultData.id);
        }
        
        // If no fiscal data exists, show form
        if (!data.fiscal_data || data.fiscal_data.length === 0) {
          setShowNewFiscalForm(true);
        }
      }
    } catch (error) {
      console.error('Error loading fiscal data:', error);
      toast.error('Error al cargar datos fiscales');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewFiscalData = async () => {
    // Validate
    if (!isValidRFC(newFiscalData.rfc)) {
      toast.error('RFC inválido');
      return;
    }
    if (!isValidCodigoPostal(newFiscalData.codigo_postal)) {
      toast.error('Código postal inválido (5 dígitos)');
      return;
    }
    if (!newFiscalData.razon_social) {
      toast.error('La razón social es requerida');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/fiscal-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFiscalData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Datos fiscales guardados');
        setFiscalDataList([...fiscalDataList, data.fiscal_data]);
        setSelectedFiscalDataId(data.fiscal_data.id);
        setShowNewFiscalForm(false);
      } else {
        toast.error(data.error || 'Error al guardar datos fiscales');
      }
    } catch (error) {
      console.error('Error saving fiscal data:', error);
      toast.error('Error al guardar datos fiscales');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedFiscalDataId) {
      toast.error('Seleccione los datos fiscales del paciente');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          fiscal_data_id: selectedFiscalDataId,
          record_ids: records.map(r => r.id),
          forma_pago: invoiceData.forma_pago,
          metodo_pago: invoiceData.metodo_pago,
          notas: invoiceData.notas || undefined,
          send_email: invoiceData.send_email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Factura generada exitosamente');
        onSuccess?.(data.invoice_id, data.xml_url, data.pdf_url);
        onOpenChange(false);
      } else {
        toast.error(data.error || 'Error al generar factura');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Error al generar factura');
    } finally {
      setGenerating(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = records.reduce((sum, r) => sum + r.price, 0);
    const iva = subtotal * 0.16;
    return { subtotal, iva, total: subtotal + iva };
  };

  const { subtotal, iva, total } = calculateTotal();
  const selectedFiscalData = fiscalDataList.find((fd) => fd.id === selectedFiscalDataId) || null;

  const applyDemoFiscalTemplate = () => {
    setNewFiscalData((previous) => ({
      ...previous,
      patient_id: patientId,
      rfc: 'XAXX010101000',
      razon_social: patientName,
      regimen_fiscal: '612',
      codigo_postal: '01000',
      uso_cfdi: 'D01',
      email_facturacion: patientEmail || previous.email_facturacion || '',
      is_default: true,
    }));
    toast.success('Plantilla demo cargada');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border border-white/15 bg-[#061025]/95 text-white backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Generar Factura (CFDI)</DialogTitle>
          <DialogDescription className="text-white/70">
            Paciente: {patientName} • {records.length} tratamiento{records.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {step === 'fiscal-data' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Datos Fiscales del Paciente</Label>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  {fiscalDataList.length > 0 && !showNewFiscalForm && (
                    <Select value={selectedFiscalDataId || ''} onValueChange={setSelectedFiscalDataId}>
                      <SelectTrigger className="border-white/20 bg-white/5 text-white">
                        <SelectValue placeholder="Seleccione datos fiscales" />
                      </SelectTrigger>
                      <SelectContent className="border-white/20 bg-slate-950 text-white">
                        {fiscalDataList.map((fd) => (
                          <SelectItem key={fd.id} value={fd.id}>
                            {fd.rfc} - {fd.razon_social}
                            {fd.is_default && ' (Predeterminado)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {!showNewFiscalForm && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewFiscalForm(true)}
                      className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Nuevos Datos Fiscales
                    </Button>
                  )}

                  {showNewFiscalForm && (
                    <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-white">Nuevos Datos Fiscales</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={applyDemoFiscalTemplate}
                          className="border-cyan-300/40 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Usar plantilla demo
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="rfc" className="text-white/80">RFC *</Label>
                          <Input
                            id="rfc"
                            value={newFiscalData.rfc}
                            onChange={(e) => setNewFiscalData({ ...newFiscalData, rfc: e.target.value.toUpperCase() })}
                            placeholder="XAXX010101000"
                            maxLength={13}
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="codigo_postal" className="text-white/80">Código Postal *</Label>
                          <Input
                            id="codigo_postal"
                            value={newFiscalData.codigo_postal}
                            onChange={(e) => setNewFiscalData({ ...newFiscalData, codigo_postal: e.target.value })}
                            placeholder="12345"
                            maxLength={5}
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="razon_social" className="text-white/80">Razón Social / Nombre *</Label>
                        <Input
                          id="razon_social"
                          value={newFiscalData.razon_social}
                          onChange={(e) => setNewFiscalData({ ...newFiscalData, razon_social: e.target.value })}
                          placeholder="Nombre completo o razón social"
                          className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="regimen_fiscal" className="text-white/80">Régimen Fiscal *</Label>
                          <Select
                            value={newFiscalData.regimen_fiscal}
                            onValueChange={(value) => setNewFiscalData({ ...newFiscalData, regimen_fiscal: value })}
                          >
                            <SelectTrigger className="border-white/20 bg-white/5 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-white/20 bg-slate-950 text-white">
                              {Object.entries(SAT_REGIMEN_FISCAL).map(([code, desc]) => (
                                <SelectItem key={code} value={code}>
                                  {code} - {desc.substring(0, 40)}...
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="uso_cfdi" className="text-white/80">Uso de CFDI *</Label>
                          <Select
                            value={newFiscalData.uso_cfdi}
                            onValueChange={(value) => setNewFiscalData({ ...newFiscalData, uso_cfdi: value })}
                          >
                            <SelectTrigger className="border-white/20 bg-white/5 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-white/20 bg-slate-950 text-white">
                              {Object.entries(SAT_USO_CFDI).map(([code, desc]) => (
                                <SelectItem key={code} value={code}>
                                  {code} - {desc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email_facturacion" className="text-white/80">Email para Facturación</Label>
                        <Input
                          id="email_facturacion"
                          type="email"
                          value={newFiscalData.email_facturacion}
                          onChange={(e) => setNewFiscalData({ ...newFiscalData, email_facturacion: e.target.value })}
                          placeholder="email@example.com"
                          className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="button" onClick={handleSaveNewFiscalData} disabled={loading} className="border-0 bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 text-black hover:from-emerald-200 hover:via-cyan-200 hover:to-sky-200">
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Guardar Datos Fiscales
                        </Button>
                        {fiscalDataList.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNewFiscalForm(false)}
                            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedFiscalData && !showNewFiscalForm && (
                    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/80">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Vista previa fiscal</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <p><span className="text-white/55">RFC:</span> {selectedFiscalData.rfc}</p>
                        <p><span className="text-white/55">CP:</span> {selectedFiscalData.codigo_postal}</p>
                        <p className="md:col-span-2"><span className="text-white/55">Razón social:</span> {selectedFiscalData.razon_social}</p>
                        <p><span className="text-white/55">Uso CFDI:</span> {selectedFiscalData.uso_cfdi}</p>
                        <p><span className="text-white/55">Régimen:</span> {selectedFiscalData.regimen_fiscal}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {selectedFiscalDataId && !showNewFiscalForm && (
              <Button onClick={() => setStep('invoice')} className="w-full border-0 bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 text-black hover:from-emerald-200 hover:via-cyan-200 hover:to-sky-200">
                Continuar
              </Button>
            )}
          </div>
        )}

        {step === 'invoice' && (
          <div className="space-y-4 py-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep('fiscal-data')}
              className="text-white/70 hover:bg-white/10 hover:text-white"
            >
              ← Volver
            </Button>

            {/* Treatment Summary */}
            <div className="space-y-2 rounded-2xl border border-white/15 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Tratamientos a Facturar</h3>
              {records.map((record) => (
                <div key={record.id} className="flex justify-between text-sm">
                  <span className="text-white/80">{record.treatment_name}</span>
                  <span className="font-mono text-white">{formatCurrency(record.price)}</span>
                </div>
              ))}
              <div className="space-y-1 border-t border-white/10 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Subtotal:</span>
                  <span className="font-mono text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">IVA (16%):</span>
                  <span className="font-mono text-white">{formatCurrency(iva)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-white">Total:</span>
                  <span className="font-mono text-cyan-200">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {selectedFiscalData && (
              <div className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 text-sm text-white/80">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/80">Se facturará a</p>
                <p className="mt-2 text-base font-semibold text-white">{selectedFiscalData.razon_social}</p>
                <p className="text-cyan-100">{selectedFiscalData.rfc} • CP {selectedFiscalData.codigo_postal}</p>
              </div>
            )}

            {/* Invoice Options */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forma_pago" className="text-white/80">Forma de Pago *</Label>
                <Select
                  value={invoiceData.forma_pago}
                  onValueChange={(value) => setInvoiceData({ ...invoiceData, forma_pago: value })}
                >
                  <SelectTrigger className="border-white/20 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-slate-950 text-white">
                    {Object.entries(SAT_FORMA_PAGO).map(([code, desc]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodo_pago" className="text-white/80">Método de Pago *</Label>
                <Select
                  value={invoiceData.metodo_pago}
                  onValueChange={(value) => setInvoiceData({ ...invoiceData, metodo_pago: value })}
                >
                  <SelectTrigger className="border-white/20 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-slate-950 text-white">
                    {Object.entries(SAT_METODO_PAGO).map(([code, desc]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas" className="text-white/80">Notas / Observaciones</Label>
                <Textarea
                  id="notas"
                  value={invoiceData.notas}
                  onChange={(e) => setInvoiceData({ ...invoiceData, notas: e.target.value })}
                  placeholder="Información adicional..."
                  rows={3}
                  className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-4">
                <div>
                  <p className="text-sm font-semibold text-white">Enviar CFDI por email</p>
                  <p className="text-xs text-white/65">Si el paciente tiene correo fiscal, se enviará PDF/XML automáticamente.</p>
                </div>
                <Switch
                  checked={invoiceData.send_email}
                  onCheckedChange={(checked) => setInvoiceData({ ...invoiceData, send_email: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleGenerateInvoice}
                disabled={generating}
                className="w-full border-0 bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 text-black hover:from-emerald-200 hover:via-cyan-200 hover:to-sky-200"
              >
                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generar Factura (CFDI)
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
