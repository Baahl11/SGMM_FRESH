import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { addMinutes } from 'date-fns'

/**
 * PUBLIC API: Create a booking (patient appointment request)
 * POST /api/public/book/[slug]
 * 
 * Body:
 * {
 *   patient_name: string
 *   patient_email: string
 *   patient_phone: string
 *   service_id: string
 *   service_name: string
 *   service_price: number
 *   service_duration_minutes: number
 *   booking_date: string (YYYY-MM-DD)
 *   booking_time: string (HH:mm)
 *   patient_notes?: string
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      'patient_name',
      'patient_email',
      'patient_phone',
      'service_name',
      'booking_date',
      'booking_time',
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.patient_email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

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
      .select('user_id, email, name')
      .eq('booking_slug', slug)
      .eq('booking_enabled', true)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Clínica no encontrada o booking no disponible' },
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
        { error: 'Configuración de booking no encontrada' },
        { status: 404 }
      )
    }

    // 3. Check if slot is still available (double-check)
    const slotDateTime = new Date(`${body.booking_date}T${body.booking_time}:00`)
    const slotDuration = body.service_duration_minutes || settings.slot_duration_minutes || 30

    // Check existing bookings
    const { data: existingBookings } = await supabase
      .from('public_bookings')
      .select('booking_time, service_duration_minutes')
      .eq('clinic_user_id', profile.user_id)
      .eq('booking_date', body.booking_date)
      .in('status', ['pending', 'confirmed'])

    // Check if slot overlaps with any existing booking
    if (existingBookings && existingBookings.length > 0) {
      for (const existing of existingBookings) {
        const existingStart = new Date(`${body.booking_date}T${existing.booking_time}`)
        const existingEnd = addMinutes(existingStart, existing.service_duration_minutes || 30)
        const requestedEnd = addMinutes(slotDateTime, slotDuration)

        // Check overlap
        if (
          (slotDateTime >= existingStart && slotDateTime < existingEnd) ||
          (requestedEnd > existingStart && requestedEnd <= existingEnd) ||
          (slotDateTime <= existingStart && requestedEnd >= existingEnd)
        ) {
          return NextResponse.json(
            { 
              error: 'Este horario ya no está disponible',
              code: 'SLOT_TAKEN'
            },
            { status: 409 }
          )
        }
      }
    }

    // 4. Create the booking with a temporary lock
    const lockUntil = addMinutes(new Date(), 10) // 10-minute lock

    const { data: booking, error: bookingError } = await supabase
      .from('public_bookings')
      .insert({
        clinic_user_id: profile.user_id,
        patient_name: body.patient_name,
        patient_email: body.patient_email,
        patient_phone: body.patient_phone,
        service_name: body.service_name,
        service_price: body.service_price || null,
        service_duration_minutes: slotDuration,
        booking_date: body.booking_date,
        booking_time: body.booking_time + ':00', // Store with seconds
        status: settings.auto_confirm ? 'confirmed' : 'pending',
        patient_notes: body.patient_notes || null,
        locked_until: lockUntil.toISOString(),
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        { 
          error: 'Error al crear la reserva',
          details: bookingError.message 
        },
        { status: 500 }
      )
    }

    // 5. Send confirmation notifications
    // TODO: Integrate with your notification system (email, SMS, WhatsApp)
    // For now, just log
    console.log('📧 Booking created:', {
      bookingId: booking.id,
      clinic: profile.name,
      patient: body.patient_name,
      date: body.booking_date,
      time: body.booking_time,
      status: booking.status,
    })

    // 6. Return success response
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        confirmation_token: booking.confirmation_token,
        cancellation_token: booking.cancellation_token,
        clinic_name: profile.name,
        patient_name: booking.patient_name,
        service_name: booking.service_name,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        auto_confirmed: settings.auto_confirm,
      },
      message: settings.auto_confirm 
        ? '¡Cita confirmada! Recibirás una confirmación por email.'
        : 'Solicitud enviada. La clínica confirmará tu cita pronto.',
    }, { status: 201 })

  } catch (error) {
    console.error('Error in booking API:', error)
    return NextResponse.json(
      { error: 'Error al procesar la reserva' },
      { status: 500 }
    )
  }
}

/**
 * PUBLIC API: Cancel a booking using cancellation token
 * DELETE /api/public/book/[slug]?token=xxx
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(request.url)
  const cancellationToken = searchParams.get('token')

  if (!cancellationToken) {
    return NextResponse.json(
      { error: 'Token de cancelación requerido' },
      { status: 400 }
    )
  }

  try {
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

    // Find booking by cancellation token
    const { data: booking, error: findError } = await supabase
      .from('public_bookings')
      .select('*, user_profiles!clinic_user_id(booking_slug)')
      .eq('cancellation_token', cancellationToken)
      .single()

    if (findError || !booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    // Verify slug matches
    if (booking.user_profiles?.booking_slug !== params.slug) {
      return NextResponse.json(
        { error: 'Token inválido para esta clínica' },
        { status: 403 }
      )
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Esta reserva ya fue cancelada' },
        { status: 400 }
      )
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('public_bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Error cancelling booking:', updateError)
      return NextResponse.json(
        { error: 'Error al cancelar la reserva' },
        { status: 500 }
      )
    }

    // TODO: Send cancellation notification to clinic

    return NextResponse.json({
      success: true,
      message: 'Reserva cancelada exitosamente',
    })

  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      { error: 'Error al cancelar la reserva' },
      { status: 500 }
    )
  }
}
