import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { addHours, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type WhatsAppProfile = {
  user_id: string;
  whatsapp_phone_number_id: string;
  whatsapp_access_token: string;
  source: 'messaging_config' | 'user_profiles';
};

async function getUserWhatsAppProfile(supabase: any, userId: string): Promise<WhatsAppProfile | null> {
  // Canonical path
  const { data: configRow } = await supabase
    .from('messaging_config')
    .select('user_id, whatsapp_enabled, whatsapp_phone_number_id, whatsapp_access_token')
    .eq('user_id', userId)
    .maybeSingle();

  if (
    configRow?.whatsapp_enabled &&
    configRow.whatsapp_phone_number_id &&
    configRow.whatsapp_access_token
  ) {
    return {
      user_id: configRow.user_id,
      whatsapp_phone_number_id: configRow.whatsapp_phone_number_id,
      whatsapp_access_token: configRow.whatsapp_access_token,
      source: 'messaging_config',
    };
  }

  // Legacy fallback
  const { data: profileRow } = await supabase
    .from('user_profiles')
    .select('user_id, whatsapp_enabled, whatsapp_phone_number_id, whatsapp_access_token')
    .eq('user_id', userId)
    .maybeSingle();

  if (
    profileRow?.whatsapp_enabled &&
    profileRow.whatsapp_phone_number_id &&
    profileRow.whatsapp_access_token
  ) {
    return {
      user_id: profileRow.user_id,
      whatsapp_phone_number_id: profileRow.whatsapp_phone_number_id,
      whatsapp_access_token: profileRow.whatsapp_access_token,
      source: 'user_profiles',
    };
  }

  return null;
}

async function getAllEnabledWhatsAppProfiles(supabase: any): Promise<WhatsAppProfile[]> {
  const byUser = new Map<string, WhatsAppProfile>();

  // Prefer canonical config
  const { data: configRows } = await supabase
    .from('messaging_config')
    .select('user_id, whatsapp_phone_number_id, whatsapp_access_token')
    .eq('whatsapp_enabled', true)
    .not('whatsapp_phone_number_id', 'is', null)
    .not('whatsapp_access_token', 'is', null);

  for (const row of configRows || []) {
    byUser.set(row.user_id, {
      user_id: row.user_id,
      whatsapp_phone_number_id: row.whatsapp_phone_number_id,
      whatsapp_access_token: row.whatsapp_access_token,
      source: 'messaging_config',
    });
  }

  // Legacy fallback only for users not present in messaging_config
  const { data: legacyRows } = await supabase
    .from('user_profiles')
    .select('user_id, whatsapp_phone_number_id, whatsapp_access_token')
    .eq('whatsapp_enabled', true)
    .not('whatsapp_phone_number_id', 'is', null)
    .not('whatsapp_access_token', 'is', null);

  for (const row of legacyRows || []) {
    if (!byUser.has(row.user_id)) {
      byUser.set(row.user_id, {
        user_id: row.user_id,
        whatsapp_phone_number_id: row.whatsapp_phone_number_id,
        whatsapp_access_token: row.whatsapp_access_token,
        source: 'user_profiles',
      });
    }
  }

  return Array.from(byUser.values());
}

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
    const cronSecret = process.env.CRON_SECRET;
    const isCronCall = cronSecret && token === cronSecret;

    let userId: string | null = null;

    if (!isCronCall) {
      // Validar JWT de usuario
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }
      userId = user.id;
    }

    // Si es llamada del cron, procesar TODOS los usuarios con WhatsApp activo
    if (isCronCall && !appointmentId) {
      const profiles = await getAllEnabledWhatsAppProfiles(supabase);

      if (!profiles || profiles.length === 0) {
        return NextResponse.json({ success: true, type, totalProcessed: 0, sent: 0, failed: 0, results: [] });
      }

      const allResults: any[] = [];
      for (const p of profiles) {
        const res = await processUserReminders(supabase, p.user_id, p, type, force, null);
        allResults.push(...res);
      }
      const sent = allResults.filter(r => r.success).length;
      return NextResponse.json({ success: true, type, totalProcessed: allResults.length, sent, failed: allResults.length - sent, results: allResults });
    }

    // Modo usuario individual
    const profile = await getUserWhatsAppProfile(supabase, userId!);

    if (!profile) {
      return NextResponse.json(
        { error: 'WhatsApp no configurado para este usuario' },
        { status: 400 }
      );
    }

    const results = await processUserReminders(supabase, userId!, profile, type, force, appointmentId || null);
    const successCount = results.filter((r: any) => r.success).length;

    return NextResponse.json({
      success: true,
      type,
      totalProcessed: results.length,
      sent: successCount,
      failed: results.length - successCount,
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

async function processUserReminders(
  supabase: any,
  userId: string,
  profile: Pick<WhatsAppProfile, 'whatsapp_phone_number_id' | 'whatsapp_access_token'>,
  type: string,
  force: boolean,
  appointmentId: string | null
): Promise<any[]> {
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
          patient:patients(id, nombre, apellido, telefono),
          doctor:doctors(nombre)
        `)
        .eq('id', appointmentId)
        .eq('user_id', userId)
        .single();

      if (!appointment) {
        return results;
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
          patient:patients(id, nombre, apellido, telefono),
          doctor:doctors(nombre)
        `)
        .eq('user_id', userId)
        .in('estado', ['programada', 'confirmada'])
        .gte('fecha_hora', startTime.toISOString())
        .lte('fecha_hora', endTime.toISOString());

      appointmentsToProcess = appointments || [];
    }

    // Filtrar recordatorios existentes desde whatsapp_messages (schema canónico)
    if (!force && appointmentsToProcess.length > 0) {
      const appointmentIds = appointmentsToProcess
        .map((apt: any) => apt.id)
        .filter(Boolean);

      const { data: existingReminders } = await supabase
        .from('whatsapp_messages')
        .select('appointment_id')
        .eq('user_id', userId)
        .eq('message_type', `reminder_${type}`)
        .in('appointment_id', appointmentIds)
        .in('status', ['pending', 'queued', 'sent', 'delivered', 'read']);

      const existingIds = new Set(
        (existingReminders || [])
          .map((row: any) => row.appointment_id)
          .filter(Boolean)
      );

      appointmentsToProcess = appointmentsToProcess.filter((apt: any) => !existingIds.has(apt.id));
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
        const patientName = `${patient.nombre || ''} ${patient.apellido || ''}`.trim();
        const doctorName = appointment.doctor?.nombre || 'su doctor';

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
          // Registrar en whatsapp_messages
          await supabase
            .from('whatsapp_messages')
            .insert({
              user_id: userId,
              patient_id: patient.id || null,
              appointment_id: appointment.id,
              to_phone: patient.telefono,
              message_body: message,
              status: 'sent',
              message_type: `reminder_${type}`,
              meta_message_id: result.messageId || null,
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

  return results;
}

async function sendMetaWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  message: string
) {
  const cleanPhone = to.replace(/[^\d]/g, '');

  try {
    if (process.env.WHATSAPP_DRY_RUN === 'true') {
      const messageId = `dryrun_${Date.now()}`;
      console.log('[Reminders] 🧪 WHATSAPP_DRY_RUN activo, no se envía a Meta:', {
        phoneNumberId,
        to: cleanPhone,
        messagePreview: message.slice(0, 120),
        messageId,
      });
      return {
        success: true,
        messageId,
        to: cleanPhone,
        dry_run: true,
      };
    }

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
