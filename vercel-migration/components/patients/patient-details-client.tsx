"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
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
      <div className="relative min-h-screen overflow-hidden bg-[#010511] px-4 py-8 text-white sm:px-6 lg:px-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[200px]" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[180px]" />
          <div className="absolute top-1/3 left-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[160px]" />
        </div>

        <div className="relative mx-auto max-w-6xl space-y-8">
          <GlassPanel className="border-white/15 bg-white/5 p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/70 via-cyan-400/60 to-indigo-500/60">
                  <User className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Paciente</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold text-white">{patient.nombre}</h1>
                    <Badge className={`border px-3 py-1 text-xs font-semibold tracking-wide ${patient.activo ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100' : 'border-rose-300/40 bg-rose-500/10 text-rose-100'}`}>
                      {patient.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/70">Expediente del paciente</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  asChild
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/patients">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href={`/patients/${patientId}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </Button>
                <Button
                  asChild
                  className="border-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-green-500 text-black shadow-lg shadow-emerald-500/40 hover:from-emerald-300 hover:via-cyan-300 hover:to-green-400"
                >
                  <Link href={`/records/new?patientId=${patientId}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Registro
                  </Link>
                </Button>
              </div>
            </div>
          </GlassPanel>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <GlassPanel className="border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-2 text-white">
                  <User className="h-4 w-4" />
                </div>
                <p className="text-lg font-semibold">Información Personal</p>
              </div>
              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-400/15 p-2 text-emerald-200">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <InlineEditField
                    label="Fecha de Nacimiento"
                    value={patient.fecha_nacimiento}
                    type="date"
                    onSave={(value) => updatePatientField('fecha_nacimiento', value)}
                    required
                  />
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-cyan-400/15 p-2 text-cyan-200">
                    <Phone className="h-4 w-4" />
                  </div>
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

                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-indigo-400/15 p-2 text-indigo-200">
                    <Mail className="h-4 w-4" />
                  </div>
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

                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-amber-400/15 p-2 text-amber-200">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <InlineEditField
                    label="Dirección"
                    value={patient.direccion || ''}
                    type="text"
                    onSave={(value) => updatePatientField('direccion', value)}
                  />
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-fuchsia-400/20 p-2 text-fuchsia-100">
                  <FileText className="h-4 w-4" />
                </div>
                <p className="text-lg font-semibold">Etiquetas</p>
              </div>
              <div className="mt-6">
                <TagManager patientId={patientId} />
              </div>
            </GlassPanel>

            <GlassPanel className="border-white/10 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-400/20 p-2 text-emerald-50">
                  <Activity className="h-4 w-4" />
                </div>
                <p className="text-lg font-semibold">Resumen de Tratamientos</p>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/60">Total Tratamientos</p>
                  <p className="text-3xl font-semibold text-white">{records.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/60">Total Pagado</p>
                  <p className="text-3xl font-semibold text-emerald-200">${totalPagado.toLocaleString()}</p>
                </div>
                {proximaCita && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/60">Próxima Cita</p>
                    <p className="text-xl font-semibold text-white">
                      {new Date(proximaCita.fecha).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </GlassPanel>

            <GlassPanel className="border-white/10 bg-white/5 p-6 md:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-purple-400/20 p-2 text-purple-100">
                  <Plus className="h-4 w-4" />
                </div>
                <p className="text-lg font-semibold">Acciones Rápidas</p>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button
                  asChild
                  variant="outline"
                  className="h-12 w-full justify-start border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href={`/records/new?patientId=${patientId}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Tratamiento
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 w-full justify-start border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href={`/agenda?patientId=${patientId}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Programar Cita
                  </Link>
                </Button>
                <Button
                  onClick={() => setSendFormModalOpen(true)}
                  variant="outline"
                  className="h-12 w-full justify-start border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Enviar Formulario
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 w-full justify-start border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href={`/patients/${patientId}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Información
                  </Link>
                </Button>
              </div>
            </GlassPanel>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-5 rounded-2xl border border-white/10 bg-white/5 p-1 text-white/70">
              <TabsTrigger value="treatments" className="rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/10 data-[state=active]:bg-white/15 data-[state=active]:text-white">
                <Stethoscope className="h-4 w-4" />
                Tratamientos
              </TabsTrigger>
              <TabsTrigger value="medical-record" className="rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/10 data-[state=active]:bg-white/15 data-[state=active]:text-white">
                <Activity className="h-4 w-4" />
                Expediente
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/10 data-[state=active]:bg-white/15 data-[state=active]:text-white">
                <FileText className="h-4 w-4" />
                Notas
              </TabsTrigger>
              <TabsTrigger value="billing" className="rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/10 data-[state=active]:bg-white/15 data-[state=active]:text-white">
                <DollarSign className="h-4 w-4" />
                Facturación
              </TabsTrigger>
              <TabsTrigger value="photos" className="rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/10 data-[state=active]:bg-white/15 data-[state=active]:text-white">
                <Camera className="h-4 w-4" />
                Fotos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="treatments">
              <GlassPanel className="border-white/10 bg-white/5 p-0">
                <div className="p-6">
                  {records.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <Stethoscope className="h-8 w-8 text-white/60" />
                      </div>
                      <h3 className="mb-3 text-xl font-semibold text-white">No hay tratamientos registrados</h3>
                      <p className="mx-auto mb-6 max-w-md text-white/70">
                        Comienza registrando el primer tratamiento para este paciente.
                      </p>
                      <Button asChild className="border-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-green-500 text-black hover:from-emerald-300 hover:via-cyan-300 hover:to-green-400">
                        <Link href={`/records/new?patientId=${patientId}`}>
                          <Plus className="mr-2 h-4 w-4" />
                          Registrar Primer Tratamiento
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-white/10">
                            <TableHead className="text-white/70">Fecha</TableHead>
                            <TableHead className="text-white/70">Tratamiento</TableHead>
                            <TableHead className="text-white/70">Monto Pagado</TableHead>
                            <TableHead className="text-white/70">Estado</TableHead>
                            <TableHead className="text-white/70">Notas</TableHead>
                            <TableHead className="text-right text-white/70">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {records.map((record) => (
                            <TableRow key={record.id} className="border-white/10 hover:bg-white/5">
                              <TableCell className="font-medium text-white">
                                {new Date(record.fecha).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-white/90">
                                {record.treatment_name || record.treatment?.nombre || 'N/A'}
                              </TableCell>
                              <TableCell className="text-white">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-emerald-300" />
                                  ${record.monto_pagado.toLocaleString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                {record.monto_pagado === 0 ? (
                                  <span className="inline-flex items-center rounded-full border border-amber-200/50 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
                                    Programado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full border border-emerald-200/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                                    {formatPaymentMethod(record.metodo_pago, record.tipo_tarjeta, record.meses_sin_intereses)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="max-w-48 truncate text-white/70">
                                {record.notas || 'Sin notas'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditRecord(record)}
                                    className="h-8 w-8 p-0 text-emerald-200 hover:bg-white/10"
                                    title="Editar tratamiento"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRecord(record)}
                                    className="h-8 w-8 p-0 text-rose-200 hover:bg-white/10"
                                    title="Eliminar tratamiento"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </GlassPanel>
            </TabsContent>

            <TabsContent value="medical-record">
              <GlassPanel className="border-white/10 bg-white/5 p-0">
                <div className="p-6">
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
                    <p className="py-12 text-center text-white/60">Cargando expediente médico...</p>
                  )}
                </div>
              </GlassPanel>
            </TabsContent>

            <TabsContent value="notes">
              <PatientNotes patientId={patientId} />
            </TabsContent>

            <TabsContent value="billing">
              <div className="space-y-6">
                <PendingBilling patientId={patientId} onUpdate={fetchData} />
                <PatientBilling patientId={patientId} patientName={patient.nombre} />
              </div>
            </TabsContent>

            <TabsContent value="photos">
              <GlassPanel className="border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Camera className="h-5 w-5 text-purple-200" />
                    <span>Galería de Fotos</span>
                  </div>
                  <Button
                    onClick={() => setPhotoModalOpen(true)}
                    size="sm"
                    className="border-0 bg-white/90 text-black hover:bg-white"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Subir Nueva Foto
                  </Button>
                </div>

                {photos.length === 0 ? (
                  <div className="py-12 text-center text-white/70">
                    <Camera className="mx-auto mb-4 h-16 w-16 text-white/40" />
                    <h3 className="mb-3 text-xl font-semibold text-white">Sin fotos de progreso</h3>
                    <p className="mb-6 text-white/70">
                      Documenta la evolución del tratamiento con fotografías.
                    </p>
                    <Button
                      onClick={() => setPhotoModalOpen(true)}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Subir Primera Foto
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {photos.map((photo) => (
                      <div key={photo.id} className="group relative overflow-hidden rounded-2xl border border-white/10">
                        <img
                          src={photo.url}
                          alt={photo.descripcion || 'Foto del paciente'}
                          className="h-64 w-full object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="mb-3 flex items-center gap-2 text-xs">
                            {photo.categoria === 'progreso' && <span className="rounded-full bg-cyan-500/30 px-2 py-0.5 text-white">📊 Progreso</span>}
                            {photo.categoria === 'antes' && <span className="rounded-full bg-amber-500/30 px-2 py-0.5 text-white">⏪ Antes</span>}
                            {photo.categoria === 'despues' && <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-white">⏩ Después</span>}
                          </div>
                          {photo.descripcion && <p className="text-sm text-white">{photo.descripcion}</p>}
                          <p className="text-xs text-white/70">
                            {new Date(photo.created_at).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar esta foto?')) {
                                handleDeletePhoto(photo.id);
                              }
                            }}
                            className="absolute right-4 top-4 rounded-full border border-white/30 bg-white/10 p-2 text-white backdrop-blur"
                            title="Eliminar foto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassPanel>
            </TabsContent>

          </Tabs>

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
                treatment: selectedRecord.treatment
                  ? {
                      ...selectedRecord.treatment,
                      id: selectedRecord.treatment.id.toString()
                    }
                  : undefined
              }}
              onSuccess={handleSuccess}
            />
          )}

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
      </div>
    </AppLayout>
  );
}