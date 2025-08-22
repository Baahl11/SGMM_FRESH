import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_email } = body;

    console.log('🧪 [EMAIL-TEST] Iniciando prueba de configuración SMTP...');

    if (!test_email) {
      return NextResponse.json(
        { error: 'Email de prueba requerido' }, 
        { status: 400 }
      );
    }

    // Obtener configuración del sistema
    let emailConfig: any = null;
    
    try {
      const systemResponse = await fetch('http://localhost:8000/api/billing/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (systemResponse.ok) {
        const systemSettings = await systemResponse.json();
        emailConfig = {
          smtp_host: systemSettings.smtp_server,
          smtp_port: systemSettings.smtp_port,
          smtp_user: systemSettings.smtp_username,
          smtp_password: systemSettings.smtp_password,
          from_name: systemSettings.email_from_name,
          from_email: systemSettings.email_from,
          enabled: systemSettings.email_enabled
        };
        console.log('✅ [EMAIL-TEST] Configuración del sistema obtenida');
      }
    } catch (error) {
      console.warn('⚠️ [EMAIL-TEST] No se pudo obtener configuración del sistema:', error);
    }

    if (!emailConfig || !emailConfig.enabled || !emailConfig.from_email) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Configuración SMTP no encontrada', 
          suggestion: 'Configure primero el email en Configuración > Facturación > Email'
        }, 
        { status: 400 }
      );
    }

    // Importar nodemailer dinámicamente
    const nodemailer = require('nodemailer');

    // Crear transporter SMTP
    const transporter = nodemailer.createTransporter({
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.smtp_port === 465, // true para 465, false para otros
      auth: {
        user: emailConfig.smtp_user,
        pass: emailConfig.smtp_password,
      },
      tls: {
        rejectUnauthorized: false // Para development
      }
    });

    try {
      // Verificar conexión SMTP
      console.log(`🔄 [EMAIL-TEST] Probando conexión a ${emailConfig.smtp_host}:${emailConfig.smtp_port}...`);
      await transporter.verify();
      console.log('✅ [EMAIL-TEST] Conexión SMTP verificada exitosamente');

      // Enviar email de prueba
      const testSubject = 'Prueba de Configuración SMTP - Sistema SGMM';
      const testMessage = `¡Hola!

Esta es una prueba de configuración de email del Sistema SGMM.

Si recibes este mensaje, significa que tu configuración SMTP está funcionando correctamente.

Detalles de la configuración:
- Servidor SMTP: ${emailConfig.smtp_host}:${emailConfig.smtp_port}
- Remitente: ${emailConfig.from_name} <${emailConfig.from_email}>
- Fecha de prueba: ${new Date().toLocaleString('es-MX')}

¡Tu sistema de mensajería está listo para usar!

Saludos,
Sistema SGMM`;

      console.log(`📧 [EMAIL-TEST] Enviando email de prueba a ${test_email}...`);

      const info = await transporter.sendMail({
        from: `"${emailConfig.from_name}" <${emailConfig.from_email}>`,
        to: test_email,
        subject: testSubject,
        text: testMessage,
        html: testMessage.replace(/\n/g, '<br>'),
      });

      console.log(`✅ [EMAIL-TEST] Email de prueba enviado: ${info.messageId}`);

      return NextResponse.json({
        success: true,
        message: 'Email de prueba enviado exitosamente',
        details: {
          message_id: info.messageId,
          from_email: emailConfig.from_email,
          to_email: test_email,
          smtp_server: emailConfig.smtp_host,
          smtp_port: emailConfig.smtp_port,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ [EMAIL-TEST] Error en prueba:', error);
      
      // Determinar tipo de error más específico
      let errorMessage = 'Error desconocido';
      let suggestion = 'Revisa la configuración SMTP';
      
      if (error instanceof Error) {
        if (error.message.includes('authentication') || error.message.includes('login')) {
          errorMessage = 'Error de autenticación';
          suggestion = 'Verifica el usuario y contraseña SMTP';
        } else if (error.message.includes('connection') || error.message.includes('timeout')) {
          errorMessage = 'Error de conexión';
          suggestion = 'Verifica el servidor y puerto SMTP';
        } else if (error.message.includes('certificate') || error.message.includes('TLS')) {
          errorMessage = 'Error de certificado SSL/TLS';
          suggestion = 'Revisa la configuración de seguridad';
        } else {
          errorMessage = error.message;
        }
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        suggestion: suggestion,
        details: {
          smtp_server: emailConfig.smtp_host,
          smtp_port: emailConfig.smtp_port,
          from_email: emailConfig.from_email,
          error_type: 'smtp_test_failed'
        }
      }, { status: 500 });

    } finally {
      // Cerrar transporter
      transporter.close();
    }

  } catch (error) {
    console.error('❌ [EMAIL-TEST] Error general:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }, 
      { status: 500 }
    );
  }
}
