import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get doctor_id from query params
    const { searchParams } = new URL(request.url);
    const doctor_id = searchParams.get('doctor_id');

    if (!doctor_id) {
      return NextResponse.json({ error: 'Missing doctor_id' }, { status: 400 });
    }

    // Fetch schedules for this doctor
    const { data, error } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctor_id)
      .eq('user_id', user.id)
      .order('dia_semana', { ascending: true });

    if (error) {
      console.error('Error fetching doctor schedules:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('Error in doctor-schedules GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { doctor_id, schedules } = body;

    if (!doctor_id || !Array.isArray(schedules)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Delete existing schedules for this doctor
    const { error: deleteError } = await supabase
      .from('doctor_schedules')
      .delete()
      .eq('doctor_id', doctor_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting old schedules:', deleteError);
      return NextResponse.json({ error: 'Error deleting old schedules' }, { status: 500 });
    }

    // Insert new schedules (only active ones to save space)
    const schedulesToInsert = schedules
      .filter(s => s.activo)
      .map(schedule => ({
        doctor_id,
        dia_semana: schedule.dia_semana,
        hora_inicio: schedule.hora_inicio,
        hora_fin: schedule.hora_fin,
        consultorio_id: schedule.consultorio_id,
        activo: true,
        user_id: user.id
      }));

    if (schedulesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('doctor_schedules')
        .insert(schedulesToInsert);

      if (insertError) {
        console.error('Error inserting schedules:', insertError);
        return NextResponse.json({ error: 'Error saving schedules' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, count: schedulesToInsert.length });

  } catch (error) {
    console.error('Error in doctor-schedules POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
