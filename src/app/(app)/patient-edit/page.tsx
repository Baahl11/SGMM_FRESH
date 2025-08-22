"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, User, Stethoscope, CreditCard, Plus, AlertCircle, Users, FileText } from "lucide-react";
import ApiService from "@/lib/api-service";

interface Patient {
  id: number;
  nombre: string;
  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  requiere_factura: boolean;
}

export default function PatientEditPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PatientEditPageContent />
    </Suspense>
  );
}

function PatientEditPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("edit");
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Obtener ID desde query parameters
  const patientId = searchParams?.get('id') || null;

  useEffect(() => {
    if (!patientId) {
      setError("ID de paciente no encontrado");
      setIsLoading(false);
      return;
    }

    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar datos del paciente
      const patientResponse = await ApiService.getPatient(parseInt(patientId!));
      if (patientResponse.error) {
        throw new Error(patientResponse.error);
      }

      setPatient(patientResponse.data);

      // Cargar registros del paciente
      const recordsResponse = await ApiService.getRecords(parseInt(patientId!));
      if (recordsResponse.error) {
        console.warn("Error loading records:", recordsResponse.error);
        setPatientRecords([]);
      } else {
        setPatientRecords(recordsResponse.data || []);
      }

    } catch (error) {
      console.error("Error loading patient data:", error);
      setError(error instanceof Error ? error.message : "Error cargando datos del paciente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePatient = async (updatedData: Partial<Patient>) => {
    if (!patient || !patientId) return;

    try {
      setIsUpdating(true);
      setError(null);

      const response = await ApiService.updatePatient(patient.id, {
        ...patient,
        ...updatedData
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Actualizar estado local
      setPatient(prev => prev ? { ...prev, ...updatedData } : null);
      
      // Mostrar mensaje de éxito
      alert("Paciente actualizado correctamente");

    } catch (error) {
      console.error("Error updating patient:", error);
      setError(error instanceof Error ? error.message : "Error actualizando paciente");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!patient || !confirm("¿Está seguro de eliminar este paciente? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      setIsUpdating(true);
      const response = await ApiService.deletePatient(patient.id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      alert("Paciente eliminado correctamente");
      router.push("/patients");

    } catch (error) {
      console.error("Error deleting patient:", error);
      setError(error instanceof Error ? error.message : "Error eliminando paciente");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos del paciente...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => router.push("/patients")} 
          variant="outline" 
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Pacientes
        </Button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Paciente no encontrado</AlertDescription>
        </Alert>
        <Button 
          onClick={() => router.push("/patients")} 
          variant="outline" 
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Pacientes
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => router.push("/patients")} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Paciente</h1>
            <p className="text-gray-600">ID: {patient.id}</p>
          </div>
        </div>
        <Badge variant="secondary">
          <User className="mr-1 h-3 w-3" />
          Activo
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="edit" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Datos</span>
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Historial</span>
          </TabsTrigger>
          <TabsTrigger value="treatments" className="flex items-center space-x-2">
            <Stethoscope className="h-4 w-4" />
            <span>Tratamientos</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Facturación</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Editar Datos */}
        <TabsContent value="edit">
          <PatientEditForm 
            patient={patient}
            onUpdate={handleUpdatePatient}
            onDelete={handleDeletePatient}
            isUpdating={isUpdating}
          />
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="records">
          <PatientRecords 
            patientId={patient.id}
            records={patientRecords}
            onRecordsChange={loadPatientData}
          />
        </TabsContent>

        {/* Tab: Tratamientos */}
        <TabsContent value="treatments">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Nuevo Tratamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push(`/records/new?patient_id=${patient.id}`)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar Tratamiento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Facturación */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Información de Facturación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">¿Requiere Factura?</label>
                  <p className="text-lg">{patient.requiere_factura ? "Sí" : "No"}</p>
                </div>
                {patient.requiere_factura && (
                  <Button 
                    onClick={() => router.push(`/billing?patient_id=${patient.id}`)}
                    variant="outline"
                  >
                    Ver Facturación
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente para el formulario de edición
function PatientEditForm({ 
  patient, 
  onUpdate, 
  onDelete, 
  isUpdating 
}: { 
  patient: Patient;
  onUpdate: (data: Partial<Patient>) => Promise<void>;
  onDelete: () => Promise<void>;
  isUpdating: boolean;
}) {
  const [formData, setFormData] = useState({
    nombre: patient.nombre || "",
    fecha_nacimiento: patient.fecha_nacimiento || "",
    telefono: patient.telefono || "",
    email: patient.email || "",
    direccion: patient.direccion || "",
    requiere_factura: patient.requiere_factura || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Paciente</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium mb-1">
              Nombre Completo *
            </label>
            <input
              id="nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fecha_nacimiento" className="block text-sm font-medium mb-1">
                Fecha de Nacimiento
              </label>
              <input
                id="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium mb-1">
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="direccion" className="block text-sm font-medium mb-1">
              Dirección
            </label>
            <textarea
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="requiere_factura"
              type="checkbox"
              checked={formData.requiere_factura}
              onChange={(e) => setFormData(prev => ({ ...prev, requiere_factura: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="requiere_factura" className="text-sm font-medium">
              Requiere Factura
            </label>
          </div>

          <Separator />

          <div className="flex justify-between">
            <Button 
              type="submit" 
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? "Actualizando..." : "Guardar Cambios"}
            </Button>

            <Button 
              type="button" 
              variant="destructive" 
              onClick={onDelete}
              disabled={isUpdating}
            >
              Eliminar Paciente
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Componente para mostrar registros
function PatientRecords({ 
  patientId, 
  records, 
  onRecordsChange 
}: { 
  patientId: number;
  records: any[];
  onRecordsChange: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Tratamientos</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No hay registros de tratamientos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="border p-4 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Tratamiento #{record.id}</p>
                    <p className="text-gray-600">{record.fecha}</p>
                    <p className="text-green-600 font-medium">
                      ${record.monto_pagado?.toFixed(2) || "0.00"} MXN
                    </p>
                  </div>
                  <Badge variant="outline">
                    {record.metodo_pago || "No especificado"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
