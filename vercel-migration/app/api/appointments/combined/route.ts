import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/appointments/combined
 * Returns both regular appointments and public bookings combined
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch regular appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(id, nombre, apellido, email, telefono),
        treatment:treatments(id, nombre, descripcion),
        doctor:doctors!appointments_doctor_id_fkey(id, nombre, especialidad, color),
        consultorio:consultorios!appointments_consultorio_id_fkey(id, nombre, ubicacion),
        appointment_type:appointment_types!appointments_appointment_type_id_fkey(id, nombre, duracion_minutos, color)
      `)
      .eq('user_id', user.id)
      .order('fecha_hora', { ascending: true });

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
    }

    // Fetch public bookings
    const { data: publicBookings, error: bookingsError } = await supabase
      .from('public_bookings')
      .select('*')
      .eq('clinic_user_id', user.id)
      .order('booking_date', { ascending: true });

    if (bookingsError) {
      console.error('❌ Error fetching public bookings:', bookingsError);
    }

    console.log(`📊 Found ${appointments?.length || 0} internal appointments, ${publicBookings?.length || 0} public bookings`);

    // Transform regular appointments
    const transformedAppointments = appointments?.map(apt => ({
      ...apt,
      source: 'internal',
      fecha: apt.fecha_hora,
      appointment_date: apt.fecha_hora,
      appointment_time: apt.fecha_hora ? new Date(apt.fecha_hora).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }) : undefined,
      patient_name: apt.patient?.nombre || apt.patient?.apellido ? 
        `${apt.patient?.nombre || ''} ${apt.patient?.apellido || ''}`.trim() : undefined,
      patient_phone: apt.patient?.telefono,
      treatment_name: apt.treatment?.nombre,
      doctor_id: apt.doctor_id,
      doctor_name: apt.doctor?.nombre,
      doctor_color: apt.doctor?.color || '#3b82f6',
      consultorio_id: apt.consultorio_id,
      consultorio_name: apt.consultorio?.nombre,
      consultorio_ubicacion: apt.consultorio?.ubicacion,
      appointment_type_id: apt.appointment_type_id,
      appointment_type_name: apt.appointment_type?.nombre,
      appointment_type_color: apt.appointment_type?.color,
      duration_minutes: apt.appointment_type?.duracion_minutos || apt.duracion_minutos || 60,
      status: apt.estado === 'programada' ? 'scheduled' : 
              apt.estado === 'confirmada' ? 'confirmed' :
              apt.estado === 'completada' ? 'completed' : 
              apt.estado === 'cancelada' ? 'cancelled' : 'scheduled',
      notes: apt.notas
    })) || [];

    // Transform public bookings to appointment format
    const transformedBookings = publicBookings?.map(booking => {
      // Combine booking_date and booking_time into a single datetime
      const bookingDateTime = `${booking.booking_date}T${booking.booking_time}`;
      
      return {
      id: `booking-${booking.id}`,
      source: 'online',
      fecha_hora: bookingDateTime,
      fecha: bookingDateTime,
      appointment_date: bookingDateTime,
      appointment_time: booking.booking_time ? booking.booking_time.substring(0, 5) : undefined,
      patient_name: booking.patient_name,
      patient_phone: booking.patient_phone,
      patient_email: booking.patient_email,
      treatment_name: booking.service_name,
      duration_minutes: booking.service_duration_minutes || 30,
      duracion_minutos: booking.service_duration_minutes || 30,
      precio_acordado: booking.service_price,
      status: booking.status === 'pending' ? 'scheduled' : 
              booking.status === 'confirmed' ? 'confirmed' :
              booking.status === 'cancelled' ? 'cancelled' :
              booking.status === 'completed' ? 'completed' : 'scheduled',
      estado: booking.status === 'pending' ? 'programada' :
              booking.status === 'confirmed' ? 'confirmada' :
              booking.status === 'cancelled' ? 'cancelada' :
              booking.status === 'completed' ? 'completada' : 'programada',
      notes: booking.patient_notes ? `🌐 ${booking.patient_notes}` : '🌐 Reserva online',
      notas: booking.patient_notes ? `🌐 ${booking.patient_notes}` : '🌐 Reserva online',
      user_id: user.id,
      booking_id: booking.id,
      doctor_color: '#10b981',
      appointment_type_color: '#10b981',
      created_at: booking.created_at,
      updated_at: booking.updated_at
    }
    }) || [];

    // Combine and sort by datetime
    const allAppointments = [...transformedAppointments, ...transformedBookings].sort((a, b) => {
      const dateA = new Date(a.fecha_hora || a.fecha).getTime();
      const dateB = new Date(b.fecha_hora || b.fecha).getTime();
      return dateA - dateB;
    });

    console.log(`✅ Returning ${transformedAppointments.length} internal + ${transformedBookings.length} online bookings`);

    return NextResponse.json({ 
      appointments: allAppointments,
      stats: {
        internal: transformedAppointments.length,
        online: transformedBookings.length,
        total: allAppointments.length
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
