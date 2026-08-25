import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';
import { NextResponse } from 'next/server';
import {
  getDemoIntegrationPolicy,
  logDemoAuditEvent,
  resolveDemoModeConfig,
} from '@/lib/demo-mode';
import { MetaWhatsAppAdapter } from '@/lib/messaging/adapters/meta-whatsapp';
import { getWhatsAppCredentials } from '@/lib/messaging/provider-service';

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

    const demoConfig = await resolveDemoModeConfig(supabase, user.id);
    const whatsappPolicy = getDemoIntegrationPolicy(demoConfig, 'whatsapp');

    // Format phone number (ensure it has country code)
    let formattedPhone = to_phone.replace(/\D/g, ''); // Remove non-digits
    if (!formattedPhone.startsWith('52') && formattedPhone.length === 10) {
      formattedPhone = '52' + formattedPhone; // Add Mexico country code
    }

    if (whatsappPolicy.shouldSimulate) {
      const simulatedMetaMessageId = `demo_wa_${Date.now()}`;

      const { data: simulatedRecord, error: simulatedInsertError } = await supabase
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
            status: 'sent',
            meta_message_id: simulatedMetaMessageId,
            sent_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (simulatedInsertError || !simulatedRecord) {
        console.error('Error creating simulated WhatsApp message record:', simulatedInsertError);
        return NextResponse.json(
          { error: 'Error al registrar mensaje simulado', success: false },
          { status: 500 }
        );
      }

      await supabase.rpc('increment_message_usage', { p_user_id: user.id });

      await logDemoAuditEvent(supabase, user.id, {
        eventType: 'whatsapp_message_simulated',
        integration: 'whatsapp',
        resourceType: 'whatsapp_message',
        resourceId: simulatedRecord.id,
        status: 'simulated',
        payload: {
          to_phone: '+' + formattedPhone,
          template_name: template_name || null,
          appointment_id: appointment_id || null,
          patient_id: patient_id || null,
        },
      });

      return NextResponse.json({
        success: true,
        message_id: simulatedRecord.id,
        meta_message_id: simulatedMetaMessageId,
        demo_mode: true,
        message: 'Mensaje simulado exitosamente (demo mode)',
      });
    }

    // Get user's WhatsApp configuration (limites y estado siguen viniendo
    // de messaging_config sin cambios; las credenciales de envio ahora
    // pasan por el facade de Fase 1)
    const { data: config, error: configError } = await supabase
      .from('messaging_config')
      .select('whatsapp_enabled, current_daily_usage, daily_message_limit')
      .eq('user_id', user.id)
      .maybeSingle();

    if (configError || !config) {
      return NextResponse.json(
        { error: 'No se encontró configuración de WhatsApp' },
        { status: 404 }
      );
    }

    if (!config.whatsapp_enabled) {
      return NextResponse.json(
        { error: 'WhatsApp no está habilitado o configurado' },
        { status: 400 }
      );
    }

    if (config.current_daily_usage >= config.daily_message_limit) {
      return NextResponse.json(
        { error: `Has alcanzado el límite diario de ${config.daily_message_limit} mensajes` },
        { status: 429 }
      );
    }

    const credentials = await getWhatsAppCredentials(supabase, user.id);
    if (!credentials) {
      return NextResponse.json(
        { error: 'WhatsApp no está habilitado o configurado' },
        { status: 400 }
      );
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

    // Send message via the messaging adapter (Fase 1: consolidacion de mensajeria)
    let metaMessageId: string | undefined;
    let dryRun = false;

    if (process.env.WHATSAPP_DRY_RUN === 'true') {
      dryRun = true;
      metaMessageId = `dryrun_${Date.now()}`;
      console.log('[WhatsApp Send] 🧪 WHATSAPP_DRY_RUN activo, no se envía a Meta:', {
        userId: user.id,
        to: formattedPhone,
        template: template_name || null,
        messagePreview: String(message_body).slice(0, 120),
        metaMessageId,
      });
    } else {
      const adapter = new MetaWhatsAppAdapter(credentials);
      const sendResult = template_name
        ? await adapter.sendTemplate({ to: formattedPhone, templateName: template_name })
        : await adapter.sendText({ to: formattedPhone, message: message_body });

      if (!sendResult.success) {
        console.error('WhatsApp API error:', sendResult.rawResponse);

        await supabase
          .from('whatsapp_messages')
          .update({
            status: 'failed',
            error_code: (sendResult.rawResponse as any)?.error?.code || 'unknown',
            error_message: sendResult.error || 'Error desconocido',
            failed_at: new Date().toISOString(),
          })
          .eq('id', messageRecord.id);

        return NextResponse.json(
          {
            error: 'Error al enviar mensaje',
            details: sendResult.error || 'Error de WhatsApp API',
            success: false,
          },
          { status: 400 }
        );
      }

      metaMessageId = sendResult.messageId;
    }

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
      dry_run: dryRun,
      demo_mode: false,
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
