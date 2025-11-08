import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { addDays, format, parse, isWithinInterval, addMinutes } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * PUBLIC API: Get available time slots for a clinic
 * GET /api/public/availability/[slug]?date=2025-11-16&service=consulta
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date') // Format: YYYY-MM-DD
  const serviceId = searchParams.get('service') // Optional: specific service

  if (!dateParam) {
    return NextResponse.json(
      { error: 'Parámetro "date" requerido (formato: YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  try {
    // Parse requested date
    const requestedDate = new Date(dateParam + 'T00:00:00')
    const dayOfWeek = format(requestedDate, 'EEEE', { locale: es }).toLowerCase()

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 1. Find clinic by slug
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('booking_slug', slug)
      .eq('booking_enabled', true)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Clínica no encontrada' },
        { status: 404 }
      )
    }

    // 2. Get booking settings
    const { data: settings, error: settingsError } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('user_id', profile.user_id)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      )
    }

    // 3. Check if requested date is within booking window
    const now = new Date()
    const minDate = addDays(now, 0)
    const maxDate = addDays(now, settings.max_advance_days || 60)

    if (requestedDate < minDate || requestedDate > maxDate) {
      return NextResponse.json({
        date: dateParam,
        available: false,
        reason: 'Fecha fuera del rango permitido',
        slots: [],
      })
    }

    // 4. Map day names (Spanish to English for comparison)
    const dayMapping: Record<string, string> = {
      lunes: 'monday',
      martes: 'tuesday',
      miércoles: 'wednesday',
      jueves: 'thursday',
      viernes: 'friday',
      sábado: 'saturday',
      domingo: 'sunday',
    }

    const englishDayName = dayMapping[dayOfWeek] || dayOfWeek

    // 5. Check if clinic is open on this day
    const availableDays = settings.available_days as string[]
    if (!availableDays.includes(englishDayName)) {
      return NextResponse.json({
        date: dateParam,
        available: false,
        reason: 'Clínica cerrada este día',
        slots: [],
      })
    }

    // 6. Get time ranges for this day
    const timeRanges = (settings.time_ranges as any)?.[englishDayName] || []
    
    if (timeRanges.length === 0) {
      return NextResponse.json({
        date: dateParam,
        available: false,
        reason: 'No hay horarios configurados para este día',
        slots: [],
      })
    }

    // 7. Generate all possible time slots
    const slotDuration = settings.slot_duration_minutes || 30
    const bufferTime = settings.buffer_time_minutes || 5
    const totalSlotTime = slotDuration + bufferTime

    const allSlots: string[] = []

    for (const range of timeRanges) {
      const startTime = parse(range.start, 'HH:mm', requestedDate)
      const endTime = parse(range.end, 'HH:mm', requestedDate)

      let currentSlot = startTime

      while (currentSlot < endTime) {
        // Check if there's enough time for a full slot before end time
        const slotEndTime = addMinutes(currentSlot, slotDuration)
        
        if (slotEndTime <= endTime) {
          allSlots.push(format(currentSlot, 'HH:mm'))
        }

        currentSlot = addMinutes(currentSlot, totalSlotTime)
      }
    }

    // 8. Get existing bookings and appointments for this date
    const { data: existingBookings } = await supabase
      .from('public_bookings')
      .select('booking_time, service_duration_minutes')
      .eq('clinic_user_id', profile.user_id)
      .eq('booking_date', dateParam)
      .in('status', ['pending', 'confirmed'])

    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('fecha_hora, duracion_minutos')
      .eq('user_id', profile.user_id)
      .gte('fecha_hora', `${dateParam}T00:00:00`)
      .lt('fecha_hora', `${dateParam}T23:59:59`)
      .in('estado', ['programada', 'confirmada', 'en_proceso'])

    // 9. Filter out occupied slots
    const occupiedTimes = new Set<string>()

    // Add booking times
    if (existingBookings) {
      for (const booking of existingBookings) {
        const bookingTime = booking.booking_time
        occupiedTimes.add(bookingTime)

        // Mark slots that overlap with this booking
        const duration = booking.service_duration_minutes || slotDuration
        const bookingStart = parse(bookingTime, 'HH:mm:ss', requestedDate)
        
        for (const slot of allSlots) {
          const slotStart = parse(slot, 'HH:mm', requestedDate)
          const slotEnd = addMinutes(slotStart, slotDuration)

          // Check if slot overlaps with booking
          if (
            (slotStart >= bookingStart && slotStart < addMinutes(bookingStart, duration)) ||
            (slotEnd > bookingStart && slotEnd <= addMinutes(bookingStart, duration)) ||
            (slotStart <= bookingStart && slotEnd >= addMinutes(bookingStart, duration))
          ) {
            occupiedTimes.add(slot)
          }
        }
      }
    }

    // Add appointment times
    if (existingAppointments) {
      for (const appointment of existingAppointments) {
        const appointmentDateTime = new Date(appointment.fecha_hora)
        const appointmentTime = format(appointmentDateTime, 'HH:mm')
        occupiedTimes.add(appointmentTime)

        // Mark slots that overlap with this appointment
        const duration = appointment.duracion_minutos || slotDuration
        
        for (const slot of allSlots) {
          const slotStart = parse(slot, 'HH:mm', requestedDate)
          const slotEnd = addMinutes(slotStart, slotDuration)

          if (
            (slotStart >= appointmentDateTime && slotStart < addMinutes(appointmentDateTime, duration)) ||
            (slotEnd > appointmentDateTime && slotEnd <= addMinutes(appointmentDateTime, duration)) ||
            (slotStart <= appointmentDateTime && slotEnd >= addMinutes(appointmentDateTime, duration))
          ) {
            occupiedTimes.add(slot)
          }
        }
      }
    }

    // 10. Remove slots that are too soon (min advance hours)
    const minAdvanceTime = addDays(now, 0)
    minAdvanceTime.setHours(now.getHours() + (settings.min_advance_hours || 2))

    const availableSlots = allSlots
      .filter(slot => !occupiedTimes.has(slot))
      .filter(slot => {
        const slotDateTime = parse(slot, 'HH:mm', requestedDate)
        return slotDateTime >= minAdvanceTime
      })
      .map(slot => ({
        time: slot,
        available: true,
      }))

    // 11. Return results
    return NextResponse.json({
      date: dateParam,
      dayOfWeek: format(requestedDate, 'EEEE', { locale: es }),
      available: availableSlots.length > 0,
      slots: availableSlots,
      timeRanges: timeRanges,
      totalSlots: allSlots.length,
      availableSlots: availableSlots.length,
    })
  } catch (error) {
    console.error('Error calculating availability:', error)
    return NextResponse.json(
      { error: 'Error al calcular disponibilidad' },
      { status: 500 }
    )
  }
}
