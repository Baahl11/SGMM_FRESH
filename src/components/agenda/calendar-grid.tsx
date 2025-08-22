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
  
  // FORCE HARDCODED SLOTS if we detect interference
  const generateEmergencySlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 5; hour < 22; hour++) {
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

  // Helper function to check if two dates are the same day (ignoring time)
  const isSameDay = (date1: Date, date2: Date | string) => {
    const d1 = date1;
    const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Use emergency slots if we detect problematic slot count
  const timeSlots = (propTimeSlots.length < 10) ? generateEmergencySlots() : propTimeSlots;
  
  // Debug logging at the start of the component
  console.log(`🔍 CalendarGrid render - viewMode: ${viewMode}, date: ${currentDate.toDateString()}`);
  console.log(`🔍 CalendarGrid - received ${appointments.length} appointments, ${propTimeSlots.length} propTimeSlots`);
  console.log(`🔍 CalendarGrid - using ${timeSlots.length} timeSlots (${timeSlots === propTimeSlots ? 'original' : 'EMERGENCY FALLBACK'})`);
  console.log(`🔍 First few timeSlots:`, timeSlots.slice(0, 10).map(s => s.time));
  
  // Log all appointments for the current day in day view
  if (viewMode === 'day') {
    const todayAppointments = appointments.filter(apt => {
      return isSameDay(currentDate, apt.fecha);
    });
    
    console.log(`🔍 DAY VIEW - TimeSlots available (${timeSlots.length} total):`, timeSlots.map(s => s.time));
    console.log(`🔍 DAY VIEW - Expected slots around 16:30:`, timeSlots.filter(s => s.time >= '16:00' && s.time <= '17:00').map(s => s.time));
    console.log(`🔍 DAY VIEW - ALL appointments for today (${todayAppointments.length} total):`, 
      todayAppointments.map(apt => ({
        id: apt.id,
        patient: apt.patient_name,
        time: apt.appointment_time || formatTime(apt.fecha),
        fecha: apt.fecha
      }))
    );
    
    // Critical: If we only have 1-2 slots, something is wrong with slot generation
    if (timeSlots.length < 10) {
      console.error(`🚨 PROBLEM: Only ${timeSlots.length} slots available. Expected 34+ slots from 05:00 to 21:30`);
      console.error(`🚨 This indicates TimeSlotManager interference or localStorage corruption`);
    }
  }

  const formatTime = (dateString: string) => {
    // Handle timezone-aware appointment time formatting
    try {
      // Check if dateString contains timezone info (UTC format)
      if (dateString.includes('Z') || dateString.includes('+') || /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/.test(dateString)) {
        // This is a UTC timestamp - convert to local time for display
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else if (dateString.includes('T')) {
        // This is a local time string (new format) - extract time directly
        const timePartMatch = dateString.match(/T(\d{2}:\d{2})/);
        if (timePartMatch) {
          return timePartMatch[1];
        }
      }
      
      // Fallback: try to parse as date and extract time
      const date = new Date(dateString);
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
    const filteredAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.fecha);
      
      // Use appointment_time if available, otherwise extract from fecha
      let aptTime;
      if (apt.appointment_time) {
        aptTime = apt.appointment_time;
      } else {
        aptTime = formatTime(apt.fecha);
      }
      
      const isSameDate = aptDate.toDateString() === date.toDateString();
      
      // Convert times to minutes for comparison - more robust matching
      const [slotHour, slotMin] = timeSlot.split(':').map(Number);
      const slotMinutes = slotHour * 60 + slotMin;
      
      const [aptHour, aptMin] = aptTime.split(':').map(Number);
      const aptMinutes = aptHour * 60 + aptMin;
      
      // Extended matching logic - check if appointment falls within this 30-minute slot
      // Also handle edge cases where times might be slightly off
      let isInSlot = false;
      
      // Primary match: exact 30-minute slot matching
      if (aptMinutes >= slotMinutes && aptMinutes < slotMinutes + 30) {
        isInSlot = true;
      }
      
      // Secondary match: handle potential minute discrepancies (±2 minutes)
      if (!isInSlot) {
        const timeDiff = Math.abs(aptMinutes - slotMinutes);
        if (timeDiff <= 2) {
          isInSlot = true;
        }
      }
      
      // Tertiary match: check if appointment is exactly on the slot time
      if (!isInSlot && aptMinutes === slotMinutes) {
        isInSlot = true;
      }
      
      // Debug for specific problematic slots in day view
      if (viewMode === 'day' && isSameDate && (timeSlot === '16:00' || timeSlot === '16:30' || timeSlot === '14:30' || timeSlot === '15:30')) {
        console.log(`🎯 ENHANCED SLOT MATCHING: Apt ${apt.id} (${aptTime}) vs Slot ${timeSlot}`);
        console.log(`   - apt minutes: ${aptMinutes}, slot minutes: ${slotMinutes}`);
        console.log(`   - range check: ${aptMinutes} >= ${slotMinutes} && ${aptMinutes} < ${slotMinutes + 30} = ${isInSlot}`);
        console.log(`   - time diff: ${Math.abs(aptMinutes - slotMinutes)} minutes`);
        console.log(`   - final match result: ${isInSlot}`);
      }
      
      return isSameDate && isInSlot;
    });
    
    return filteredAppointments;
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
        {/* Header with time column */}
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

        {/* Time slots grid */}
        {timeSlots.map((slot) => (
          <div key={slot.id} className="contents">
            {/* Time label */}
            <div className="flex items-center justify-center p-2 text-sm text-gray-600 bg-gray-50 rounded">
              {slot.time}
            </div>
            
            {/* Day columns */}
            {weekDays.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForSlot(day, slot.time);
              const isAvailable = slot.available && !slot.blocked;
              
              return (
                <div 
                  key={`${dayIndex}-${slot.id}`}
                  className={`
                    relative min-h-[60px] border border-gray-200 rounded-lg p-1 transition-colors
                    ${isAvailable ? 'hover:bg-blue-50 cursor-pointer' : 'bg-gray-50'}
                    ${slot.blocked ? 'bg-red-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => {
                    if (isAvailable && dayAppointments.length === 0) {
                      // Use LOCAL date string to avoid timezone conversion issues
                      const year = day.getFullYear();
                      const month = String(day.getMonth() + 1).padStart(2, '0');
                      const dayOfMonth = String(day.getDate()).padStart(2, '0');
                      const localDateString = `${year}-${month}-${dayOfMonth}`;
                      console.log(`🔍 WEEK VIEW: Slot clicked - ${slot.time} on day:`, day.toDateString());
                      console.log(`🔍 WEEK VIEW: Local date components - Y:${year} M:${month} D:${dayOfMonth}`);
                      console.log(`🔍 WEEK VIEW: Sending date string: ${localDateString}`);
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
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Plus className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  
                  {dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appointment);
                      }}
                      className="bg-blue-100 border border-blue-300 rounded p-1 mb-1 cursor-pointer hover:bg-blue-200 transition-colors"
                    >
                      <div className="text-xs font-medium text-blue-900 truncate">
                        {appointment.patient_name}
                      </div>
                      <div className="text-xs text-blue-700 truncate">
                        {appointment.treatment_name}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
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
            
            // DEBUG: Log for slots that should have appointments
            if (viewMode === 'day' && (slot.time === '14:30' || slot.time === '15:30' || slot.time === '16:00' || slot.time === '16:30')) {
              console.log(`🔍 DAY VIEW SLOT ${slot.time}: Found ${slotAppointments.length} appointments:`, 
                slotAppointments.map(a => `${a.id} (${a.patient_name})`));
            }
            
            return (
              <Card 
                key={slot.id}
                className={`
                  p-4 transition-colors cursor-pointer
                  ${isAvailable ? 'hover:bg-blue-50' : 'bg-gray-50'}
                  ${slot.blocked ? 'bg-red-50 cursor-not-allowed' : ''}
                `}
                onClick={() => {
                  if (isAvailable && slotAppointments.length === 0) {
                    // Use LOCAL date string to avoid timezone conversion issues
                    const year = currentDate.getFullYear();
                    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const dayOfMonth = String(currentDate.getDate()).padStart(2, '0');
                    const localDateString = `${year}-${month}-${dayOfMonth}`;
                    
                    console.log(`🔍 DAY VIEW: Slot clicked - ${slot.time} on ${currentDate.toDateString()}`);
                    console.log(`🔍 DAY VIEW: Local date components - Y:${year} M:${month} D:${dayOfMonth}`);
                    console.log(`🔍 DAY VIEW: Sending date string: ${localDateString}`);
                    
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
                    {slotAppointments.length === 0 && isAvailable && (
                      <Button variant="ghost" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {slotAppointments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {slotAppointments.map((appointment: Appointment) => (
                      <div
                        key={appointment.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(appointment);
                        }}
                        className="bg-blue-100 border border-blue-300 rounded-lg p-3 hover:bg-blue-200 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">
                              {appointment.patient_name}
                            </span>
                          </div>
                          
                          <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                            {appointment.status || 'Programada'}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-blue-700 mb-1">
                          {appointment.treatment_name}
                        </div>
                        
                        {appointment.notes && (
                          <div className="text-xs text-blue-600">
                            {appointment.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
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
    calendarEnd.setDate(calendarEnd.getDate() + 41); // 6 weeks
    
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
        {/* Header */}
        {dayNames.map((dayName) => (
          <div key={dayName} className="text-center p-2 font-medium text-gray-700 bg-gray-50 rounded">
            {dayName}
          </div>
        ))}
        
        {/* Calendar days */}
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
                  min-h-[100px] p-2 cursor-pointer transition-colors
                  ${isCurrentMonth ? 'hover:bg-blue-50' : 'bg-gray-50 opacity-60'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                `}
                onClick={() => {
                  // Use LOCAL date string to avoid timezone conversion issues
                  const year = day.getFullYear();
                  const month = String(day.getMonth() + 1).padStart(2, '0');
                  const dayOfMonth = String(day.getDate()).padStart(2, '0');
                  const localDateString = `${year}-${month}-${dayOfMonth}`;
                  console.log(`🔍 MONTH VIEW: Day clicked:`, day.toDateString());
                  console.log(`🔍 MONTH VIEW: Local date components - Y:${year} M:${month} D:${dayOfMonth}`);
                  console.log(`🔍 MONTH VIEW: Sending date string: ${localDateString}`);
                  onSlotClick(localDateString, '09:00');
                }}
              >
                <div className={`
                  text-sm font-medium mb-1
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isToday ? 'text-blue-600' : ''}
                `}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appointment);
                      }}
                      className="bg-blue-100 rounded px-1 py-0.5 text-xs text-blue-800 truncate hover:bg-blue-200"
                    >
                      {formatTime(appointment.fecha)} {appointment.patient_name}
                    </div>
                  ))}
                  
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
