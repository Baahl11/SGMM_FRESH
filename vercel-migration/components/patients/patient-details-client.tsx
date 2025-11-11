"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagManager } from "@/components/patients/tag-manager";
import { QuickAppointmentModal } from "@/components/patients/quick-appointment-modal";
import { UploadPhotoModal } from "@/components/patients/upload-photo-modal";
import { QuickInvoiceModal } from "@/components/patients/quick-invoice-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Link from "next/link";
import AppLayout from '@/components/layout/app-layout';
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Stethoscope,
  Camera,
  Edit,
  Plus,
  ArrowLeft,
  Activity,
  DollarSign,
  Pencil,
  Trash2
} from 'lucide-react';
import PatientBilling from '@/components/billing/patient-billing';
import PendingBilling from '@/components/billing/pending-billing';
import { formatPaymentMethod } from '@/app/lib/payment';
import { InlineEditField } from '@/components/patients/inline-edit-field';
import { EditRecordModal } from '@/components/records/edit-record-modal';
import { DeleteRecordDialog } from '@/components/records/delete-record-dialog';
import { PatientNotes } from '@/components/patients/patient-notes';
import { MedicalRecordComplete } from '@/components/patients/medical-record-complete';
import { MedicalTimeline } from '@/components/patients/medical-record/medical-timeline';
import { ConsultationWizard } from '@/components/patients/medical-record/consultation-wizard';
import { SendFormModal } from '@/components/patients/send-form-modal';
import type { 
  MedicalHistory, 
  PatientAllergy, 
  CurrentMedication,
  PatientDemographics 
} from '@/lib/types/medical-history';

interface Patient {
  id: number;
  nombre: string;
  apellido?: string;
  fecha_nacimiento: string;
  telefono: string;
  email?: string;
  direccion?: string;
  notas?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Record {
  id: number;
  patient_id: number;
  treatment_id: string;
  fecha: string;
  monto_pagado: number;
  monto_neto: number;
  costo_unitario: number;
  ganancia: number;
  metodo_pago: string;
  tipo_tarjeta?: string;
  meses_sin_intereses?: number;
  tasa_comision?: number;
  comision_monto?: number;
  treatment_name?: string;
  patient_name?: string;
  notas?: string;
  treatment?: {
    id: number;
    nombre: string;
    precio: number;
    precio_base: number;
    costo_unitario: number;
  };
}

interface PatientDetailsClientProps {
  patientId: string;
}

export default function PatientDetailsClient({ patientId }: PatientDetailsClientProps) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('treatments');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [medicalNotes, setMedicalNotes] = useState<any[]>([]);
  const [totalConsultations, setTotalConsultations] = useState<number>(0);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | undefined>(undefined);
  const [allergies, setAllergies] = useState<PatientAllergy[]>([]);
  const [medications, setMedications] = useState<CurrentMedication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states for edit/delete
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  
  // Medical record modal state
  // Medical record state managed by MedicalRecordComplete component
  
  // Quick action modals
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [sendFormModalOpen, setSendFormModalOpen] = useState(false);
  const [medicalTimelineOpen, setMedicalTimelineOpen] = useState(false);
  const [consultationWizardOpen, setConsultationWizardOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingAuth(false);
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      fetchData();
    };

    getUser();
  }, [router, patientId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔥 PatientDetailsClient: Fetching patient ${patientId}`);
      
      // Fetch patient data
      const patientResponse = await fetch(`/api/patients/${patientId}`);
      
      if (!patientResponse.ok) {
        throw new Error(`HTTP error! status: ${patientResponse.status}`);
      }
      
      const patientData = await patientResponse.json();
      console.log('✅ Patient data loaded:', patientData);
      setPatient(patientData);

      // Fetch patient records
      console.log(`🔥 PatientDetailsClient: Fetching records for patient ${patientId}`);
      const recordsResponse = await fetch(`/api/records/patient/${patientId}`);
      
      if (!recordsResponse.ok) {
        throw new Error(`HTTP error! status: ${recordsResponse.status}`);
      }
      
      const recordsData = await recordsResponse.json();
      console.log(`✅ Patient records loaded: ${recordsData.length} records`);
      setRecords(Array.isArray(recordsData) ? recordsData : []);

      // Fetch patient photos
      console.log(`🔥 PatientDetailsClient: Fetching photos for patient ${patientId}`);
      const photosResponse = await fetch(`/api/patient-photos?patient_id=${patientId}`);

      if (photosResponse.ok) {
        const photosData = await photosResponse.json();
        console.log(`✅ Patient photos loaded: ${photosData.photos?.length || 0} photos`);
        setPhotos(Array.isArray(photosData.photos) ? photosData.photos : []);
      } else {
        console.warn('⚠️ Could not load photos');
        setPhotos([]);
      }

      // Fetch medical notes (expediente médico - TODAS las consultas)
      console.log(`🔥 PatientDetailsClient: Fetching medical notes for patient ${patientId}`);
      const notesResponse = await fetch(`/api/medical-records?patient_id=${patientId}`);
      
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        // Guardar todas las consultas (no filtrar por notas privadas)
        setTotalConsultations(notesData.length);
        setMedicalNotes(notesData); // Mostrar TODAS las consultas
        console.log(`✅ Medical notes loaded: ${notesData.length} consultations`);
      } else {
        console.warn('⚠️ Could not load medical notes');
        setMedicalNotes([]);
        setTotalConsultations(0);
      }

      // Fetch medical history (NOM-004 data)
      console.log(`🔥 PatientDetailsClient: Fetching medical history for patient ${patientId}`);
      const historyResponse = await fetch(`/api/medical-history?patient_id=${patientId}`);
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log('✅ Medical history loaded:', historyData.data ? 'exists' : 'none');
        setMedicalHistory(historyData.data);
      } else {
        console.warn('⚠️ Could not load medical history');
        setMedicalHistory(undefined);
      }

      // Fetch patient allergies
      console.log(`🔥 PatientDetailsClient: Fetching allergies for patient ${patientId}`);
      const allergiesResponse = await fetch(`/api/allergies?patient_id=${patientId}`);
      
      if (allergiesResponse.ok) {
        const allergiesData = await allergiesResponse.json();
        console.log(`✅ Allergies loaded: ${allergiesData.data?.length || 0} allergies`);
        setAllergies(allergiesData.data || []);
      } else {
        console.warn('⚠️ Could not load allergies');
        setAllergies([]);
      }

      // Fetch current medications
      console.log(`🔥 PatientDetailsClient: Fetching medications for patient ${patientId}`);
      const medicationsResponse = await fetch(`/api/medications?patient_id=${patientId}`);
      
      if (medicationsResponse.ok) {
        const medicationsData = await medicationsResponse.json();
        console.log(`✅ Medications loaded: ${medicationsData.data?.length || 0} medications`);
        setMedications(medicationsData.data || []);
      } else {
        console.warn('⚠️ Could not load medications');
        setMedications([]);
      }
    } catch (err) {
      console.error('❌ Error loading patient data:', err);
      setError("Error al cargar datos del paciente");
      setPatient(null);
      setRecords([]);
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePatientField = async (field: keyof Patient, value: string) => {
    if (!patient) return;

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...patient,
          [field]: value,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar paciente');
      }

      const updatedPatient = await response.json();
      setPatient(updatedPatient);
      console.log(`✅ Patient ${field} updated:`, value);
    } catch (err) {
      console.error(`❌ Error updating patient ${field}:`, err);
      throw err;
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      console.log('🔥 [patient-details] Deleting photo:', photoId);
      const response = await fetch(`/api/patient-photos?id=${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar foto');
      }

      console.log('✅ [patient-details] Photo deleted successfully');
      // Actualizar la lista de fotos localmente
      setPhotos(photos.filter(p => p.id !== photoId));
      // También refrescar los datos completos
      fetchData();
    } catch (err) {
      console.error('❌ [patient-details] Error deleting photo:', err);
      alert('Error al eliminar la foto. Por favor intenta de nuevo.');
    }
  };

  if (loadingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando datos del paciente...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto py-10 text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button variant="outline" asChild>
            <Link href="/patients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Pacientes
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout>
        <div className="container mx-auto py-10 text-center">
          <div className="text-red-600 mb-4">Paciente no encontrado</div>
          <Button variant="outline" asChild>
            <Link href="/patients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Pacientes
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const totalPagado = records
    .filter(record => record.monto_pagado > 0)
    .reduce((sum, record) => sum + record.monto_pagado, 0);

  const proximaCita = records
    .filter(record => record.monto_pagado === 0)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0];

  // Handle edit record
  const handleEditRecord = (record: Record) => {
    setSelectedRecord(record);
    setEditModalOpen(true);
  };

  // Handle delete record
  const handleDeleteRecord = (record: Record) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  // Handle success (refresh data)
  const handleSuccess = () => {
    fetchData(); // Refresh all data
  };

  return (
    <AppLayout>
      <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {patient.nombre}
              </h1>
              <p className="text-gray-600">Expediente del paciente</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/patients">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/patients/${patientId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
              <Link href={`/records/new?patientId=${patientId}`}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Registro
              </Link>
            </Button>
          </div>
        </div>

        {/* Patient Information Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Personal Information */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Información Personal</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 bg-green-100 rounded-md flex items-center justify-center flex-shrink-0 mt-1">
                  <Calendar className="h-3 w-3 text-green-600" />
                </div>
                <div className="flex-1">
                  <InlineEditField
                    label="Fecha de Nacimiento"
                    value={patient.fecha_nacimiento}
                    type="date"
                    onSave={(value) => updatePatientField('fecha_nacimiento', value)}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0 mt-1">
                  <Phone className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <InlineEditField
                    label="Teléfono"
                    value={patient.telefono}
                    type="tel"
                    onSave={(value) => updatePatientField('telefono', value)}
                    required
                    validate={(value) => {
                      if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) {
                        return 'El teléfono debe tener 10 dígitos';
                      }
                      return null;
                    }}
                  />
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 bg-purple-100 rounded-md flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="h-3 w-3 text-purple-600" />
                </div>
                <div className="flex-1">
                  <InlineEditField
                    label="Email"
                    value={patient.email || ''}
                    type="email"
                    onSave={(value) => updatePatientField('email', value)}
                    validate={(value) => {
                      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        return 'Email inválido';
                      }
                      return null;
                    }}
                  />
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 bg-orange-100 rounded-md flex items-center justify-center flex-shrink-0 mt-1">
                  <MapPin className="h-3 w-3 text-orange-600" />
                </div>
                <div className="flex-1">
                  <InlineEditField
                    label="Dirección"
                    value={patient.direccion || ''}
                    type="text"
                    onSave={(value) => updatePatientField('direccion', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags Management */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Etiquetas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <TagManager patientId={patientId} />
            </CardContent>
          </Card>

          {/* Treatment Summary */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Resumen de Tratamientos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Stethoscope className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Total Tratamientos</p>
                    <p className="text-2xl font-bold text-blue-900">{records.length}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Total Pagado</p>
                    <p className="text-2xl font-bold text-green-900">${totalPagado.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              {proximaCita && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-600">Próxima Cita</p>
                      <p className="font-bold text-orange-900">
                        {new Date(proximaCita.fecha).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Acciones Rápidas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href={`/records/new?patientId=${patientId}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Tratamiento
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href={`/agenda?patientId=${patientId}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Programar Cita
                </Link>
              </Button>
              <Button 
                onClick={() => setSendFormModalOpen(true)}
                className="w-full justify-start" 
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Enviar Formulario
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href={`/patients/${patientId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Información
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for all sections */}
  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white rounded-xl shadow-sm border border-gray-200 grid w-full grid-cols-6">
            <TabsTrigger value="treatments" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Tratamientos
            </TabsTrigger>
            <TabsTrigger value="medical-record" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Expediente
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Facturación
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotos
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Acciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="treatments" className="mt-6">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-6">
                {records.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                      <Stethoscope className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">No hay tratamientos registrados</h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      Comienza registrando el primer tratamiento para este paciente.
                    </p>
                    <Button asChild className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
                      <Link href={`/records/new?patientId=${patientId}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Primer Tratamiento
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tratamiento</TableHead>
                          <TableHead>Monto Pagado</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Notas</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {new Date(record.fecha).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {record.treatment_name || record.treatment?.nombre || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                ${record.monto_pagado.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              {record.monto_pagado === 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Programado
                                </span>
                              ) : (
                                <div className="flex flex-col">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                                    {formatPaymentMethod(record.metodo_pago, record.tipo_tarjeta, record.meses_sin_intereses)}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="max-w-48 truncate">
                              {record.notas || 'Sin notas'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRecord(record)}
                                  className="h-8 w-8 p-0 hover:bg-blue-50"
                                  title="Editar tratamiento"
                                >
                                  <Pencil className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRecord(record)}
                                  className="h-8 w-8 p-0 hover:bg-red-50"
                                  title="Eliminar tratamiento"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expediente Médico Tab - NOM-004 Compliant */}
          <TabsContent value="medical-record" className="mt-6">
            {patient ? (
              <MedicalRecordComplete
                patientId={patientId}
                patientData={{
                  domicilio: patient.direccion,
                  estado_civil: (patient as any).estado_civil,
                  ocupacion: (patient as any).ocupacion,
                  lugar_nacimiento: (patient as any).lugar_nacimiento,
                  religion: (patient as any).religion,
                }}
                medicalHistory={medicalHistory}
                allergies={allergies}
                medications={medications}
                medicalNotes={medicalNotes}
                totalConsultations={totalConsultations}
                onOpenTimeline={() => setMedicalTimelineOpen(true)}
                onCreateConsultation={() => setConsultationWizardOpen(true)}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-gray-500">Cargando expediente médico...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notas Personales Tab - NUEVO */}
          <TabsContent value="notes" className="mt-6">
            <PatientNotes patientId={patientId} />
          </TabsContent>

          {/* Facturación Tab */}
          <TabsContent value="billing" className="mt-6">
            <div className="space-y-6">
              {/* Pending Billing Section */}
              <PendingBilling 
                patientId={patientId} 
                onUpdate={fetchData}
              />
              
              {/* Original Billing Component (Bundles/Packages) */}
              <PatientBilling 
                patientId={patientId} 
                patientName={patient.nombre} 
              />
            </div>
          </TabsContent>

          {/* Fotos Tab - LIMPIA (sin notas médicas) */}
          <TabsContent value="photos" className="mt-6">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-600" />
                    📸 Galería de Fotos de Progreso
                  </span>
                  <Button onClick={() => setPhotoModalOpen(true)} size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Subir Nueva Foto
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {photos.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Sin fotos de progreso</h3>
                    <p className="text-gray-600 mb-6">
                      Documenta la evolución del tratamiento con fotografías
                    </p>
                    <Button onClick={() => setPhotoModalOpen(true)} variant="outline">
                      <Camera className="h-4 w-4 mr-2" />
                      Subir Primera Foto
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="group relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all">
                        <img
                          src={photo.url}
                          alt={photo.descripcion || 'Foto del paciente'}
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar esta foto?')) {
                                handleDeletePhoto(photo.id);
                              }
                            }}
                            className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
                            title="Eliminar foto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            {photo.categoria && (
                              <div className="flex items-center gap-2 mb-1">
                                {photo.categoria === 'progreso' && <span className="text-xs bg-blue-500 px-2 py-1 rounded">📊 Progreso</span>}
                                {photo.categoria === 'antes' && <span className="text-xs bg-orange-500 px-2 py-1 rounded">⏪ Antes</span>}
                                {photo.categoria === 'despues' && <span className="text-xs bg-green-500 px-2 py-1 rounded">⏩ Después</span>}
                              </div>
                            )}
                            {photo.descripcion && (
                              <p className="text-sm">{photo.descripcion}</p>
                            )}
                            <p className="text-xs text-gray-300 mt-1">
                              {new Date(photo.created_at).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Acciones Rápidas Tab */}
          <TabsContent value="actions" className="mt-6">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-600" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Button className="h-20 flex-col gap-2" variant="outline" asChild>
                    <Link href={`/records/new?patientId=${patientId}`}>
                      <Plus className="h-6 w-6" />
                      Nuevo Tratamiento
                    </Link>
                  </Button>
                  <Button 
                    className="h-20 flex-col gap-2" 
                    variant="outline"
                    onClick={() => setAppointmentModalOpen(true)}
                  >
                    <Calendar className="h-6 w-6" />
                    Programar Cita
                  </Button>
                  <Button className="h-20 flex-col gap-2" variant="outline" asChild>
                    <Link href={`/patients/${patientId}/edit`}>
                      <Edit className="h-6 w-6" />
                      Editar Información
                    </Link>
                  </Button>
                  <Button 
                    className="h-20 flex-col gap-2" 
                    variant="outline"
                    onClick={() => setInvoiceModalOpen(true)}
                  >
                    <FileText className="h-6 w-6" />
                    Crear Factura
                  </Button>
                  <Button 
                    className="h-20 flex-col gap-2" 
                    variant="outline"
                    onClick={() => setActiveTab('medical-record')}
                  >
                    <Activity className="h-6 w-6" />
                    Ver Expediente NOM-004
                  </Button>
                  <Button 
                    className="h-20 flex-col gap-2" 
                    variant="outline"
                    onClick={() => setPhotoModalOpen(true)}
                  >
                    <Camera className="h-6 w-6" />
                    Subir Foto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facturación Tab */}
          <TabsContent value="billing" className="mt-6">
            <div className="space-y-6">
              {/* Pending Billing Section */}
              <PendingBilling 
                patientId={patientId} 
                onUpdate={fetchData}
              />
              
              {/* Original Billing Component (Bundles/Packages) */}
              <PatientBilling 
                patientId={patientId} 
                patientName={patient.nombre} 
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Record Modal */}
        {selectedRecord && (
          <EditRecordModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedRecord(null);
            }}
            record={{
              ...selectedRecord,
              id: selectedRecord.id.toString(),
              treatment_id: selectedRecord.treatment_id || selectedRecord.treatment?.id.toString() || '',
              treatment: selectedRecord.treatment ? {
                ...selectedRecord.treatment,
                id: selectedRecord.treatment.id.toString()
              } : undefined
            }}
            onSuccess={handleSuccess}
          />
        )}

        {/* Delete Record Dialog */}
        {selectedRecord && (
          <DeleteRecordDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedRecord(null);
            }}
            recordId={selectedRecord.id.toString()}
            treatmentName={selectedRecord.treatment_name || selectedRecord.treatment?.nombre || 'Tratamiento'}
            onSuccess={handleSuccess}
          />
        )}

        {/* Modals */}
        {patient && (
          <>
            <QuickAppointmentModal
              patientId={patientId}
              patientName={patient.nombre}
              open={appointmentModalOpen}
              onClose={() => setAppointmentModalOpen(false)}
              onSuccess={fetchData}
            />
            
            <UploadPhotoModal
              patientId={patientId}
              patientName={patient.nombre}
              open={photoModalOpen}
              onClose={() => setPhotoModalOpen(false)}
              onSuccess={fetchData}
            />
            
            <QuickInvoiceModal
              patientId={patientId}
              patientName={patient.nombre}
              open={invoiceModalOpen}
              onClose={() => setInvoiceModalOpen(false)}
              onSuccess={fetchData}
            />
            
            <SendFormModal
              isOpen={sendFormModalOpen}
              onClose={() => setSendFormModalOpen(false)}
              patientId={patientId}
              patientName={patient.nombre}
            />

            <MedicalTimeline
              patientId={patientId}
              patientName={patient.nombre}
              open={medicalTimelineOpen}
              onClose={() => setMedicalTimelineOpen(false)}
              onSuccess={fetchData}
            />

            <ConsultationWizard
              open={consultationWizardOpen}
              onClose={() => setConsultationWizardOpen(false)}
              patientId={patientId}
              patientName={patient.nombre}
              onSuccess={() => {
                fetchData();
                setConsultationWizardOpen(false);
              }}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}