import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import emailService from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { test_email } = body;

    if (!test_email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user's email config
    const { data: config, error: configError } = await supabase
      .from('email_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !config) {
      return NextResponse.json({ error: 'Email config not found. Please configure email first.' }, { status: 404 });
    }

    if (!config.email_enabled) {
      return NextResponse.json({ error: 'Email is not enabled' }, { status: 400 });
    }

    // Prepare test email
    const subject = '✅ Prueba de Email - AgendaMedPro';
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #10b981;">✅ ¡Configuración Exitosa!</h2>
            <p>Hola,</p>
            <p>Este es un email de prueba de tu configuración SMTP en AgendaMedPro.</p>
            
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #059669;">Detalles de Configuración:</h3>
              <p><strong>Servidor SMTP:</strong> ${config.smtp_host}</p>
              <p><strong>Puerto:</strong> ${config.smtp_port}</p>
              <p><strong>Email remitente:</strong> ${config.from_email}</p>
              <p><strong>Nombre:</strong> ${config.from_name}</p>
            </div>
            
            <p>Si recibiste este email, tu configuración está funcionando correctamente. ✅</p>
            <p>Ahora puedes enviar notificaciones automáticas a tus pacientes.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 0.9em;">
              Este email fue enviado desde tu cuenta de AgendaMedPro<br>
              Fecha: ${new Date().toLocaleString('es-MX')}
            </p>
          </div>
        </body>
      </html>
    `;
    
    const text = `¡Configuración Exitosa! Este es un email de prueba de AgendaMedPro. Tu configuración SMTP está funcionando correctamente.`;

    // Send test email
    const smtpConfig = {
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      smtp_secure: config.smtp_secure,
      smtp_user: config.smtp_user,
      smtp_password: config.smtp_password,
      from_email: config.from_email,
      from_name: config.from_name,
    };

    const result = await emailService.sendWithFallback(
      smtpConfig,
      config.resend_api_key,
      test_email,
      subject,
      html,
      text
    );

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      provider: result.provider,
      messageId: result.messageId,
    });

  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error sending test email',
    }, { status: 500 });
  }
}
