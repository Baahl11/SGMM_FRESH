import { createClient } from '@supabase/supabase-js';
import { addMinutes, parse, isWithinInterval } from 'date-fns';
import { clinicDateStringRangeUtc } from './timezone';

interface TimeSlot {
  start: Date;
  end: Date;
}

interface ConflictCheckResult {
  hasConflict: boolean;
  conflictsWith?: {
    type: 'booking' | 'appointment';
    id: string;
    time: string;
    patient_name?: string;
  };
  availableSlots?: string[];
}

/**
 * Check if a time slot conflicts with existing bookings/appointments
 */
export async function checkSlotConflict(
  userId: string,
  date: string,
  time: string,
  durationMinutes: number,
  excludeBookingId?: string
): Promise<ConflictCheckResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // Parse requested slot
    const requestedDate = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    requestedDate.setHours(hours, minutes, 0, 0);
    
    const requestedStart = requestedDate;
    const requestedEnd = addMinutes(requestedStart, durationMinutes);

    // Get existing bookings for this date
    let bookingsQuery = supabase
      .from('public_bookings')
      .select('id, booking_time, service_duration, patient_name, status')
      .eq('clinic_user_id', userId)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed']);

    if (excludeBookingId) {
      bookingsQuery = bookingsQuery.neq('id', excludeBookingId);
    }

    const { data: bookings } = await bookingsQuery;

    // Check for booking conflicts
    if (bookings) {
      for (const booking of bookings) {
        const bookingStart = new Date(date);
        const [bHours, bMinutes] = booking.booking_time.split(':').map(Number);
        bookingStart.setHours(bHours, bMinutes, 0, 0);
        const bookingEnd = addMinutes(bookingStart, booking.service_duration || 30);

        // Check if slots overlap
        if (
          (requestedStart >= bookingStart && requestedStart < bookingEnd) ||
          (requestedEnd > bookingStart && requestedEnd <= bookingEnd) ||
          (requestedStart <= bookingStart && requestedEnd >= bookingEnd)
        ) {
          return {
            hasConflict: true,
            conflictsWith: {
              type: 'booking',
              id: booking.id,
              time: booking.booking_time,
              patient_name: booking.patient_name,
            },
          };
        }
      }
    }

    // Get existing appointments for this date (adenda V2.1, A-5: rango en
    // hora local de la clinica, no un string sin offset interpretado como UTC)
    const { startUtc: dayStartUtc, endUtc: dayEndUtc } = clinicDateStringRangeUtc(date);
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, fecha_hora, duracion_minutos, patient:patients(nombre, apellido)')
      .eq('user_id', userId)
      .gte('fecha_hora', dayStartUtc.toISOString())
      .lt('fecha_hora', dayEndUtc.toISOString())
      .in('estado', ['programada', 'confirmada', 'en_proceso']);

    // Check for appointment conflicts
    if (appointments) {
      for (const appointment of appointments) {
        const appointmentStart = new Date(appointment.fecha_hora);
        const appointmentEnd = addMinutes(appointmentStart, appointment.duracion_minutos || 30);

        // Check if slots overlap
        if (
          (requestedStart >= appointmentStart && requestedStart < appointmentEnd) ||
          (requestedEnd > appointmentStart && requestedEnd <= appointmentEnd) ||
          (requestedStart <= appointmentStart && requestedEnd >= appointmentEnd)
        ) {
          const patient = appointment.patient as any;
          return {
            hasConflict: true,
            conflictsWith: {
              type: 'appointment',
              id: appointment.id,
              time: appointmentStart.toTimeString().slice(0, 5),
              patient_name: patient ? `${patient.nombre} ${patient.apellido}` : undefined,
            },
          };
        }
      }
    }

    return { hasConflict: false };
  } catch (error) {
    console.error('Error checking slot conflict:', error);
    throw error;
  }
}

/**
 * Get all occupied time slots for a specific date
 */
export async function getOccupiedSlots(
  userId: string,
  date: string
): Promise<TimeSlot[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const occupiedSlots: TimeSlot[] = [];

  try {
    // Get bookings
    const { data: bookings } = await supabase
      .from('public_bookings')
      .select('booking_time, service_duration')
      .eq('clinic_user_id', userId)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed']);

    if (bookings) {
      for (const booking of bookings) {
        const start = new Date(date);
        const [hours, minutes] = booking.booking_time.split(':').map(Number);
        start.setHours(hours, minutes, 0, 0);
        const end = addMinutes(start, booking.service_duration || 30);

        occupiedSlots.push({ start, end });
      }
    }

    // Get appointments (adenda V2.1, A-5: rango en hora local de la clinica)
    const { startUtc: occupiedDayStartUtc, endUtc: occupiedDayEndUtc } = clinicDateStringRangeUtc(date);
    const { data: appointments } = await supabase
      .from('appointments')
      .select('fecha_hora, duracion_minutos')
      .eq('user_id', userId)
      .gte('fecha_hora', occupiedDayStartUtc.toISOString())
      .lt('fecha_hora', occupiedDayEndUtc.toISOString())
      .in('estado', ['programada', 'confirmada', 'en_proceso']);

    if (appointments) {
      for (const appointment of appointments) {
        const start = new Date(appointment.fecha_hora);
        const end = addMinutes(start, appointment.duracion_minutos || 30);

        occupiedSlots.push({ start, end });
      }
    }

    return occupiedSlots;
  } catch (error) {
    console.error('Error getting occupied slots:', error);
    throw error;
  }
}

/**
 * Find next available slot for a given duration
 */
export async function findNextAvailableSlot(
  userId: string,
  startDate: string,
  durationMinutes: number,
  daysToSearch: number = 7
): Promise<{ date: string; time: string } | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // Get booking settings
    const { data: settings } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings) return null;

    const slotDuration = settings.slot_duration_minutes || 30;
    const bufferTime = settings.buffer_time_minutes || 5;

    // Search through next N days
    for (let dayOffset = 0; dayOffset < daysToSearch; dayOffset++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      const dateStr = checkDate.toISOString().split('T')[0];

      // Get day of week
      const dayOfWeek = checkDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      // Check if clinic is open
      const availableDays = settings.available_days as string[];
      if (!availableDays.includes(dayOfWeek)) continue;

      // Get time ranges
      const timeRanges = (settings.time_ranges as any)?.[dayOfWeek] || [];
      if (timeRanges.length === 0) continue;

      // Get occupied slots for this day
      const occupiedSlots = await getOccupiedSlots(userId, dateStr);

      // Check each time range
      for (const range of timeRanges) {
        const rangeStart = parse(range.start, 'HH:mm', checkDate);
        const rangeEnd = parse(range.end, 'HH:mm', checkDate);

        let currentTime = rangeStart;

        while (currentTime < rangeEnd) {
          const slotEnd = addMinutes(currentTime, durationMinutes);

          // Check if slot fits in range
          if (slotEnd > rangeEnd) break;

          // Check if slot is free
          const isOccupied = occupiedSlots.some(occupied =>
            (currentTime >= occupied.start && currentTime < occupied.end) ||
            (slotEnd > occupied.start && slotEnd <= occupied.end) ||
            (currentTime <= occupied.start && slotEnd >= occupied.end)
          );

          if (!isOccupied) {
            return {
              date: dateStr,
              time: currentTime.toTimeString().slice(0, 5),
            };
          }

          currentTime = addMinutes(currentTime, slotDuration + bufferTime);
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding next available slot:', error);
    return null;
  }
}

/**
 * Validate if a booking can be made (checks conflicts, business hours, etc.)
 */
export async function validateBooking(
  userId: string,
  date: string,
  time: string,
  durationMinutes: number,
  excludeBookingId?: string
): Promise<{
  valid: boolean;
  error?: string;
  suggestion?: { date: string; time: string };
}> {
  try {
    // Check for conflicts
    const conflictCheck = await checkSlotConflict(
      userId,
      date,
      time,
      durationMinutes,
      excludeBookingId
    );

    if (conflictCheck.hasConflict) {
      const conflict = conflictCheck.conflictsWith!;
      const nextSlot = await findNextAvailableSlot(userId, date, durationMinutes);

      return {
        valid: false,
        error: `Este horario ya está ocupado por ${
          conflict.type === 'booking' ? 'otra reserva' : 'una cita interna'
        }${conflict.patient_name ? ` (${conflict.patient_name})` : ''} a las ${conflict.time}`,
        suggestion: nextSlot || undefined,
      };
    }

    // Additional validations can go here (business hours, holidays, etc.)

    return { valid: true };
  } catch (error) {
    console.error('Error validating booking:', error);
    return {
      valid: false,
      error: 'Error al validar la reserva',
    };
  }
}
