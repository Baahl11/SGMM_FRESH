"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, User, Plus, Calendar, Clock, Phone, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ─── Module-level cache (survives modal open/close, resets on page reload) ────
let _patients:         Patient[]         | null = null;
let _treatments:       Treatment[]       | null = null;
let _doctors:          Doctor[]          | null = null;
let _consultorios:     Consultorio[]     | null = null;
let _appointmentTypes: AppointmentType[] | null = null;

// Estilos reutilizables
const inputClass = 'w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20';
const labelClass = 'text-white/90 text-sm font-medium mb-2 block';
const selectTriggerClass = 'rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white hover:bg-white/10 focus:border-white/40 focus:ring-2 focus:ring-white/20';

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
      // Use cached data if available — no loading flash
      if (_patients && _treatments && _doctors && _consultorios && _appointmentTypes) {
        setPatients(_patients);
        setTreatments(_treatments);
        setDoctors(_doctors);
        setConsultorios(_consultorios);
        setAppointmentTypes(_appointmentTypes);
        setLoadingData(false);
        initializeForm();
      } else {
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
    }
  }, [isOpen, selectedSlot, selectedAppointment]);

  const loadPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const patientsData = await response.json();
        const safeData = Array.isArray(patientsData) ? patientsData : [];
        _patients = safeData;
        setPatients(safeData);
      } else { setPatients([]); }
    } catch { setPatients([]); }
  };

  const loadTreatments = async () => {
    try {
      const response = await fetch('/api/treatments');
      if (response.ok) {
        const treatmentsData = await response.json();
        const safeData = Array.isArray(treatmentsData) ? treatmentsData : [];
        _treatments = safeData;
        setTreatments(safeData);
      } else { setTreatments([]); }
    } catch { setTreatments([]); }
  };

  const loadDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const data = await response.json();
        const safeData = Array.isArray(data) ? data.filter((d: Doctor) => d.activo !== false) : [];
        _doctors = safeData;
        setDoctors(safeData);
      } else { setDoctors([]); }
    } catch { setDoctors([]); }
  };

  const loadConsultorios = async () => {
    try {
      const response = await fetch('/api/consultorios');
      if (response.ok) {
        const data = await response.json();
        const safeData = Array.isArray(data) ? data.filter((c: Consultorio) => c.activo !== false) : [];
        _consultorios = safeData;
        setConsultorios(safeData);
      } else { setConsultorios([]); }
    } catch { setConsultorios([]); }
  };

  const loadAppointmentTypes = async () => {
    try {
      const response = await fetch('/api/appointment-types');
      if (response.ok) {
        const data = await response.json();
        const safeData = Array.isArray(data) ? data.filter((t: AppointmentType) => t.activo !== false) : [];
        _appointmentTypes = safeData;
        setAppointmentTypes(safeData);
      } else { setAppointmentTypes([]); }
    } catch { setAppointmentTypes([]); }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-white/20 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-purple-500/20 blur-[150px]" />
          <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-blue-500/15 blur-[140px]" />
        </div>
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-purple-400" />
            {selectedAppointment ? "Editar Cita" : "Nueva Cita"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {selectedAppointment 
              ? "Modifica los detalles de la cita existente." 
              : "Completa la información para agendar una nueva cita médica."
            }
          </DialogDescription>
        </DialogHeader>

        {/* Overlay spinner shown only on first-ever load, no layout jump */}
        {loadingData && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-slate-900/60 backdrop-blur-sm">
            <Loader2 className="h-7 w-7 animate-spin text-purple-300" />
          </div>
        )}

        <div className="space-y-5 relative z-10">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Conflict/validation area — fixed min-height so it never shifts other fields */}
          <div className="min-h-[44px]">
            {validating ? (
              <Alert className="border-blue-400/30 bg-blue-500/10">
                <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                <AlertDescription className="text-blue-100">Validando disponibilidad...</AlertDescription>
              </Alert>
            ) : (conflicts.doctorBusy || conflicts.consultorioBusy || conflicts.patientDuplicate || conflicts.doctorNotWorking || conflicts.outsideWorkingHours || conflicts.doctorException) ? (
              <Alert className={`${conflicts.doctorNotWorking || conflicts.outsideWorkingHours || conflicts.doctorException ? 'border-red-400/30 bg-red-500/10' : 'border-amber-400/30 bg-amber-500/10'}`}>
                <AlertCircle className={`h-4 w-4 ${conflicts.doctorNotWorking || conflicts.outsideWorkingHours || conflicts.doctorException ? 'text-red-300' : 'text-amber-300'}`} />
                <AlertDescription className={conflicts.doctorNotWorking || conflicts.outsideWorkingHours || conflicts.doctorException ? 'text-red-100' : 'text-amber-100'}>
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
            ) : null}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className={labelClass}>Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="time" className={labelClass}>Hora</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Patient Selection — fixed height container eliminates layout shift */}
          <div>
            <Label className={labelClass}>Paciente</Label>
            <div className="min-h-[56px]">
              {selectedPatient ? (
                <div className="flex items-center justify-between rounded-2xl border border-blue-400/30 bg-blue-500/10 p-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-300" />
                    <div>
                      <div className="font-medium text-white">{selectedPatient.nombre}</div>
                      <div className="flex items-center gap-1 text-sm text-blue-200">
                        <Phone className="h-3 w-3" />
                        {selectedPatient.telefono}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    Cambiar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        placeholder="Buscar paciente por nombre o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                      className="flex shrink-0 items-center gap-2 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4" />
                      Nuevo
                    </Button>
                  </div>

                  {/* Fixed-height list — no layout jump when items load */}
                  <div className="h-36 overflow-y-auto space-y-1.5">
                    {showNewPatientForm ? (
                      <div className="rounded-2xl border border-green-400/30 bg-green-500/10 p-3 space-y-2">
                        <h4 className="text-sm font-medium text-green-200">Nuevo Paciente</h4>
                        <Input placeholder="Nombre completo" value={formData.newPatientName} onChange={(e) => setFormData(prev => ({ ...prev, newPatientName: e.target.value }))} className={inputClass} />
                        <Input placeholder="Teléfono" value={formData.newPatientPhone} onChange={(e) => setFormData(prev => ({ ...prev, newPatientPhone: e.target.value }))} className={inputClass} />
                        <Input placeholder="Email (opcional)" type="email" value={formData.newPatientEmail} onChange={(e) => setFormData(prev => ({ ...prev, newPatientEmail: e.target.value }))} className={inputClass} />
                      </div>
                    ) : filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => setSelectedPatient(patient)}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2 transition hover:border-white/30 hover:bg-white/10"
                        >
                          <User className="h-4 w-4 shrink-0 text-white/40" />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-white text-sm">{patient.nombre}</div>
                            <div className="text-xs text-white/50">{patient.telefono}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-4 text-center text-sm text-white/50">
                        {searchTerm ? 'No se encontraron pacientes' : 'Escribe para buscar un paciente'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🆕 Doctor Selection */}
          <div>
            <Label className={labelClass}>Doctor</Label>
            <Select 
              value={selectedDoctor?.id || ""} 
              onValueChange={(value) => {
                const doctor = doctors.find(d => d.id === value);
                setSelectedDoctor(doctor || null);
              }}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Seleccionar doctor..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20 text-white">
                {doctors.length > 0 ? (
                  doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id} className="hover:bg-white/10 focus:bg-white/10">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: doctor.color }}
                        />
                        <span>{doctor.nombre}</span>
                        {doctor.especialidad && (
                          <span className="text-xs text-white/50">({doctor.especialidad})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-white/60 text-center">
                    No hay doctores disponibles
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 🆕 Consultorio Selection */}
          <div>
            <Label className={labelClass}>Consultorio</Label>
            <Select 
              value={selectedConsultorio?.id || ""} 
              onValueChange={(value) => {
                const consultorio = consultorios.find(c => c.id === value);
                setSelectedConsultorio(consultorio || null);
              }}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Seleccionar consultorio..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20 text-white">
                {consultorios.length > 0 ? (
                  consultorios.map((consultorio) => (
                    <SelectItem key={consultorio.id} value={consultorio.id} className="hover:bg-white/10 focus:bg-white/10">
                      <div>
                        <div className="font-medium">{consultorio.nombre}</div>
                        {consultorio.ubicacion && (
                          <div className="text-xs text-white/50">{consultorio.ubicacion}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-white/60 text-center">
                    No hay consultorios disponibles
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 🆕 Appointment Type Selection */}
          <div>
            <Label className={labelClass}>Tipo de Cita</Label>
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
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Seleccionar tipo de cita..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20 text-white">
                {appointmentTypes.length > 0 ? (
                  appointmentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id} className="hover:bg-white/10 focus:bg-white/10">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: type.color }}
                        />
                        <span>{type.nombre}</span>
                        <span className="text-xs text-white/50">({type.duracion_minutos} min)</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-white/60 text-center">
                    No hay tipos de cita disponibles
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Treatment Selection */}
          <div>
            <Label className={labelClass}>Tratamiento</Label>
            {/* Treatment Search */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
              <Input
                placeholder="Buscar tratamiento..."
                value={treatmentSearchTerm}
                onChange={(e) => setTreatmentSearchTerm(e.target.value)}
                className={`${inputClass} pl-10`}
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
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Seleccionar tratamiento..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto bg-slate-900 border-white/20 text-white">
                {filteredTreatments.length > 0 ? (
                  filteredTreatments.map((treatment) => (
                    <SelectItem key={treatment.id} value={treatment.id.toString()} className="hover:bg-white/10 focus:bg-white/10">
                      <div>
                        <div className="font-medium">{treatment.nombre}</div>
                        <div className="text-sm text-white/60">${(Number(treatment.precio) || Number(treatment.precio_base) || 0).toLocaleString()}</div>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-white/60 text-center">
                    {treatmentSearchTerm ? 'No se encontraron tratamientos' : 'No hay tratamientos disponibles'}
                  </div>
                )}
              </SelectContent>
            </Select>
            {filteredTreatments.length > 0 && (
              <p className="text-xs text-white/50 mt-1">
                {filteredTreatments.length} de {treatments.length} tratamientos
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <Label className={labelClass}>Estado</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20 text-white">
                <SelectItem value="scheduled" className="hover:bg-white/10 focus:bg-white/10">
                  <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Programada</Badge>
                </SelectItem>
                <SelectItem value="confirmed" className="hover:bg-white/10 focus:bg-white/10">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Confirmada</Badge>
                </SelectItem>
                <SelectItem value="completed" className="hover:bg-white/10 focus:bg-white/10">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Completada</Badge>
                </SelectItem>
                <SelectItem value="cancelled" className="hover:bg-white/10 focus:bg-white/10">
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Cancelada</Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className={labelClass}>Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre la cita..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div>
              {selectedAppointment && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                  className="rounded-2xl bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                >
                  🗑️ Eliminar Cita
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose} className="rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10">
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !!(conflicts.doctorBusy || conflicts.consultorioBusy || conflicts.patientDuplicate || conflicts.doctorNotWorking || conflicts.outsideWorkingHours || conflicts.doctorException)}
                className="rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white disabled:opacity-50"
              >
                {loading ? "Guardando..." : selectedAppointment ? "Actualizar" : "Crear Cita"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}