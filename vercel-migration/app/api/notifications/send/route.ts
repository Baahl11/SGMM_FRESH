import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import emailService from '@/lib/email-service';
import { sendWithUserEmailConfig } from '@/lib/email/user-config';
import {
  getDemoIntegrationPolicy,
  resolveDemoModeConfig,
} from '@/lib/demo-mode';

/**
 * POST /api/notifications/send
 * Send notification (email + WhatsApp) for booking events
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const demoConfig = await resolveDemoModeConfig(supabase, user.id);
    const emailPolicy = getDemoIntegrationPolicy(demoConfig, 'email');
    const whatsappPolicy = getDemoIntegrationPolicy(demoConfig, 'whatsapp');

    const body = await request.json();
    const { booking_id, event_type, send_email, send_whatsapp } = body;
    
    // event_type: 'booking_received', 'booking_confirmed', 'booking_cancelled', 'reminder_24h', 'reminder_1h'

    if (!booking_id || !event_type) {
      return NextResponse.json({ error: 'booking_id and event_type are required' }, { status: 400 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('public_bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('clinic_user_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get user's profile for clinic info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('clinic_name, clinic_phone, clinic_address')
      .eq('id', user.id)
      .single();

    const results: any[] = [];

    // === SEND EMAIL ===
    if (send_email) {
      try {
        // Get email config
        const { data: emailConfig } = await supabase
          .from('email_config')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // Get email template
        const { data: template } = await supabase
          .from('email_templates')
          .select('*')
          .eq('user_id', user.id)
          .eq('template_type', event_type)
          .eq('is_active', true)
          .maybeSingle();

        const variables = {
          patient_name: booking.patient_name,
          booking_date: new Date(booking.booking_date).toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          booking_time: booking.booking_time.slice(0, 5),
          service_name: booking.service_name,
          service_duration: booking.service_duration.toString(),
          service_price: booking.service_price.toLocaleString('es-MX'),
          clinic_name: profile?.clinic_name || 'Clínica',
          clinic_phone: profile?.clinic_phone || '',
          clinic_address: profile?.clinic_address || '',
        };

        const subject = template
          ? emailService.replaceVariables(template.subject, variables)
          : `[DEMO] ${profile?.clinic_name || 'Clínica'} - Notificación ${event_type}`;

        const html = template
          ? emailService.replaceVariables(template.body_html, variables)
          : `<p>Hola ${booking.patient_name}, este es un envío simulado en demo mode para el evento ${event_type}.</p>`;

        const text = template?.body_text
          ? emailService.replaceVariables(template.body_text, variables)
          : `Hola ${booking.patient_name}, este es un envío simulado en demo mode para el evento ${event_type}.`;

        let emailResult: {
          provider: string
          messageId: string
        };

        if (emailPolicy.shouldSimulate) {
          const simulated = await emailService.sendDemo(
            booking.patient_email || 'demo@agendamedpro.com',
            subject,
            text
          );
          emailResult = {
            provider: simulated.provider,
            messageId: simulated.messageId,
          };
        } else if (emailConfig && emailConfig.email_enabled && template) {
          const sent = await sendWithUserEmailConfig(emailConfig, {
            to: booking.patient_email,
            subject,
            html,
            text,
          });

          emailResult = {
            provider: sent.provider,
            messageId: sent.messageId,
          };
        } else {
          results.push({ type: 'email', success: false, error: 'Email not configured' });
          await supabase.from('notification_logs').insert([{
            user_id: user.id,
            booking_id,
            notification_type: 'email',
            event_type,
            recipient_email: booking.patient_email,
            status: 'failed',
            error_message: 'Email not configured',
            failed_at: new Date().toISOString(),
          }]);
          emailResult = null as any;
        }

        if (emailResult) {
          // Log notification
          await supabase.from('notification_logs').insert([{
            user_id: user.id,
            booking_id,
            notification_type: 'email',
            event_type,
            recipient_email: booking.patient_email,
            subject,
            message_body: html,
            status: 'sent',
            provider: emailResult.provider,
            provider_message_id: emailResult.messageId,
            sent_at: new Date().toISOString(),
          }]);

          // Increment usage counter
          await supabase.rpc('increment_email_usage', { p_user_id: user.id });

          results.push({
            type: 'email',
            success: true,
            provider: emailResult.provider,
            demo_mode: emailPolicy.shouldSimulate,
          });
        }
      } catch (error: any) {
        console.error('Error sending email:', error);
        results.push({ type: 'email', success: false, error: error.message });

        // Log failed notification
        await supabase.from('notification_logs').insert([{
          user_id: user.id,
          booking_id,
          notification_type: 'email',
          event_type,
          recipient_email: booking.patient_email,
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
        }]);
      }
    }

    // === SEND WHATSAPP ===
    if (send_whatsapp) {
      try {
        // Build WhatsApp message
        let message = '';

        switch (event_type) {
          case 'booking_received':
            message = `¡Hola ${booking.patient_name}! 👋\n\nHemos recibido tu reserva para:\n📅 ${new Date(booking.booking_date).toLocaleDateString('es-MX')}\n⏰ ${booking.booking_time.slice(0, 5)}\n💼 ${booking.service_name}\n\nTe confirmaremos pronto. Gracias! ✅\n\n${profile?.clinic_name || 'Clínica'}`;
            break;
          case 'booking_confirmed':
            message = `¡Hola ${booking.patient_name}! ✅\n\nTu cita ha sido CONFIRMADA:\n📅 ${new Date(booking.booking_date).toLocaleDateString('es-MX')}\n⏰ ${booking.booking_time.slice(0, 5)}\n💼 ${booking.service_name}\n\n¡Te esperamos! Por favor llega 10 min antes.\n\n${profile?.clinic_name || 'Clínica'}`;
            break;
          case 'booking_cancelled':
            message = `Hola ${booking.patient_name},\n\nLamentamos informarte que tu cita del ${new Date(booking.booking_date).toLocaleDateString('es-MX')} a las ${booking.booking_time.slice(0, 5)} ha sido cancelada.\n\nPuedes agendar una nueva cita cuando gustes.\n\n${profile?.clinic_name || 'Clínica'}`;
            break;
          case 'reminder_24h':
            message = `🔔 Recordatorio\n\n¡Hola ${booking.patient_name}!\n\nTe recordamos tu cita MAÑANA:\n📅 ${new Date(booking.booking_date).toLocaleDateString('es-MX')}\n⏰ ${booking.booking_time.slice(0, 5)}\n💼 ${booking.service_name}\n\n¡Nos vemos pronto!\n\n${profile?.clinic_name || 'Clínica'}`;
            break;
          case 'reminder_1h':
            message = `⏰ ¡TU CITA ES EN 1 HORA!\n\n${booking.patient_name}, tu cita es a las ${booking.booking_time.slice(0, 5)}\n\n📍 ${profile?.clinic_address || ''}\n\n¡Te esperamos!\n\n${profile?.clinic_name || 'Clínica'}`;
            break;
        }

        if (!whatsappPolicy.shouldSimulate) {
          // Get WhatsApp config only for real sending mode
          const { data: whatsappConfig } = await supabase
            .from('messaging_config')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!whatsappConfig || !whatsappConfig.whatsapp_enabled) {
            throw new Error('WhatsApp not configured');
          }
        }

        // Send via WhatsApp API (real or simulated in endpoint)
        const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/messaging/whatsapp/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            to_phone: booking.patient_phone,
            message_body: message,
            patient_id: booking.patient_id,
            booking_id,
          }),
        });

        const whatsappData = await whatsappResponse.json();

        if (whatsappData.success) {
          const isDemoSend = Boolean(whatsappData.demo_mode);
          // Log notification
          await supabase.from('notification_logs').insert([{
            user_id: user.id,
            booking_id,
            notification_type: 'whatsapp',
            event_type,
            recipient_phone: booking.patient_phone,
            message_body: message,
            status: 'sent',
            provider: isDemoSend ? 'whatsapp_demo' : 'whatsapp_business',
            provider_message_id: whatsappData.meta_message_id,
            sent_at: new Date().toISOString(),
          }]);

          results.push({ type: 'whatsapp', success: true, demo_mode: isDemoSend });
        } else {
          throw new Error(whatsappData.error || 'WhatsApp sending failed');
        }
      } catch (error: any) {
        console.error('Error sending WhatsApp:', error);
        results.push({ type: 'whatsapp', success: false, error: error.message });

        // Log failed notification
        await supabase.from('notification_logs').insert([{
          user_id: user.id,
          booking_id,
          notification_type: 'whatsapp',
          event_type,
          recipient_phone: booking.patient_phone,
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
        }]);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Notifications processed',
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
