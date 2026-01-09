"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, User, Plus, Calendar, Clock, Phone, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Skeleton Loader Component
function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  );
}

interface Patient {
  id: number;
  nombre: string;
  telefono: string;
  email?: string;
}

interface Treatment {
  id: number;
  nombre: string;
  precio: number;
  precio_base?: number;
  costo_unitario: number;
  descripcion?: string;
}

// 🆕 Multi-doctor interfaces
interface Doctor {
  id: string;
  nombre: string;
  especialidad?: string;
  color: string;
  activo?: boolean;
}

interface Consultorio {
  id: string;
  nombre: string;
  ubicacion?: string;
  activo?: boolean;
}

interface AppointmentType {
  id: string;
  nombre: string;
  duracion_minutos: number;
  color: string;
  activo?: boolean;
}

interface Appointment {
  id: number;
  patient_id: number;
  treatment_id?: number;
  fecha: string;
  appointment_time?: string;
  patient_name?: string;
  treatment_name?: string;
  phone?: string;
  notes?: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointmentData: any) => Promise<void>;
  onDelete?: (appointmentId: number) => Promise<void>;
  selectedSlot?: { date: string; time: string } | null;
  selectedAppointment?: Appointment | null;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedSlot,
  selectedAppointment
}: AppointmentModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [treatmentSearchTerm, setTreatmentSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🆕 Multi-doctor state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedConsultorio, setSelectedConsultorio] = useState<Consultorio | null>(null);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<AppointmentType | null>(null);
  
  // 🎨 UX Enhancement states
  const [loadingData, setLoadingData] = useState(true);
  const [validating, setValidating] = useState(false);
  const [conflicts, setConflicts] = useState<{
    doctorBusy?: boolean;
    consultorioBusy?: boolean;
    patientDuplicate?: boolean;
    doctorNotWorking?: boolean;
    outsideWorkingHours?: boolean;
    doctorException?: boolean;
    exceptionType?: string;
    message?: string;
  }>({});
  
  // Form data
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    notes: "",
    status: "scheduled" as "scheduled" | "confirmed" | "completed" | "cancelled",
    // New patient form
    newPatientName: "",
    newPatientPhone: "",
    newPatientEmail: ""
  });

  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      Promise.all([
        loadPatients(),
        loadTreatments(),
        loadDoctors(),
        loadConsultorios(),
        loadAppointmentTypes()
      ]).finally(() => {
        setLoadingData(false);
        initializeForm();
      });
    }
  }, [isOpen, selectedSlot, selectedAppointment]);

  const loadPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const patientsData = await response.json();
        const safeData = Array.isArray(patientsData) ? patientsData : [];
        setPatients(safeData);
      } else {
        setPatients([]);
      }
    } catch (err) {
      setPatients([]);
    }
  };

  const loadTreatments = async () => {
    try {
      const response = await fetch('/api/treatments');
      if (response.ok) {
        const treatmentsData = await response.json();
        const safeData = Array.isArray(treatmentsData) ? treatmentsData : [];
        setTreatments(safeData);
      } else {
        setTreatments([]);
      }
    } catch (err) {
      setTreatments([]);
    }
  };

  // 🆕 Load doctors
  const loadDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const data = await response.json();
        const safeData = Array.isArray(data) ? data.filter((d: Doctor) => d.activo !== false) : [];
        setDoctors(safeData);
      } else {
        setDoctors([]);
      }
    } catch (err) {
      setDoctors([]);
    }
  };

  // 🆕 Load consultorios
  const loadConsultorios = async () => {
    try {
      const response = await fetch('/api/consultorios');
      if (response.ok) {
        const data = await response.json();
        const safeData = Array.isArray(data) ? data.filter((c: Consultorio) => c.activo !== false) : [];
        setConsultorios(safeData);
      } else {
        setConsultorios([]);
      }
    } catch (err) {
      setConsultorios([]);
    }
  };

  // 🆕 Load appointment types
  const loadAppointmentTypes = async () => {
    try {
      const response = await fetch('/api/appointment-types');
      if (response.ok) {
        const data = await response.json();
        const safeData = Array.isArray(data) ? data.filter((t: AppointmentType) => t.activo !== false) : [];
        setAppointmentTypes(safeData);
      } else {
        setAppointmentTypes([]);
      }
    } catch (err) {
      setAppointmentTypes([]);
    }
  };

  const initializeForm = () => {
    if (selectedAppointment) {
      // Editing existing appointment
      const aptDate = new Date(selectedAppointment.fecha);
      setFormData({
        date: aptDate.toISOString().split('T')[0],
        time: aptDate.toTimeString().slice(0, 5),
        notes: selectedAppointment.notes || "",
        status: (selectedAppointment.status || "scheduled") as "scheduled" | "confirmed" | "completed" | "cancelled",
        newPatientName: "",
        newPatientPhone: "",
        newPatientEmail: ""
      });
      
      // Find and set patient and treatment
      const patient = patients.find(p => p.id === selectedAppointment.patient_id);
      const treatment = treatments.find(t => t.id === selectedAppointment.treatment_id);
      setSelectedPatient(patient || null);
      setSelectedTreatment(treatment || null);
    } else if (selectedSlot) {
      // Creating new appointment
      // Extract date directly from the selectedSlot.date string to avoid timezone issues
      const dateStr = selectedSlot.date.includes('T') 
        ? selectedSlot.date.split('T')[0] 
        : selectedSlot.date.substring(0, 10);
      
      setFormData({
        date: dateStr,
        time: selectedSlot.time,
        notes: "",
        status: "scheduled",
        newPatientName: "",
        newPatientPhone: "",
        newPatientEmail: ""
      });
      
      setSelectedPatient(null);
      setSelectedTreatment(null);
    }
  };

  const filteredPatients = Array.isArray(patients) 
    ? patients.filter(patient =>
        patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.telefono.includes(searchTerm)
      )
    : [];

  const filteredTreatments = Array.isArray(treatments) 
    ? treatments.filter(treatment =>
        treatment.nombre.toLowerCase().includes(treatmentSearchTerm.toLowerCase())
      )
    : [];

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      let patientId = selectedPatient?.id;

      // Create new patient if needed
      if (showNewPatientForm && formData.newPatientName) {
        const newPatientData = {
          nombre: formData.newPatientName,
          telefono: formData.newPatientPhone,
          email: formData.newPatientEmail,
          fecha_nacimiento: new Date().toISOString().split('T')[0], // Default to today
          direccion: "",
          requiere_factura: false
        };

        const patientResponse = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPatientData)
        });
        
        if (!patientResponse.ok) {
          throw new Error("Error al crear el paciente");
        }
        
        const createdPatient = await patientResponse.json();
        patientId = createdPatient.id;
      }

      if (!patientId || !selectedTreatment) {
        const missingItems = [];
        if (!patientId) missingItems.push('paciente');
        if (!selectedTreatment) missingItems.push('tratamiento');
        
        const errorMsg = `Por favor selecciona un ${missingItems.join(' y un ')}`;
        setError(errorMsg);
        return;
      }

      // Create appointment date in Mexico timezone (UTC-6)
      // No convertir a UTC, mantener la hora local de México
      const appointmentDateTimeLocal = `${formData.date}T${formData.time}:00`;
      
      // Guardar como timestamp local sin conversión UTC
      // Formato: '2025-10-23T08:30:00' (hora de México)
      const localDateTime = appointmentDateTimeLocal;

      const appointmentData = {
        patient_id: patientId,
        treatment_id: selectedTreatment.id,
        appointment_date: localDateTime, // Hora local de México
        appointment_time: formData.time, // Keep original time for compatibility
        duration_minutes: selectedAppointmentType?.duracion_minutos || 60, // Use type duration or default
        status: formData.status,
        notes: formData.notes,
        // 🆕 Multi-doctor fields
        doctor_id: selectedDoctor?.id || null,
        consultorio_id: selectedConsultorio?.id || null,
        appointment_type_id: selectedAppointmentType?.id || null
      };

      await onSave(appointmentData);
      
      // Reset form
      setSelectedPatient(null);
      setSelectedTreatment(null);
      setShowNewPatientForm(false);
      setSearchTerm("");
      setFormData({
        date: "",
        time: "",
        notes: "",
        status: "scheduled",
        newPatientName: "",
        newPatientPhone: "",
        newPatientEmail: ""
      });
      
    } catch (err) {
      console.error('Error saving appointment:', err);
      setError("Error al guardar la cita");
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Validate conflicts in real-time
  const validateConflicts = async () => {
    if (!formData.date || !formData.time) {
      setConflicts({});
      return;
    }

    try {
      setValidating(true);
      const appointmentDateTimeLocal = `${formData.date}T${formData.time}:00`;
      const appointmentDateTime = new Date(appointmentDateTimeLocal);
      const utcDateTime = appointmentDateTime.toISOString();

      const newConflicts: {
        doctorBusy?: boolean;
        consultorioBusy?: boolean;
        patientDuplicate?: boolean;
        doctorNotWorking?: boolean;
        outsideWorkingHours?: boolean;
        doctorException?: boolean;
        exceptionType?: string;
        message?: string;
      } = {};

      // 🆕 Check doctor schedule availability first (if doctor is selected)
      if (selectedDoctor) {
        const appointmentDateTimeLocal = `${formData.date}T${formData.time}:00`;
        
        const scheduleResponse = await fetch('/api/doctor-schedules/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctor_id: selectedDoctor.id,
            appointment_date: appointmentDateTimeLocal
          })
        });

        if (scheduleResponse.ok) {
          const scheduleResult = await scheduleResponse.json();
          
          if (!scheduleResult.available) {
            if (scheduleResult.reason === 'doctor_not_working') {
              newConflicts.doctorNotWorking = true;
              newConflicts.message = scheduleResult.message;
            } else if (scheduleResult.reason === 'before_working_hours' || scheduleResult.reason === 'after_working_hours') {
              newConflicts.outsideWorkingHours = true;
              newConflicts.message = scheduleResult.message;
            } else if (scheduleResult.reason === 'doctor_exception') {
              newConflicts.doctorException = true;
              newConflicts.exceptionType = scheduleResult.exception_type;
              newConflicts.message = scheduleResult.message;
            }
            
            // If doctor is not available, no need to check other conflicts
            setConflicts(newConflicts);
            setValidating(false);
            return;
          }
        }
      }

      // Check appointment conflicts (only if doctor schedule is OK)
      if (selectedDoctor) {
        const appointmentDateTimeLocal = `${formData.date}T${formData.time}:00`;
        
        const response = await fetch('/api/appointments/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointment_date: appointmentDateTimeLocal,
            duration_minutes: selectedAppointmentType?.duracion_minutos || 60,
            doctor_id: selectedDoctor?.id,
            consultorio_id: selectedConsultorio?.id,
            patient_id: selectedPatient?.id,
            exclude_appointment_id: selectedAppointment?.id
          })
        });

        if (response.ok) {
          const result = await response.json();
          newConflicts.doctorBusy = result.conflicts?.doctor_busy || false;
          newConflicts.consultorioBusy = result.conflicts?.consultorio_busy || false;
          newConflicts.patientDuplicate = result.conflicts?.patient_duplicate || false;
        }
      }

      setConflicts(newConflicts);
    } catch (err) {
      console.error('Error validating conflicts:', err);
    } finally {
      setValidating(false);
    }
  };

  // Trigger validation when key fields change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateConflicts();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [formData.date, formData.time, selectedDoctor, selectedConsultorio, selectedPatient, selectedAppointmentType]);

  const handleDelete = async () => {
    console.log('🗑️ [DELETE] Starting delete process...');
    console.log('🗑️ [DELETE] selectedAppointment:', selectedAppointment);
    console.log('🗑️ [DELETE] onDelete function exists:', !!onDelete);
    
    if (!selectedAppointment || !onDelete) {
      console.error('❌ [DELETE] Missing selectedAppointment or onDelete');
      return;
    }
    
    try {
      console.log('🗑️ [DELETE] Showing confirm dialog...');
      const confirmed = confirm("¿Estás seguro de que quieres eliminar esta cita?");
      console.log('🗑️ [DELETE] User confirmed:', confirmed);
      
      if (confirmed) {
        console.log('🗑️ [DELETE] Calling onDelete with ID:', selectedAppointment.id);
        await onDelete(selectedAppointment.id);
        console.log('✅ [DELETE] onDelete completed successfully');
        onClose();
        console.log('✅ [DELETE] Modal closed');
      } else {
        console.log('ℹ️ [DELETE] User cancelled deletion');
      }
    } catch (err) {
      console.error('❌ [DELETE] Error during delete:', err);
      console.error('❌ [DELETE] Error stack:', err instanceof Error ? err.stack : 'No stack');
      setError("Error al eliminar la cita");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-gradient-to-br from-white/95 via-white/90 to-white/95 border border-white/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Calendar className="h-5 w-5 text-purple-600" />
            {selectedAppointment ? "Editar Cita" : "Nueva Cita"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {selectedAppointment 
              ? "Modifica los detalles de la cita existente." 
              : "Completa la información para agendar una nueva cita médica."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loadingData ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* Conflict Alerts */}
              {validating && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Validando disponibilidad...
                  </AlertDescription>
                </Alert>
              )}
              
              {(conflicts.doctorBusy || conflicts.consultorioBusy || conflicts.patientDuplicate || conflicts.doctorNotWorking || conflicts.outsideWorkingHours || conflicts.doctorException) && !validating && (
                <Alert className={`border-amber-200 bg-amber-50 ${conflicts.doctorNotWorking || conflicts.outsideWorkingHours || conflicts.doctorException ? 'border-red-200 bg-red-50' : ''}`}>
                  <AlertCircle className={`h-4 w-4 ${conflicts.doctorNotWorking || conflicts.outsideWorkingHours || conflicts.doctorException ? 'text-red-600' : 'text-amber-600'}`} />
                  <AlertDescription className={conflicts.doctorNotWorking || conflicts.outsideWorkingHours || conflicts.doctorException ? 'text-red-800' : 'text-amber-800'}>
                    <div className="font-medium mb-1">
                      {conflicts.doctorNotWorking || conflicts.outsideWorkingHours || conflicts.doctorException ? '❌ No disponible:' : '⚠️ Conflictos detectados:'}
                    </div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {conflicts.doctorNotWorking && <li>{conflicts.message || 'El doctor no trabaja este día'}</li>}
                      {conflicts.outsideWorkingHours && <li>{conflicts.message || 'Fuera del horario de trabajo'}</li>}
                      {conflicts.doctorException && <li>{conflicts.message || 'El doctor no está disponible en esta fecha'}</li>}
                      {conflicts.doctorBusy && <li>El doctor ya tiene una cita en este horario</li>}
                      {conflicts.consultorioBusy && <li>El consultorio está ocupado en este horario</li>}
                      {conflicts.patientDuplicate && <li>El paciente ya tiene una cita en este horario</li>}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>

          {/* Patient Selection */}
          <div>
            <Label>Paciente</Label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">{selectedPatient.nombre}</div>
                    <div className="text-sm text-blue-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedPatient.telefono}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPatient(null)}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar paciente por nombre o teléfono..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nuevo
                  </Button>
                </div>

                {showNewPatientForm ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                    <h4 className="font-medium text-green-900">Nuevo Paciente</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <Input
                        placeholder="Nombre completo"
                        value={formData.newPatientName}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPatientName: e.target.value }))}
                      />
                      <Input
                        placeholder="Teléfono"
                        value={formData.newPatientPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPatientPhone: e.target.value }))}
                      />
                      <Input
                        placeholder="Email (opcional)"
                        type="email"
                        value={formData.newPatientEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPatientEmail: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="font-medium">{patient.nombre}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {patient.telefono}
                        </div>
                      </div>
                    ))}
                    {filteredPatients.length === 0 && searchTerm && (
                      <p className="text-center text-gray-500 py-4">
                        No se encontraron pacientes. ¿Quieres crear uno nuevo?
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🆕 Doctor Selection */}
          <div>
            <Label>Doctor</Label>
            <Select 
              value={selectedDoctor?.id || ""} 
              onValueChange={(value) => {
                const doctor = doctors.find(d => d.id === value);
                setSelectedDoctor(doctor || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar doctor..." />
              </SelectTrigger>
              <SelectContent>
                {doctors.length > 0 ? (
                  doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: doctor.color }}
                        />
                        <span>{doctor.nombre}</span>
                        {doctor.especialidad && (
                          <span className="text-xs text-gray-500">({doctor.especialidad})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No hay doctores disponibles
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 🆕 Consultorio Selection */}
          <div>
            <Label>Consultorio</Label>
            <Select 
              value={selectedConsultorio?.id || ""} 
              onValueChange={(value) => {
                const consultorio = consultorios.find(c => c.id === value);
                setSelectedConsultorio(consultorio || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar consultorio..." />
              </SelectTrigger>
              <SelectContent>
                {consultorios.length > 0 ? (
                  consultorios.map((consultorio) => (
                    <SelectItem key={consultorio.id} value={consultorio.id}>
                      <div>
                        <div className="font-medium">{consultorio.nombre}</div>
                        {consultorio.ubicacion && (
                          <div className="text-xs text-gray-500">{consultorio.ubicacion}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No hay consultorios disponibles
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 🆕 Appointment Type Selection */}
          <div>
            <Label>Tipo de Cita</Label>
            <Select 
              value={selectedAppointmentType?.id || ""} 
              onValueChange={(value) => {
                const type = appointmentTypes.find(t => t.id === value);
                setSelectedAppointmentType(type || null);
                // Auto-update duration if type is selected
                if (type) {
                  setFormData(prev => ({ ...prev, duration: type.duracion_minutos }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de cita..." />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.length > 0 ? (
                  appointmentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: type.color }}
                        />
                        <span>{type.nombre}</span>
                        <span className="text-xs text-gray-500">({type.duracion_minutos} min)</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No hay tipos de cita disponibles
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Treatment Selection */}
          <div>
            <Label>Tratamiento</Label>
            {/* Treatment Search */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar tratamiento..."
                value={treatmentSearchTerm}
                onChange={(e) => setTreatmentSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select 
              value={selectedTreatment?.id.toString() || ""} 
              onValueChange={(value) => {
                const treatment = treatments.find(t => t.id.toString() === value);
                setSelectedTreatment(treatment || null);
                setTreatmentSearchTerm(""); // Clear search after selection
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tratamiento..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {filteredTreatments.length > 0 ? (
                  filteredTreatments.map((treatment) => (
                    <SelectItem key={treatment.id} value={treatment.id.toString()}>
                      <div>
                        <div className="font-medium">{treatment.nombre}</div>
                        <div className="text-sm text-gray-600">${(Number(treatment.precio) || Number(treatment.precio_base) || 0).toLocaleString()}</div>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    {treatmentSearchTerm ? 'No se encontraron tratamientos' : 'No hay tratamientos disponibles'}
                  </div>
                )}
              </SelectContent>
            </Select>
            {filteredTreatments.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {filteredTreatments.length} de {treatments.length} tratamientos
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <Label>Estado</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">
                  <Badge variant="secondary">Programada</Badge>
                </SelectItem>
                <SelectItem value="confirmed">
                  <Badge className="bg-blue-100 text-blue-800">Confirmada</Badge>
                </SelectItem>
                <SelectItem value="completed">
                  <Badge className="bg-green-100 text-green-800">Completada</Badge>
                </SelectItem>
                <SelectItem value="cancelled">
                  <Badge variant="destructive">Cancelada</Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre la cita..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {selectedAppointment && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  🗑️ Eliminar Cita
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading || (conflicts.doctorBusy || conflicts.consultorioBusy || conflicts.patientDuplicate || conflicts.doctorNotWorking || conflicts.outsideWorkingHours || conflicts.doctorException || false)}>
                {loading ? "Guardando..." : selectedAppointment ? "Actualizar" : "Crear Cita"}
              </Button>
            </div>
          </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}