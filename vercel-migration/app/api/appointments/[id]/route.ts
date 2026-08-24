import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/log';

const log = createLogger('api/appointments/[id]');

/**
 * Auditoría fable 2026-06-11 — hallazgo C2 (P0):
 * El PUT original no autenticaba, usaba service role y actualizaba por id sin
 * filtrar por tenant, permitiendo modificar citas de cualquier clínica.
 *
 * Ahora los tres métodos: (1) exigen usuario autenticado, (2) acotan toda
 * operación con .eq('user_id', user.id) — el modelo de tenant existente del
 * producto —, (3) validan el body con Zod (sin mass assignment) y
 * (4) responden 404 sin revelar existencia cross-tenant.
 * Se mantiene compatibilidad con los nombres de campo ES/EN que ya envía el
 * frontend.
 */

const APPOINTMENT_SELECT = `
  *,
  patient:patients(id, nombre, apellido, email, telefono),
  treatment:treatments(id, nombre, descripcion),
  doctor:doctors!appointments_doctor_id_fkey(id, nombre, especialidad, color),
  consultorio:consultorios!appointments_consultorio_id_fkey(id, nombre, ubicacion),
  appointment_type:appointment_types!appointments_appointment_type_id_fkey(id, nombre, duracion_minutos, color)
`;

const uuid = z.string().uuid();

const putBodySchema = z
  .object({
    scheduled_datetime: z.string().datetime({ offset: true }).optional(),
    fecha_hora: z.string().datetime({ offset: true }).optional(),
    appointment_date: z.string().datetime({ offset: true }).optional(),
    appointment_time: z.string().optional(),
    appointment_type: z.string().max(100).optional(),
    duration_minutes: z.number().int().min(5).max(720).optional(),
    duracion_minutos: z.number().int().min(5).max(720).optional(),
    status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']).optional(),
    estado: z.enum(['programada', 'confirmada', 'completada', 'cancelada']).optional(),
    notes: z.string().max(10_000).nullable().optional(),
    notas: z.string().max(10_000).nullable().optional(),
    treatment_id: uuid.nullable().optional(),
    doctor_id: uuid.nullable().optional(),
    consultorio_id: uuid.nullable().optional(),
    appointment_type_id: uuid.nullable().optional(),
  })
  .strict();

const STATUS_EN_TO_ES: Record<string, string> = {
  scheduled: 'programada',
  confirmed: 'confirmada',
  completed: 'completada',
  cancelled: 'cancelada',
};

type JoinedAppointment = Record<string, unknown> & {
  fecha_hora?: string | null;
  estado?: string | null;
  notas?: string | null;
  duracion_minutos?: number | null;
  doctor_id?: string | null;
  consultorio_id?: string | null;
  appointment_type_id?: string | null;
  patient?: { nombre?: string; apellido?: string; telefono?: string } | null;
  treatment?: { nombre?: string } | null;
  doctor?: { nombre?: string; color?: string } | null;
  consultorio?: { nombre?: string } | null;
  appointment_type?: { nombre?: string; duracion_minutos?: number } | null;
};

function transformAppointment(appointment: JoinedAppointment) {
  return {
    ...appointment,
    fecha: appointment.fecha_hora,
    appointment_date: appointment.fecha_hora,
    appointment_time: appointment.fecha_hora
      ? new Date(appointment.fecha_hora).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : undefined,
    patient_name:
      appointment.patient?.nombre || appointment.patient?.apellido
        ? `${appointment.patient?.nombre || ''} ${appointment.patient?.apellido || ''}`.trim()
        : undefined,
    patient_phone: appointment.patient?.telefono,
    treatment_name: appointment.treatment?.nombre,
    doctor_id: appointment.doctor_id,
    doctor_name: appointment.doctor?.nombre,
    doctor_color: appointment.doctor?.color || '#3b82f6',
    consultorio_id: appointment.consultorio_id,
    consultorio_name: appointment.consultorio?.nombre,
    appointment_type_id: appointment.appointment_type_id,
    appointment_type_name: appointment.appointment_type?.nombre,
    duration_minutes:
      appointment.appointment_type?.duracion_minutos || appointment.duracion_minutos || 60,
    status:
      appointment.estado === 'programada'
        ? 'scheduled'
        : appointment.estado === 'confirmada'
          ? 'confirmed'
          : appointment.estado === 'completada'
            ? 'completed'
            : appointment.estado === 'cancelada'
              ? 'cancelled'
              : 'scheduled',
    notes: appointment.notas,
  };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { user: null, supabase };
  return { user, supabase };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const { user, supabase } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!uuid.safeParse(id).success) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(APPOINTMENT_SELECT)
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    log.error('GET inesperado', { error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const { user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!uuid.safeParse(id).success) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = putBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const finalDateTime = body.fecha_hora || body.scheduled_datetime || body.appointment_date;
    const finalDuration = body.duracion_minutos || body.duration_minutes;
    const finalStatus = body.estado || (body.status ? STATUS_EN_TO_ES[body.status] : undefined);
    const finalNotes = body.notas !== undefined ? body.notas : body.notes;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (finalDateTime) updateData.fecha_hora = finalDateTime;
    if (finalDuration) updateData.duracion_minutos = finalDuration;
    if (finalStatus) updateData.estado = finalStatus;
    if (finalNotes !== undefined) updateData.notas = finalNotes;
    if (body.treatment_id !== undefined) updateData.treatment_id = body.treatment_id;
    if (body.doctor_id !== undefined) updateData.doctor_id = body.doctor_id;
    if (body.consultorio_id !== undefined) updateData.consultorio_id = body.consultorio_id;
    if (body.appointment_type_id !== undefined)
      updateData.appointment_type_id = body.appointment_type_id;

    // Cliente admin sólo para resolver los JOIN del SELECT; la mutación queda
    // acotada al tenant con el doble filtro id + user_id (mismo patrón que DELETE).
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(APPOINTMENT_SELECT)
      .maybeSingle();

    if (error) {
      log.error('UPDATE falló', { code: error.code });
      return NextResponse.json({ error: 'Error updating appointment' }, { status: 500 });
    }
    if (!appointment) {
      // No revela si la cita existe en otro tenant.
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json(transformAppointment(appointment));
  } catch (error) {
    log.error('PUT inesperado', { error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const { user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!uuid.safeParse(id).success) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      log.error('DELETE falló', { code: error.code });
      return NextResponse.json({ error: 'Error deleting appointment' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Appointment deleted successfully', id });
  } catch (error) {
    log.error('DELETE inesperado', { error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
