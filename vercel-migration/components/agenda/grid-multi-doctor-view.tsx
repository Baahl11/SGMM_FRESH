"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, LayoutGrid } from "lucide-react";

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

interface GridMultiDoctorViewProps {
  appointments: Appointment[];
  doctors: Doctor[];
  currentDate: Date;
  onAppointmentClick: (apt: Appointment) => void;
  onSlotClick: (date: string, time: string) => void;
}

export default function GridMultiDoctorView({
  appointments,
  doctors,
  currentDate,
  onAppointmentClick,
  onSlotClick
}: GridMultiDoctorViewProps) {
  // Filter appointments for current date
  const dateStr = currentDate.toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.fecha).toISOString().split('T')[0];
    return aptDate === dateStr;
  });

  // Generate time slots from 8:00 to 20:00 (8 AM to 8 PM)
  const timeSlots: string[] = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 20) timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const getAppointmentForDoctorAndTime = (doctorId: string, time: string) => {
    return todayAppointments.find(apt => {
      const aptTime = apt.appointment_time || apt.fecha.split('T')[1]?.slice(0, 5);
      return apt.doctor_id === doctorId && aptTime === time;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Vista Grid Multi-Doctor
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {currentDate.toLocaleDateString('es-MX', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <Badge variant="outline">
                {todayAppointments.length} citas totales
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid View */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row with Doctor Names */}
              <div className="grid gap-0 sticky top-0 bg-white border-b-2 border-gray-300 z-10" style={{ gridTemplateColumns: `120px repeat(${doctors.length}, 1fr)` }}>
                <div className="p-3 border-r border-gray-200 bg-gray-50 font-medium text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hora
                  </div>
                </div>
                {doctors.map(doctor => (
                  <div
                    key={doctor.id}
                    className="p-3 border-r border-gray-200 bg-gray-50"
                    style={{ borderTopColor: doctor.color, borderTopWidth: '3px' }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: doctor.color }}
                      />
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {doctor.nombre}
                        </div>
                        {doctor.especialidad && (
                          <div className="text-xs text-gray-500">
                            {doctor.especialidad}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slots Rows */}
              {timeSlots.map(time => (
                <div
                  key={time}
                  className="grid gap-0 border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  style={{ gridTemplateColumns: `120px repeat(${doctors.length}, 1fr)` }}
                >
                  {/* Time Column */}
                  <div className="p-2 border-r border-gray-200 bg-gray-50/50 flex items-center">
                    <span className="text-sm font-medium text-gray-700">{time}</span>
                  </div>

                  {/* Doctor Columns */}
                  {doctors.map(doctor => {
                    const appointment = getAppointmentForDoctorAndTime(doctor.id, time);
                    
                    return (
                      <div
                        key={`${doctor.id}-${time}`}
                        className={`
                          p-2 border-r border-gray-200 min-h-[60px] cursor-pointer transition-all
                          ${appointment 
                            ? 'bg-blue-50 hover:bg-blue-100' 
                            : 'hover:bg-gray-100'
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
                        {appointment ? (
                          <div className="space-y-1">
                            <div className="font-medium text-sm text-gray-900 line-clamp-1">
                              {appointment.patient_name}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {appointment.appointment_type_name && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  {appointment.appointment_type_name}
                                </Badge>
                              )}
                              {appointment.status === 'confirmed' && (
                                <span className="text-xs">✅</span>
                              )}
                            </div>
                            {appointment.consultorio_name && (
                              <div className="text-xs text-gray-600 line-clamp-1">
                                📍 {appointment.consultorio_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 h-full flex items-center justify-center">
                            +
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
