"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Phone
} from "lucide-react";
import ApiService from "@/lib/api-service";

interface Appointment {
  id: number;
  patient_id: number;
  treatment_id: number;
  fecha: string;
  notas: string;
  patient_name?: string;
  patient_phone?: string;
  treatment_name?: string;
}

interface WeeklyCalendarProps {
  className?: string;
}

export default function WeeklyCalendar({ className = "" }: WeeklyCalendarProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [patients, setPatients] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);

  useEffect(() => {
    loadAppointments();
    loadBaseData();
  }, [currentWeekStart]);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    return new Date(d.setDate(diff));
  }

  const loadBaseData = async () => {
    try {
      const [patientsResponse, treatmentsResponse] = await Promise.all([
        ApiService.getPatients(),
        ApiService.getTreatments()
      ]);

      if (patientsResponse.data) setPatients(patientsResponse.data);
      if (treatmentsResponse.data) setTreatments(treatmentsResponse.data);
    } catch (error) {
      console.error("Error loading base data:", error);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      
      // Get appointments (records with monto_pagado = 0)
      const response = await ApiService.getRecords();
      
      if (response.data) {
        // Filter for scheduled appointments (monto_pagado = 0) in current week
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59);
        
        const weeklyAppointments = response.data.filter((record: any) => {
          const recordDate = new Date(record.fecha);
          return record.monto_pagado === 0 && 
                 recordDate >= currentWeekStart && 
                 recordDate <= weekEnd;
        });

        setAppointments(weeklyAppointments);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patientId: number): string => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.nombre || `Paciente ${patientId}`;
  };

  const getPatientPhone = (patientId: number): string => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.telefono || "";
  };

  const getTreatmentName = (treatmentId: number): string => {
    const treatment = treatments.find(t => t.id === treatmentId);
    return treatment?.nombre || "Tratamiento";
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    router.push(`/patients/${appointment.patient_id}/edit`);
  };

  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.fecha);
      return aptDate.toDateString() === date.toDateString();
    }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <CardTitle>Citas de la Semana</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {currentWeekStart.toLocaleDateString('es-MX', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })} - {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX', { 
            month: 'long', 
            day: 'numeric'
          })}
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando citas...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {getDaysOfWeek().map((date, index) => {
              const dayAppointments = getAppointmentsForDay(date);
              const isCurrentDay = isToday(date);
              
              return (
                <div key={index} className="min-h-[120px]">
                  {/* Day Header */}
                  <div className={`text-center p-2 rounded-t-lg border-b ${
                    isCurrentDay 
                      ? 'bg-blue-100 border-blue-300 text-blue-900' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="text-xs font-medium">{weekDays[index]}</div>
                    <div className={`text-lg font-bold ${
                      isCurrentDay ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Appointments */}
                  <div className="space-y-1 p-1 min-h-[80px] bg-gray-50 rounded-b-lg">
                    {dayAppointments.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="text-xs text-gray-400">Sin citas</div>
                      </div>
                    ) : (
                      dayAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          onClick={() => handleAppointmentClick(appointment)}
                          className="bg-white border border-blue-200 rounded p-2 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">
                              {formatTime(appointment.fecha)}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-gray-900 mb-1">
                            {getPatientName(appointment.patient_id)}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            {getTreatmentName(appointment.treatment_id)}
                          </div>
                          {getPatientPhone(appointment.patient_id) && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-500">
                                {getPatientPhone(appointment.patient_id)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {!loading && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  Total citas esta semana: <span className="font-medium">{appointments.length}</span>
                </span>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Programadas
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/patients/new')}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nueva Cita
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
