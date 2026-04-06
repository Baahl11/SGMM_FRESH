"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
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
  User,
  Sparkles
} from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import CalendarGrid from "@/components/agenda/calendar-grid";
import AppointmentModal from "@/components/agenda/appointment-modal";
import TimeSlotManager from "@/components/agenda/time-slot-manager";
import TimelineDoctorView from "@/components/agenda/timeline-doctor-view";
import TimelineConsultorioView from "@/components/agenda/timeline-consultorio-view";
import GridMultiDoctorView from "@/components/agenda/grid-multi-doctor-view";
import { GlassPanel } from "@/components/ui/glass-panel";

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
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const router = useRouter();
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

  const getNextSlotTime = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const remainder = minutes % 30;
    if (remainder !== 0) {
      now.setMinutes(minutes + (30 - remainder));
    }
    now.setSeconds(0, 0);
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const openQuickAppointment = () => {
    const today = new Date();
    const localDate = today.toISOString().split('T')[0];
    const nextSlot = getNextSlotTime();
    setSelectedAppointment(null);
    setSelectedSlot({ date: localDate, time: nextSlot });
    setShowAppointmentModal(true);
  };

  // 🆕 Load filter data
  const loadFilters = async () => {
    try {
      const [doctorsRes, consultoriosRes, typesRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/consultorios'),
        fetch('/api/appointment-types')
      ]);
      if (doctorsRes.ok) {
        const data = await doctorsRes.json();
        const activeDoctors = Array.isArray(data) ? data.filter((d: any) => d.activo !== false) : [];
        setDoctors(activeDoctors);
      } else {
        console.error('❌ [FILTERS] Doctors endpoint returned error:', doctorsRes.status);
        setDoctors([]);
      }
      if (consultoriosRes.ok) {
        const data = await consultoriosRes.json();
        setConsultorios(Array.isArray(data) ? data.filter((c: any) => c.activo !== false) : []);
      } else {
        console.error('❌ [FILTERS] Consultorios endpoint returned error:', consultoriosRes.status);
        setConsultorios([]);
      }
      if (typesRes.ok) {
        const data = await typesRes.json();
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
    setLoading(true);
    setError(null);
    try {
      // Add cache busting to force fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/appointments/combined?_=${timestamp}`, {
        cache: 'no-store'
      });
      if (!response.ok) {
        console.error(`❌ loadAppointments error: ${response.status}`);
        setError(`Error ${response.status}: No se pudieron cargar las citas`);
        return;
      }

      const result = await response.json();
      const appointments = Array.isArray(result) ? result : (result.appointments || result.data || []);
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
        setAppointments(processedAppointments);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error('❌ [LOAD] Error in catch block:', err);
      setError('Error al cargar las citas');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate default time slots (8 AM to 6 PM, 30-min intervals)
  const generateDefaultTimeSlots = (): TimeSlot[] => {
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
        // ❌ CONFLICTO 1: Mismo doctor ocupado
        if (doctor_id && existingApt.doctor_id === doctor_id) {
          return `⚠️ El doctor ya tiene una cita agendada a esta hora con ${existingApt.patient_name || 'otro paciente'}`;
        }

        // ❌ CONFLICTO 2: Mismo paciente duplicado
        if (patient_id && Number(existingApt.patient_id) === Number(patient_id)) {
          return `⚠️ Este paciente ya tiene una cita agendada a esta hora`;
        }

        // ❌ CONFLICTO 3: Mismo consultorio ocupado
        if (consultorio_id && existingApt.consultorio_id === consultorio_id) {
          return `⚠️ El consultorio ya está ocupado a esta hora por ${existingApt.patient_name || 'otro paciente'}`;
        }
      }
    }
    // ✅ Sin conflictos
    return null;
  };

  const handleAppointmentSave = async (appointmentData: any) => {
    // 🚨 VALIDAR CONFLICTOS antes de guardar
    const conflictError = validateAppointmentConflicts(appointmentData);
    if (conflictError) {
      toast.error(conflictError, {
        duration: 5000,
      });
      return; // ❌ No guardar si hay conflicto
    }
    
    try {
      let newAppointmentId = null;
      if (selectedAppointment) {
        // Update existing appointment
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
        if (result.id) {
          newAppointmentId = result.id;
        }
      } else {
        // Create new appointment
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appointmentData),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.id) {
          newAppointmentId = result.id;
        }
      }

      // Reload appointments with retry
      const reloadWithRetry = async (attempts = 3) => {
        for (let i = 0; i < attempts; i++) {
          await new Promise(resolve => setTimeout(resolve, i * 500));
          await loadAppointments();
          
          if (newAppointmentId && i === attempts - 1) {
            setTimeout(() => {
              setAppointments(prev => [...prev]);
              setRefreshTrigger(prev => prev + 1);
            }, 200);
          }
        }
      };

      await reloadWithRetry();
      setShowAppointmentModal(false);
      setSelectedSlot(null);
      setSelectedAppointment(null);
    } catch (err) {
      console.error('❌ Error saving appointment:', err);
      setError('Error al guardar la cita');
    }
  };

  const handleAppointmentDelete = async (appointmentId: number) => {
    try {
      const url = `/api/appointments/${appointmentId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [API DELETE] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (result.error) {
        console.error('❌ [API DELETE] Result has error:', result.error);
        throw new Error(result.error);
      }
      // Update local state immediately instead of reloading
      setAppointments(prev => {
        const filtered = prev.filter(apt => apt.id !== appointmentId);
        return filtered;
      });
    } catch (error) {
      console.error('❌ [API DELETE] Error deleting appointment:', error);
      console.error('❌ [API DELETE] Error stack:', error instanceof Error ? error.stack : 'No stack');
      alert('Error al eliminar la cita: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  // 🆕 Handler for drag-and-drop appointment move
  const handleAppointmentMove = async (appointmentId: number, newDate: string, newTime: string) => {
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

  const todayBase = new Date();
  todayBase.setHours(0, 0, 0, 0);
  const weekAhead = new Date(todayBase);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const todayAppointmentsCount = filteredAppointments.filter((apt) => {
    const aptDate = new Date(apt.fecha);
    return aptDate.toDateString() === todayBase.toDateString();
  }).length;

  const upcomingWeekCount = filteredAppointments.filter((apt) => {
    const aptDate = new Date(apt.fecha);
    return aptDate >= todayBase && aptDate <= weekAhead;
  }).length;

  const slotPool = Math.max(1, (timeSlots.length > 0 ? timeSlots : forceTimeSlots).length);
  const spanMultiplier = viewMode === 'week' ? 7 : viewMode === 'month' ? 30 : 1;
  const occupancyRate = Math.min(100, Math.round((filteredAppointments.length / (slotPool * spanMultiplier || 1)) * 100)) || 0;

  // Load working hours from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('working-hours');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWorkingHours(parsed);
      } catch (e) {
        console.error('🔍 Error parsing working hours on mount:', e);
        setWorkingHours(null);
      }
    } else {
      setWorkingHours(null);
    }
  }, []);

  // Update time slots when workingHours, currentDate, viewMode, or refreshTrigger change
  useEffect(() => {
    loadAppointments();
    loadTimeSlots();
  }, [currentDate, viewMode, refreshTrigger, workingHours]);

  // Force initial load of appointments when component mounts
  useEffect(() => {
    loadFilters(); // 🆕 Load filter options
    loadAppointments();
    loadTimeSlots();
  }, []);

  return (
    <AppLayout>
      <div className="dashboard-surface space-y-8 text-white">
        <GlassPanel className="p-6 border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 shadow-xl flex items-center justify-center">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">AgendaMed Pro</p>
                <h1 className="text-4xl font-semibold leading-tight">Agenda</h1>
                <p className="text-white/70">Gestión profesional de citas, horarios y recursos en una sola vista.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={openQuickAppointment}
                className="h-12 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-500 text-slate-900 font-semibold shadow-[0_20px_45px_rgba(14,165,233,0.35)] hover:opacity-90"
              >
                <Sparkles className="mr-2 h-4 w-4" /> Nueva cita
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTimeSlotManager(true)}
                className="h-12 rounded-full border-white/30 bg-white/5 text-white hover:bg-white/10"
              >
                <Clock className="mr-2 h-4 w-4" /> Horarios inteligentes
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/settings')}
                className="h-12 rounded-full border-white/30 bg-white/5 text-white hover:bg-white/10"
              >
                <Settings className="mr-2 h-4 w-4" /> Configuración
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-white/60">Citas filtradas</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-semibold">{filteredAppointments.length}</span>
                <Badge className="rounded-full bg-emerald-400/20 text-emerald-100 border-emerald-300/30">{appointments.length} totales</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-white/60">Hoy</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-semibold">{todayAppointmentsCount}</span>
                <Badge className="rounded-full bg-cyan-400/20 text-cyan-50 border-cyan-300/30">agenda diaria</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-white/60">Próximos 7 días</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-semibold">{upcomingWeekCount}</span>
                <Badge className="rounded-full bg-purple-400/20 text-purple-50 border-purple-300/30">siguiente semana</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-white/60">Ocupación estimada</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-semibold">{occupancyRate}%</span>
                <Badge className="rounded-full bg-white/10 text-white border-white/20">modo {viewMode}</Badge>
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="overflow-hidden border-white/15 bg-gradient-to-b from-white/10 via-white/5 to-transparent">
          <div className="border-b border-white/5 px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                  className="rounded-full border-white/30 bg-white/5 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('next')}
                  className="rounded-full border-white/30 bg-white/5 text-white hover:bg-white/10"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center text-xl font-semibold tracking-tight text-white">
                {getDateRangeText()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="rounded-full text-emerald-200 hover:text-white"
              >
                Hoy
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-b border-white/5 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
              <span className="text-sm uppercase tracking-wide text-white/60">Modo de vista</span>
              <select
                value={advancedViewMode}
                onChange={(e) => setAdvancedViewMode(e.target.value as any)}
                className="pill-select flex h-11 items-center justify-between px-4 text-sm shadow-lg"
              >
                <option value="calendar">Calendario estándar</option>
                <option value="timeline-doctor">Timeline por doctor</option>
                <option value="timeline-consultorio">Timeline por consultorio</option>
                <option value="grid-multi">Grid multi-doctor</option>
              </select>
            </div>

            {advancedViewMode === 'calendar' && (
              <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'day' | 'week' | 'month')}>
                <TabsList className="rounded-full bg-white/10 p-1 text-white">
                  <TabsTrigger value="day" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900">Día</TabsTrigger>
                  <TabsTrigger value="week" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900">Semana</TabsTrigger>
                  <TabsTrigger value="month" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900">Mes</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          <div className="border-b border-white/5 px-6 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70">
                <Filter className="h-4 w-4" />
                Filtros rápidos
              </div>

              <select
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                className="glass-select min-w-[200px]"
              >
                <option value="all">Todos los doctores</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.nombre}
                  </option>
                ))}
              </select>

              <select
                value={filterConsultorio}
                onChange={(e) => setFilterConsultorio(e.target.value)}
                className="glass-select min-w-[200px]"
              >
                <option value="all">Todos los consultorios</option>
                {consultorios.map((consultorio) => (
                  <option key={consultorio.id} value={consultorio.id}>
                    {consultorio.nombre}
                  </option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="glass-select min-w-[200px]"
              >
                <option value="all">Todos los tipos</option>
                {appointmentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nombre}
                  </option>
                ))}
              </select>

              {(filterDoctor !== 'all' || filterConsultorio !== 'all' || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setFilterDoctor('all');
                    setFilterConsultorio('all');
                    setFilterType('all');
                  }}
                  className="rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
                >
                  Limpiar filtros
                </button>
              )}

              <div className="ml-auto flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80">
                <Badge className="rounded-full bg-emerald-400/20 text-emerald-50 border-transparent">
                  {filteredAppointments.length} / {appointments.length}
                </Badge>
                citas visibles
              </div>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-6">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-white/70">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-white"></div>
                  <p>Cargando agenda...</p>
                </div>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-rose-200">
                <p>{error}</p>
                <Button 
                  onClick={loadAppointments}
                  variant="outline"
                  className="mt-4 rounded-full border-white/30 text-white"
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
          </div>
        </GlassPanel>
        
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
              // Force reload working hours from localStorage
              try {
                const saved = localStorage.getItem('working-hours');
                if (saved) {
                  const parsedHours = JSON.parse(saved);
                  setWorkingHours(parsedHours);
                  
                  // Generate new slots based on updated working hours
                  const newSlots = generateCustomTimeSlots(parsedHours);
                  setTimeSlots(newSlots);
                  setForceTimeSlots(newSlots);
                } else {
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
            }}
          />
        )}

      </div>
    </AppLayout>
  );
}