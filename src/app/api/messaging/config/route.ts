import { NextRequest, NextResponse } from 'next/server';

// Configuration for Next.js static export
export const dynamic = 'force-dynamic';
export const revalidate = false;

// TODO: En el futuro, conectar con el backend Rust
// Por ahora, simular almacenamiento en memoria
let currentConfig: any = null;

export async function GET(request: NextRequest) {
  try {
    // Si hay configuración guardada, devolverla
    if (currentConfig) {
      return NextResponse.json({
        ...currentConfig,
        system_email_configured: !!currentConfig.email,
        messaging_system_active: !!currentConfig.email
      });
    }
    
    // Configuración por defecto si no hay nada guardado
    const config = {
      // Email settings
      email: '',
      messaging_email: '',
      doctor_name: '',
      gmail_app_password: '',
      
      // Notification settings  
      email_enabled: false,
      whatsapp_enabled: false,
      email_advance_hours: 24,
      whatsapp_advance_hours: 2,
      
      // Templates
      email_template: 'Estimado/a {nombre_paciente}, le recordamos que tiene una cita médica programada para el {fecha_cita} a las {hora_cita}. Consultorio SGMM.',
      whatsapp_template: 'Hola {nombre_paciente}! 👋 Recordatorio: Tienes cita médica el {fecha_cita} a las {hora_cita}. Te esperamos en SGMM 🏥',
      
      // API Keys
      sendgrid_api_key: '',
      whatsapp_business_id: '',
      whatsapp_access_token: '',
      whatsapp_phone_number_id: '',
      whatsapp_webhook_verify_token: '',
      
      // Status
      system_email_configured: false,
      messaging_system_active: false,
      auto_configured: false
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error getting messaging config:', error);
    return NextResponse.json(
      { error: 'Failed to get messaging configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('💾 Saving messaging config:', body);
    
    // Guardar configuración en memoria
    currentConfig = {
      ...body,
      system_email_configured: !!body.email || !!body.messaging_email,
      messaging_system_active: !!(body.email || body.messaging_email),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(currentConfig);
  } catch (error) {
    console.error('Error saving messaging config:', error);
    return NextResponse.json(
      { error: 'Failed to save messaging configuration' },
      { status: 500 }
    );
  }
}

// Endpoint especial para configuración automática durante OAuth
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, auto_configured } = body;
    
    console.log('🔧 Auto-configuring messaging for OAuth user:', { email, name, auto_configured });
    
    // Configuración automática durante OAuth login
    currentConfig = {
      // Mantener otras configuraciones si existen
      ...(currentConfig || {}),
      // Sobrescribir con los nuevos valores
      email: email,
      messaging_email: email,
      doctor_name: name || currentConfig?.doctor_name || 'Usuario SGMM',
      system_email_configured: true,
      messaging_system_active: true,
      auto_configured: true,
      auto_configured_at: new Date().toISOString(),
      configured_via_oauth: true
    };
    
    console.log('✅ Auto-configuration completed:', currentConfig);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configuración automática completada',
      config: currentConfig 
    });
  } catch (error) {
    console.error('Error in auto-configuration:', error);
    return NextResponse.json(
      { error: 'Failed to auto-configure messaging' },
      { status: 500 }
    );
  }
}
