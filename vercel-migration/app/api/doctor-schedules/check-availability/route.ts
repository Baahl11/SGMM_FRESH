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
    const { doctor_id, appointment_date } = body;

    if (!doctor_id || !appointment_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Parse the appointment date
    const aptDate = new Date(appointment_date);
    const dayOfWeek = aptDate.getDay(); // 0=Sunday, 6=Saturday
    const aptTime = aptDate.toTimeString().slice(0, 5); // HH:MM format

    // Fetch the doctor's schedule for this day of the week
    const { data: schedules, error: scheduleError } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctor_id)
      .eq('dia_semana', dayOfWeek)
      .eq('activo', true)
      .eq('user_id', user.id);

    if (scheduleError) {
      console.error('Error fetching doctor schedule:', scheduleError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // If no schedule exists for this day, doctor doesn't work
    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        available: false,
        reason: 'doctor_not_working',
        message: 'El doctor no trabaja este día'
      });
    }

    // Check if appointment time is within working hours
    const schedule = schedules[0];
    const [aptHour, aptMin] = aptTime.split(':').map(Number);
    const [startHour, startMin] = schedule.hora_inicio.split(':').map(Number);
    const [endHour, endMin] = schedule.hora_fin.split(':').map(Number);

    const aptMinutes = aptHour * 60 + aptMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (aptMinutes < startMinutes) {
      return NextResponse.json({
        available: false,
        reason: 'before_working_hours',
        message: `El doctor empieza a trabajar a las ${schedule.hora_inicio}`,
        suggested_time: schedule.hora_inicio
      });
    }

    if (aptMinutes >= endMinutes) {
      return NextResponse.json({
        available: false,
        reason: 'after_working_hours',
        message: `El doctor termina de trabajar a las ${schedule.hora_fin}`,
        suggested_time: schedule.hora_inicio
      });
    }

    // Check for doctor exceptions (vacations, holidays, blocks)
    const aptDateOnly = aptDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data: exceptions, error: exceptionsError } = await supabase
      .from('doctor_exceptions')
      .select('*')
      .eq('doctor_id', doctor_id)
      .eq('activo', true)
      .eq('user_id', user.id)
      .lte('fecha_inicio', aptDateOnly)
      .gte('fecha_fin', aptDateOnly);

    if (exceptionsError) {
      console.error('Error fetching doctor exceptions:', exceptionsError);
      // Don't block if we can't check exceptions, just log the error
    }

    // If there's an active exception for this date, block the appointment
    if (exceptions && exceptions.length > 0) {
      const exception = exceptions[0];
      let exceptionTypeLabel = 'bloqueado';
      
      switch (exception.tipo) {
        case 'vacaciones':
          exceptionTypeLabel = 'de vacaciones';
          break;
        case 'festivo':
          exceptionTypeLabel = 'por día festivo';
          break;
        case 'bloqueo':
          exceptionTypeLabel = 'bloqueado';
          break;
      }

      const message = exception.motivo 
        ? `El doctor está ${exceptionTypeLabel}: ${exception.motivo}`
        : `El doctor está ${exceptionTypeLabel} en esta fecha`;

      return NextResponse.json({
        available: false,
        reason: 'doctor_exception',
        exception_type: exception.tipo,
        message: message,
        exception_dates: {
          start: exception.fecha_inicio,
          end: exception.fecha_fin
        }
      });
    }

    // All checks passed
    return NextResponse.json({
      available: true,
      consultorio_id: schedule.consultorio_id,
      working_hours: {
        start: schedule.hora_inicio,
        end: schedule.hora_fin
      }
    });

  } catch (error) {
    console.error('Error checking doctor availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
