import { NextRequest, NextResponse } from 'next/server';

// Por ahora usaremos un archivo JSON para almacenar la configuración
// En el futuro esto se guardará en la base de datos
const CONFIG_FILE_PATH = 'notifications_config.json';

const defaultConfig = {
  email_enabled: false,
  whatsapp_enabled: false,  email_advance_hours: 24,
  whatsapp_advance_hours: 2,
  email_template: 'Estimado/a {nombre_paciente}, le recordamos que tiene una cita médica programada para el {fecha_cita} a las {hora_cita}. Consultorio UME López & López.',
  whatsapp_template: 'Hola {nombre_paciente}! 👋 Recordatorio: Tienes cita médica el {fecha_cita} a las {hora_cita}. Te esperamos en UME López & López 🏥',
  sendgrid_api_key: '',
  twilio_account_sid: '',
  twilio_auth_token: '',
  twilio_phone_number: '',
};

export async function GET() {
  try {
    // Por ahora devolvemos la configuración por defecto
    // En el futuro esto se leerá de la base de datos
    return NextResponse.json(defaultConfig);
  } catch (error) {
    console.error('Error loading notification config:', error);
    return NextResponse.json(defaultConfig);
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    // Validar que la configuración tenga la estructura correcta
    const requiredFields = [
      'email_enabled',
      'whatsapp_enabled',
      'email_advance_hours',
      'whatsapp_advance_hours',
      'email_template',
      'whatsapp_template'
    ];

    for (const field of requiredFields) {
      if (!(field in config)) {
        return NextResponse.json(
          { error: `Campo requerido faltante: ${field}` },
          { status: 400 }
        );
      }
    }

    // Por ahora solo registramos la configuración en consola
    // En el futuro esto se guardará en la base de datos
    console.log('Saving notification config:', {
      email_enabled: config.email_enabled,
      whatsapp_enabled: config.whatsapp_enabled,
      email_advance_hours: config.email_advance_hours,
      whatsapp_advance_hours: config.whatsapp_advance_hours,
      // No loggear las API keys por seguridad
      has_sendgrid_key: !!config.sendgrid_api_key,
      has_twilio_sid: !!config.twilio_account_sid,
      has_twilio_token: !!config.twilio_auth_token,
    });

    return NextResponse.json({ success: true, message: 'Configuración guardada exitosamente' });
  } catch (error) {
    console.error('Error saving notification config:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
