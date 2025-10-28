"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Building2 } from "lucide-react";
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

interface Consultorio {
  id: string;
  nombre: string;
  ubicacion?: string;
}

interface TimelineConsultorioViewProps {
  appointments: Appointment[];
  consultorios: Consultorio[];
  currentDate: Date;
  onAppointmentClick: (apt: Appointment) => void;
  onSlotClick: (date: string, time: string) => void;
}

export default function TimelineConsultorioView({
  appointments,
  consultorios,
  currentDate,
  onAppointmentClick,
  onSlotClick
}: TimelineConsultorioViewProps) {
  const [selectedConsultorioId, setSelectedConsultorioId] = useState<string>(consultorios[0]?.id || '');

  const selectedConsultorio = consultorios.find(c => c.id === selectedConsultorioId);

  // Filter appointments for selected consultorio and current date
  const dateStr = currentDate.toISOString().split('T')[0];
  const consultorioAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.fecha).toISOString().split('T')[0];
    return aptDate === dateStr && apt.consultorio_id === selectedConsultorioId;
  });

  // Generate time slots from 8:00 to 20:00 (8 AM to 8 PM)
  const timeSlots: string[] = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 20) timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const getAppointmentForTime = (time: string) => {
    return consultorioAppointments.find(apt => {
      const aptTime = apt.appointment_time || apt.fecha.split('T')[1]?.slice(0, 5);
      return aptTime === time;
    });
  };

  return (
    <div className="space-y-4">
      {/* Consultorio Selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Vista por Consultorio
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Seleccionar consultorio:</span>
              <Select value={selectedConsultorioId} onValueChange={setSelectedConsultorioId}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {consultorios.map(consultorio => (
                    <SelectItem key={consultorio.id} value={consultorio.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span>{consultorio.nombre}</span>
                        {consultorio.ubicacion && (
                          <span className="text-xs text-gray-500">({consultorio.ubicacion})</span>
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
              {consultorioAppointments.length} citas
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
                      ? 'bg-green-50 border-green-200 hover:bg-green-100 cursor-pointer' 
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
                        className="w-1 h-12 rounded-full bg-green-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {appointment.patient_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {appointment.doctor_name && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: appointment.doctor_color }}
                              />
                              <span className="text-xs text-gray-600">
                                Dr. {appointment.doctor_name}
                              </span>
                            </div>
                          )}
                          {appointment.appointment_type_name && (
                            <Badge variant="secondary" className="text-xs">
                              {appointment.appointment_type_name}
                            </Badge>
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
