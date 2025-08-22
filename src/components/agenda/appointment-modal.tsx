"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, User, Plus, Calendar, Clock, Phone } from "lucide-react";
import ApiService from "@/lib/api-service";

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

interface Appointment {
  id: number;
  patient_id: number;
  treatment_id?: number; // Made optional for appointments
  fecha: string;
  appointment_time?: string; // Add appointment_time field
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
      loadPatients();
      loadTreatments();
      initializeForm();
    }
  }, [isOpen, selectedSlot, selectedAppointment]);

  const loadPatients = async () => {
    try {
      const response = await ApiService.getPatients();
      if (Array.isArray(response.data)) {
        setPatients(response.data);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error('Error loading patients:', err);
    }
  };

  const loadTreatments = async () => {
    try {
      const response = await ApiService.getTreatments();
      if (response.data) {
        setTreatments(response.data);
      }
    } catch (err) {
      console.error('Error loading treatments:', err);
    }
  };

  const initializeForm = () => {
    console.log('🔍 [APPOINTMENT-MODAL] initializeForm called');
    console.log('🔍 [APPOINTMENT-MODAL] selectedSlot:', selectedSlot);
    console.log('🔍 [APPOINTMENT-MODAL] selectedAppointment:', selectedAppointment);
    
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
      console.log('🔍 [APPOINTMENT-MODAL] Processing selectedSlot for new appointment');
      console.log('🔍 [APPOINTMENT-MODAL] selectedSlot.date raw:', selectedSlot.date);
      console.log('🔍 [APPOINTMENT-MODAL] selectedSlot.date type:', typeof selectedSlot.date);
      
      // Extract date directly from the selectedSlot.date string to avoid timezone issues
      const dateStr = selectedSlot.date.includes('T') 
        ? selectedSlot.date.split('T')[0] 
        : selectedSlot.date.substring(0, 10);
      
      console.log('🔍 [APPOINTMENT-MODAL] Processed dateStr:', dateStr);
      console.log('🔍 [APPOINTMENT-MODAL] selectedSlot.time:', selectedSlot.time);
      
      setFormData({
        date: dateStr,
        time: selectedSlot.time,
        notes: "",
        status: "scheduled",
        newPatientName: "",
        newPatientPhone: "",
        newPatientEmail: ""
      });
      
      console.log('🔍 [APPOINTMENT-MODAL] FormData set with date:', dateStr, 'time:', selectedSlot.time);
      setSelectedPatient(null);
      setSelectedTreatment(null);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.telefono.includes(searchTerm)
  );

  const filteredTreatments = treatments.filter(treatment =>
    treatment.nombre.toLowerCase().includes(treatmentSearchTerm.toLowerCase())
  );

  const handleSave = async () => {
    console.log('🔍 AppointmentModal.handleSave called');
    console.log('  - selectedPatient:', selectedPatient);
    console.log('  - selectedTreatment:', selectedTreatment);
    console.log('  - formData:', formData);
    console.log('  - showNewPatientForm:', showNewPatientForm);
    
    try {
      setLoading(true);
      setError(null);

      let patientId = selectedPatient?.id;

      // Create new patient if needed
      if (showNewPatientForm && formData.newPatientName) {
        console.log('🔍 Creating new patient:', formData.newPatientName);
        const newPatientData = {
          nombre: formData.newPatientName,
          telefono: formData.newPatientPhone,
          email: formData.newPatientEmail,
          fecha_nacimiento: new Date().toISOString().split('T')[0], // Default to today
          direccion: "",
          requiere_factura: false
        };

        const patientResponse = await ApiService.createPatient(newPatientData);
        if (patientResponse.data) {
          patientId = patientResponse.data.id;
          console.log('✅ New patient created with ID:', patientId);
        } else {
          throw new Error("Error al crear el paciente");
        }
      }

      if (!patientId || !selectedTreatment) {
        const missingItems = [];
        if (!patientId) missingItems.push('paciente');
        if (!selectedTreatment) missingItems.push('tratamiento');
        
        const errorMsg = `Por favor selecciona un ${missingItems.join(' y un ')}`;
        console.log('❌ Validation error:', errorMsg);
        setError(errorMsg);
        return;
      }

      // Create appointment date - use local time without timezone conversion
      const appointmentDateTimeLocal = `${formData.date} ${formData.time}:00`;
      console.log('🔍 Creating appointment for local time:', appointmentDateTimeLocal);

      const appointmentData = {
        patient_id: patientId,
        treatment_id: selectedTreatment.id,
        appointment_date: formData.date.length === 10 ? formData.date : formData.date.substring(0, 10),
        appointment_time: formData.time.length === 5 ? formData.time : formData.time.substring(0, 5),
        duration_minutes: 60, // default duration
        status: formData.status,
        notes: formData.notes
      };

      console.log('🔍 Calling onSave with data:', appointmentData);
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

  const handleDelete = async () => {
    if (!selectedAppointment || !onDelete) return;
    
    if (confirm("¿Estás seguro de que quieres eliminar esta cita?")) {
      try {
        await onDelete(selectedAppointment.id);
        onClose();
      } catch (err) {
        console.error('Error deleting appointment:', err);
        setError("Error al eliminar la cita");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {selectedAppointment ? "Editar Cita" : "Nueva Cita"}
          </DialogTitle>
          <DialogDescription>
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
                >
                  Eliminar Cita
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Guardando..." : selectedAppointment ? "Actualizar" : "Crear Cita"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
