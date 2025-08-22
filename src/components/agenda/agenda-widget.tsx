"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Plus,
  ChevronRight,
  Phone,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import ApiService from "@/lib/api-service";

interface Appointment {
  id: number;
  patient_id: number;
  treatment_id: number;
  patient_name: string;
  treatment_name: string;
  patient_phone?: string;
  fecha: string;
  appointment_time?: string;
  notas?: string;
}

interface AgendaWidgetProps {
  className?: string;
}

export function AgendaWidget({ className = "" }: AgendaWidgetProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      console.log('📅 AgendaWidget: Loading appointments from today onwards');
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const dateFrom = today.toISOString().split('T')[0];
      console.log('📅 AgendaWidget: Fetching from date:', dateFrom);
      
      // Use the getAppointmentsWithNames method with proper parameters
      const response = await ApiService.getAppointmentsWithNames({ 
        date_from: dateFrom 
      });
      console.log('📅 AgendaWidget: Response received:', response);
      
      if (response.data && !response.error) {
        const appointmentsData = Array.isArray(response.data) ? response.data : [];
        console.log('📅 AgendaWidget: Appointments loaded:', appointmentsData.length);
        console.log('📅 AgendaWidget: First appointment:', appointmentsData[0]);
        
        // Transform the data to match expected format
        const transformedAppointments = appointmentsData.map((apt: any) => ({
          id: apt.id,
          patient_id: apt.patient_id,
          treatment_id: apt.treatment_id,
          patient_name: apt.patient_name,
          treatment_name: apt.treatment_name,
          patient_phone: apt.patient_phone || '',
          fecha: apt.appointment_date, // Use only the date, not concatenated with time
          appointment_time: apt.appointment_time, // Keep time separate 
          notas: apt.notes || ''
        }));
        
        setAppointments(transformedAppointments);
        console.log('📅 AgendaWidget: Transformed appointments:', transformedAppointments);
      } else {
        console.log('📅 AgendaWidget: No appointments data received or error:', response.error);
        setAppointments([]);
      }
    } catch (error) {
      console.error("📅 AgendaWidget: Error loading appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper function to safely parse date strings without timezone issues
  const parseDate = (dateString: string) => {
    // If it's just a date (YYYY-MM-DD), parse it as local time
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-based
    }
    // Otherwise, parse normally
    return new Date(dateString);
  };

  const todayAppointments = appointments.filter(apt => {
    const aptDate = parseDate(apt.fecha);
    aptDate.setHours(0, 0, 0, 0);
    return aptDate.getTime() === today.getTime();
  });

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = parseDate(apt.fecha);
    return aptDate > new Date();
  }).slice(0, 5);

  const nextAppointment = upcomingAppointments[0];

  const formatDate = (dateString: string) => {
    const date = parseDate(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (appointment: Appointment) => {
    // Use appointment_time if available
    if (appointment.appointment_time) {
      return appointment.appointment_time;
    }
    // Fallback to extracting from fecha if it contains time
    const date = parseDate(appointment.fecha);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const isToday = (dateString: string) => {
    const date = parseDate(dateString);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const isTomorrow = (dateString: string) => {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = parseDate(dateString);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === tomorrow.getTime();
  };

  const getDateLabel = (dateString: string) => {
    if (isToday(dateString)) return "Hoy";
    if (isTomorrow(dateString)) return "Mañana";
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-purple-600" />
            Agenda Médica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <CalendarIcon className="h-5 w-5 text-purple-600" />
            Agenda Médica
          </CardTitle>
          <Link href="/agenda">
            <Button 
              variant="outline" 
              size="sm"
              className="border-purple-200 text-purple-700 hover:bg-purple-100"
            >
              Ver Agenda
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 rounded-lg p-3 border border-purple-200/50">
            <div className="text-sm text-purple-600 font-medium">Citas de Hoy</div>
            <div className="text-xl font-bold text-purple-800">{todayAppointments.length}</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 border border-purple-200/50">
            <div className="text-sm text-purple-600 font-medium">Próximas</div>
            <div className="text-xl font-bold text-purple-800">{upcomingAppointments.length}</div>
          </div>
        </div>

        {/* Next Appointment Highlight */}
        {nextAppointment && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Próxima Cita</span>
              <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                {getDateLabel(nextAppointment.fecha)}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-purple-600" />
                <span className="font-medium text-purple-900">{nextAppointment.patient_name}</span>
              </div>
              <div className="text-sm text-purple-700">
                              <p className="text-sm text-gray-600 font-medium">
                {formatTime(nextAppointment)} - {nextAppointment.treatment_name}
              </p>
              </div>
              {nextAppointment.patient_phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-purple-600">{nextAppointment.patient_phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Today's Appointments */}
        {todayAppointments.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Citas de Hoy
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {todayAppointments.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-3 p-2 bg-white/80 rounded border border-purple-100"
                >
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-purple-900 truncate">
                      {appointment.patient_name}
                    </p>
                    <p className="text-xs text-purple-600">
                      {formatTime(appointment)}
                    </p>
                  </div>
                </div>
              ))}
              {todayAppointments.length > 3 && (
                <p className="text-xs text-purple-600 text-center">
                  +{todayAppointments.length - 3} citas más
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <CalendarIcon className="h-8 w-8 text-purple-300 mx-auto mb-2" />
            <p className="text-sm text-purple-600">No hay citas programadas para hoy</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 border-t border-purple-200">
          <Link href="/agenda">
            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
