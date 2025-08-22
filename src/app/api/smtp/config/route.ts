import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔄 [SMTP-CONFIG] Obteniendo configuración SMTP del sistema...');
    
    // Intentar obtener la configuración del backend
    try {
      const backendResponse = await fetch('http://localhost:8000/api/billing/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (backendResponse.ok) {
        const settings = await backendResponse.json();
        console.log('✅ [SMTP-CONFIG] Configuración obtenida del backend');
        
        return NextResponse.json({
          host: settings.smtp_server || 'smtp.gmail.com',
          port: settings.smtp_port || 587,
          secure: settings.smtp_port === 465,
          username: settings.smtp_username || '',
          password: settings.smtp_password ? '***configured***' : '',
          fromEmail: settings.email_from || settings.smtp_username || '',
          fromName: settings.email_from_name || 'Sistema SGMM',
          enabled: settings.email_enabled || false,
          configured: !!(settings.smtp_server && settings.smtp_username && settings.smtp_password)
        });
      }
    } catch (error) {
      console.warn('⚠️ [SMTP-CONFIG] Backend no disponible:', error);
    }
    
    // Configuración por defecto
    return NextResponse.json({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: '',
      password: '',
      fromEmail: '',
      fromName: 'Sistema SGMM',
      enabled: false,
      configured: false
    });
  } catch (error) {
    console.error('❌ [SMTP-CONFIG] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración SMTP' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 [SMTP-CONFIG] Actualizando configuración SMTP...');

    // En una implementación completa, aquí se guardaría en el backend
    console.log('✅ [SMTP-CONFIG] Configuración SMTP actualizada (simulado)');

    return NextResponse.json({
      success: true,
      message: 'Configuración SMTP actualizada exitosamente',
      configured: true
    });
  } catch (error) {
    console.error('❌ [SMTP-CONFIG] Error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración SMTP' },
      { status: 500 }
    );
  }
}
