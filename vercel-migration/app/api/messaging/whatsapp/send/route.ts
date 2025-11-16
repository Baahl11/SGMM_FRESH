import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

/**
 * POST /api/messaging/whatsapp/send
 * Send a WhatsApp message using Meta Business API
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { to_phone, message_body, patient_id, appointment_id, template_name } = body;

    // Validate required fields
    if (!to_phone || !message_body) {
      return NextResponse.json(
        { error: 'Número de teléfono y mensaje son requeridos' },
        { status: 400 }
      );
    }

    // Check patient consent if patient_id is provided
    if (patient_id) {
      const { data: consent } = await supabase
        .from('patient_whatsapp_consent')
        .select('has_consented, opted_out')
        .eq('user_id', user.id)
        .eq('patient_id', patient_id)
        .single();

      if (consent && (!consent.has_consented || consent.opted_out)) {
        return NextResponse.json(
          { error: 'El paciente no ha dado consentimiento para recibir mensajes de WhatsApp' },
          { status: 403 }
        );
      }
    }

    // Get user's WhatsApp configuration
    const { data: config, error: configError } = await supabase
      .from('messaging_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { error: 'No se encontró configuración de WhatsApp' },
        { status: 404 }
      );
    }

    // Check if WhatsApp is enabled and configured
    if (!config.whatsapp_enabled || !config.whatsapp_access_token) {
      return NextResponse.json(
        { error: 'WhatsApp no está habilitado o configurado' },
        { status: 400 }
      );
    }

    // Check daily limit
    if (config.current_daily_usage >= config.daily_message_limit) {
      return NextResponse.json(
        { error: `Has alcanzado el límite diario de ${config.daily_message_limit} mensajes` },
        { status: 429 }
      );
    }

    // Format phone number (ensure it has country code)
    let formattedPhone = to_phone.replace(/\D/g, ''); // Remove non-digits
    if (!formattedPhone.startsWith('52') && formattedPhone.length === 10) {
      formattedPhone = '52' + formattedPhone; // Add Mexico country code
    }

    // Create message record in database (pending status)
    const { data: messageRecord, error: insertError } = await supabase
      .from('whatsapp_messages')
      .insert([
        {
          user_id: user.id,
          patient_id,
          appointment_id,
          to_phone: '+' + formattedPhone,
          message_type: template_name ? 'template' : 'text',
          template_name,
          message_body,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (insertError || !messageRecord) {
      console.error('Error creating message record:', insertError);
      return NextResponse.json(
        { error: 'Error al crear registro de mensaje' },
        { status: 500 }
      );
    }

    // Send message via WhatsApp Business API
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${config.whatsapp_phone_number_id}/messages`;

    const messagePayload: any = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
    };

    // Use template or text message
    if (template_name) {
      messagePayload.type = 'template';
      messagePayload.template = {
        name: template_name,
        language: {
          code: 'es_MX',
        },
      };
    } else {
      messagePayload.type = 'text';
      messagePayload.text = {
        body: message_body,
      };
    }

    const whatsappResponse = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.whatsapp_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    const whatsappData = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappData);

      // Update message status to failed
      await supabase
        .from('whatsapp_messages')
        .update({
          status: 'failed',
          error_code: whatsappData.error?.code || 'unknown',
          error_message: whatsappData.error?.message || 'Error desconocido',
          failed_at: new Date().toISOString(),
        })
        .eq('id', messageRecord.id);

      return NextResponse.json(
        {
          error: 'Error al enviar mensaje',
          details: whatsappData.error?.message || 'Error de WhatsApp API',
          success: false,
        },
        { status: 400 }
      );
    }

    // Message sent successfully
    const metaMessageId = whatsappData.messages?.[0]?.id;

    // Update message status to sent
    await supabase
      .from('whatsapp_messages')
      .update({
        status: 'sent',
        meta_message_id: metaMessageId,
        sent_at: new Date().toISOString(),
      })
      .eq('id', messageRecord.id);

    // Increment daily usage counter
    await supabase.rpc('increment_message_usage', { p_user_id: user.id });

    return NextResponse.json({
      success: true,
      message_id: messageRecord.id,
      meta_message_id: metaMessageId,
      message: 'Mensaje enviado exitosamente',
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/messaging/whatsapp/send:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
