import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    const { id } = params;
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(id, name, email, phone),
        treatment:treatments(id, treatment_type, description)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    const { id } = params;
    
    const { 
      // Support multiple datetime formats
      scheduled_datetime,
      fecha_hora,
      appointment_date,
      appointment_time, 
      // Support multiple field names
      appointment_type, 
      duration_minutes,
      duracion_minutos,
      status,
      estado,
      notes,
      notas,
      treatment_id,
      // Multi-doctor fields
      doctor_id,
      consultorio_id,
      appointment_type_id
    } = body;

    // Use the provided values with fallbacks
    const finalDateTime = fecha_hora || scheduled_datetime || appointment_date;
    const finalDuration = duracion_minutos || duration_minutes || 60;
    const finalStatus = estado || (status === 'scheduled' ? 'programada' : 
                                   status === 'confirmed' ? 'confirmada' :
                                   status === 'completed' ? 'completada' :
                                   status === 'cancelled' ? 'cancelada' : 'programada');
    const finalNotes = notas || notes;

    const supabase = await createClient();

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only update fields that are provided
    if (finalDateTime) updateData.fecha_hora = finalDateTime;
    if (finalDuration) updateData.duracion_minutos = finalDuration;
    if (finalStatus) updateData.estado = finalStatus;
    if (finalNotes !== undefined) updateData.notas = finalNotes;
    if (treatment_id) updateData.treatment_id = treatment_id;
    if (doctor_id !== undefined) updateData.doctor_id = doctor_id || null;
    if (consultorio_id !== undefined) updateData.consultorio_id = consultorio_id || null;
    if (appointment_type_id !== undefined) updateData.appointment_type_id = appointment_type_id || null;

    // Use admin client to bypass RLS for JOINs
    // Specify which foreign key to use to avoid ambiguity
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        patient:patients(id, nombre, apellido, email, telefono),
        treatment:treatments(id, nombre, descripcion),
        doctor:doctors!appointments_doctor_id_fkey(id, nombre, especialidad, color),
        consultorio:consultorios!appointments_consultorio_id_fkey(id, nombre, ubicacion),
        appointment_type:appointment_types!appointments_appointment_type_id_fkey(id, nombre, duracion_minutos, color)
      `)
      .single();

    if (error) {
      console.error('❌ Supabase UPDATE error:', error);
      return NextResponse.json(
        { error: 'Error updating appointment', details: error },
        { status: 500 }
      );
    }
    
    if (!appointment) {
      console.error('❌ No appointment returned from UPDATE! The record might not exist or RLS is blocking it.');
      return NextResponse.json(
        { error: 'Appointment not found after update' },
        { status: 404 }
      );
    }

    // Transform response to match frontend expectations
    const transformed = {
      ...appointment,
      fecha: appointment.fecha_hora,
      appointment_date: appointment.fecha_hora,
      appointment_time: appointment.fecha_hora ? new Date(appointment.fecha_hora).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }) : undefined,
      patient_name: appointment.patient?.nombre || appointment.patient?.apellido ? 
        `${appointment.patient?.nombre || ''} ${appointment.patient?.apellido || ''}`.trim() : undefined,
      patient_phone: appointment.patient?.telefono,
      treatment_name: appointment.treatment?.nombre,
      doctor_id: appointment.doctor_id,
      doctor_name: appointment.doctor?.nombre,
      doctor_color: appointment.doctor?.color || '#3b82f6',
      consultorio_id: appointment.consultorio_id,
      consultorio_name: appointment.consultorio?.nombre,
      appointment_type_id: appointment.appointment_type_id,
      appointment_type_name: appointment.appointment_type?.nombre,
      duration_minutes: appointment.appointment_type?.duracion_minutos || appointment.duracion_minutos || 60,
      status: appointment.estado === 'programada' ? 'scheduled' : 
              appointment.estado === 'confirmada' ? 'confirmed' :
              appointment.estado === 'completada' ? 'completed' : 
              appointment.estado === 'cancelada' ? 'cancelled' : 'scheduled',
      notes: appointment.notas
    };

    return NextResponse.json(transformed);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { id } = params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { error } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ [API ENDPOINT] Supabase error:', error);
      return NextResponse.json(
        { error: 'Error deleting appointment', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ 
      message: 'Appointment deleted successfully',
      id: id
    });

  } catch (error) {
    console.error('❌ [API ENDPOINT] Unexpected error:', error);
    console.error('❌ [API ENDPOINT] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}