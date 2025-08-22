"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Settings,
  Users,
  Bell
} from "lucide-react";
import CalendarGrid from "@/components/agenda/calendar-grid";
import AppointmentModal from "@/components/agenda/appointment-modal";
import TimeSlotManager from "@/components/agenda/time-slot-manager";
import DebugSlots from "@/components/debug/DebugSlots";
import ApiService from "@/lib/api-service";
import { useAuth } from "@/hooks/use-auth";

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

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  blocked?: boolean;
  reason?: string;
}

export default function AgendaPage() {
  // Auth hook for proper OAuth support
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // State declarations
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [forceTimeSlots, setForceTimeSlots] = useState<TimeSlot[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Force refresh trigger
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingHours, setWorkingHours] = useState<any>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showTimeSlotManager, setShowTimeSlotManager] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Loader for appointments
  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      // TEMP FIX: Get ALL appointments, don't filter by date - backend filter is not working properly
      console.log('🔍 loadAppointments: Loading ALL appointments...');
      const response = await ApiService.getAppointmentsWithNames();
      if (response.error) {
        console.error('❌ loadAppointments error:', response.error);
        setError(response.error);
        return;
      }
      if (response.data) {
        console.log(`🔍 loadAppointments: Received ${response.data.length} appointments from API`);
        const processedAppointments = response.data.map((appointment: any) => ({
          id: appointment.id,
          patient_id: appointment.patient_id,
          treatment_id: appointment.treatment_id,
          fecha: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          patient_name: appointment.patient_name,
          treatment_name: appointment.treatment_name,
          phone: appointment.patient_phone,
          notes: appointment.notes,
          status: appointment.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
        }));
        console.log(`🔍 loadAppointments: Processed ${processedAppointments.length} appointments`);
        console.log('🔍 loadAppointments: First 3 appointments:', processedAppointments.slice(0, 3));
        setAppointments(processedAppointments);
      }
    } catch (err) {
      console.error('❌ loadAppointments catch error:', err);
      setError('Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  // Generate default time slots (8 AM to 6 PM, 30-min intervals)
  const generateDefaultTimeSlots = (): TimeSlot[] => {
    console.log(`🔍 generateDefaultTimeSlots: STARTING slot generation...`);
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM (typical business hours)
    const endHour = 18; // 6 PM (typical business hours)
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

    console.log(`🔍 generateDefaultTimeSlots: Generated ${slots.length} default slots (${startHour}:00-${endHour}:00)`);
    console.log(`🔍 First 5 slots:`, slots.slice(0, 5).map(s => s.time));
    console.log(`🔍 Last 5 slots:`, slots.slice(-5).map(s => s.time));

    return slots;
  };

  // Generate custom time slots based on working hours
  const generateCustomTimeSlots = (workingHours: any): TimeSlot[] => {
    console.log(`🔍 generateCustomTimeSlots: Starting with hours:`, workingHours);
    const slots: TimeSlot[] = [];
    
    if (!workingHours || !workingHours.start || !workingHours.end) {
      console.log(`🔍 Invalid working hours, falling back to default`);
      return generateDefaultTimeSlots();
    }
    
    try {
      // Parse working hours
      const [startHour, startMinute] = workingHours.start.split(":").map(Number);
      const [endHour, endMinute] = workingHours.end.split(":").map(Number);
      const slotDuration = workingHours.slotDuration || 30;
      
      console.log(`🔍 Parsed: ${startHour}:${startMinute} to ${endHour}:${endMinute}, duration: ${slotDuration}min`);
      
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
      
      console.log(`🔍 generateCustomTimeSlots: Generated ${slots.length} custom slots`);
      console.log(`🔍 First 5 custom slots:`, slots.slice(0, 5).map(s => s.time));
      console.log(`🔍 Last 5 custom slots:`, slots.slice(-5).map(s => s.time));
      
    } catch (error) {
      console.error(`🔍 Error generating custom slots:`, error);
      return generateDefaultTimeSlots();
    }
    
    return slots;
  };

  // Load time slots based on working hours configuration
  const loadTimeSlots = async () => {
    try {
      console.log(`🔍 loadTimeSlots: Loading slots based on working hours...`);
      console.log(`🔍 Current workingHours:`, workingHours);
      
      let generatedSlots: TimeSlot[] = [];
      
      if (workingHours && workingHours.start && workingHours.end) {
        // Use custom working hours
        console.log(`🔍 Using CUSTOM working hours: ${workingHours.start} to ${workingHours.end}`);
        generatedSlots = generateCustomTimeSlots(workingHours);
      } else {
        // Use default slots
        console.log(`🔍 Using DEFAULT time slots (no custom hours configured)`);
        generatedSlots = generateDefaultTimeSlots();
      }
      
      console.log(`🔍 Generated ${generatedSlots.length} slots`);
      console.log(`🔍 First 10 slots:`, generatedSlots.slice(0, 10).map(s => s.time));
      console.log(`🔍 Last 5 slots:`, generatedSlots.slice(-5).map(s => s.time));
      
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

  const handleSlotClick = (date: string, time: string) => {
    console.log(`🔍 [AGENDA-PAGE] handleSlotClick called - date: "${date}", time: "${time}"`);
    console.log(`🔍 [AGENDA-PAGE] date type: ${typeof date}, length: ${date.length}`);
    console.log(`🔍 [AGENDA-PAGE] Current view mode: ${viewMode}`);
    console.log(`🔍 [AGENDA-PAGE] Current date: ${currentDate.toDateString()}`);
    console.log(`🔍 [AGENDA-PAGE] Current date ISO: ${currentDate.toISOString()}`);
    
    setSelectedSlot({ date, time });
    setSelectedAppointment(null);
    setShowAppointmentModal(true);
    
    console.log(`🔍 [AGENDA-PAGE] Modal should now be open, selectedSlot set to:`, { date, time });
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedSlot(null);
    setShowAppointmentModal(true);
  };

  const handleAppointmentSave = async (appointmentData: any) => {
    console.log('🔍 handleAppointmentSave called with data:', appointmentData);
    console.log('🔍 selectedAppointment:', selectedAppointment);
    console.log('🔍 selectedSlot:', selectedSlot);
    console.log('🔍 Current view mode during save:', viewMode);
    
    try {
      let newAppointmentId = null;
      if (selectedAppointment) {
        // Update existing appointment
        console.log('🔍 Updating existing appointment:', selectedAppointment.id);
        const result = await ApiService.updateAppointment(selectedAppointment.id, appointmentData);
        if (result.data && result.data.id) {
          newAppointmentId = result.data.id;
        }
      } else {
        // Create new appointment
        console.log('🔍 Creating new appointment...');
        console.log('🔍 Data being sent to API:', appointmentData);
        const result = await ApiService.createAppointment(appointmentData);
        if (result.data && result.data.id) {
          newAppointmentId = result.data.id;
        }
      }

      // Múltiples intentos de recarga con delay progresivo - FIX para appointments que aparecen/desaparecen
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
    try {
      console.log('🗑️ Deleting appointment with ID:', appointmentId);
      const result = await ApiService.deleteAppointment(appointmentId);
      if (result.error) {
        throw new Error(result.error);
      }
      console.log('✅ Appointment deleted successfully');
      await loadAppointments();
      console.log('✅ Appointments reloaded after deletion');
    } catch (error) {
      console.error('❌ Error deleting appointment:', error);
    }
  };

  // Navigation function for date navigation
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

  // Get formatted date range text for navigation header
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
      default: // day
        return currentDate.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
    }
  };

  // Check authentication on mount
  useEffect(() => {
    if (!authLoading && !isAuthenticated && process.env.NEXT_PUBLIC_BYPASS_AUTH !== "1") {
      console.log("User not authenticated, redirecting to login...");
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, router]);

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
    if (!authLoading && isAuthenticated) {
      loadAppointments();
      loadTimeSlots();
    }
  }, [currentDate, viewMode, refreshTrigger, workingHours, isAuthenticated, authLoading]);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 min-h-screen">
      {/* Show loading spinner while checking authentication */}
      {authLoading && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      )}
      
      {/* Show content only when authenticated and not loading */}
      {!authLoading && isAuthenticated && (
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
                  <Settings className="h-4 w-4" />
                  Horarios
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
            <div className="flex justify-end mt-4">
              <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'day' | 'week' | 'month')}>
                <TabsList>
                  <TabsTrigger value="day">Día</TabsTrigger>
                  <TabsTrigger value="week">Semana</TabsTrigger>
                  <TabsTrigger value="month">Mes</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <CalendarGrid
              viewMode={viewMode}
              currentDate={currentDate}
              appointments={appointments}
              timeSlots={timeSlots.length > 0 ? timeSlots : forceTimeSlots}
              onSlotClick={handleSlotClick}
              onAppointmentClick={handleAppointmentClick}
            />
          </CardContent>
        </Card>
      )}
      
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
    </div>
  );
}