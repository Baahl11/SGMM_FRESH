import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { addHours, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * AGENT: Reminder Automation
 * POST /api/agents/reminders/send
 * 
 * Envía recordatorios de WhatsApp para citas próximas
 * 
 * Body:
 * {
 *   appointmentId?: string,  // Enviar a una cita específica
 *   type: '24h' | '2h',      // Tipo de recordatorio
 *   force?: boolean          // Forzar envío aunque ya se haya enviado
 * }
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointmentId, type = '24h', force = false } = body;

    // Autenticación
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('whatsapp_enabled, whatsapp_phone_number_id, whatsapp_access_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: 'Error al cargar configuración de WhatsApp' },
        { status: 500 }
      );
    }

    if (!profile?.whatsapp_enabled || !profile.whatsapp_phone_number_id || !profile.whatsapp_access_token) {
      return NextResponse.json(
        { error: 'WhatsApp no configurado para este usuario' },
        { status: 400 }
      );
    }

    const results: any[] = [];
    let appointmentsToProcess: any[] = [];

    // Si se especificó una cita, procesar solo esa
    if (appointmentId) {
      const { data: appointment } = await supabase
        .from('appointments')
        .select(`
          id,
          fecha_hora,
          duracion_minutos,
          recordatorio_enviado,
          recordatorio_24h_at,
          recordatorio_2h_at,
          patient:patients(id, nombre, apellido, telefono),
          doctor:doctors(nombre),
          user:users(name)
        `)
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .single();

      if (!appointment) {
        return NextResponse.json(
          { error: 'Cita no encontrada' },
          { status: 404 }
        );
      }

      appointmentsToProcess = [appointment];
    } else {
      // Procesar citas que cumplan los criterios de tiempo
      const now = new Date();
      let startTime: Date;
      let endTime: Date;

      if (type === '24h') {
        // Citas entre 23 y 25 horas en el futuro
        startTime = addHours(now, 23);
        endTime = addHours(now, 25);
      } else {
        // Citas entre 1.5 y 2.5 horas en el futuro
        startTime = addHours(now, 1.5);
        endTime = addHours(now, 2.5);
      }

      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          fecha_hora,
          duracion_minutos,
          recordatorio_enviado,
          recordatorio_24h_at,
          recordatorio_2h_at,
          patient:patients(id, nombre, apellido, telefono),
          doctor:doctors(nombre),
          user:users(name)
        `)
        .eq('user_id', user.id)
        .in('estado', ['programada', 'confirmada'])
        .gte('fecha_hora', startTime.toISOString())
        .lte('fecha_hora', endTime.toISOString());

      appointmentsToProcess = appointments || [];

      // Filtrar las que ya tienen recordatorio enviado (si no es force)
      if (!force) {
        appointmentsToProcess = appointmentsToProcess.filter(apt => {
          if (type === '24h') {
            return !apt.recordatorio_24h_at;
          } else {
            return !apt.recordatorio_2h_at;
          }
        });
      }
    }

    console.log(`[Reminders] Procesando ${appointmentsToProcess.length} citas para recordatorio ${type}`);

    // Enviar recordatorio a cada cita
    for (const appointment of appointmentsToProcess) {
      try {
        const patient = appointment.patient;

        if (!patient?.telefono) {
          results.push({
            appointmentId: appointment.id,
            success: false,
            error: 'Paciente sin teléfono'
          });
          continue;
        }

        // Formatear datos para el mensaje
        const appointmentDate = parseISO(appointment.fecha_hora);
        const dateStr = format(appointmentDate, "EEEE d 'de' MMMM", { locale: es });
        const timeStr = format(appointmentDate, 'HH:mm');
        const patientName = `${patient.nombre} ${patient.apellido}`;
        const doctorName = appointment.doctor?.nombre || appointment.user?.name || 'su doctor';

        // Generar mensaje según tipo
        let message: string;
        if (type === '24h') {
          message = `Hola ${patientName} 👋

Te recordamos tu cita *mañana ${dateStr} a las ${timeStr}* con ${doctorName}.

¿Confirmas tu asistencia? Por favor responde:
✅ SÍ - Confirmo
❌ NO - Necesito cancelar

_Recordatorio automático de AgendaMedPro_`;
        } else {
          message = `Hola ${patientName} 👋

Tu cita es *HOY en 2 horas (${timeStr})* 🕐

Nos vemos pronto.

_Recordatorio automático de AgendaMedPro_`;
        }

        // Enviar mensaje
        const result = await sendMetaWhatsAppMessage(
          profile.whatsapp_phone_number_id,
          profile.whatsapp_access_token,
          patient.telefono,
          message
        );

        if (result.success) {
          // Actualizar registro de cita
          const updateData: any = {
            recordatorio_enviado: true
          };

          if (type === '24h') {
            updateData.recordatorio_24h_at = new Date().toISOString();
          } else {
            updateData.recordatorio_2h_at = new Date().toISOString();
          }

          await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', appointment.id);

          // Registrar en whatsapp_messages
          await supabase
            .from('whatsapp_messages')
            .insert({
              user_id: user.id,
              to_number: patient.telefono,
              message: message,
              status: 'sent',
              message_type: `reminder_${type}`,
              related_appointment_id: appointment.id,
              sent_at: new Date().toISOString()
            });

          results.push({
            appointmentId: appointment.id,
            patientName,
            success: true,
            messageSid: result.messageId
          });

          console.log(`[Reminders] ✅ Enviado a ${patientName} (${patient.telefono})`);
        } else {
          results.push({
            appointmentId: appointment.id,
            patientName,
            success: false,
            error: result.error
          });

          console.error(`[Reminders] ❌ Error enviando a ${patientName}:`, result.error);
        }

        // Pequeña pausa entre mensajes para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`[Reminders] Error procesando cita ${appointment.id}:`, error);
        results.push({
          appointmentId: appointment.id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      type,
      totalProcessed: results.length,
      sent: successCount,
      failed: failureCount,
      results
    });

  } catch (error: any) {
    console.error('[Reminders] Error general:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enviar recordatorios' },
      { status: 500 }
    );
  }
}

async function sendMetaWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  message: string
) {
  const cleanPhone = to.replace(/[^\d]/g, '');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { body: message }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || 'Error enviando WhatsApp'
      };
    }

    return {
      success: true,
      messageId: data?.messages?.[0]?.id,
      to: cleanPhone
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Error enviando WhatsApp'
    };
  }
}
