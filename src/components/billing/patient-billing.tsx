"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  FileText, 
  Download, 
  Eye, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  CreditCard,
  Receipt,
  Save,
  Plus,
  Building2,
  Mail
} from "lucide-react";
import ApiService from "@/lib/api-service";
import { apiPost, apiGet } from "@/lib/api";
import FiscalConfiguration from "./fiscal-configuration";

interface PatientBillingProps {
  patientId: number;
  patientName: string;
}

interface Patient {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  whatsapp?: string;
}

interface BillingSettings {
  id?: number;
  patient_id: number;
  rfc: string;
  razon_social: string;
  domicilio_fiscal: string;
  regimen_fiscal: string;
  uso_cfdi: string;
  forma_pago: string;
  metodo_pago: string;
  activo: boolean;
}

interface PendingTreatment {
  id: string | number; // Allow both string and number for composite IDs
  fecha: string;
  tratamiento_nombre: string;
  monto_pagado: number;
  metodo_pago: string;
  notas?: string;
  has_invoice: boolean;
  // Additional fields for tracking source
  record_id?: number;
  record_treatment_id?: number;
  treatment_id?: number;
}

interface Invoice {
  id: number;
  folio_fiscal?: string;
  status: string;
  total: number;
  fecha_creacion: string;
  fecha_timbrado?: string;
  fecha_cancelacion?: string;
  concepts: InvoiceConcept[];
  logs: InvoiceLog[];
}

interface InvoiceConcept {
  id: number;
  descripcion: string;
  cantidad: number;
  valor_unitario: number;
  importe: number;
}

interface InvoiceLog {
  id: number;
  accion: string;
  detalle?: string;
  fecha: string;
}

export default function PatientBilling({ patientId, patientName }: PatientBillingProps) {
  const [activeTab, setActiveTab] = useState("settings");
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState<{ [key: number]: boolean }>({});

  // Patient data state
  const [patient, setPatient] = useState<Patient | null>(null);
  // States for billing settings
  const [billingSettings, setBillingSettings] = useState<BillingSettings>({
    patient_id: patientId,
    rfc: "",
    razon_social: "",
    domicilio_fiscal: "",
    regimen_fiscal: "612", // Persona Física con Actividades Empresariales
    uso_cfdi: "G03", // Gastos en general
    forma_pago: "01", // Efectivo
    metodo_pago: "PUE", // Pago en una sola exhibición
    activo: true
  });

  // States for treatments and invoices
  const [pendingTreatments, setPendingTreatments] = useState<PendingTreatment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedTreatments, setSelectedTreatments] = useState<(string | number)[]>([]);

  useEffect(() => {
    loadBillingData();
  }, [patientId]);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      // Load patient data first
      console.log('[PatientBilling] Loading patient data for ID:', patientId);
      try {
        const patientResponse = await ApiService.getPatient(patientId);
        if (patientResponse.data) {
          console.log('[PatientBilling] Patient data loaded:', patientResponse.data);
          setPatient(patientResponse.data);
        }
      } catch (patientErr) {
        console.warn('[PatientBilling] Could not load patient data:', patientErr);
        // Continue even if patient data fails - set minimal patient data
        setPatient({
          id: patientId,
          nombre: patientName
        });
      }

      // Load billing settings (no patientId parameter needed)
      const settingsResponse = await ApiService.getBillingSettings();
      if (settingsResponse.data) {
        // Ensure all fields have default values to prevent controlled/uncontrolled input issues
        setBillingSettings({
          patient_id: patientId,
          rfc: settingsResponse.data.rfc || "",
          razon_social: settingsResponse.data.razon_social || "",
          domicilio_fiscal: settingsResponse.data.domicilio_fiscal || "",
          regimen_fiscal: settingsResponse.data.regimen_fiscal || "612",
          uso_cfdi: settingsResponse.data.uso_cfdi || "G03",
          forma_pago: settingsResponse.data.forma_pago || "01",
          metodo_pago: settingsResponse.data.metodo_pago || "PUE",
          activo: settingsResponse.data.activo ?? true,
          id: settingsResponse.data.id
        });
      }

      // Load pending treatments for this specific patient
      console.log('[PatientBilling] Loading treatments for patient:', patientId);
      const treatmentsResponse = await ApiService.getPendingTreatments(patientId);
      console.log('[PatientBilling] Treatments response:', treatmentsResponse);
      
      if (treatmentsResponse.data && treatmentsResponse.data.length > 0) {
        // Transform the response structure into flat list of treatments
        const patientData = treatmentsResponse.data.find((p: any) => p.patient_id === patientId) || treatmentsResponse.data[0];
        console.log('[PatientBilling] Patient data:', patientData);
        
        const safeTreatments: PendingTreatment[] = [];
        
        if (patientData && patientData.records) {
          patientData.records.forEach((record: any) => {
            // Simple record structure from our backend
            safeTreatments.push({
              id: record.id,
              fecha: record.fecha || new Date().toISOString(),
              tratamiento_nombre: record.treatment_name || 'Tratamiento sin nombre',
              monto_pagado: record.monto_pagado || 0,
              metodo_pago: record.metodo_pago || 'No especificado',
              notas: record.notas || '',
              has_invoice: false,
              record_id: record.id,
              treatment_id: record.treatment_id
            });
          });
        }
        
        console.log('[PatientBilling] Processed treatments:', safeTreatments);
        setPendingTreatments(safeTreatments);
      } else {
        // If no data or error, show empty list
        console.log('[PatientBilling] No treatments data received');
        setPendingTreatments([]);
      }

      // Load invoices for this patient
      console.log('[PatientBilling] Loading invoices for patient:', patientId);
      const invoicesResponse = await ApiService.getInvoices({ patient_id: patientId });
      console.log('[PatientBilling] Invoices response:', invoicesResponse);
      
      if (invoicesResponse.data) {
        console.log('[PatientBilling] Processing invoices:', invoicesResponse.data.length);
        // Map Tauri backend structure to frontend interface
        const safeInvoices = invoicesResponse.data.map((invoice: any) => ({
          id: invoice.id,
          folio_fiscal: invoice.cfdi_uuid || '', // Tauri uses cfdi_uuid
          status: invoice.status || 'pendiente',
          total: invoice.total_amount || 0, // Tauri uses total_amount
          fecha_creacion: invoice.created_at || new Date().toISOString(), // Tauri uses created_at
          fecha_timbrado: invoice.issue_date, // Tauri uses issue_date for timbrado date
          fecha_cancelacion: invoice.cancelled_at, // Tauri might use cancelled_at
          concepts: (invoice.concepts || []).map((concept: any, index: number) => ({
            id: concept.record_id || `concept-${invoice.id}-${index}`, // Tauri uses record_id
            descripcion: concept.concept || 'Sin descripción', // Tauri uses concept field
            cantidad: 1, // Default quantity
            valor_unitario: concept.amount || 0, // Tauri uses amount - ESTE ES EL MONTO REAL
            importe: concept.amount || 0 // Same as amount for total - ESTE ES EL MONTO REAL
          })),
          logs: [] // Tauri doesn't have logs yet, default to empty array
        }));
        console.log('[PatientBilling] Processed invoices:', safeInvoices);
        setInvoices(safeInvoices);
      } else {
        console.log('[PatientBilling] No invoices data received or error occurred');
        setInvoices([]);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar datos de facturación");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = billingSettings.id 
        ? await ApiService.updateBillingSettings(billingSettings.id, billingSettings)
        : await ApiService.createBillingSettings(billingSettings);

      if (response.error) {
        throw new Error(response.error);
      }

      setBillingSettings(response.data);
      setSuccess("Configuración de facturación guardada exitosamente");
    } catch (err: any) {
      setError(err.message || "Error al guardar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (selectedTreatments.length === 0) {
      setError("Selecciona al menos un tratamiento para facturar");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Extract treatment IDs from selected treatments (for Tauri backend)
      const treatmentIds: number[] = [];
      selectedTreatments.forEach((treatmentId) => {
        // Find the treatment to get its treatment_id
        const treatment = pendingTreatments.find(t => t.id === treatmentId);
        if (treatment && treatment.treatment_id && !treatmentIds.includes(treatment.treatment_id)) {
          treatmentIds.push(treatment.treatment_id);
        }
      });

      if (treatmentIds.length === 0) {
        throw new Error("No se pudieron obtener los IDs de los tratamientos seleccionados");
      }

      console.log('[PatientBilling] Creating invoice with treatment IDs:', treatmentIds);
      
      // Create invoice using Tauri backend structure
      const invoiceData = {
        patient_id: patientId,
        treatment_ids: treatmentIds,
        notes: `Factura creada desde ${treatmentIds.length} tratamiento(s)`,
        due_days: 30
      };

      const response = await ApiService.createInvoice(invoiceData);

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('[PatientBilling] Invoice created successfully:', response.data);
      setSuccess(`Factura #${response.data?.id || 'N/A'} creada exitosamente`);
      setSelectedTreatments([]);
      
      // Recargar datos para actualizar la lista
      console.log('[PatientBilling] Reloading data to show new invoice...');
      await loadBillingData();
      
      // 📧 AUTO-ENVÍO DE FACTURA POR EMAIL
      if (response.data?.id && patient?.email) {
        console.log('[PatientBilling] 📧 Auto-sending invoice to patient email:', patient.email);
        try {
          const emailResponse = await ApiService.sendInvoiceEmail(response.data.id, patient.email);
          if (emailResponse.error) {
            console.warn('[PatientBilling] Email send failed:', emailResponse.error);
            setSuccess(`Factura #${response.data?.id} creada exitosamente. Error al enviar email: ${emailResponse.error}`);
          } else {
            console.log('[PatientBilling] ✅ Email sent successfully:', emailResponse.data);
            setSuccess(`✅ Factura #${response.data?.id} creada y enviada por email a ${patient.email}`);
          }
        } catch (emailErr: any) {
          console.warn('[PatientBilling] Email send error:', emailErr);
          setSuccess(`Factura #${response.data?.id} creada exitosamente. Email no pudo enviarse automáticamente.`);
        }
      } else {
        if (!patient?.email) {
          console.log('[PatientBilling] ⚠️ Paciente no tiene email configurado - no enviando automáticamente');
          setSuccess(`Factura #${response.data?.id} creada exitosamente. Paciente no tiene email configurado.`);
        }
      }
      
      // Cambiar automáticamente al tab de historial de facturas para mostrar la nueva factura
      console.log('[PatientBilling] Switching to invoices tab...');
      setActiveTab("invoices");
      
      // Mostrar mensaje de éxito adicional después de cambiar tab
      setTimeout(() => {
        if (invoices.length > 0) {
          console.log('[PatientBilling] ✅ Nueva factura visible en historial');
        } else {
          console.log('[PatientBilling] ⚠️ Factura creada pero no visible en historial - verificar carga');
        }
      }, 100);
      
    } catch (err: any) {
      setError(err.message || "Error al crear factura");
    } finally {
      setLoading(false);
    }
  };

  const handleStampInvoice = async (invoiceId: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // TEMPORAL: Llamar directamente al backend Tauri para evitar problema de ruta de Next.js
      console.log(`[PatientBilling] Timbrar factura ${invoiceId} - llamando directamente al backend Tauri`);
      
      const result = await apiPost(`billing/invoices/${invoiceId}/stamp`, {});

      console.log('[PatientBilling] ✅ Factura timbrada exitosamente:', result);
      
      setSuccess(`✅ Factura timbrada exitosamente. UUID: ${result.cfdi_uuid || 'N/A'}`);
      await loadBillingData();
    } catch (err: any) {
      console.error('[PatientBilling] Error al timbrar factura:', err);
      setError(err.message || "Error al timbrar factura");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = async (invoiceId: number) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta factura?")) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await ApiService.cancelInvoice(invoiceId, "Cancelación solicitada por el usuario");

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccess("Factura cancelada exitosamente");
      await loadBillingData();
    } catch (err: any) {
      setError(err.message || "Error al cancelar factura");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: number, format: 'xml' | 'pdf') => {
    try {
      // TEMPORAL: Llamar directamente al backend Tauri para evitar problema de rutas de Next.js
      console.log(`[PatientBilling] Descargando ${format.toUpperCase()} para factura ${invoiceId} - llamando directamente al backend Tauri`);
      
      const response = await fetch(`/api/billing/invoices/${invoiceId}/${format}`, {
        method: 'GET',
        headers: {
          'Accept': format === 'xml' ? 'application/xml' : 'application/pdf',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => `Failed to download ${format.toUpperCase()}`);
        throw new Error(errorText);
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura_${invoiceId}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      console.log(`[PatientBilling] ✅ ${format.toUpperCase()} descargado exitosamente`);
    } catch (err: any) {
      console.error(`[PatientBilling] Error al descargar ${format.toUpperCase()}:`, err);
      setError(err.message || `Error al descargar ${format.toUpperCase()}`);
    }
  };

  const handleSendInvoiceEmail = async (invoiceId: number) => {
    // Prompt user for email address
    const email = prompt("Ingresa el email donde enviar la factura:");
    if (!email) {
      return; // User cancelled
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un email válido");
      return;
    }

    setEmailSending(prev => ({ ...prev, [invoiceId]: true }));
    setError(null);
    setSuccess(null);
    
    try {
      // TEMPORAL: Llamar directamente al backend Tauri para evitar problema de rutas de Next.js
      console.log(`[PatientBilling] Enviando factura ${invoiceId} por email a ${email} - llamando directamente al backend Tauri`);
      
      const result = await apiPost(`billing/invoices/${invoiceId}/email`, { email: email });

      console.log('[PatientBilling] ✅ Email enviado exitosamente:', result);
      setSuccess('✅ Factura enviada por correo exitosamente');
    } catch (err: any) {
      console.error('[PatientBilling] Error al enviar email:', err);
      setError(err.message || 'Error al enviar la factura por correo');
    } finally {
      setEmailSending(prev => ({ ...prev, [invoiceId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'borrador':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Borrador</Badge>;
      case 'timbrada':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Timbrada</Badge>;
      case 'cancelada':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Cancelada</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
          <Receipt className="w-5 h-5" />
          <span className="font-medium">Facturación Electrónica - {patientName}</span>
        </div>
        <p className="text-gray-600 mt-2">
          Gestiona la configuración fiscal y genera facturas electrónicas
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
          <span className="text-gray-600">Cargando datos de facturación...</span>
        </div>
      )}

      {/* Main Content - Only show when not loading */}
      {!loading && (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuración Fiscal
          </TabsTrigger>
          <TabsTrigger value="pac-config" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Configuración PAC
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Tratamientos por Facturar
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Historial de Facturas
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración Fiscal del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    value={billingSettings.rfc}
                    onChange={(e) => setBillingSettings({...billingSettings, rfc: e.target.value.toUpperCase()})}
                    placeholder="XAXX010101000"
                    className="uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="razon_social">Razón Social</Label>
                  <Input
                    id="razon_social"
                    value={billingSettings.razon_social}
                    onChange={(e) => setBillingSettings({...billingSettings, razon_social: e.target.value})}
                    placeholder="Nombre o razón social"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="domicilio_fiscal">Domicilio Fiscal</Label>
                <Textarea
                  id="domicilio_fiscal"
                  value={billingSettings.domicilio_fiscal}
                  onChange={(e) => setBillingSettings({...billingSettings, domicilio_fiscal: e.target.value})}
                  placeholder="Dirección fiscal completa"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="regimen_fiscal">Régimen Fiscal</Label>
                  <Select 
                    value={billingSettings.regimen_fiscal} 
                    onValueChange={(value) => setBillingSettings({...billingSettings, regimen_fiscal: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="612">612 - Persona Física con Actividades Empresariales</SelectItem>
                      <SelectItem value="605">605 - Sueldos y Salarios e Ingresos Asimilados</SelectItem>
                      <SelectItem value="606">606 - Arrendamiento</SelectItem>
                      <SelectItem value="608">608 - Demás ingresos</SelectItem>
                      <SelectItem value="610">610 - Residentes en el Extranjero sin Establecimiento Permanente en México</SelectItem>
                      <SelectItem value="611">611 - Ingresos por Dividendos</SelectItem>
                      <SelectItem value="614">614 - Ingresos por intereses</SelectItem>
                      <SelectItem value="607">607 - Régimen de Incorporación Fiscal</SelectItem>
                      <SelectItem value="629">629 - De los Regímenes Fiscales Preferentes</SelectItem>
                      <SelectItem value="630">630 - Enajenación de acciones en bolsa de valores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="uso_cfdi">Uso de CFDI</Label>
                  <Select 
                    value={billingSettings.uso_cfdi} 
                    onValueChange={(value) => setBillingSettings({...billingSettings, uso_cfdi: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="G03">G03 - Gastos en general</SelectItem>
                      <SelectItem value="G01">G01 - Adquisición de mercancías</SelectItem>
                      <SelectItem value="G02">G02 - Devoluciones, descuentos o bonificaciones</SelectItem>
                      <SelectItem value="I01">I01 - Construcciones</SelectItem>
                      <SelectItem value="I02">I02 - Mobilario y equipo de oficina por inversiones</SelectItem>
                      <SelectItem value="I03">I03 - Equipo de transporte</SelectItem>
                      <SelectItem value="I04">I04 - Equipo de computo y accesorios</SelectItem>
                      <SelectItem value="I05">I05 - Dados, troqueles, moldes, matrices y herramental</SelectItem>
                      <SelectItem value="I06">I06 - Comunicaciones telefónicas</SelectItem>
                      <SelectItem value="I07">I07 - Comunicaciones satelitales</SelectItem>
                      <SelectItem value="I08">I08 - Otra maquinaria y equipo</SelectItem>
                      <SelectItem value="D01">D01 - Honorarios médicos, dentales y gastos hospitalarios</SelectItem>
                      <SelectItem value="D02">D02 - Gastos médicos por incapacidad o discapacidad</SelectItem>
                      <SelectItem value="D03">D03 - Gastos funerales</SelectItem>
                      <SelectItem value="D04">D04 - Donativos</SelectItem>
                      <SelectItem value="D05">D05 - Intereses reales efectivamente pagados por créditos hipotecarios</SelectItem>
                      <SelectItem value="D06">D06 - Aportaciones voluntarias al SAR</SelectItem>
                      <SelectItem value="D07">D07 - Primas por seguros de gastos médicos</SelectItem>
                      <SelectItem value="D08">D08 - Gastos de transportación escolar obligatoria</SelectItem>
                      <SelectItem value="D09">D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones</SelectItem>
                      <SelectItem value="D10">D10 - Pagos por servicios educativos</SelectItem>
                      <SelectItem value="P01">P01 - Por definir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="forma_pago">Forma de Pago</Label>
                  <Select 
                    value={billingSettings.forma_pago} 
                    onValueChange={(value) => setBillingSettings({...billingSettings, forma_pago: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">01 - Efectivo</SelectItem>
                      <SelectItem value="02">02 - Cheque nominativo</SelectItem>
                      <SelectItem value="03">03 - Transferencia electrónica de fondos</SelectItem>
                      <SelectItem value="04">04 - Tarjeta de crédito</SelectItem>
                      <SelectItem value="05">05 - Monedero electrónico</SelectItem>
                      <SelectItem value="06">06 - Dinero electrónico</SelectItem>
                      <SelectItem value="08">08 - Vales de despensa</SelectItem>
                      <SelectItem value="12">12 - Dación en pago</SelectItem>
                      <SelectItem value="13">13 - Pago por subrogación</SelectItem>
                      <SelectItem value="14">14 - Pago por consignación</SelectItem>
                      <SelectItem value="15">15 - Condonación</SelectItem>
                      <SelectItem value="17">17 - Compensación</SelectItem>
                      <SelectItem value="23">23 - Novación</SelectItem>
                      <SelectItem value="24">24 - Confusión</SelectItem>
                      <SelectItem value="25">25 - Remisión de deuda</SelectItem>
                      <SelectItem value="26">26 - Prescripción o caducidad</SelectItem>
                      <SelectItem value="27">27 - A satisfacción del acreedor</SelectItem>
                      <SelectItem value="28">28 - Tarjeta de débito</SelectItem>
                      <SelectItem value="29">29 - Tarjeta de servicios</SelectItem>
                      <SelectItem value="30">30 - Aplicación de anticipos</SelectItem>
                      <SelectItem value="99">99 - Por definir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="metodo_pago">Método de Pago</Label>
                  <Select 
                    value={billingSettings.metodo_pago} 
                    onValueChange={(value) => setBillingSettings({...billingSettings, metodo_pago: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUE">PUE - Pago en una sola exhibición</SelectItem>
                      <SelectItem value="PPD">PPD - Pago en parcialidades o diferido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={billingSettings.activo}
                  onCheckedChange={(checked) => setBillingSettings({...billingSettings, activo: checked})}
                />
                <Label htmlFor="activo">Configuración activa</Label>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveSettings} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAC Configuration Tab */}
        <TabsContent value="pac-config" className="space-y-6">
          <FiscalConfiguration 
            onSettingsUpdate={() => {
              // Opcional: actualizar algún estado o mostrar notificación
              setSuccess("Configuración PAC actualizada exitosamente");
            }}
          />
        </TabsContent>

        {/* Pending Treatments Tab */}
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Tratamientos Pendientes de Facturar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingTreatments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay tratamientos pendientes de facturar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTreatments.map((treatment) => (
                    <div key={String(treatment.id)} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedTreatments.includes(treatment.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTreatments([...selectedTreatments, treatment.id]);
                          } else {
                            setSelectedTreatments(selectedTreatments.filter(id => id !== treatment.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{treatment.tratamiento_nombre || 'Tratamiento'}</h4>
                          <span className="font-bold text-green-600">
                            ${(treatment.monto_pagado || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span>Fecha: {new Date(treatment.fecha).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span>Método: {treatment.metodo_pago}</span>
                          {treatment.notas && (
                            <>
                              <span className="mx-2">•</span>
                              <span>{treatment.notas}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedTreatments.length > 0 && (
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleCreateInvoice} disabled={loading}>
                        <Plus className="w-4 h-4 mr-2" />
                        {loading ? "Creando..." : `Crear Factura (${selectedTreatments.length} tratamiento${selectedTreatments.length > 1 ? 's' : ''})`}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Historial de Facturas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay facturas creadas para este paciente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <Card key={invoice.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <h4 className="font-medium">
                              Factura #{invoice.id}
                              {invoice.folio_fiscal && (
                                <span className="text-sm text-gray-500 ml-2">
                                  Folio: {invoice.folio_fiscal}
                                </span>
                              )}
                            </h4>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              ${((invoice.concepts || []).reduce((sum, concept) => sum + (concept.importe || 0), 0) || 0).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(invoice.fecha_creacion).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {/* Concepts */}
                        <div className="space-y-2 mb-4">
                          <h5 className="font-medium text-sm">Conceptos:</h5>
                          {(invoice.concepts || []).map((concept) => (
                            <div key={`concept-${concept.id}-${invoice.id}`} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                              <span>{concept.descripcion || 'Concepto'}</span>
                              <span>
                                {concept.cantidad || 0} x ${(concept.valor_unitario || 0).toLocaleString()} = ${(concept.importe || 0).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex gap-2">
                            {/* Botones para facturas borrador/pendientes */}
                            {(invoice.status === 'borrador' || invoice.status === 'draft' || invoice.status === 'pendiente') && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleStampInvoice(invoice.id)}
                                  disabled={loading}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Timbrar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                  onClick={() => handleSendInvoiceEmail(invoice.id)}
                                  disabled={emailSending[invoice.id] || loading}
                                >
                                  <Mail className="w-4 h-4 mr-1" />
                                  {emailSending[invoice.id] ? 'Enviando...' : 'Enviar por Email'}
                                </Button>
                              </>
                            )}
                            
                            {/* Botones para facturas timbradas */}
                            {invoice.status === 'timbrada' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDownloadInvoice(invoice.id, 'xml')}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  XML
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDownloadInvoice(invoice.id, 'pdf')}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  PDF
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                  onClick={() => handleSendInvoiceEmail(invoice.id)}
                                  disabled={emailSending[invoice.id] || loading}
                                >
                                  <Mail className="w-4 h-4 mr-1" />
                                  {emailSending[invoice.id] ? 'Enviando...' : 'Enviar por Email'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleCancelInvoice(invoice.id)}
                                  disabled={loading}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancelar
                                </Button>
                              </>
                            )}
                          </div>
                          
                          {/* Status timestamps */}
                          <div className="text-xs text-gray-500">
                            {invoice.fecha_timbrado && (
                              <div>Timbrada: {new Date(invoice.fecha_timbrado).toLocaleString()}</div>
                            )}
                            {invoice.fecha_cancelacion && (
                              <div>Cancelada: {new Date(invoice.fecha_cancelacion).toLocaleString()}</div>
                            )}
                          </div>
                        </div>

                        {/* Logs */}
                        {invoice.logs.length > 0 && (
                          <details className="mt-4">
                            <summary className="cursor-pointer text-sm font-medium">
                              Ver historial ({invoice.logs.length} eventos)
                            </summary>
                            <div className="mt-2 space-y-1">
                              {(invoice.logs || []).map((log) => (
                                <div key={`log-${log.id}-${invoice.id}`} className="text-xs p-2 bg-gray-50 rounded">
                                  <div className="font-medium">{log.accion}</div>
                                  {log.detalle && <div className="text-gray-600">{log.detalle}</div>}
                                  <div className="text-gray-500">
                                    {new Date(log.fecha).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
