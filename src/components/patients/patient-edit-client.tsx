"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, User, Stethoscope, CreditCard, Plus, AlertCircle, Users, FileText } from "lucide-react";
import { PatientWithTreatmentForm } from "@/components/patients/patient-with-treatment-form";
import MultiTreatmentForm from "@/components/patients/multi-treatment-form";
import PatientBilling from "@/components/billing/patient-billing";
import ApiService from "@/lib/api-service";
import simpleCalendarService from "@/lib/google-calendar";

interface PatientWithTreatmentData {
  // Datos del paciente
  nombre: string;
  fecha_nacimiento: string;
  telefono: string;
  email: string;
  direccion: string;
  requiere_factura: boolean;
  
  // Tratamiento realizado
  tratamiento_realizado_id: string;
  fecha_tratamiento: string;
  monto_pagado: number;
  costo_unitario: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  tipo_tarjeta?: 'bbva' | 'banamex' | 'amex' | 'openpay' | 'otros';
  meses_sin_intereses?: number;
  
  // Campos de cálculo de comisiones (opcionales)
  comision_monto?: number;
  tasa_comision?: number;
  monto_neto?: number;
  ganancia?: number;
  
  // Tratamiento futuro
  tratamiento_futuro_id?: string;
  fecha_proxima_cita?: string;
  hora_proxima_cita?: string;
  
  // Notas
  notas: string;
  bundle_items?: string[];
  
  // Campos adicionales para funcionalidad completa
  tratamiento?: {
    id: string;
    nombre: string;
    precio: number;
    comision_porcentaje: number;
  };
}

interface Patient {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  direccion?: string;
  requiere_factura?: boolean;
}

interface Treatment {
  id: string;
  nombre: string;
  precio: number;
  comision_porcentaje: number;
}

interface MultiTreatment {
  treatment_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  commission_percentage: number;
  commission_amount: number;
  notes?: string;
}

interface BundleItem {
  treatment_id: string;
  quantity: number;
}

export default function PatientEditClient() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id as string;

  const [activeTab, setActiveTab] = useState("single");
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patientTreatments, setPatientTreatments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
      loadTreatments();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getPatient(parseInt(patientId));
      
      if (response.data && !response.error) {
        setPatient(response.data);
        
        // Cargar tratamientos del paciente
        const treatmentsResponse = await ApiService.getRecords(parseInt(patientId));
        if (treatmentsResponse.data && !treatmentsResponse.error) {
          setPatientTreatments(treatmentsResponse.data || []);
        }
      } else {
        setError('No se pudo cargar la información del paciente');
      }
    } catch (err) {
      console.error('Error loading patient:', err);
      setError('Error al cargar el paciente');
    } finally {
      setLoading(false);
    }
  };

  const loadTreatments = async () => {
    try {
      const response = await ApiService.getTreatments();
      if (response.data && !response.error) {
        setTreatments(response.data);
      }
    } catch (err) {
      console.error('Error loading treatments:', err);
    }
  };

  const handleSingleTreatmentSubmit = async (data: PatientWithTreatmentData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Actualizar datos del paciente
      const patientUpdateData = {
        nombre: data.nombre,
        fecha_nacimiento: data.fecha_nacimiento,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
        requiere_factura: data.requiere_factura
      };

      const patientResponse = await ApiService.updatePatient(parseInt(patientId), patientUpdateData);
      
      if (patientResponse.error) {
        throw new Error('Error al actualizar el paciente');
      }

      // Crear registro de tratamiento
      const treatmentData = {
        patient_id: parseInt(patientId),
        treatment_id: data.tratamiento_realizado_id,
        fecha_tratamiento: data.fecha_tratamiento,
        monto_pagado: data.monto_pagado,
        costo_unitario: data.costo_unitario,
        metodo_pago: data.metodo_pago,
        comision_porcentaje: data.tasa_comision || 0,
        comision_monto: data.comision_monto || 0,
        notas: data.notas || ''
      };

      const treatmentResponse = await ApiService.createRecord(treatmentData);
      
      if (treatmentResponse.error) {
        throw new Error('Error al guardar el tratamiento');
      }

      // Crear evento en Google Calendar si está disponible
      try {
        const selectedTreatment = treatments.find(t => t.id === data.tratamiento_realizado_id);
        if (selectedTreatment && simpleCalendarService) {
          const calendarEvent = {
            title: `Tratamiento: ${selectedTreatment.nombre}`,
            description: `Paciente: ${data.nombre}\nTratamiento: ${selectedTreatment.nombre}\nMonto: $${data.monto_pagado}`,
            startDateTime: new Date(data.fecha_tratamiento).toISOString(),
            endDateTime: new Date(new Date(data.fecha_tratamiento).getTime() + (120 * 60 * 1000)).toISOString(), // 2 horas después
            patientEmail: data.email,
            patientName: data.nombre,
            patientPhone: data.telefono,
            location: 'Consultorio Médico'
          };
          
          simpleCalendarService.openCalendarEvent(calendarEvent);
        }
      } catch (calendarError) {
        console.warn('No se pudo crear el evento en Google Calendar:', calendarError);
        // No fallar si Google Calendar no está disponible
      }

      setSuccess('Paciente y tratamiento guardados exitosamente');
      
      // Recargar datos
      await loadPatientData();
      
      // Redirigir después de un momento
      setTimeout(() => {
        router.push('/patients');
      }, 2000);

    } catch (err: any) {
      console.error('Error saving data:', err);
      setError(err.message || 'Error al guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleMultiTreatmentSubmit = async (treatments: MultiTreatment[], bundleItems: BundleItem[] = []) => {
    try {
      setLoading(true);
      setError(null);

      // Crear registros individuales para cada tratamiento
      for (const treatment of treatments) {
        const treatmentData = {
          patient_id: parseInt(patientId),
          treatment_id: treatment.treatment_id,
          fecha_tratamiento: new Date().toISOString().split('T')[0],
          monto_pagado: treatment.total_price,
          costo_unitario: treatment.unit_price,
          metodo_pago: 'efectivo', // Por defecto
          comision_porcentaje: treatment.commission_percentage || 0,
          comision_monto: treatment.commission_amount || 0,
          notas: treatment.notes || ''
        };

        const response = await ApiService.createRecord(treatmentData);
        
        if (response.error) {
          throw new Error(`Error al guardar el tratamiento: ${treatment.treatment_id}`);
        }
      }

      // Si hay bundle items, crear el bundle
      if (bundleItems.length > 0) {
        // Para bundles, usar una API específica si existe o simplemente registrar como nota
        console.log('Bundle items to create:', bundleItems);
        // Por ahora solo loggeamos, implementar después la API de bundles si es necesario
      }

      setSuccess('Tratamientos múltiples guardados exitosamente');
      
      // Recargar datos
      await loadPatientData();

    } catch (err: any) {
      console.error('Error saving multi-treatments:', err);
      setError(err.message || 'Error al guardar los tratamientos múltiples');
    } finally {
      setLoading(false);
    }
  };

  const handleBillingSubmit = async (billingData: any) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar facturación cuando la API esté lista
      console.log('Billing data:', billingData);
      setSuccess('Funcionalidad de facturación en desarrollo');

    } catch (err: any) {
      console.error('Error processing billing:', err);
      setError(err.message || 'Error al procesar la facturación');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando datos del paciente...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push('/patients')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Pacientes
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/patients')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Paciente</h1>
            {patient && (
              <p className="text-gray-600 mt-1">
                {patient.nombre} - ID: {patient.id}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            <Users className="w-4 h-4 mr-1" />
            Paciente Activo
          </Badge>
          {patientTreatments.length > 0 && (
            <Badge variant="outline" className="px-3 py-1">
              <FileText className="w-4 h-4 mr-1" />
              {patientTreatments.length} Tratamiento{patientTreatments.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Editar Datos + Tratamiento
          </TabsTrigger>
          <TabsTrigger value="multiple" className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Tratamientos Múltiples
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Facturación
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Editar Datos del Paciente + Añadir Tratamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient && (
                <PatientWithTreatmentForm
                  initialData={patient}
                  patientRecords={patientTreatments}
                  onSubmit={handleSingleTreatmentSubmit}
                  patientId={parseInt(patientId)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multiple" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Tratamientos Múltiples y Bundles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultiTreatmentForm
                patientId={parseInt(patientId)}
                onSubmit={handleMultiTreatmentSubmit}
                onCancel={() => setActiveTab("single")}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Sistema de Facturación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient && (
                <div className="text-center py-8">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sistema de Facturación</h3>
                  <p className="text-gray-600">Paciente: {patient.nombre}</p>
                  <p className="text-sm text-gray-500 mt-2">Funcionalidad en desarrollo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Historial de Tratamientos */}
      {patientTreatments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historial de Tratamientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patientTreatments.map((treatment: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Tratamiento</p>
                      <p className="font-medium">{treatment.treatment_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fecha</p>
                      <p className="font-medium">{treatment.fecha_tratamiento || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monto</p>
                      <p className="font-medium">${treatment.monto_pagado || 0}</p>
                    </div>
                  </div>
                  {treatment.notas && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Notas</p>
                      <p className="text-sm">{treatment.notas}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
