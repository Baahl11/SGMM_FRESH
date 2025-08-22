import { NextRequest, NextResponse } from 'next/server';

// Force static generation for production build
export const dynamic = "force-static";

// Interface para configuraciÃ³n de recordatorios automÃ¡ticos
interface AutoReminderConfig {
  enabled: boolean;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  timing_24h: boolean;
  timing_2h: boolean;
  timing_48h: boolean;
  custom_message: string;
  auto_send: boolean;
  schedule: {
    enabled: boolean;
    times: string[]; // ['09:00', '17:00'] - horas del dÃ­a para enviar recordatorios
    days_ahead: number; // DÃ­as de anticipaciÃ³n para programar recordatorios
  };
  notification_preferences: {
    doctor_email: string;
    send_summary: boolean;
    summary_frequency: 'daily' | 'weekly' | 'manual';
  };
}

// ConfiguraciÃ³n por defecto
const defaultConfig: AutoReminderConfig = {
  enabled: true,
  email_enabled: true,
  whatsapp_enabled: true,
  timing_24h: true,
  timing_2h: true,
  timing_48h: false,
  custom_message: 'Hola {paciente}, te recordamos tu cita para {tratamiento} el {fecha} a las {hora}. Â¡Te esperamos!',
  auto_send: false, // Por seguridad, inicia en modo manual
  schedule: {
    enabled: true,
    times: ['09:00', '17:00'], // MaÃ±ana y tarde
    days_ahead: 2
  },
  notification_preferences: {
    doctor_email: '',
    send_summary: true,
    summary_frequency: 'daily'
  }
};

// GET: Obtener configuraciÃ³n actual de recordatorios
export async function GET() {
  console.log('ðŸ“‹ Getting reminder configuration...');
  
  try {
    // En una implementaciÃ³n real, esto vendrÃ­a de la base de datos del usuario
    // Por ahora devolvemos la configuraciÃ³n por defecto
    const config = { ...defaultConfig };

    return NextResponse.json({
      success: true,
      config,
      message_templates: {
        professional: 'Estimado/a {paciente}, le recordamos su cita de {tratamiento} programada para el {fecha} a las {hora}.',
        friendly: 'Hola {paciente}! ðŸ‘‹ No olvides tu cita de {tratamiento} el {fecha} a las {hora}. Â¡Nos vemos!',
        default: 'Hola {paciente}, te recordamos tu cita para {tratamiento} el {fecha} a las {hora}. Â¡Te esperamos!'
      },
      available_variables: [
        '{paciente}', '{fecha}', '{hora}', '{tratamiento}', '{doctor}', '{clinica}'
      ]
    });
  } catch (error) {
    console.error('âŒ Error getting reminder config:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT: Actualizar configuraciÃ³n de recordatorios
export async function PUT(request: NextRequest) {
  console.log('ðŸ”„ Updating reminder configuration...');
  
  try {
    const body = await request.json();
    console.log('ðŸ“¥ New config data:', body);

    // Validar la configuraciÃ³n recibida
    const updatedConfig: AutoReminderConfig = {
      ...defaultConfig,
      ...body,
      // Asegurar que ciertos campos sean vÃ¡lidos
      schedule: {
        ...defaultConfig.schedule,
        ...(body.schedule || {}),
        times: body.schedule?.times?.filter((time: string) => /^\d{2}:\d{2}$/.test(time)) || defaultConfig.schedule.times
      },
      notification_preferences: {
        ...defaultConfig.notification_preferences,
        ...(body.notification_preferences || {}),
        summary_frequency: ['daily', 'weekly', 'manual'].includes(body.notification_preferences?.summary_frequency) 
          ? body.notification_preferences.summary_frequency 
          : defaultConfig.notification_preferences.summary_frequency
      }
    };

    console.log('âœ… Configuration updated successfully');
    console.log('ðŸ“Š Auto-send enabled:', updatedConfig.auto_send);
    console.log('ðŸ“§ Email enabled:', updatedConfig.email_enabled);
    console.log('ðŸ“± WhatsApp enabled:', updatedConfig.whatsapp_enabled);

    // En una implementaciÃ³n real, aquÃ­ guardarÃ­amos en la base de datos
    // await saveUserReminderConfig(userId, updatedConfig);

    // Si el auto-send estÃ¡ habilitado, programar la prÃ³xima ejecuciÃ³n
    if (updatedConfig.enabled && updatedConfig.auto_send) {
      console.log('â° Auto-send enabled, scheduling next reminder check...');
      // AquÃ­ se programarÃ­a un cron job o similar para ejecutar automÃ¡ticamente
    }

    return NextResponse.json({
      success: true,
      message: 'ConfiguraciÃ³n de recordatorios actualizada exitosamente',
      config: updatedConfig,
      next_scheduled_run: updatedConfig.enabled && updatedConfig.auto_send 
        ? getNextScheduledRun(updatedConfig.schedule.times)
        : null
    });

  } catch (error) {
    console.error('âŒ Error updating reminder config:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: Probar configuraciÃ³n de recordatorios (dry run)
export async function POST(request: NextRequest) {
  console.log('ðŸ§ª Testing reminder configuration...');
  
  try {
    const body = await request.json();
    const config = body.config || defaultConfig;

    console.log('ðŸ“‹ Testing with config:', config);

    // Simular el proceso de envÃ­o de recordatorios
    const testResult = await simulateReminderSending(config);

    return NextResponse.json({
      success: true,
      message: 'Prueba de configuraciÃ³n completada',
      test_result: testResult,
      recommendations: generateConfigRecommendations(testResult)
    });

  } catch (error) {
    console.error('âŒ Error testing reminder config:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// FunciÃ³n auxiliar para calcular la prÃ³xima ejecuciÃ³n programada
function getNextScheduledRun(times: string[]): string {
  if (!times.length) return '';
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Buscar la prÃ³xima hora programada hoy
  for (const time of times.sort()) {
    const scheduledTime = new Date(`${today}T${time}:00`);
    if (scheduledTime > now) {
      return scheduledTime.toISOString();
    }
  }
  
  // Si no hay mÃ¡s horas hoy, usar la primera hora del dÃ­a siguiente
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];
  return new Date(`${tomorrowDate}T${times[0]}:00`).toISOString();
}

// Simular envÃ­o de recordatorios para testing
async function simulateReminderSending(config: AutoReminderConfig) {
  // En una implementaciÃ³n real, esto harÃ­a una llamada a la API de recordatorios
  return {
    eligible_appointments: 5,
    email_candidates: config.email_enabled ? 4 : 0,
    whatsapp_candidates: config.whatsapp_enabled ? 5 : 0,
    timing_24h_matches: config.timing_24h ? 2 : 0,
    timing_2h_matches: config.timing_2h ? 1 : 0,
    timing_48h_matches: config.timing_48h ? 2 : 0,
    estimated_sends: Math.min(
      (config.email_enabled ? 4 : 0) + (config.whatsapp_enabled ? 5 : 0),
      (config.timing_24h ? 2 : 0) + (config.timing_2h ? 1 : 0) + (config.timing_48h ? 2 : 0)
    )
  };
}

// Generar recomendaciones basadas en el test
function generateConfigRecommendations(testResult: any): string[] {
  const recommendations: string[] = [];
  
  if (testResult.email_candidates === 0) {
    recommendations.push('Considera habilitar recordatorios por email para mayor alcance');
  }
  
  if (testResult.whatsapp_candidates === 0) {
    recommendations.push('Habilita WhatsApp para recordatorios mÃ¡s inmediatos');
  }
  
  if (testResult.estimated_sends === 0) {
    recommendations.push('Verifica que al menos un mÃ©todo de contacto y timing estÃ© habilitado');
  }
  
  if (testResult.timing_24h_matches === 0 && testResult.timing_2h_matches === 0) {
    recommendations.push('Considera habilitar recordatorios de 24h o 2h para mejor efectividad');
  }
  
  return recommendations;
}
