"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  User, 
  Phone, 
  Calendar as CalendarIcon,
  Plus
} from "lucide-react";

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
  appointment_type_color?: string;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  blocked?: boolean;
  reason?: string;
}

interface CalendarGridProps {
  viewMode: 'week' | 'month' | 'day';
  currentDate: Date;
  appointments: Appointment[];
  timeSlots: TimeSlot[];
  onSlotClick: (date: string, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

export default function CalendarGrid({
  viewMode,
  currentDate,
  appointments,
  timeSlots: propTimeSlots,
  onSlotClick,
  onAppointmentClick
}: CalendarGridProps) {
  
  // 🆕 Helper function to get appointment colors
  const getAppointmentColors = (appointment: Appointment) => {
    const color = appointment.doctor_color || '#3b82f6'; // Default blue
    
    // 🔍 DEBUG: Log color information
    console.log('🎨 getAppointmentColors:', {
      patient: appointment.patient_name,
      doctor_id: appointment.doctor_id,
      doctor_name: appointment.doctor_name,
      doctor_color: appointment.doctor_color,
      final_color: color
    });
    
    // Convert hex to RGB for opacity
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return {
      background: `rgba(${r}, ${g}, ${b}, 0.15)`, // Light background
      border: `rgba(${r}, ${g}, ${b}, 0.4)`,      // Medium border
      hover: `rgba(${r}, ${g}, ${b}, 0.25)`,      // Hover background
      text: color,                                 // Full color for text
    };
  };
  
  // Generate emergency slots if needed
  const generateEmergencySlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          id: `emergency-${hour}-${minute}`,
          time,
          available: true,
          blocked: false
        });
      }
    }
    return slots;
  };
  
  // Helper function to safely parse date strings
  const parseDate = (dateString: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateString);
  };

  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date | string) => {
    const d1 = date1;
    const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Use emergency slots if we don't have enough time slots
  const timeSlots = (propTimeSlots.length < 10) ? generateEmergencySlots() : propTimeSlots;
  
  const formatTime = (dateString: string | undefined | null) => {
    try {
      // 🔧 Handle undefined/null cases
      if (!dateString) {
        console.warn('formatTime: dateString is undefined/null');
        return '00:00';
      }

      // 🔧 Ensure dateString is a string
      const dateStr = String(dateString);
      
      if (dateStr.includes('Z') || dateStr.includes('+') || /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/.test(dateStr)) {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else if (dateStr.includes('T')) {
        const timePartMatch = dateStr.match(/T(\d{2}:\d{2})/);
        if (timePartMatch) {
          return timePartMatch[1];
        }
      }
      
      const date = new Date(dateStr);
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch (error) {
      console.error('Error formatting time:', dateString, error);
      return '00:00';
    }
  };

  const getAppointmentsForSlot = (date: Date, timeSlot: string) => {
    return appointments.filter(apt => {
      // 🔧 Skip appointments without required data
      if (!apt?.fecha) {
        console.warn('Appointment missing fecha:', apt);
        return false;
      }

      const aptDate = new Date(apt.fecha);
      
      // 🔧 Skip invalid dates
      if (isNaN(aptDate.getTime())) {
        console.warn('Invalid appointment date:', apt.fecha);
        return false;
      }
      
      let aptTime;
      if (apt.appointment_time) {
        aptTime = apt.appointment_time;
      } else {
        aptTime = formatTime(apt.fecha);
      }
      
      const isSameDate = aptDate.toDateString() === date.toDateString();
      
      const [slotHour, slotMin] = timeSlot.split(':').map(Number);
      const slotMinutes = slotHour * 60 + slotMin;
      
      const [aptHour, aptMin] = aptTime.split(':').map(Number);
      const aptMinutes = aptHour * 60 + aptMin;
      
      let isInSlot = false;
      
      if (aptMinutes >= slotMinutes && aptMinutes < slotMinutes + 30) {
        isInSlot = true;
      }
      
      if (!isInSlot) {
        const timeDiff = Math.abs(aptMinutes - slotMinutes);
        if (timeDiff <= 2) {
          isInSlot = true;
        }
      }
      
      if (!isInSlot && aptMinutes === slotMinutes) {
        isInSlot = true;
      }
      
      return isSameDate && isInSlot;
    });
  };

  const renderDayView = () => {
    return (
      <div className="space-y-2">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentDate.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        <div className="grid gap-2">
          {timeSlots.map((slot) => {
            const slotAppointments = getAppointmentsForSlot(currentDate, slot.time);
            const isAvailable = slot.available && !slot.blocked;
            
            return (
              <Card 
                key={slot.id}
                className={`
                  p-4 transition-colors cursor-pointer
                  ${isAvailable ? 'hover:bg-blue-50' : 'bg-gray-50'}
                  ${slot.blocked ? 'bg-red-50 cursor-not-allowed' : ''}
                `}
                onClick={() => {
                  if (isAvailable && !slot.blocked) {
                    const year = currentDate.getFullYear();
                    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const dayOfMonth = String(currentDate.getDate()).padStart(2, '0');
                    const localDateString = `${year}-${month}-${dayOfMonth}`;
                    
                    // Siempre permitir crear nueva cita, incluso si ya hay citas en este slot
                    onSlotClick(localDateString, slot.time);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">{slot.time}</span>
                    
                    {slot.blocked && (
                      <Badge variant="destructive" className="text-xs">
                        Bloqueado
                      </Badge>
                    )}
                    
                    {slotAppointments.length > 0 && (
                      <Badge variant="default" className="text-xs bg-blue-600">
                        {slotAppointments.length} citas
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isAvailable && !slot.blocked && (
                      <Button variant="ghost" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {slotAppointments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {/* Botón para agregar otra cita */}
                    {isAvailable && !slot.blocked && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed border-2 hover:bg-blue-50 hover:border-blue-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          const year = currentDate.getFullYear();
                          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                          const dayOfMonth = String(currentDate.getDate()).padStart(2, '0');
                          const localDateString = `${year}-${month}-${dayOfMonth}`;
                          onSlotClick(localDateString, slot.time);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar otra cita
                      </Button>
                    )}
                    
                    {slotAppointments.map((appointment: Appointment) => {
                      const colors = getAppointmentColors(appointment);
                      return (
                        <div
                          key={appointment.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(appointment);
                          }}
                          className="rounded-lg p-3 transition-colors cursor-pointer border"
                          style={{
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.hover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = colors.background;
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" style={{ color: colors.text }} />
                              <span className="font-medium" style={{ color: colors.text }}>
                                {appointment.patient_name}
                              </span>
                              {appointment.doctor_name && (
                                <span className="text-xs opacity-70">• {appointment.doctor_name}</span>
                              )}
                            </div>
                            
                            <Badge variant="secondary" style={{ backgroundColor: colors.border, color: colors.text }}>
                              {appointment.status || 'Programada'}
                            </Badge>
                          </div>
                          
                          <div className="text-sm mb-1" style={{ color: colors.text, opacity: 0.9 }}>
                            {appointment.appointment_type_name || appointment.treatment_name}
                          </div>
                          
                          {appointment.consultorio_name && (
                            <div className="text-xs opacity-70" style={{ color: colors.text }}>
                              📍 {appointment.consultorio_name}
                            </div>
                          )}
                          
                          {appointment.notes && (
                            <div className="text-xs mt-1 opacity-70" style={{ color: colors.text }}>
                              {appointment.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
      <div className="grid grid-cols-8 gap-2">
        <div className="text-sm font-medium text-gray-500 p-2">Hora</div>
        {weekDays.map((day, index) => (
          <div key={index} className="text-center p-2">
            <div className="text-sm font-medium text-gray-700">
              {dayNames[index]}
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {day.getDate()}
            </div>
          </div>
        ))}

        {timeSlots.map((slot) => (
          <div key={slot.id} className="contents">
            <div className="flex items-center justify-center p-2 text-sm text-gray-600 bg-gray-50 rounded">
              {slot.time}
            </div>
            
            {weekDays.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForSlot(day, slot.time);
              const isAvailable = slot.available && !slot.blocked;
              
              return (
                <div 
                  key={`${dayIndex}-${slot.id}`}
                  className={`
                    relative min-h-[60px] border border-gray-200 rounded-lg p-1 transition-colors group
                    ${isAvailable ? 'hover:bg-blue-50 cursor-pointer' : 'bg-gray-50'}
                    ${slot.blocked ? 'bg-red-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => {
                    if (isAvailable && !slot.blocked && dayAppointments.length === 0) {
                      const year = day.getFullYear();
                      const month = String(day.getMonth() + 1).padStart(2, '0');
                      const dayOfMonth = String(day.getDate()).padStart(2, '0');
                      const localDateString = `${year}-${month}-${dayOfMonth}`;
                      onSlotClick(localDateString, slot.time);
                    }
                  }}
                >
                  {slot.blocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-red-600">Bloqueado</span>
                    </div>
                  )}
                  
                  {dayAppointments.length === 0 && isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  
                  {/* Botón "+" cuando hay citas (aparece al hover) */}
                  {dayAppointments.length > 0 && isAvailable && !slot.blocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const year = day.getFullYear();
                        const month = String(day.getMonth() + 1).padStart(2, '0');
                        const dayOfMonth = String(day.getDate()).padStart(2, '0');
                        const localDateString = `${year}-${month}-${dayOfMonth}`;
                        onSlotClick(localDateString, slot.time);
                      }}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1 shadow-sm border border-blue-300 hover:bg-blue-50 z-10"
                      title="Agregar otra cita"
                    >
                      <Plus className="h-3 w-3 text-blue-600" />
                    </button>
                  )}
                  
                  {dayAppointments.map((appointment) => {
                    const colors = getAppointmentColors(appointment);
                    return (
                      <div
                        key={appointment.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(appointment);
                        }}
                        className="rounded p-1 mb-1 cursor-pointer transition-colors border"
                        style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.hover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colors.background;
                        }}
                      >
                        <div className="text-xs font-medium truncate" style={{ color: colors.text }}>
                          {appointment.patient_name}
                        </div>
                        <div className="text-xs truncate opacity-80" style={{ color: colors.text }}>
                          {appointment.appointment_type_name || appointment.treatment_name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
    
    const weeks = [];
    let currentWeek = [];
    const calendarEnd = new Date(calendarStart);
    calendarEnd.setDate(calendarEnd.getDate() + 41);
    
    for (let day = new Date(calendarStart); day <= calendarEnd; day.setDate(day.getDate() + 1)) {
      currentWeek.push(new Date(day));
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((dayName) => (
          <div key={dayName} className="text-center p-2 font-medium text-gray-700 bg-gray-50 rounded">
            {dayName}
          </div>
        ))}
        
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const dayAppointments = appointments.filter(apt => {
              const aptDate = new Date(apt.fecha);
              return aptDate.toDateString() === day.toDateString();
            });
            
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <Card
                key={`${weekIndex}-${dayIndex}`}
                className={`
                  min-h-[100px] p-2 cursor-pointer transition-colors relative group
                  ${isCurrentMonth ? 'hover:bg-blue-50' : 'bg-gray-50 opacity-60'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                `}
                onClick={() => {
                  if (dayAppointments.length === 0) {
                    const year = day.getFullYear();
                    const month = String(day.getMonth() + 1).padStart(2, '0');
                    const dayOfMonth = String(day.getDate()).padStart(2, '0');
                    const localDateString = `${year}-${month}-${dayOfMonth}`;
                    onSlotClick(localDateString, '09:00');
                  }
                }}
              >
                <div className={`
                  text-sm font-medium mb-1
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isToday ? 'text-blue-600' : ''}
                `}>
                  {day.getDate()}
                  
                  {/* Botón "+" para agregar cita (aparece al hover) */}
                  {isCurrentMonth && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const year = day.getFullYear();
                        const month = String(day.getMonth() + 1).padStart(2, '0');
                        const dayOfMonth = String(day.getDate()).padStart(2, '0');
                        const localDateString = `${year}-${month}-${dayOfMonth}`;
                        onSlotClick(localDateString, '09:00');
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1 shadow-sm border border-blue-300 hover:bg-blue-50"
                      title="Agregar cita"
                    >
                      <Plus className="h-3 w-3 text-blue-600" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => {
                    const colors = getAppointmentColors(appointment);
                    return (
                      <div
                        key={appointment.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(appointment);
                        }}
                        className="rounded px-1 py-0.5 text-xs truncate cursor-pointer transition-colors"
                        style={{
                          backgroundColor: colors.background,
                          color: colors.text,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.hover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colors.background;
                        }}
                      >
                        {formatTime(appointment.fecha)} {appointment.patient_name}
                      </div>
                    );
                  })}
                  
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayAppointments.length - 3} más
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  switch (viewMode) {
    case 'day':
      return renderDayView();
    case 'week':
      return renderWeekView();
    case 'month':
      return renderMonthView();
    default:
      return renderWeekView();
  }
}