/**
 * WhatsApp Reminders Cron Job
 * 
 * Runs every hour to send automatic appointment reminders via WhatsApp.
 * Uses personalization data from messaging_config for customized messages.
 * 
 * Schedule: 0 * * * * (every hour)
 * Auth: Requires CRON_SECRET in headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface MessagingConfig {
  user_id: string;
  whatsapp_business_id: string;
  whatsapp_phone_number_id: string;
  whatsapp_access_token: string;
  whatsapp_phone_number: string;
  whatsapp_enabled: boolean;
  auto_reminders_enabled: boolean;
  reminder_24h_enabled: boolean;
  reminder_1h_enabled: boolean;
  daily_message_limit: number;
  doctor_name: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  custom_message_signature: string | null;
}

interface Appointment {
  id: string;
  patient_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  user_id: string;
  patient_name: string;
  patient_phone: string;
}

/**
 * Format phone number to international format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 52 (Mexico), use as-is
  // Otherwise prepend 52
  if (!cleaned.startsWith('52')) {
    cleaned = '52' + cleaned;
  }
  
  return cleaned;
}

/**
 * Build personalized message with dynamic data
 */
function buildMessage(
  type: '24h' | '1h',
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  config: MessagingConfig
): string {
  const timeText = type === '24h' ? 'mañana' : 'en 1 hora';
  
  // Base message
  let message = `Hola ${patientName}, te recordamos tu cita ${timeText} el ${appointmentDate} a las ${appointmentTime}.`;
  
  // Add clinic name if available
  if (config.clinic_name) {
    message += ` Te esperamos en ${config.clinic_name}`;
    
    // Add address if available
    if (config.clinic_address) {
      message += ` ubicada en ${config.clinic_address}`;
    }
    message += '.';
  }
  
  // Add clinic phone if available
  if (config.clinic_phone) {
    message += ` Para cualquier duda, llámanos al ${config.clinic_phone}.`;
  }
  
  // Add signature
  if (config.custom_message_signature) {
    message += `\n\nSaludos,\n${config.custom_message_signature}`;
  } else if (config.doctor_name) {
    message += `\n\nSaludos,\n${config.doctor_name}`;
  }
  
  return message;
}

/**
 * Send WhatsApp message via Meta Business API
 */
async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  config: MessagingConfig
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${config.whatsapp_phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.whatsapp_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: message,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('WhatsApp API error:', error);
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Log message to database
 */
async function logMessage(
  supabase: any,
  userId: string,
  patientId: string,
  appointmentId: string,
  phoneNumber: string,
  message: string,
  status: 'sent' | 'failed',
  errorMessage?: string,
  messageId?: string
): Promise<void> {
  try {
    await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: userId,
        patient_id: patientId,
        appointment_id: appointmentId,
        phone_number: phoneNumber,
        message_body: message,
        status,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
        error_message: errorMessage || null,
        whatsapp_message_id: messageId || null,
      });
  } catch (error) {
    console.error('Error logging message:', error);
  }
}

/**
 * Main cron job handler
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client to bypass RLS
    const supabase = supabaseAdmin;

    console.log('🔄 Starting WhatsApp reminders cron job...');

    // Get all enabled configurations
    const { data: configs, error: configError } = await supabase
      .from('messaging_config')
      .select('*')
      .eq('whatsapp_enabled', true)
      .eq('auto_reminders_enabled', true);

    if (configError) {
      console.error('Error fetching configs:', configError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!configs || configs.length === 0) {
      console.log('No enabled configurations found');
      return NextResponse.json({ message: 'No configs enabled', sent: 0 });
    }

    console.log(`Found ${configs.length} enabled configuration(s)`);

    let totalSent = 0;
    let totalFailed = 0;

    // Process each user's configuration
    for (const config of configs as MessagingConfig[]) {
      try {
        console.log(`Processing user: ${config.user_id}`);

        // Check daily limit
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
          .from('whatsapp_messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', config.user_id)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);

        if (todayCount && todayCount >= config.daily_message_limit) {
          console.log(`User ${config.user_id} reached daily limit (${config.daily_message_limit})`);
          continue;
        }

        const remainingLimit = config.daily_message_limit - (todayCount || 0);
        console.log(`Daily limit remaining: ${remainingLimit}`);

        // Calculate time windows
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
        const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        // Query appointments for reminders
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            patient_id,
            scheduled_date,
            scheduled_time,
            status,
            notes,
            user_id,
            patients:patient_id (
              full_name,
              phone
            )
          `)
          .eq('user_id', config.user_id)
          .eq('status', 'scheduled')
          .gte('scheduled_date', now.toISOString().split('T')[0])
          .lte('scheduled_date', in24Hours.toISOString().split('T')[0]);

        if (appointmentsError) {
          console.error(`Error fetching appointments for user ${config.user_id}:`, appointmentsError);
          continue;
        }

        if (!appointments || appointments.length === 0) {
          console.log(`No appointments found for user ${config.user_id}`);
          continue;
        }

        console.log(`Found ${appointments.length} appointment(s) for user ${config.user_id}`);

        // Process each appointment
        for (const apt of appointments) {
          const patient = apt.patients as any;
          if (!patient || !patient.phone) {
            console.log(`Skipping appointment ${apt.id}: no patient phone`);
            continue;
          }

          // Check if we already sent reminder for this appointment
          const { data: existingMessages } = await supabase
            .from('whatsapp_messages')
            .select('id')
            .eq('appointment_id', apt.id)
            .eq('status', 'sent')
            .limit(1);

          if (existingMessages && existingMessages.length > 0) {
            console.log(`Already sent reminder for appointment ${apt.id}`);
            continue;
          }

          // Combine date and time for comparison
          const appointmentDateTime = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`);
          const timeDiff = appointmentDateTime.getTime() - now.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          let shouldSend = false;
          let reminderType: '24h' | '1h' = '24h';

          // Check 24h reminder
          if (config.reminder_24h_enabled && hoursDiff > 23 && hoursDiff <= 25) {
            shouldSend = true;
            reminderType = '24h';
          }

          // Check 1h reminder
          if (config.reminder_1h_enabled && hoursDiff > 0.5 && hoursDiff <= 1.5) {
            shouldSend = true;
            reminderType = '1h';
          }

          if (!shouldSend) {
            console.log(`Appointment ${apt.id} not in reminder window`);
            continue;
          }

          // Check daily limit again
          if (totalSent >= remainingLimit) {
            console.log(`Reached daily limit for user ${config.user_id}`);
            break;
          }

          // Build personalized message
          const message = buildMessage(
            reminderType,
            patient.full_name,
            apt.scheduled_date,
            apt.scheduled_time,
            config
          );

          console.log(`Sending ${reminderType} reminder for appointment ${apt.id}`);

          // Send message
          const result = await sendWhatsAppMessage(patient.phone, message, config);

          // Log to database
          await logMessage(
            supabase,
            config.user_id,
            apt.patient_id,
            apt.id,
            patient.phone,
            message,
            result.success ? 'sent' : 'failed',
            result.error,
            result.messageId
          );

          if (result.success) {
            totalSent++;
            console.log(`✅ Message sent successfully (ID: ${result.messageId})`);
          } else {
            totalFailed++;
            console.log(`❌ Message failed: ${result.error}`);
          }

          // Small delay between messages
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error processing user ${config.user_id}:`, error);
        totalFailed++;
      }
    }

    console.log(`✅ Cron job completed. Sent: ${totalSent}, Failed: ${totalFailed}`);

    return NextResponse.json({
      success: true,
      sent: totalSent,
      failed: totalFailed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
