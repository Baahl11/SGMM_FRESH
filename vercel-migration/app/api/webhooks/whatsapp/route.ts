import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyMetaSignature, allowUnsignedInDev } from '@/lib/security/webhook-signatures';
import { maskPhone } from '@/lib/log';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs'; // fable: Node para crypto.timingSafeEqual

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

/**
 * GET /api/webhooks/whatsapp
 * Verificación del webhook por Meta
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verificar token (debe coincidir con el que configuraste en Meta)
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!VERIFY_TOKEN) {
    console.error('[WEBHOOK] WHATSAPP_VERIFY_TOKEN not configured');
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WEBHOOK] ✅ Webhook verificado');
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST /api/webhooks/whatsapp
 * Recibe mensajes entrantes de WhatsApp y responde con IA
 */
export async function POST(request: NextRequest) {
  try {
    // Auditoría fable 2026-06-11 (C10): verificación FAIL-CLOSED de
    // X-Hub-Signature-256. Antes, sin WHATSAPP_APP_SECRET el webhook procesaba
    // cualquier payload; ahora en producción se rechaza, y la comparación es
    // de tiempo constante. Límite de tamaño para evitar abuso.
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const rawBody = await request.text();
    if (rawBody.length > 256_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    if (!appSecret) {
      if (!allowUnsignedInDev()) {
        console.error('[WEBHOOK] WHATSAPP_APP_SECRET ausente; rechazando webhook (fail-closed)');
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 401 });
      }
    } else {
      const signature = request.headers.get('x-hub-signature-256');
      if (!verifyMetaSignature(rawBody, signature, appSecret)) {
        console.error('[WEBHOOK] ❌ Firma inválida o ausente');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    // No registrar el cuerpo completo: contiene teléfonos y mensajes de pacientes.
    console.log('[WEBHOOK] 📨 Evento recibido de WhatsApp');

    // Verificar que sea un mensaje de texto
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      console.log('[WEBHOOK] ⚠️ No hay mensajes para procesar');
      return NextResponse.json({ status: 'no_messages' });
    }

    const message = messages[0];
    const from = message.from; // Número del paciente
    const messageText = message.text?.body;
    const messageId = message.id;

    if (!messageText) {
      console.log('[WEBHOOK] ⚠️ Mensaje sin texto');
      return NextResponse.json({ status: 'no_text' });
    }

    console.log(`[WEBHOOK] 💬 Mensaje entrante de ${maskPhone(from)} (${messageText.length} caracteres)`);

    // Obtener metadata de WhatsApp Business
    const metadata = value?.metadata;
    const phoneNumberId = metadata?.phone_number_id;
    const displayPhoneNumber = metadata?.display_phone_number;

    console.log(`[WEBHOOK] 📱 Phone Number ID: ${phoneNumberId}`);

    // Buscar el doctor que tiene este Phone Number ID configurado
    // 1) Fuente canónica: messaging_config
    // 2) Fallback legacy: user_profiles
    let userId: string | null = null;
    let accessToken: string | null = null;
    let clinicNameFromConfig: string | null = null;
    let clinicAddressFromConfig: string | null = null;
    let clinicPhoneFromConfig: string | null = null;
    let customSignatureFromConfig: string | null = null;

    const { data: configRow, error: configError } = await supabase
      .from('messaging_config')
      .select('user_id, whatsapp_access_token, whatsapp_phone_number_id, clinic_name, clinic_address, clinic_phone, custom_message_signature')
      .eq('whatsapp_phone_number_id', phoneNumberId)
      .eq('whatsapp_enabled', true)
      .maybeSingle();

    if (configError) {
      // No bloquea webhook: mantener compatibilidad con installations legacy
      console.warn('[WEBHOOK] ⚠️ Error consultando messaging_config, usando fallback legacy:', configError.message);
    }

    if (configRow?.user_id && configRow?.whatsapp_access_token) {
      userId = configRow.user_id;
      accessToken = configRow.whatsapp_access_token;
      clinicNameFromConfig = configRow.clinic_name || null;
      clinicAddressFromConfig = configRow.clinic_address || null;
      clinicPhoneFromConfig = configRow.clinic_phone || null;
      customSignatureFromConfig = configRow.custom_message_signature || null;
      console.log('[WEBHOOK] ✅ Tenant resuelto por messaging_config');
    } else {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, whatsapp_access_token, whatsapp_phone_number_id')
        .eq('whatsapp_phone_number_id', phoneNumberId)
        .eq('whatsapp_enabled', true)
        .maybeSingle();

      console.log('[WEBHOOK] 🔍 Fallback legacy consultado', { encontrado: Boolean(profile), error: profileError?.code });

      if (profileError) {
        console.error('[WEBHOOK] ❌ Error buscando perfil legacy:', profileError);
        return NextResponse.json({ status: 'database_error', error: profileError.message });
      }

      if (profile?.user_id && profile?.whatsapp_access_token) {
        userId = profile.user_id;
        accessToken = profile.whatsapp_access_token;
      }
    }

    if (!userId || !accessToken) {
      console.error('[WEBHOOK] ❌ No se encontró perfil para Phone Number ID:', phoneNumberId);
      return NextResponse.json({ status: 'profile_not_found', phoneNumberId });
    }

    console.log(`[WEBHOOK] 👨‍⚕️ Doctor encontrado: ${userId}`);

    // Obtener perfil del doctor con compatibilidad de esquema:
    // algunos entornos usan `name`, otros `full_name`.
    let doctorName: string | null = null;
    let bookingSlug: string | null = null;

    const { data: profileByName, error: profileByNameError } = await supabase
      .from('user_profiles')
      .select('name, booking_slug')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profileByNameError) {
      doctorName = profileByName?.name || null;
      bookingSlug = profileByName?.booking_slug || null;
    } else {
      const { data: profileByFullName, error: profileByFullNameError } = await supabase
        .from('user_profiles')
        .select('full_name, booking_slug')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileByFullNameError) {
        console.warn('[WEBHOOK] ⚠️ No fue posible leer nombre del doctor en user_profiles:', profileByFullNameError.message);
      } else {
        doctorName = profileByFullName?.full_name || null;
        bookingSlug = profileByFullName?.booking_slug || null;
      }
    }

    const resolvedDoctorName = doctorName || 'Tu Doctor';
    const signatureName = customSignatureFromConfig || resolvedDoctorName;
    const bookingUrl = bookingSlug 
      ? `https://agendamedpro.com/book/${bookingSlug}`
      : 'https://agendamedpro.com/dashboard/settings/booking'; // Fallback si no ha configurado

    // Contexto operativo del consultorio (clínica, equipo, horarios)
    const { data: mainLocation } = await supabase
      .from('locations')
      .select('nombre, direccion, ciudad, telefono, timezone, horarios_laborales, es_principal')
      .eq('user_id', userId)
      .eq('activo', true)
      .order('es_principal', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: doctors } = await supabase
      .from('doctors')
      .select('nombre, especialidad')
      .eq('user_id', userId)
      .eq('activo', true)
      .limit(6);

    const { data: schedules } = await supabase
      .from('doctor_schedules')
      .select(`
        dia_semana,
        hora_inicio,
        hora_fin,
        doctor:doctors(nombre)
      `)
      .eq('user_id', userId)
      .eq('activo', true)
      .order('dia_semana', { ascending: true })
      .limit(20);

    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const scheduleLines = (schedules || []).map((sch: any) => {
      const dayName = dayNames[sch.dia_semana] || `Día ${sch.dia_semana}`;
      const doctorLabel = sch.doctor?.nombre ? ` (${sch.doctor.nombre})` : '';
      return `${dayName}: ${sch.hora_inicio} - ${sch.hora_fin}${doctorLabel}`;
    });

    const clinicName = clinicNameFromConfig || mainLocation?.nombre || 'Consultorio';
    const clinicAddress = clinicAddressFromConfig
      || [mainLocation?.direccion, mainLocation?.ciudad].filter(Boolean).join(', ')
      || '';
    const clinicPhone = clinicPhoneFromConfig || mainLocation?.telefono || '';
    const clinicTimezone = mainLocation?.timezone || 'America/Mexico_City';
    const doctorsList = (doctors || []).map((d: any) => d.especialidad ? `${d.nombre} (${d.especialidad})` : d.nombre).join(', ');
    const scheduleSummary = scheduleLines.length > 0
      ? scheduleLines.slice(0, 10).join('\n')
      : 'No hay horarios cargados en el sistema.';

    // Buscar paciente por teléfono
    const cleanFrom = from.replace(/[\s\-\+]/g, '');
    const { data: patient } = await supabase
      .from('patients')
      .select('id, nombre, apellido, telefono, user_id')
      .eq('user_id', userId)
      .ilike('telefono', `%${cleanFrom.slice(-10)}%`) // Últimos 10 dígitos
      .maybeSingle();

    let patientName = 'Paciente';
    let patientContext = '';

    if (patient) {
      patientName = `${patient.nombre} ${patient.apellido}`.trim();
      patientContext = `Paciente registrado: ${patientName}`;
      
      // Buscar citas próximas del paciente
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7); // Próximos 7 días
      
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, fecha_hora, estado')
        .eq('patient_id', patient.id)
        .gte('fecha_hora', new Date().toISOString())
        .lte('fecha_hora', tomorrow.toISOString())
        .order('fecha_hora', { ascending: true })
        .limit(3);

      if (appointments && appointments.length > 0) {
        patientContext += `\n\nCitas próximas:`;
        appointments.forEach((apt, idx) => {
          const fecha = new Date(apt.fecha_hora).toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          });
          const hora = new Date(apt.fecha_hora).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          });
          patientContext += `\n${idx + 1}. ${fecha} a las ${hora} (${apt.estado})`;
        });
      }
    } else {
      patientContext = `Paciente NO registrado (teléfono ${from})`;
    }

    console.log(`[WEBHOOK] 🔍 Contexto construido (${patientContext.length} caracteres)`);

    // Detectar intención del mensaje
    const lowerMessage = messageText.toLowerCase().trim();
    
    // Respuestas rápidas para confirmaciones
    if (lowerMessage === 'sí' || lowerMessage === 'si' || lowerMessage === 'confirmo' || lowerMessage === 'ok') {
      // Buscar la próxima cita del paciente
      if (patient) {
        const { data: nextAppointment } = await supabase
          .from('appointments')
          .select('id, fecha_hora, estado')
          .eq('patient_id', patient.id)
          .gte('fecha_hora', new Date().toISOString())
          .order('fecha_hora', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (nextAppointment) {
          // Actualizar estado a confirmada
          await supabase
            .from('appointments')
            .update({ estado: 'confirmada' })
            .eq('id', nextAppointment.id);

          const fechaHora = new Date(nextAppointment.fecha_hora);
          const fechaFormato = fechaHora.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          });
          const horaFormato = fechaHora.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          });

          const response = `¡Perfecto ${patientName}! ✅\n\nTu cita del ${fechaFormato} a las ${horaFormato} está confirmada.\n\nTe esperamos puntual. Si necesitas cancelar, avísanos con tiempo.\n\n- ${doctorName}`;
          
          await sendWhatsAppMessage(phoneNumberId, accessToken, from, response);
          
          // Registrar conversación
          await supabase.from('whatsapp_conversations').insert({
            user_id: userId,
            patient_id: patient.id,
            phone_number: from,
            message_in: messageText,
            message_out: response,
            message_id: messageId,
            responded_by: 'ai',
            action_taken: 'confirmed_appointment'
          });

          return NextResponse.json({ status: 'confirmed' });
        }
      }
      
      const response = `¡Perfecto ${patientName}! ✅\n\nGracias por confirmar. Te esperamos.\n\n- ${doctorName}`;
      await sendWhatsAppMessage(phoneNumberId, accessToken, from, response);
      
      return NextResponse.json({ status: 'confirmed' });
    }

    if (lowerMessage === 'no' || lowerMessage === 'cancelar' || lowerMessage === 'no puedo') {
      // Buscar la próxima cita del paciente
      if (patient) {
        const { data: nextAppointment } = await supabase
          .from('appointments')
          .select('id, fecha_hora')
          .eq('patient_id', patient.id)
          .gte('fecha_hora', new Date().toISOString())
          .order('fecha_hora', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (nextAppointment) {
          // Actualizar estado a cancelada
          await supabase
            .from('appointments')
            .update({ estado: 'cancelada' })
            .eq('id', nextAppointment.id);

          const response = `Entendido ${patientName} 📋\n\nTu cita ha sido cancelada.\n\nPara reagendar, usa este link:\n${bookingUrl}\n\n- ${doctorName}`;
          
          await sendWhatsAppMessage(phoneNumberId, accessToken, from, response);
          
          // Registrar conversación
          await supabase.from('whatsapp_conversations').insert({
            user_id: userId,
            patient_id: patient.id,
            phone_number: from,
            message_in: messageText,
            message_out: response,
            message_id: messageId,
            responded_by: 'ai',
            action_taken: 'cancelled_appointment'
          });

          return NextResponse.json({ status: 'cancelled' });
        }
      }
      
      const response = `Entendido ${patientName} 📋\n\nSi deseas agendar una nueva cita:\n${bookingUrl}\n\n- ${doctorName}`;
      await sendWhatsAppMessage(phoneNumberId, accessToken, from, response);
      
      return NextResponse.json({ status: 'cancelled' });
    }

    // Detectar intención de agendar cita
    if (
      lowerMessage.includes('agendar') ||
      lowerMessage.includes('cita') ||
      lowerMessage.includes('horario') ||
      lowerMessage.includes('disponible') ||
      lowerMessage.includes('cuando') ||
      lowerMessage.includes('agenda')
    ) {
      const locationBlock = clinicAddress ? `📍 ${clinicAddress}\n` : '';
      const phoneBlock = clinicPhone ? `☎️ ${clinicPhone}\n` : '';
      const scheduleBlock = scheduleLines.length > 0
        ? `\nHorarios de atención:\n${scheduleLines.slice(0, 5).map((line) => `• ${line}`).join('\n')}\n`
        : '';

      const response = `¡Hola ${patientName}! 📅\n\n${clinicName}\n${locationBlock}${phoneBlock}${scheduleBlock}\nPuedes ver horarios disponibles y agendar aquí:\n${bookingUrl}\n\n- ${signatureName}`;
      
      await sendWhatsAppMessage(phoneNumberId, accessToken, from, response);
      
      // Registrar conversación
      await supabase.from('whatsapp_conversations').insert({
        user_id: userId,
        patient_id: patient?.id || null,
        phone_number: from,
        message_in: messageText,
        message_out: response,
        message_id: messageId,
        responded_by: 'ai',
        action_taken: 'sent_booking_link'
      });

      return NextResponse.json({ status: 'booking_link_sent' });
    }

    // Para todo lo demás, usar Claude IA
    console.log('[WEBHOOK] 🤖 Generando respuesta con Claude...');

    // El bookingUrl y doctorName ya están definidos arriba

    const systemPrompt = `Eres un asistente virtual de AgendaMedPro para la clínica "${clinicName}".

CONTEXTO DEL PACIENTE:
${patientContext}

  CONTEXTO DE LA CLÍNICA:
  - Nombre: ${clinicName}
  - Dirección: ${clinicAddress || 'No registrada'}
  - Teléfono: ${clinicPhone || 'No registrado'}
  - Zona horaria: ${clinicTimezone}
  - Doctores activos: ${doctorsList || 'No registrados'}
  - Horarios disponibles:
  ${scheduleSummary}

CAPACIDADES QUE TIENES:
1. 📅 Ver horarios disponibles - Envía este link: ${bookingUrl}
2. ✅ Confirmar citas existentes
3. ❌ Cancelar citas
4. 📋 Consultar próximas citas
5. 💰 Consultar adeudos/pagos

INSTRUCCIONES:
- Responde de forma amable, profesional y CONCISA (máximo 3 oraciones)
- Si preguntan "¿Qué horarios hay?" o "Quiero agendar", menciona brevemente horarios de clínica y envía el link: ${bookingUrl}
- Si preguntan por citas, muestra las que tiene el paciente del contexto arriba
- Si confirman (sí/ok/confirmo), agradece: "¡Perfecto! Tu cita está confirmada ✅"
- Si cancelan (no/cancelar), confirma: "Tu cita ha sido cancelada. Para reagendar: ${bookingUrl}"
- Usa emojis con moderación (máximo 2 por mensaje)
- NO inventes información que no tengas en el contexto
- SIEMPRE proporciona el link si quieren agendar
- Firma los mensajes como "- ${signatureName}"`;

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: messageText
        }
      ]
    });

    const aiResponse = claudeResponse.content[0].type === 'text' 
      ? claudeResponse.content[0].text 
      : 'Lo siento, no pude procesar tu mensaje. Por favor contacta al consultorio.';

    console.log(`[WEBHOOK] 💬 Respuesta IA generada (${aiResponse.length} caracteres)`);

    // Enviar respuesta por WhatsApp
    await sendWhatsAppMessage(phoneNumberId, accessToken, from, aiResponse);

    // Registrar conversación en base de datos
    await supabase.from('whatsapp_conversations').insert({
      user_id: userId,
      patient_id: patient?.id || null,
      phone_number: from,
      message_in: messageText,
      message_out: aiResponse,
      message_id: messageId,
      responded_by: 'ai'
    });

    console.log('[WEBHOOK] ✅ Respuesta enviada exitosamente');

    return NextResponse.json({ 
      status: 'success',
      message: 'Mensaje procesado y respondido'
    });

  } catch (error) {
    console.error('[WEBHOOK] 💥 Error:', error);
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Función auxiliar para enviar mensajes de WhatsApp
async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  message: string
) {
  try {
    if (process.env.WHATSAPP_DRY_RUN === 'true') {
      const fakeId = `dryrun_${Date.now()}`;
      console.log('[WEBHOOK] 🧪 WHATSAPP_DRY_RUN activo, no se envía a Meta:', {
        phoneNumberId,
        to,
        messagePreview: message.slice(0, 120),
        fakeId,
      });
      return {
        messages: [{ id: fakeId }],
        dry_run: true,
      };
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: { body: message }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[WEBHOOK] ❌ Error enviando mensaje:', error);
      throw new Error(error.error?.message || 'Error sending message');
    }

    const data = await response.json();
    console.log('[WEBHOOK] ✅ Mensaje enviado - ID:', data.messages?.[0]?.id);
    return data;
  } catch (error) {
    console.error('[WEBHOOK] 💥 Error en sendWhatsAppMessage:', error);
    throw error;
  }
}
