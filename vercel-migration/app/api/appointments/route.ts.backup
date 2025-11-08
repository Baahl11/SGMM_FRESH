import { NextRequest, NextResponse } from 'next/server';
import { createClient, supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use regular client to respect RLS - filters by user_id automatically
    const { data: appointments, error } = await supabase
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

    if (error) {
      console.error('❌ Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Error fetching appointments', details: error.message },
        { status: 500 }
      );
    }

    // �🔧 Transform data to match frontend expectations
    const transformedAppointments = appointments?.map(apt => ({
      ...apt,
      // Map database fields to frontend expected fields
      fecha: apt.fecha_hora,  // Map fecha_hora to fecha
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
      // 🆕 Multi-doctor fields
      doctor_id: apt.doctor_id,
      doctor_name: apt.doctor?.nombre,
      doctor_color: apt.doctor?.color || '#3b82f6', // Default blue
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

    return NextResponse.json({ appointments: transformedAppointments });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { 
      patient_id, 
      fecha_hora,
      appointment_date,
      appointment_time,
      duracion_minutos = 60,
      duration_minutes = 60,
      estado = 'programada',
      status = 'scheduled',
      motivo,
      notas,
      notes,
      treatment_id,
      precio_acordado,
      doctor_id,
      consultorio_id,
      appointment_type_id
    } = body;

    const finalDateTime = fecha_hora || appointment_date;
    const finalDuration = duracion_minutos || duration_minutes;
    const finalStatus = estado === 'programada' ? estado : (status === 'scheduled' ? 'programada' : estado);
    const finalNotes = motivo || notas || notes;

    // Validate required fields
    if (!patient_id || !finalDateTime) {
      return NextResponse.json(
        { error: 'Missing required fields: patient_id, fecha_hora/appointment_date' },
        { status: 400 }
      );
    }

    // Insert new appointment with user_id
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([{
        patient_id,
        fecha_hora: finalDateTime,
        duracion_minutos: finalDuration,
        estado: finalStatus,
        notas: finalNotes,
        treatment_id,
        precio_acordado,
        doctor_id,
        consultorio_id,
        appointment_type_id,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select(`
        *,
        patient:patients(id, nombre, apellido, email, telefono),
        treatment:treatments(id, nombre, descripcion),
        doctor:doctors(id, nombre, especialidad, color),
        consultorio:consultorios(id, nombre, ubicacion),
        appointment_type:appointment_types(id, nombre, duracion_minutos, color)
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Error creating appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Appointment created successfully',
      appointment 
    }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}