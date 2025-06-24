"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, User, Stethoscope, CreditCard, Plus, AlertCircle, Users } from "lucide-react";
import { PatientWithTreatmentForm } from "@/components/patients/patient-with-treatment-form";
import MultiTreatmentForm from "@/components/patients/multi-treatment-form";
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
    // Tratamiento futuro
  tratamiento_futuro_id?: string;
  fecha_proxima_cita?: string;
  hora_proxima_cita?: string;
  
  // Notas
  notas: string;
}

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("edit");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (params.id) {
      fetchPatientData(parseInt(params.id as string));
    }
  }, [params.id]);

  const fetchPatientData = async (id: number) => {
    try {
      setIsLoading(true);
      // Cargar datos del paciente
      const patientResponse = await ApiService.getPatient(id);
      if (patientResponse.data) {
        setPatient(patientResponse.data);
      }

      // Cargar registros del paciente
      const recordsResponse = await ApiService.getRecordsWithNames(id);
      if (recordsResponse.data) {
        setPatientRecords(recordsResponse.data);
      }
    } catch (error) {
      console.error("Error al cargar los datos del paciente:", error);
      setError("Error al cargar los datos del paciente");
    } finally {
      setIsLoading(false);
    }
  };  const handleSubmit = async (data: PatientWithTreatmentData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Actualizar datos del paciente
      const patientData = {
        nombre: data.nombre,
        fecha_nacimiento: data.fecha_nacimiento,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
        requiere_factura: data.requiere_factura
      };
      
      await ApiService.updatePatient(parseInt(params.id as string), patientData);
      
      // 2. Si hay tratamiento realizado, crear un nuevo registro con cálculos
      if (data.tratamiento_realizado_id && data.monto_pagado > 0) {
        // Calcular comisiones y ganancia
        const { calcularGananciaNeta } = await import("@/lib/payment");
        const calculation = calcularGananciaNeta(
          data.monto_pagado,
          data.costo_unitario,
          data.metodo_pago,
          data.tipo_tarjeta,
          data.meses_sin_intereses || 0
        );

        const recordData = {
          patient_id: parseInt(params.id as string),
          treatment_id: parseInt(data.tratamiento_realizado_id),
          fecha: new Date(data.fecha_tratamiento + 'T12:00:00.000Z').toISOString(),
          monto_pagado: data.monto_pagado,
          monto_neto: data.monto_pagado - calculation.comision,
          costo_unitario: data.costo_unitario,
          ganancia: calculation.ganancia,
          metodo_pago: data.metodo_pago,
          tipo_tarjeta: data.tipo_tarjeta,
          meses_sin_intereses: data.meses_sin_intereses || 0,
          tasa_comision: calculation.tasa,
          comision_monto: calculation.comision,
          notas: data.notas
        };

        const recordResponse = await ApiService.createRecord(recordData);
        if (recordResponse.error) {
          const errorMsg = typeof recordResponse.error === 'object' 
            ? JSON.stringify(recordResponse.error) 
            : recordResponse.error;
          throw new Error(`Error al crear el registro del tratamiento: ${errorMsg}`);
        }
        
        if (!recordResponse.data) {
          throw new Error("Error al crear el registro del tratamiento: No se recibió respuesta del servidor");
        }
      }      // 3. Si hay tratamiento futuro, crear un registro pendiente
      if (data.tratamiento_futuro_id && data.fecha_proxima_cita && data.hora_proxima_cita) {
        const appointmentDateTime = new Date(`${data.fecha_proxima_cita}T${data.hora_proxima_cita}:00.000Z`);
        
        const futureRecordData = {
          patient_id: parseInt(params.id as string),
          treatment_id: parseInt(data.tratamiento_futuro_id),
          fecha: appointmentDateTime.toISOString(),
          monto_pagado: 0,
          monto_neto: 0,
          costo_unitario: 0,
          ganancia: 0,
          metodo_pago: 'efectivo',
          tasa_comision: 0,
          comision_monto: 0,
          notas: "Cita programada - Pendiente"
        };
        
        const futureRecordResponse = await ApiService.createRecord(futureRecordData);
        
        if (futureRecordResponse.error) {
          throw new Error(`Error al crear el registro futuro: ${futureRecordResponse.error}`);
        }

        // 4. Mostrar opción de agregar al calendario si está configurado
        if (futureRecordResponse.data && simpleCalendarService.isConfigured()) {
          try {
            // Obtener información del tratamiento
            const treatmentsResponse = await ApiService.getTreatments();
            const treatment = treatmentsResponse.data?.find((t: any) => t.id === parseInt(data.tratamiento_futuro_id!));
            
            const appointmentDate = new Date(`${data.fecha_proxima_cita}T${data.hora_proxima_cita}:00.000Z`);
            const endDate = new Date(appointmentDate.getTime() + (60 * 60 * 1000)); // 1 hora después
            
            // Crear enlace del calendario y mostrar opción al usuario
            const calendarEvent = {
              title: `Cita: ${treatment?.nombre || 'Tratamiento'} - ${data.nombre}`,
              description: `Cita programada para el paciente ${data.nombre}.\nTratamiento: ${treatment?.nombre || 'N/A'}\nTeléfono: ${data.telefono}`,
              startDateTime: appointmentDate.toISOString(),
              endDateTime: endDate.toISOString(),
              patientEmail: data.email,
              patientName: data.nombre,
              patientPhone: data.telefono,
              location: 'UME López & López'
            };
            
            // Preguntar si quiere agregar al calendario
            if (confirm('¿Deseas agregar esta cita al calendario de Google?')) {
              simpleCalendarService.openCalendarEvent(calendarEvent);
            }
          } catch (calendarError) {
            console.warn('Error al mostrar calendario:', calendarError);
            // No fallar todo el proceso por un error de calendario
          }
        }
      }
      
      // Refrescar los datos después de crear los registros
      await fetchPatientData(parseInt(params.id as string));
      
      setSuccess("Paciente actualizado exitosamente");
    } catch (error) {
      console.error("Error al actualizar:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar el paciente";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const handleMultiTreatmentSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);    try {
      const response = await ApiService.createMultipleTreatmentRecord(parseInt(params.id as string), data);
      if (response.data && !response.error) {
        setSuccess("Tratamientos registrados exitosamente");
        await fetchPatientData(parseInt(params.id as string));
      } else {
        setError(response.error || "Error al registrar los tratamientos");
      }
    } catch (err: any) {
      console.error("Error creating multi-treatment record:", err);
      setError(err.message || "Error inesperado al registrar los tratamientos");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este tratamiento?")) {
      return;
    }

    try {      const response = await fetch(`/api/records/${recordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el tratamiento');
      }

      // Refrescar los datos
      await fetchPatientData(parseInt(params.id as string));
      setSuccess("Tratamiento eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar:", error);
      setError("Error al eliminar el tratamiento");
    }
  };

  const handleEditRecord = async (recordId: number, editData: any) => {
    try {
      // Calcular comisiones y ganancia con los nuevos datos
      const { calcularGananciaNeta } = await import("@/lib/payment");
      const calculation = calcularGananciaNeta(
        editData.monto_pagado,
        editData.costo_unitario,
        editData.metodo_pago,
        editData.tipo_tarjeta,
        editData.meses_sin_intereses || 0
      );

      const updateData = {
        monto_pagado: editData.monto_pagado,
        monto_neto: editData.monto_pagado - calculation.comision,
        costo_unitario: editData.costo_unitario,
        ganancia: calculation.ganancia,
        metodo_pago: editData.metodo_pago,
        tipo_tarjeta: editData.tipo_tarjeta,
        meses_sin_intereses: editData.meses_sin_intereses || 0,
        tasa_comision: calculation.tasa,
        comision_monto: calculation.comision,
        notas: editData.notas
      };

      const response = await ApiService.updateRecord(recordId, updateData);
      
      if (response.error) {
        throw new Error(`Error al actualizar el registro: ${response.error}`);
      }

      // Refrescar los datos
      await fetchPatientData(parseInt(params.id as string));
      setSuccess("Registro actualizado exitosamente");
    } catch (error) {
      console.error("Error al actualizar registro:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar el registro";
      setError(errorMessage);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
    setSuccess(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos del paciente...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Paciente no encontrado</p>
            <Button 
              variant="outline" 
              onClick={() => router.push("/patients")}
              className="mt-4"
            >
              Volver a Pacientes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/patients")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Pacientes
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Paciente</h1>
              <p className="text-gray-600 mt-1">
                Modifica los datos del paciente o agrega nuevos tratamientos
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-lg px-3 py-1">
              ID: {patient.id}
            </Badge>
          </div>
        </div>

        {/* Patient Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900">{patient.nombre}</h3>
                <div className="flex items-center gap-4 text-blue-700 text-sm mt-1">
                  <span>{patient.telefono}</span>
                  {patient.email && <span>{patient.email}</span>}
                  <span>Nacimiento: {new Date(patient.fecha_nacimiento).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Editar Datos + Tratamiento
                </TabsTrigger>
                <TabsTrigger value="multiple" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Múltiples Tratamientos
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              {/* Edit Patient + Single Treatment Tab */}
              <TabsContent value="edit" className="space-y-6">
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                    <Stethoscope className="w-5 h-5" />
                    <span className="font-medium">Actualizar Datos del Paciente y Agregar Tratamiento</span>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Modifica la información personal del paciente y registra un nuevo tratamiento
                  </p>
                </div>

                <Separator />

                <PatientWithTreatmentForm 
                  initialData={patient} 
                  patientRecords={patientRecords}
                  patientId={parseInt(params.id as string)}
                  onSubmit={handleSubmit} 
                  onDeleteRecord={handleDeleteRecord}
                  onEditRecord={handleEditRecord}
                />
              </TabsContent>

              {/* Multiple Treatments Tab */}
              <TabsContent value="multiple" className="space-y-6">
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Registrar Múltiples Tratamientos</span>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Agrega múltiples tratamientos para este paciente (paquetes, promociones, etc.)
                  </p>
                </div>

                <Separator />

                <MultiTreatmentForm
                  patientId={parseInt(params.id as string)}
                  onSubmit={handleMultiTreatmentSubmit}
                  onCancel={() => setActiveTab("edit")}
                  loading={loading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
