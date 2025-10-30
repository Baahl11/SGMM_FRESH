"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
import { useState } from "react";

interface Appointment {
  id: number;
  patient_id: number;
  patient_name?: string;
  fecha: string;
  appointment_time?: string;
  doctor_id?: string;
  doctor_name?: string;
  doctor_color?: string;
  consultorio_id?: string;
  consultorio_name?: string;
  appointment_type_id?: string;
  appointment_type_name?: string;
  treatment_id?: number;
  treatment_name?: string;
  phone?: string;
  notes?: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface Doctor {
  id: string;
  nombre: string;
  color: string;
  especialidad?: string;
}

interface TimelineDoctorViewProps {
  appointments: Appointment[];
  doctors: Doctor[];
  currentDate: Date;
  onAppointmentClick: (apt: Appointment) => void;
  onSlotClick: (date: string, time: string) => void;
}

export default function TimelineDoctorView({
  appointments,
  doctors,
  currentDate,
  onAppointmentClick,
  onSlotClick
}: TimelineDoctorViewProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || '');

  // Si no hay doctores, mostrar mensaje
  if (!doctors || doctors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <User className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">No hay doctores registrados</h3>
              <p className="text-sm text-gray-500 mt-2">
                Primero debes registrar doctores en la sección de configuración
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/dashboard/settings/doctors'}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ir a Configuración de Doctores
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  // Filter appointments for selected doctor and current date
  const dateStr = currentDate.toISOString().split('T')[0];
  const doctorAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.fecha).toISOString().split('T')[0];
    return aptDate === dateStr && apt.doctor_id === selectedDoctorId;
  });

  // Generate time slots from 8:00 to 20:00 (8 AM to 8 PM)
  const timeSlots: string[] = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 20) timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const getAppointmentForTime = (time: string) => {
    return doctorAppointments.find(apt => {
      const aptTime = apt.appointment_time || apt.fecha.split('T')[1]?.slice(0, 5);
      return aptTime === time;
    });
  };

  return (
    <div className="space-y-4">
      {/* Doctor Selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Vista por Doctor
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Seleccionar doctor:</span>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map(doctor => (
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
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline View */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              {currentDate.toLocaleDateString('es-MX', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <Badge variant="outline">
              {doctorAppointments.length} citas
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {timeSlots.map(time => {
              const appointment = getAppointmentForTime(time);
              
              return (
                <div
                  key={time}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border transition-all
                    ${appointment 
                      ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer'
                    }
                  `}
                  onClick={() => {
                    if (appointment) {
                      onAppointmentClick(appointment);
                    } else {
                      onSlotClick(dateStr, time);
                    }
                  }}
                >
                  {/* Time */}
                  <div className="flex items-center gap-2 w-20">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{time}</span>
                  </div>

                  {/* Appointment or Empty Slot */}
                  {appointment ? (
                    <div className="flex-1 flex items-center gap-3">
                      <div
                        className="w-1 h-12 rounded-full"
                        style={{ backgroundColor: selectedDoctor?.color }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {appointment.patient_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {appointment.appointment_type_name && (
                            <Badge variant="secondary" className="text-xs">
                              {appointment.appointment_type_name}
                            </Badge>
                          )}
                          {appointment.consultorio_name && (
                            <span className="text-xs text-gray-600">
                              📍 {appointment.consultorio_name}
                            </span>
                          )}
                        </div>
                        {appointment.notes && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {appointment.status === 'scheduled' && '📅 Programada'}
                        {appointment.status === 'confirmed' && '✅ Confirmada'}
                        {appointment.status === 'completed' && '✔️ Completada'}
                        {appointment.status === 'cancelled' && '❌ Cancelada'}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex-1 text-sm text-gray-400">
                      Disponible - Click para agendar
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
