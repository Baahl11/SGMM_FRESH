import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔄 [EMAIL-CONFIG] Obteniendo configuración del sistema...');
    
    // Intentar obtener la configuración del sistema desde billing settings
    try {
      const systemResponse = await fetch('http://localhost:8000/api/billing/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (systemResponse.ok) {
        const systemSettings = await systemResponse.json();
        console.log('✅ [EMAIL-CONFIG] Configuración obtenida del sistema backend');
        
        // Mapear la configuración del backend al formato esperado por el frontend
        return NextResponse.json({
          smtp: {
            host: systemSettings.smtp_server || 'smtp.gmail.com',
            port: systemSettings.smtp_port || 587,
            username: systemSettings.smtp_username || '',
            password: systemSettings.smtp_password ? '***' + systemSettings.smtp_password.slice(-4) : '',
            fromEmail: systemSettings.email_from || systemSettings.smtp_username || '',
            fromName: systemSettings.email_from_name || 'Sistema SGMM',
            enabled: systemSettings.email_enabled || false,
            subjectTemplate: systemSettings.email_subject_template || 'Mensaje desde Sistema SGMM',
            bodyTemplate: systemSettings.email_body_template || 'Estimado/a {nombre},\n\nSaludos cordiales,\nEquipo SGMM'
          },
          sendgrid: {
            apiKey: '',
            fromEmail: 'noreply@sgmm.com',
            fromName: 'Sistema SGMM',
            enabled: false
          },
          system_configured: true,
          configured: !!(systemSettings.email_enabled && 
                         systemSettings.smtp_server && 
                         systemSettings.smtp_username && 
                         systemSettings.email_from)
        });
      }
    } catch (systemError) {
      console.warn('⚠️ [EMAIL-CONFIG] Backend no disponible o sin configuración:', systemError);
    }
    
    // Fallback a configuración por defecto si no hay backend o configuración
    console.log('📋 [EMAIL-CONFIG] Usando configuración por defecto');
    return NextResponse.json({
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        username: '',
        password: '',
        fromEmail: '',
        fromName: 'Sistema SGMM',
        enabled: false,
        subjectTemplate: 'Mensaje desde Sistema SGMM',
        bodyTemplate: 'Estimado/a {nombre},\n\nSaludos cordiales,\nEquipo SGMM'
      },
      sendgrid: {
        apiKey: '',
        fromEmail: 'noreply@sgmm.com',
        fromName: 'Sistema SGMM',
        enabled: false
      },
      system_configured: false,
      configured: false
    });
  } catch (error) {
    console.error('❌ [EMAIL-CONFIG] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 [EMAIL-CONFIG] Guardando configuración...');

    // En una implementación completa, aquí se actualizarían los billing settings en el backend
    // Por ahora solo confirmamos la recepción
    console.log('✅ [EMAIL-CONFIG] Configuración recibida (pendiente integración completa con backend)');

    return NextResponse.json({ 
      success: true, 
      message: 'Configuración de email recibida (función en desarrollo)',
      configured: true,
      provider: 'SMTP'
    });
  } catch (error) {
    console.error('❌ [EMAIL-CONFIG] Error:', error);
    return NextResponse.json(
      { error: 'Error al procesar configuración' }, 
      { status: 500 }
    );
  }
}
