import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

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
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'agendamedpro_verify_2026';

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
    const body = await request.json();
    console.log('[WEBHOOK] 📨 Mensaje recibido:', JSON.stringify(body, null, 2));

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

    console.log(`[WEBHOOK] 💬 De: ${from} - Mensaje: "${messageText}"`);

    // Obtener metadata de WhatsApp Business
    const metadata = value?.metadata;
    const phoneNumberId = metadata?.phone_number_id;
    const displayPhoneNumber = metadata?.display_phone_number;

    console.log(`[WEBHOOK] 📱 Phone Number ID: ${phoneNumberId}`);

    // Buscar el doctor que tiene este Phone Number ID configurado
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, whatsapp_access_token, whatsapp_phone_number_id')
      .eq('whatsapp_phone_number_id', phoneNumberId)
      .eq('whatsapp_enabled', true)
      .maybeSingle();

    console.log('[WEBHOOK] 🔍 Query result:', { profile, error: profileError });

    if (profileError) {
      console.error('[WEBHOOK] ❌ Error buscando perfil:', profileError);
      return NextResponse.json({ status: 'database_error', error: profileError.message });
    }

    if (!profile) {
      console.error('[WEBHOOK] ❌ No se encontró perfil para Phone Number ID:', phoneNumberId);
      return NextResponse.json({ status: 'profile_not_found', phoneNumberId });
    }

    const userId = profile.user_id;
    const accessToken = profile.whatsapp_access_token;

    console.log(`[WEBHOOK] 👨‍⚕️ Doctor encontrado: ${userId}`);

    // Obtener información del doctor para personalizar respuestas
    const { data: doctorProfile } = await supabase
      .from('user_profiles')
      .select('full_name, booking_slug')
      .eq('user_id', userId)
      .maybeSingle();

    const doctorName = doctorProfile?.full_name || 'Tu Doctor';
    const bookingSlug = doctorProfile?.booking_slug;
    const bookingUrl = bookingSlug 
      ? `https://agendamedpro.com/book/${bookingSlug}`
      : 'https://agendamedpro.com/dashboard/settings/booking'; // Fallback si no ha configurado

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

    console.log(`[WEBHOOK] 🔍 Contexto: ${patientContext}`);

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
      const response = `¡Hola ${patientName}! 📅\n\nPuedes ver los horarios disponibles y agendar tu cita aquí:\n\n${bookingUrl}\n\nEs rápido y fácil. ¿Te ayudo con algo más?\n\n- ${doctorName}`;
      
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

    const systemPrompt = `Eres un asistente virtual de AgendaMedPro para el consultorio del Dr. ${doctorName}.

CONTEXTO DEL PACIENTE:
${patientContext}

CAPACIDADES QUE TIENES:
1. 📅 Ver horarios disponibles - Envía este link: ${bookingUrl}
2. ✅ Confirmar citas existentes
3. ❌ Cancelar citas
4. 📋 Consultar próximas citas
5. 💰 Consultar adeudos/pagos

INSTRUCCIONES:
- Responde de forma amable, profesional y CONCISA (máximo 3 oraciones)
- Si preguntan "¿Qué horarios hay?" o "Quiero agendar", envía el link: ${bookingUrl}
- Si preguntan por citas, muestra las que tiene el paciente del contexto arriba
- Si confirman (sí/ok/confirmo), agradece: "¡Perfecto! Tu cita está confirmada ✅"
- Si cancelan (no/cancelar), confirma: "Tu cita ha sido cancelada. Para reagendar: ${bookingUrl}"
- Usa emojis con moderación (máximo 2 por mensaje)
- NO inventes información que no tengas en el contexto
- SIEMPRE proporciona el link si quieren agendar
- Firma los mensajes como "- Dr. ${doctorName}"`;

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

    console.log(`[WEBHOOK] 💬 Respuesta IA: "${aiResponse}"`);

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
