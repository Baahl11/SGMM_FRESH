"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  User, 
  Phone, 
  Calendar as CalendarIcon,
  Plus,
  GripVertical,
  AlertCircle
} from "lucide-react";
import { 
  getAppointmentColorsByStatus, 
  getStatusLabel, 
  getStatusIcon 
} from "@/lib/utils/appointment-colors";
import { 
  loadBufferConfig, 
  isTimeSlotInBuffer,
  getBufferTimeLabel
} from "@/lib/utils/buffer-time";
import { useDragAndDrop } from "@/hooks/use-drag-and-drop";
import { canDragAppointment, getDropZoneClass } from "@/lib/utils/drag-and-drop";
import { RecurringBadge } from "@/components/appointments/recurring-badge";
import { GoogleSyncBadge } from "@/components/appointments/google-sync-badge";
import { isRecurringAppointment, RecurrencePattern } from "@/lib/utils/recurring-appointments";
import { isSyncedWithGoogle } from "@/lib/utils/google-calendar";
import { toast } from "sonner";

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
  // 🆕 Recurring fields
  recurring_series_id?: string;
  recurring_pattern?: RecurrencePattern;
  recurring_instance_index?: number;
  is_recurring?: boolean;
  // 🆕 Google Calendar sync fields
  google_calendar_event_id?: string;
  synced_with_google?: boolean;
  last_synced_at?: string;
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
  onAppointmentMove?: (appointmentId: number, newDate: string, newTime: string) => Promise<void>;
  enableDragAndDrop?: boolean;
}

export default function CalendarGrid({
  viewMode,
  currentDate,
  appointments,
  timeSlots: propTimeSlots,
  onSlotClick,
  onAppointmentClick,
  onAppointmentMove,
  enableDragAndDrop = true
}: CalendarGridProps) {
  
  // Load buffer configuration
  const bufferConfig = useMemo(() => loadBufferConfig(), []);

  // Drag and Drop functionality
  const {
    isDragging,
    draggedAppointment,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    isDropTarget,
    isValidDropTarget,
    getDropTargetConflicts
  } = useDragAndDrop({
    appointments,
    onAppointmentMove: onAppointmentMove || (async () => {
      toast.error('Drag & Drop no configurado');
    }),
    onConflictDetected: (conflicts) => {
      toast.error('Conflicto de horario', {
        description: conflicts.join(', ')
      });
    }
  });
  
  // � NEW: Get appointment colors with status-based priority
  const getAppointmentColors = (appointment: Appointment) => {
    // Use new utility function that prioritizes status colors
    return getAppointmentColorsByStatus(
      appointment.status,
      appointment.doctor_color
    );
  };

  // Check if a time slot is blocked by buffer time
  const isSlotBlockedByBuffer = (date: Date, slotTime: string): { blocked: boolean; reason?: string } => {
    if (!bufferConfig.enabled) {
      return { blocked: false };
    }

    // Get all appointments for this date
    const dateAppointments = appointments.filter(apt => isSameDay(date, apt.fecha));

    // Check each appointment to see if this slot is in its buffer zone
    for (const apt of dateAppointments) {
      const aptTime = formatTime(apt.appointment_time);
      const duration = 30; // Default 30 min, adjust based on appointment type if available

      const inBuffer = isTimeSlotInBuffer(
        slotTime,
        aptTime,
        duration,
        bufferConfig,
        apt.doctor_id,
        apt.appointment_type_id
      );

      if (inBuffer) {
        return { 
          blocked: true, 
          reason: `Buffer de ${getBufferTimeLabel(bufferConfig.globalBufferMinutes)} - ${apt.patient_name || 'Cita'}` 
        };
      }
    }

    return { blocked: false };
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
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-white">
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
            const bufferCheck = isSlotBlockedByBuffer(currentDate, slot.time);
            const isBlocked = slot.blocked || bufferCheck.blocked;
            const isAvailable = slot.available && !isBlocked;
            
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dayOfMonth = String(currentDate.getDate()).padStart(2, '0');
            const localDateString = `${year}-${month}-${dayOfMonth}`;
            
            const isCurrentDropTarget = isDropTarget(localDateString, slot.time);
            const isValidDrop = isValidDropTarget(localDateString, slot.time);
            const dropConflicts = getDropTargetConflicts(localDateString, slot.time);
            const dropZoneClass = getDropZoneClass(isCurrentDropTarget, isValidDrop, dropConflicts.length > 0);
            
            return (
              <div
                key={slot.id}
                className={`
                  rounded-2xl border p-4 text-white transition-all shadow-[0_20px_55px_rgba(3,7,18,0.45)]
                  ${isAvailable ? 'hover:border-white/30 hover:bg-white/10' : 'opacity-70'}
                  ${isBlocked ? 'border-amber-300/40 bg-amber-500/10 cursor-not-allowed text-amber-100' : 'bg-gradient-to-br from-white/5 via-slate-900/40 to-slate-900/60 border-white/10'}
                  ${dropZoneClass}
                `}
                onClick={() => {
                  if (isAvailable && !isBlocked) {
                    onSlotClick(localDateString, slot.time);
                  }
                }}
                onDragOver={(e) => enableDragAndDrop && handleDragOver(localDateString, slot.time, e)}
                onDragEnter={(e) => enableDragAndDrop && handleDragEnter(e)}
                onDragLeave={(e) => enableDragAndDrop && handleDragLeave(e)}
                onDrop={(e) => enableDragAndDrop && handleDrop(localDateString, slot.time, e)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-white/60" />
                    <span className="font-medium text-white">{slot.time}</span>
                    
                    {slot.blocked && (
                      <Badge className="text-xs rounded-full border border-amber-200/40 bg-amber-500/10 text-amber-50">
                        Bloqueado
                      </Badge>
                    )}

                    {bufferCheck.blocked && (
                      <Badge className="text-xs rounded-full border border-amber-200/30 bg-amber-500/5 text-amber-100">
                        ⏱️ Buffer
                      </Badge>
                    )}
                    
                    {slotAppointments.length > 0 && (
                      <Badge className="text-xs rounded-full border border-emerald-300/40 bg-emerald-500/15 text-emerald-50">
                        {slotAppointments.length} citas
                      </Badge>
                    )}

                    {/* Drop zone indicator */}
                    {isCurrentDropTarget && isValidDrop && (
                      <Badge className="text-xs rounded-full border border-emerald-300/50 bg-emerald-500/15 text-emerald-50">
                        ✓ Soltar aquí
                      </Badge>
                    )}

                    {isCurrentDropTarget && dropConflicts.length > 0 && (
                      <Badge className="text-xs rounded-full border border-rose-300/40 bg-rose-500/10 text-rose-100">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Conflicto
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isAvailable && !slot.blocked && (
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
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
                        className="w-full border-2 border-dashed border-white/30 text-white hover:border-white hover:bg-white/10"
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
                      const dragCheck = canDragAppointment(appointment);
                      const isDraggable = enableDragAndDrop && dragCheck.canDrag;
                      
                      return (
                        <div
                          key={appointment.id}
                          draggable={isDraggable}
                          onDragStart={(e) => isDraggable && handleDragStart(appointment, e)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(appointment);
                          }}
                          className={`
                            rounded-lg p-3 transition-all cursor-pointer border
                            ${isDraggable ? 'cursor-move hover:shadow-lg' : ''}
                            ${isDragging && draggedAppointment?.id === appointment.id ? 'opacity-50' : ''}
                          `}
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
                              {isDraggable && (
                                <div title="Arrastrar para mover">
                                  <GripVertical 
                                    className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity cursor-grab" 
                                    style={{ color: colors.text }}
                                  />
                                </div>
                              )}
                              <User className="h-4 w-4" style={{ color: colors.text }} />
                              <span className="font-medium" style={{ color: colors.text }}>
                                {appointment.patient_name}
                              </span>
                              {appointment.doctor_name && (
                                <span className="text-xs opacity-70">• {appointment.doctor_name}</span>
                              )}
                            </div>
                            
                            <div className="flex gap-1">
                              <Badge 
                                variant="secondary" 
                                style={{ 
                                  backgroundColor: colors.badgeBackground, 
                                  color: colors.badgeText,
                                  borderColor: colors.border
                                }}
                                className="border"
                              >
                                {getStatusIcon(appointment.status)} {getStatusLabel(appointment.status)}
                              </Badge>
                              {isRecurringAppointment(appointment) && (
                                <RecurringBadge pattern={appointment.recurring_pattern} />
                              )}
                              {isSyncedWithGoogle(appointment) && (
                                <GoogleSyncBadge 
                                  synced={true} 
                                  eventId={appointment.google_calendar_event_id}
                                />
                              )}
                            </div>
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
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
      <div className="grid grid-cols-8 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-sm font-semibold text-white/70">Hora</div>
        {weekDays.map((day, index) => {
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div
              key={index}
              className={`rounded-2xl border p-2 text-center transition-all ${
                isToday
                  ? 'border-emerald-300/40 bg-gradient-to-br from-emerald-400/20 via-cyan-400/15 to-transparent shadow-[0_10px_35px_rgba(45,212,191,0.25)]'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className={`text-sm font-medium ${isToday ? 'text-emerald-50' : 'text-white/70'}`}>
                {dayNames[index]}
              </div>
              <div className={`text-2xl font-semibold ${isToday ? 'text-white' : 'text-white'}`}>
                {day.getDate()}
              </div>
            </div>
          );
        })}

        {timeSlots.map((slot) => (
          <div key={slot.id} className="contents">
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900/40 p-2 text-sm text-white/70">
              {slot.time}
            </div>
            
            {weekDays.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForSlot(day, slot.time);
              const bufferCheck = isSlotBlockedByBuffer(day, slot.time);
              const isBlocked = slot.blocked || bufferCheck.blocked;
              const isAvailable = slot.available && !isBlocked;
              
              const year = day.getFullYear();
              const month = String(day.getMonth() + 1).padStart(2, '0');
              const dayOfMonth = String(day.getDate()).padStart(2, '0');
              const localDateString = `${year}-${month}-${dayOfMonth}`;
              
              const isCurrentDropTarget = isDropTarget(localDateString, slot.time);
              const isValidDrop = isValidDropTarget(localDateString, slot.time);
              const dropConflicts = getDropTargetConflicts(localDateString, slot.time);
              const dropZoneClass = getDropZoneClass(isCurrentDropTarget, isValidDrop, dropConflicts.length > 0);
              
              const isToday = day.toDateString() === today.toDateString();
              return (
                <div 
                  key={`${dayIndex}-${slot.id}`}
                  className={`
                    group relative min-h-[70px] rounded-2xl border p-1 transition-all
                    ${isAvailable ? 'hover:border-white/40 hover:bg-white/10 cursor-pointer' : 'opacity-60'}
                    ${isBlocked ? 'border-amber-200/40 bg-amber-500/10 cursor-not-allowed text-amber-100' : ''}
                    ${isToday ? 'border-white/25 bg-gradient-to-b from-white/10 via-slate-900/30 to-slate-900/60' : 'border-white/5 bg-slate-900/30'}
                    ${dropZoneClass}
                  `}
                  onClick={() => {
                    if (isAvailable && !isBlocked && dayAppointments.length === 0) {
                      onSlotClick(localDateString, slot.time);
                    }
                  }}
                  onDragOver={(e) => enableDragAndDrop && handleDragOver(localDateString, slot.time, e)}
                  onDragEnter={(e) => enableDragAndDrop && handleDragEnter(e)}
                  onDragLeave={(e) => enableDragAndDrop && handleDragLeave(e)}
                  onDrop={(e) => enableDragAndDrop && handleDrop(localDateString, slot.time, e)}
                >
                  {slot.blocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-red-600">Bloqueado</span>
                    </div>
                  )}

                  {bufferCheck.blocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-amber-200">⏱️ Buffer</span>
                    </div>
                  )}
                  
                  {dayAppointments.length === 0 && isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  {/* Botón "+" cuando hay citas (aparece al hover) */}
                  {dayAppointments.length > 0 && isAvailable && !isBlocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const year = day.getFullYear();
                        const month = String(day.getMonth() + 1).padStart(2, '0');
                        const dayOfMonth = String(day.getDate()).padStart(2, '0');
                        const localDateString = `${year}-${month}-${dayOfMonth}`;
                        onSlotClick(localDateString, slot.time);
                      }}
                      className="absolute right-1 top-1 z-10 rounded-full border border-white/30 bg-white/10 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      title="Agregar otra cita"
                    >
                      <Plus className="h-3 w-3 text-white" />
                    </button>
                  )}
                  
                  {dayAppointments.map((appointment) => {
                    const colors = getAppointmentColors(appointment);
                    const dragCheck = canDragAppointment(appointment);
                    const isDraggable = enableDragAndDrop && dragCheck.canDrag;
                    
                    return (
                      <div
                        key={appointment.id}
                        draggable={isDraggable}
                        onDragStart={(e) => isDraggable && handleDragStart(appointment, e)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(appointment);
                        }}
                        className={`
                          rounded p-1 mb-1 cursor-pointer transition-all border
                          ${isDraggable ? 'cursor-move hover:shadow-md' : ''}
                          ${isDragging && draggedAppointment?.id === appointment.id ? 'opacity-50' : ''}
                        `}
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
          <div key={dayName} className="rounded-2xl border border-white/10 bg-white/5 p-2 text-center text-sm font-semibold text-white/70">
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
            const isToday = day.toDateString() === today.toDateString();
            
            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`
                  group relative min-h-[110px] cursor-pointer rounded-2xl border p-2 transition-all
                  ${isCurrentMonth ? 'border-white/10 bg-gradient-to-br from-white/5 via-slate-900/30 to-slate-900/60 hover:border-white/30 hover:bg-white/10' : 'border-white/5 bg-slate-900/10 opacity-60'}
                  ${isToday ? 'ring-2 ring-emerald-300/60 shadow-[0_12px_35px_rgba(16,185,129,0.25)]' : ''}
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
                <div className="mb-1 flex items-start justify-between">
                  <div className={`
                    text-sm font-medium
                    ${isCurrentMonth ? 'text-white' : 'text-white/50'}
                    ${isToday ? 'text-emerald-200 font-bold' : ''}
                  `}>
                    {day.getDate()}
                    {isToday && <span className="ml-1 text-xs">●</span>}
                  </div>
                  
                  {/* Badge con contador de citas */}
                  {dayAppointments.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Badge 
                        className="h-5 rounded-full border border-cyan-300/40 bg-cyan-500/10 px-1.5 py-0 text-xs text-cyan-50"
                      >
                        {dayAppointments.length}
                      </Badge>
                    </div>
                  )}
                  
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
                      className="absolute right-2 top-2 rounded-full border border-white/20 bg-white/10 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      title="Agregar cita"
                    >
                      <Plus className="h-3 w-3 text-white" />
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
                        className="truncate rounded border px-1.5 py-1 text-xs transition-all"
                        style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.text,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.hover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colors.background;
                        }}
                        title={`${getStatusLabel(appointment.status)} - ${appointment.patient_name}`}
                      >
                        <span className="mr-0.5">{getStatusIcon(appointment.status)}</span>
                        {formatTime(appointment.fecha)} {appointment.patient_name}
                      </div>
                    );
                  })}
                  
                  {dayAppointments.length > 3 && (
                    <div className="px-1 text-xs font-medium text-white/60">
                      +{dayAppointments.length - 3} más
                    </div>
                  )}
                </div>
              </div>
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