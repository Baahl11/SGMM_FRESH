"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import toast, { Toaster } from 'react-hot-toast';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Settings,
  Users,
  Bell,
  LayoutGrid,
  User
} from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import CalendarGrid from "@/components/agenda/calendar-grid";
import AppointmentModal from "@/components/agenda/appointment-modal";
import TimeSlotManager from "@/components/agenda/time-slot-manager";
import AgendaConfigModal from "@/components/agenda/agenda-config-modal";
import TimelineDoctorView from "@/components/agenda/timeline-doctor-view";
import TimelineConsultorioView from "@/components/agenda/timeline-consultorio-view";
import GridMultiDoctorView from "@/components/agenda/grid-multi-doctor-view";

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
  // 🆕 Multi-doctor fields
  doctor_id?: string;
  doctor_name?: string;
  doctor_color?: string;
  consultorio_id?: string;
  consultorio_name?: string;
  appointment_type_id?: string;
  appointment_type_name?: string;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  blocked?: boolean;
  reason?: string;
}

export default function AgendaPage() {
  // State declarations
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [forceTimeSlots, setForceTimeSlots] = useState<TimeSlot[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingHours, setWorkingHours] = useState<any>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showTimeSlotManager, setShowTimeSlotManager] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // 🆕 Multi-doctor filters
  const [doctors, setDoctors] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterConsultorio, setFilterConsultorio] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // 🆕 Advanced view modes
  const [advancedViewMode, setAdvancedViewMode] = useState<'calendar' | 'timeline-doctor' | 'timeline-consultorio' | 'grid-multi'>('calendar');

  // 🆕 Load filter data
  const loadFilters = async () => {
    try {
      console.log('🔍 [FILTERS] Loading doctors, consultorios, and appointment types...');
      const [doctorsRes, consultoriosRes, typesRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/consultorios'),
        fetch('/api/appointment-types')
      ]);
      
      console.log('🔍 [FILTERS] Doctors response status:', doctorsRes.status);
      if (doctorsRes.ok) {
        const data = await doctorsRes.json();
        console.log('🔍 [FILTERS] Doctors data:', data);
        const activeDoctors = Array.isArray(data) ? data.filter((d: any) => d.activo !== false) : [];
        console.log('🔍 [FILTERS] Active doctors count:', activeDoctors.length);
        setDoctors(activeDoctors);
      } else {
        console.error('❌ [FILTERS] Doctors endpoint returned error:', doctorsRes.status);
        setDoctors([]);
      }
      
      console.log('🔍 [FILTERS] Consultorios response status:', consultoriosRes.status);
      if (consultoriosRes.ok) {
        const data = await consultoriosRes.json();
        console.log('🔍 [FILTERS] Consultorios data count:', Array.isArray(data) ? data.length : 0);
        setConsultorios(Array.isArray(data) ? data.filter((c: any) => c.activo !== false) : []);
      } else {
        console.error('❌ [FILTERS] Consultorios endpoint returned error:', consultoriosRes.status);
        setConsultorios([]);
      }
      
      console.log('🔍 [FILTERS] Appointment types response status:', typesRes.status);
      if (typesRes.ok) {
        const data = await typesRes.json();
        console.log('🔍 [FILTERS] Appointment types data count:', Array.isArray(data) ? data.length : 0);
        setAppointmentTypes(Array.isArray(data) ? data.filter((t: any) => t.activo !== false) : []);
      } else {
        console.error('❌ [FILTERS] Appointment types endpoint returned error:', typesRes.status);
        setAppointmentTypes([]);
      }
    } catch (err) {
      console.error('❌ [FILTERS] Error loading filters:', err);
      setDoctors([]);
      setConsultorios([]);
      setAppointmentTypes([]);
    }
  };

  // Loader for appointments
  const loadAppointments = async () => {
    console.log('📥 [LOAD] Starting loadAppointments...');
    setLoading(true);
    setError(null);
    try {
      // Add cache busting to force fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/appointments?_=${timestamp}`, {
        cache: 'no-store'
      });
      
      console.log('📥 [LOAD] Response status:', response.status);
      
      if (!response.ok) {
        console.error(`❌ loadAppointments error: ${response.status}`);
        setError(`Error ${response.status}: No se pudieron cargar las citas`);
        return;
      }

      const result = await response.json();
      console.log('📥 [LOAD] Raw result:', result);
      
      const appointments = Array.isArray(result) ? result : (result.appointments || result.data || []);
      console.log('📥 [LOAD] Parsed appointments count:', appointments.length);
      
      if (appointments.length > 0) {
        const processedAppointments = appointments.map((appointment: any) => ({
          id: appointment.id,
          patient_id: appointment.patient_id,
          treatment_id: appointment.treatment_id,
          fecha: appointment.appointment_date || appointment.fecha,
          appointment_time: appointment.appointment_time,
          patient_name: appointment.patient_name,
          treatment_name: appointment.treatment_name,
          phone: appointment.patient_phone || appointment.phone,
          notes: appointment.notes,
          status: appointment.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled',
          // 🆕 Multi-doctor fields
          doctor_id: appointment.doctor_id,
          doctor_name: appointment.doctor_name,
          doctor_color: appointment.doctor_color,
          consultorio_id: appointment.consultorio_id,
          consultorio_name: appointment.consultorio_name,
          appointment_type_id: appointment.appointment_type_id,
          appointment_type_name: appointment.appointment_type_name
        }));
        console.log('📥 [LOAD] Processed appointments:', processedAppointments.length);
        console.log('📥 [LOAD] Appointment IDs:', processedAppointments.map((a: any) => a.id));
        setAppointments(processedAppointments);
      } else {
        console.log('📥 [LOAD] No appointments found, setting empty array');
        setAppointments([]);
      }
    } catch (err) {
      console.error('❌ [LOAD] Error in catch block:', err);
      setError('Error al cargar las citas');
      setAppointments([]);
    } finally {
      setLoading(false);
      console.log('📥 [LOAD] Loading complete, state updated');
    }
  };

  // Generate default time slots (8 AM to 6 PM, 30-min intervals)
  const generateDefaultTimeSlots = (): TimeSlot[] => {
    console.log(`🔍 generateDefaultTimeSlots: STARTING slot generation...`);
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 18; // 6 PM
    const interval = 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          id: `default-${hour}-${minute}`,
          time,
          available: true
        });
      }
    }

    return slots;
  };

  // Generate custom time slots based on working hours
  const generateCustomTimeSlots = (workingHours: any): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    
    if (!workingHours || !workingHours.start || !workingHours.end) {
      return generateDefaultTimeSlots();
    }
    
    try {
      // Parse working hours
      const [startHour, startMinute] = workingHours.start.split(":").map(Number);
      const [endHour, endMinute] = workingHours.end.split(":").map(Number);
      const slotDuration = workingHours.slotDuration || 30;
      
      // Calculate total minutes for easier iteration
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      
      for (let totalMinutes = startTotalMinutes; totalMinutes < endTotalMinutes; totalMinutes += slotDuration) {
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          id: `custom-${hour}-${minute}`,
          time,
          available: true
        });
      }
      
    } catch (error) {
      console.error(`🔍 Error generating custom slots:`, error);
      return generateDefaultTimeSlots();
    }
    
    return slots;
  };

  // Load time slots based on working hours configuration
  const loadTimeSlots = async () => {
    try {
      let generatedSlots: TimeSlot[] = [];
      
      if (workingHours && workingHours.start && workingHours.end) {
        // Use custom working hours
        generatedSlots = generateCustomTimeSlots(workingHours);
      } else {
        // Use default slots
        generatedSlots = generateDefaultTimeSlots();
      }
      
      setTimeSlots(generatedSlots);
      setForceTimeSlots(generatedSlots);
      
    } catch (err) {
      console.error('Error loading time slots:', err);
      // Fallback to default slots if there's an error
      const fallbackSlots = generateDefaultTimeSlots();
      setTimeSlots(fallbackSlots);
      setForceTimeSlots(fallbackSlots);
    }
  };

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    switch (viewMode) {
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
      case 'month':
        return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      default:
        return currentDate.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
    }
  };

  const handleSlotClick = (date: string, time: string) => {
    setSelectedSlot({ date, time });
    setSelectedAppointment(null);
    setShowAppointmentModal(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedSlot(null);
    setShowAppointmentModal(true);
  };

  // 🚨 VALIDACIÓN: Detectar conflictos de horarios
  const validateAppointmentConflicts = (appointmentData: any): string | null => {
    const { appointment_date, doctor_id, patient_id, consultorio_id } = appointmentData;
    
    // appointment_date viene como ISO string completo (e.g., "2025-10-15T15:00:00.000Z")
    const appointmentDateTime = new Date(appointment_date);
    
    // Excluir la cita actual si estamos editando
    const otherAppointments = appointments.filter(apt => 
      apt.id !== selectedAppointment?.id
    );

    for (const existingApt of otherAppointments) {
      const existingDateTime = new Date(existingApt.fecha);
      
      // Comparar si es la misma fecha y hora (ignorar segundos)
      const sameYear = existingDateTime.getFullYear() === appointmentDateTime.getFullYear();
      const sameMonth = existingDateTime.getMonth() === appointmentDateTime.getMonth();
      const sameDate = existingDateTime.getDate() === appointmentDateTime.getDate();
      const sameHour = existingDateTime.getHours() === appointmentDateTime.getHours();
      const sameMinutes = existingDateTime.getMinutes() === appointmentDateTime.getMinutes();
      
      if (sameYear && sameMonth && sameDate && sameHour && sameMinutes) {
        console.log('⚠️ [VALIDATION] Same time slot found:', existingApt.patient_name, existingDateTime.toISOString());
        
        // ❌ CONFLICTO 1: Mismo doctor ocupado
        if (doctor_id && existingApt.doctor_id === doctor_id) {
          console.log('❌ [VALIDATION] Doctor conflict detected');
          return `⚠️ El doctor ya tiene una cita agendada a esta hora con ${existingApt.patient_name || 'otro paciente'}`;
        }

        // ❌ CONFLICTO 2: Mismo paciente duplicado
        if (patient_id && Number(existingApt.patient_id) === Number(patient_id)) {
          console.log('❌ [VALIDATION] Patient conflict detected');
          return `⚠️ Este paciente ya tiene una cita agendada a esta hora`;
        }

        // ❌ CONFLICTO 3: Mismo consultorio ocupado
        if (consultorio_id && existingApt.consultorio_id === consultorio_id) {
          console.log('❌ [VALIDATION] Consultorio conflict detected');
          return `⚠️ El consultorio ya está ocupado a esta hora por ${existingApt.patient_name || 'otro paciente'}`;
        }
      }
    }

    console.log('✅ [VALIDATION] No conflicts found');
    // ✅ Sin conflictos
    return null;
  };

  const handleAppointmentSave = async (appointmentData: any) => {
    console.log('🔍 handleAppointmentSave called with data:', appointmentData);
    console.log('🔍 selectedAppointment:', selectedAppointment);
    console.log('🔍 selectedSlot:', selectedSlot);
    
    // 🚨 VALIDAR CONFLICTOS antes de guardar
    const conflictError = validateAppointmentConflicts(appointmentData);
    if (conflictError) {
      toast.error(conflictError, {
        duration: 5000,
        style: {
          background: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #fca5a5',
        }
      });
      return; // ❌ No guardar si hay conflicto
    }
    
    try {
      let newAppointmentId = null;
      if (selectedAppointment) {
        // Update existing appointment
        console.log('🔍 Updating existing appointment:', selectedAppointment.id);
        
        const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appointmentData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📨 PUT Result:', result);
        console.log('🎨 PUT doctor_color:', result.doctor_color);
        if (result.id) {
          newAppointmentId = result.id;
        }
      } else {
        // Create new appointment
        console.log('🔍 Creating new appointment...');
        console.log('🔍 Data being sent to API:', appointmentData);
        
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appointmentData),
        });

        console.log('🌐 POST Response status:', response.status);
        console.log('🌐 POST Response ok:', response.ok);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📨 POST Result:', result);
        
        if (result.id) {
          newAppointmentId = result.id;
        }
      }

      // Reload appointments with retry
      const reloadWithRetry = async (attempts = 3) => {
        console.log('🔄 Starting reloadWithRetry with', attempts, 'attempts');
        for (let i = 0; i < attempts; i++) {
          console.log(`🔄 Retry attempt ${i + 1}/${attempts}`);
          await new Promise(resolve => setTimeout(resolve, i * 500));
          await loadAppointments();
          
          if (newAppointmentId && i === attempts - 1) {
            setTimeout(() => {
              setAppointments(prev => [...prev]);
              setRefreshTrigger(prev => prev + 1);
              console.log('🔄 Final refresh trigger applied');
            }, 200);
          }
        }
        console.log('✅ reloadWithRetry completed');
      };

      await reloadWithRetry();
      setShowAppointmentModal(false);
      setSelectedSlot(null);
      setSelectedAppointment(null);
      console.log('✅ Appointment save/update completed with retry system');
    } catch (err) {
      console.error('❌ Error saving appointment:', err);
      setError('Error al guardar la cita');
    }
  };

  const handleAppointmentDelete = async (appointmentId: number) => {
    console.log('🗑️ [API DELETE] Starting API delete for ID:', appointmentId);
    try {
      const url = `/api/appointments/${appointmentId}`;
      console.log('🗑️ [API DELETE] Fetching URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🗑️ [API DELETE] Response status:', response.status);
      console.log('🗑️ [API DELETE] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [API DELETE] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🗑️ [API DELETE] Result:', result);
      
      if (result.error) {
        console.error('❌ [API DELETE] Result has error:', result.error);
        throw new Error(result.error);
      }
      
      console.log('✅ [API DELETE] Appointment deleted successfully');
      
      // Update local state immediately instead of reloading
      setAppointments(prev => {
        const filtered = prev.filter(apt => apt.id !== appointmentId);
        console.log('🗑️ [API DELETE] Filtered appointments count:', filtered.length, '(was:', prev.length, ')');
        return filtered;
      });
      
      console.log('✅ [API DELETE] Local state updated, appointment removed from UI');
    } catch (error) {
      console.error('❌ [API DELETE] Error deleting appointment:', error);
      console.error('❌ [API DELETE] Error stack:', error instanceof Error ? error.stack : 'No stack');
      alert('Error al eliminar la cita: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  // 🆕 Handler for drag-and-drop appointment move
  const handleAppointmentMove = async (appointmentId: number, newDate: string, newTime: string) => {
    console.log('🎯 [DRAG] Moving appointment', appointmentId, 'to', newDate, newTime);
    try {
      // Combine date and time into ISO string
      const [hours, minutes] = newTime.split(':');
      const appointmentDateTime = new Date(newDate);
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_date: appointmentDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reload appointments to show the change
      await loadAppointments();
      console.log('✅ [DRAG] Appointment moved successfully');
    } catch (error) {
      console.error('❌ [DRAG] Error moving appointment:', error);
      alert('Error al mover la cita');
      // Reload to revert the optimistic update
      await loadAppointments();
    }
  };

  // 🆕 Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    if (filterDoctor !== 'all' && apt.doctor_id !== filterDoctor) return false;
    if (filterConsultorio !== 'all' && apt.consultorio_id !== filterConsultorio) return false;
    if (filterType !== 'all' && apt.appointment_type_id !== filterType) return false;
    return true;
  });

  // Load working hours from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('working-hours');
    console.log('🔍 Initial load of working-hours from localStorage:', saved);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('🔍 Parsed working hours on mount:', parsed);
        setWorkingHours(parsed);
      } catch (e) {
        console.error('🔍 Error parsing working hours on mount:', e);
        setWorkingHours(null);
      }
    } else {
      console.log('🔍 No working hours found in localStorage');
      setWorkingHours(null);
    }
  }, []);

  // Update time slots when workingHours, currentDate, viewMode, or refreshTrigger change
  useEffect(() => {
    console.log('🔍 Effect triggered - workingHours changed:', workingHours);
    loadAppointments();
    loadTimeSlots();
  }, [currentDate, viewMode, refreshTrigger, workingHours]);

  // Force initial load of appointments when component mounts
  useEffect(() => {
    console.log('🔍 FORCE LOAD - Calling loadAppointments...');
    loadFilters(); // 🆕 Load filter options
    loadAppointments();
    loadTimeSlots();
  }, []);

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 min-h-screen">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Agenda
                  </h1>
                  <p className="text-gray-600">Gestión profesional de citas y horarios</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTimeSlotManager(true)}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Horarios
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfigModal(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configuración
                </Button>
              </div>
            </div>
            
            {/* Date Navigation Section */}
            <div className="flex justify-between items-center mt-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('next')}
                  className="flex items-center gap-2"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-700">
                  {getDateRangeText()}
                </h2>
              </div>
              
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  Hoy
                </Button>
              </div>
            </div>
            
            {/* View Mode Tabs */}
            <div className="flex justify-between items-center mt-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Modo de vista:</span>
                <select
                  value={advancedViewMode}
                  onChange={(e) => setAdvancedViewMode(e.target.value as any)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="calendar">📅 Calendario Estándar</option>
                  <option value="timeline-doctor">👨‍⚕️ Timeline por Doctor</option>
                  <option value="timeline-consultorio">🏥 Timeline por Consultorio</option>
                  <option value="grid-multi">📊 Grid Multi-Doctor</option>
                </select>
              </div>
              
              {advancedViewMode === 'calendar' && (
                <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'day' | 'week' | 'month')}>
                  <TabsList>
                    <TabsTrigger value="day">Día</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mes</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>

            {/* 🆕 Filters Section */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filtros:</span>
                </div>
                
                {/* Doctor Filter */}
                <select
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">Todos los doctores</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.nombre}
                    </option>
                  ))}
                </select>

                {/* Consultorio Filter */}
                <select
                  value={filterConsultorio}
                  onChange={(e) => setFilterConsultorio(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">Todos los consultorios</option>
                  {consultorios.map((consultorio) => (
                    <option key={consultorio.id} value={consultorio.id}>
                      {consultorio.nombre}
                    </option>
                  ))}
                </select>

                {/* Appointment Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">Todos los tipos</option>
                  {appointmentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.nombre}
                    </option>
                  ))}
                </select>

                {/* Clear Filters Button */}
                {(filterDoctor !== 'all' || filterConsultorio !== 'all' || filterType !== 'all') && (
                  <button
                    onClick={() => {
                      setFilterDoctor('all');
                      setFilterConsultorio('all');
                      setFilterType('all');
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Limpiar filtros
                  </button>
                )}

                {/* Active filters count */}
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                    {filteredAppointments.length} de {appointments.length} citas
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando agenda...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <Button 
                  onClick={loadAppointments}
                  variant="outline"
                  className="mt-4"
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              <>
                {advancedViewMode === 'calendar' && (
                  <CalendarGrid
                    viewMode={viewMode}
                    currentDate={currentDate}
                    appointments={filteredAppointments}
                    timeSlots={timeSlots.length > 0 ? timeSlots : forceTimeSlots}
                    onSlotClick={handleSlotClick}
                    onAppointmentClick={handleAppointmentClick}
                    onAppointmentMove={handleAppointmentMove}
                    enableDragAndDrop={true}
                  />
                )}
                
                {advancedViewMode === 'timeline-doctor' && (
                  <TimelineDoctorView
                    appointments={filteredAppointments}
                    doctors={doctors}
                    currentDate={currentDate}
                    onAppointmentClick={handleAppointmentClick}
                    onSlotClick={handleSlotClick}
                  />
                )}
                
                {advancedViewMode === 'timeline-consultorio' && (
                  <TimelineConsultorioView
                    appointments={filteredAppointments}
                    consultorios={consultorios}
                    currentDate={currentDate}
                    onAppointmentClick={handleAppointmentClick}
                    onSlotClick={handleSlotClick}
                  />
                )}
                
                {advancedViewMode === 'grid-multi' && (
                  <GridMultiDoctorView
                    appointments={filteredAppointments}
                    doctors={doctors}
                    currentDate={currentDate}
                    onAppointmentClick={handleAppointmentClick}
                    onSlotClick={handleSlotClick}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Modals */}
        {showAppointmentModal && (
          <AppointmentModal
            isOpen={showAppointmentModal}
            onClose={() => {
              setShowAppointmentModal(false);
              setSelectedSlot(null);
              setSelectedAppointment(null);
            }}
            onSave={handleAppointmentSave}
            onDelete={handleAppointmentDelete}
            selectedSlot={selectedSlot}
            selectedAppointment={selectedAppointment}
          />
        )}
        
        {/* TimeSlotManager modal para gestión de horarios */}
        {showTimeSlotManager && (
          <TimeSlotManager
            isOpen={showTimeSlotManager}
            onClose={() => setShowTimeSlotManager(false)}
            selectedDate={currentDate}
            onSlotUpdate={(slots) => {
              console.log('🔍 TimeSlotManager onSlotUpdate called with slots:', slots?.length || 'undefined');
              
              // Force reload working hours from localStorage
              try {
                const saved = localStorage.getItem('working-hours');
                console.log('🔍 Reading working-hours from localStorage:', saved);
                
                if (saved) {
                  const parsedHours = JSON.parse(saved);
                  console.log('🔍 Parsed working hours:', parsedHours);
                  setWorkingHours(parsedHours);
                  
                  // Generate new slots based on updated working hours
                  const newSlots = generateCustomTimeSlots(parsedHours);
                  console.log('🔍 Generated new slots from working hours:', newSlots.length);
                  setTimeSlots(newSlots);
                  setForceTimeSlots(newSlots);
                } else {
                  console.log('🔍 No working hours in localStorage, using default');
                  setWorkingHours(null);
                  const defaultSlots = generateDefaultTimeSlots();
                  setTimeSlots(defaultSlots);
                  setForceTimeSlots(defaultSlots);
                }
              } catch (e) {
                console.error('🔍 Error parsing working hours:', e);
                setWorkingHours(null);
                const defaultSlots = generateDefaultTimeSlots();
                setTimeSlots(defaultSlots);
                setForceTimeSlots(defaultSlots);
              }
              
              // Force a refresh to reload everything
              setRefreshTrigger(prev => prev + 1);
              console.log('🔍 Forced refresh trigger');
            }}
          />
        )}

        {/* Configuración Modal con TODAS las features */}
        {showConfigModal && (
          <AgendaConfigModal
            isOpen={showConfigModal}
            onClose={() => setShowConfigModal(false)}
          />
        )}
      </div>
    </AppLayout>
  );
}