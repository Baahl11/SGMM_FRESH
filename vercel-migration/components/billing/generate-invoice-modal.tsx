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
import { Loader2, Plus, Download } from 'lucide-react';
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
    }
  }, [open, patientId]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Factura (CFDI)</DialogTitle>
          <DialogDescription>
            Paciente: {patientName} • {records.length} tratamiento{records.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {step === 'fiscal-data' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Datos Fiscales del Paciente</Label>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  {fiscalDataList.length > 0 && !showNewFiscalForm && (
                    <Select value={selectedFiscalDataId || ''} onValueChange={setSelectedFiscalDataId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione datos fiscales" />
                      </SelectTrigger>
                      <SelectContent>
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
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Nuevos Datos Fiscales
                    </Button>
                  )}

                  {showNewFiscalForm && (
                    <div className="space-y-4 border p-4 rounded-lg">
                      <h3 className="font-semibold">Nuevos Datos Fiscales</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="rfc">RFC *</Label>
                          <Input
                            id="rfc"
                            value={newFiscalData.rfc}
                            onChange={(e) => setNewFiscalData({ ...newFiscalData, rfc: e.target.value.toUpperCase() })}
                            placeholder="XAXX010101000"
                            maxLength={13}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="codigo_postal">Código Postal *</Label>
                          <Input
                            id="codigo_postal"
                            value={newFiscalData.codigo_postal}
                            onChange={(e) => setNewFiscalData({ ...newFiscalData, codigo_postal: e.target.value })}
                            placeholder="12345"
                            maxLength={5}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="razon_social">Razón Social / Nombre *</Label>
                        <Input
                          id="razon_social"
                          value={newFiscalData.razon_social}
                          onChange={(e) => setNewFiscalData({ ...newFiscalData, razon_social: e.target.value })}
                          placeholder="Nombre completo o razón social"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="regimen_fiscal">Régimen Fiscal *</Label>
                          <Select
                            value={newFiscalData.regimen_fiscal}
                            onValueChange={(value) => setNewFiscalData({ ...newFiscalData, regimen_fiscal: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(SAT_REGIMEN_FISCAL).map(([code, desc]) => (
                                <SelectItem key={code} value={code}>
                                  {code} - {desc.substring(0, 40)}...
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="uso_cfdi">Uso de CFDI *</Label>
                          <Select
                            value={newFiscalData.uso_cfdi}
                            onValueChange={(value) => setNewFiscalData({ ...newFiscalData, uso_cfdi: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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
                        <Label htmlFor="email_facturacion">Email para Facturación</Label>
                        <Input
                          id="email_facturacion"
                          type="email"
                          value={newFiscalData.email_facturacion}
                          onChange={(e) => setNewFiscalData({ ...newFiscalData, email_facturacion: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="button" onClick={handleSaveNewFiscalData} disabled={loading}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Guardar Datos Fiscales
                        </Button>
                        {fiscalDataList.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNewFiscalForm(false)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {selectedFiscalDataId && !showNewFiscalForm && (
              <Button onClick={() => setStep('invoice')} className="w-full">
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
            >
              ← Volver
            </Button>

            {/* Treatment Summary */}
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">Tratamientos a Facturar</h3>
              {records.map((record) => (
                <div key={record.id} className="flex justify-between text-sm">
                  <span>{record.treatment_name}</span>
                  <span className="font-mono">${record.price.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA (16%):</span>
                  <span className="font-mono">${iva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="font-mono">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Invoice Options */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forma_pago">Forma de Pago *</Label>
                <Select
                  value={invoiceData.forma_pago}
                  onValueChange={(value) => setInvoiceData({ ...invoiceData, forma_pago: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SAT_FORMA_PAGO).map(([code, desc]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodo_pago">Método de Pago *</Label>
                <Select
                  value={invoiceData.metodo_pago}
                  onValueChange={(value) => setInvoiceData({ ...invoiceData, metodo_pago: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SAT_METODO_PAGO).map(([code, desc]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas / Observaciones</Label>
                <Textarea
                  id="notas"
                  value={invoiceData.notas}
                  onChange={(e) => setInvoiceData({ ...invoiceData, notas: e.target.value })}
                  placeholder="Información adicional..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleGenerateInvoice}
                disabled={generating}
                className="w-full"
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
