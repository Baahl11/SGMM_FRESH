import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      appointment_date,
      duration_minutes = 60,
      doctor_id,
      consultorio_id,
      patient_id,
      exclude_appointment_id
    } = body;

    if (!appointment_date) {
      return NextResponse.json({ error: 'Missing appointment_date' }, { status: 400 });
    }

    // Calculate end time
    const startTime = new Date(appointment_date);
    const endTime = new Date(startTime.getTime() + duration_minutes * 60000);

    const conflicts: {
      doctor_busy?: boolean;
      consultorio_busy?: boolean;
      patient_duplicate?: boolean;
    } = {};

    // Build query to check for overlapping appointments
    let query = supabase
      .from('appointments')
      .select('id, doctor_id, consultorio_id, patient_id, fecha_hora')
      .neq('estado', 'cancelada')
      .gte('fecha_hora', startTime.toISOString())
      .lt('fecha_hora', endTime.toISOString());

    // Exclude current appointment if editing
    if (exclude_appointment_id) {
      query = query.neq('id', exclude_appointment_id);
    }

    const { data: overlappingAppointments, error: queryError } = await query;

    if (queryError) {
      console.error('Error checking conflicts:', queryError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Check conflicts
    if (overlappingAppointments) {
      // Check doctor conflict
      if (doctor_id) {
        conflicts.doctor_busy = overlappingAppointments.some(
          apt => apt.doctor_id === doctor_id
        );
      }

      // Check consultorio conflict
      if (consultorio_id) {
        conflicts.consultorio_busy = overlappingAppointments.some(
          apt => apt.consultorio_id === consultorio_id
        );
      }

      // Check patient duplicate
      if (patient_id) {
        conflicts.patient_duplicate = overlappingAppointments.some(
          apt => apt.patient_id === patient_id
        );
      }
    }

    const hasConflicts = conflicts.doctor_busy || conflicts.consultorio_busy || conflicts.patient_duplicate;

    return NextResponse.json({
      valid: !hasConflicts,
      conflicts,
      overlapping_count: overlappingAppointments?.length || 0
    });

  } catch (error) {
    console.error('Error validating appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
