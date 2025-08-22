import { NextRequest, NextResponse } from 'next/server';

// Force static generation for production build
export const dynamic = "force-static";

// Sistema de envÃ­o automÃ¡tico de recordatorios
interface ReminderConfig {
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  timing_24h: boolean;
  timing_2h: boolean;
  timing_48h: boolean;
  custom_message: string;
}

interface ReminderResult {
  appointment_id: number;
  patient_name: string;
  email_sent: boolean;
  whatsapp_sent: boolean;
  timing: string;
  errors?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config = {}, dry_run = true } = body;
    
    const reminderConfig: ReminderConfig = {
      email_enabled: config.email_enabled ?? true,
      whatsapp_enabled: config.whatsapp_enabled ?? true, 
      timing_24h: config.timing_24h ?? true,
      timing_2h: config.timing_2h ?? true,
      timing_48h: config.timing_48h ?? false,
      custom_message: config.custom_message || '',
      ...config
    };

    console.log('ðŸ”” Starting automatic reminder sending process...');
    console.log('ðŸ“‹ Reminder config:', reminderConfig);
    console.log('ðŸ§ª Dry run mode:', dry_run);

    // Obtener citas prÃ³ximas que necesiten recordatorios
    const upcomingResponse = await fetch(`${request.url.split('/api/')[0]}/api/messaging/appointments/upcoming?days=7`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!upcomingResponse.ok) {
      throw new Error('Failed to fetch upcoming appointments');
    }

    const upcomingData = await upcomingResponse.json();
    const appointments = upcomingData.data || [];

    console.log(`ðŸ“… Found ${appointments.length} upcoming appointments`);

    // Filtrar citas que necesitan recordatorios segÃºn la configuraciÃ³n
    const appointmentsNeedingReminders = appointments.filter((apt: any) => {
      const now = new Date();
      const appointmentDate = new Date(apt.fecha);
      const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Verificar si estÃ¡ en el rango de timing habilitado
      if (hoursUntil <= 2 && reminderConfig.timing_2h) return true;
      if (hoursUntil <= 24 && hoursUntil > 2 && reminderConfig.timing_24h) return true;
      if (hoursUntil <= 48 && hoursUntil > 24 && reminderConfig.timing_48h) return true;

      return false;
    }).filter((apt: any) => !apt.reminder_sent); // Solo citas sin recordatorio enviado

    console.log(`ðŸ“§ ${appointmentsNeedingReminders.length} appointments need reminders`);

    const results: ReminderResult[] = [];

    for (const appointment of appointmentsNeedingReminders) {
      const result: ReminderResult = {
        appointment_id: appointment.id,
        patient_name: appointment.patient_name,
        email_sent: false,
        whatsapp_sent: false,
        timing: appointment.reminder_type,
        errors: []
      };

      // Enviar recordatorio por email si estÃ¡ habilitado y el paciente tiene email
      if (reminderConfig.email_enabled && appointment.patient_email) {
        try {
          if (!dry_run) {
            // AquÃ­ irÃ­a la llamada real a la API de email
            console.log(`ðŸ“¨ Sending email reminder to ${appointment.patient_email}`);
            // await sendEmailReminder(appointment, reminderConfig);
          } else {
            console.log(`ðŸ“¨ [DRY RUN] Would send email to ${appointment.patient_email}`);
          }
          result.email_sent = !dry_run;
        } catch (emailError) {
          console.error('âŒ Email reminder failed:', emailError);
          result.errors?.push(`Email failed: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
        }
      }

      // Enviar recordatorio por WhatsApp si estÃ¡ habilitado y el paciente tiene telÃ©fono
      if (reminderConfig.whatsapp_enabled && appointment.patient_whatsapp) {
        try {
          if (!dry_run) {
            // AquÃ­ irÃ­a la llamada real a la API de WhatsApp
            console.log(`ðŸ“± Sending WhatsApp reminder to ${appointment.patient_whatsapp}`);
            // await sendWhatsAppReminder(appointment, reminderConfig);
          } else {
            console.log(`ðŸ“± [DRY RUN] Would send WhatsApp to ${appointment.patient_whatsapp}`);
          }
          result.whatsapp_sent = !dry_run;
        } catch (whatsappError) {
          console.error('âŒ WhatsApp reminder failed:', whatsappError);
          result.errors?.push(`WhatsApp failed: ${whatsappError instanceof Error ? whatsappError.message : 'Unknown error'}`);
        }
      }

      results.push(result);
    }

    const summary = {
      total_appointments: appointments.length,
      reminders_needed: appointmentsNeedingReminders.length,
      emails_sent: results.filter(r => r.email_sent).length,
      whatsapp_sent: results.filter(r => r.whatsapp_sent).length,
      errors: results.filter(r => r.errors && r.errors.length > 0).length,
      dry_run: dry_run
    };

    console.log('âœ… Reminder sending process completed');
    console.log('ðŸ“Š Summary:', summary);

    return NextResponse.json({
      success: true,
      summary,
      results,
      config: reminderConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ðŸ’¥ Error in reminder sending process:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Template de mensaje por defecto
function generateReminderMessage(appointment: any, config: ReminderConfig): string {
  if (config.custom_message) {
    return config.custom_message
      .replace('{paciente}', appointment.patient_name)
      .replace('{fecha}', new Date(appointment.fecha).toLocaleDateString('es-ES'))
      .replace('{hora}', appointment.appointment_time)
      .replace('{tratamiento}', appointment.treatment_name);
  }

  const fecha = new Date(appointment.fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `Hola ${appointment.patient_name}, te recordamos tu cita para ${appointment.treatment_name} el ${fecha} a las ${appointment.appointment_time}. Â¡Te esperamos!`;
}

// FunciÃ³n para obtener la configuraciÃ³n de recordatorios del usuario
export async function GET() {
  // ConfiguraciÃ³n por defecto que se puede personalizar desde el frontend
  const defaultConfig: ReminderConfig = {
    email_enabled: true,
    whatsapp_enabled: true,
    timing_24h: true,
    timing_2h: true,
    timing_48h: false,
    custom_message: ''
  };

  return NextResponse.json({
    success: true,
    config: defaultConfig,
    templates: {
      default: 'Hola {paciente}, te recordamos tu cita para {tratamiento} el {fecha} a las {hora}. Â¡Te esperamos!',
      formal: 'Estimado/a {paciente}, le recordamos que tiene una cita programada para {tratamiento} el {fecha} a las {hora}. Por favor, confirme su asistencia.',
      casual: 'Hola {paciente}! ðŸ‘‹ No olvides tu cita de {tratamiento} maÃ±ana {fecha} a las {hora}. Â¡Nos vemos! ðŸ˜Š'
    }
  });
}
