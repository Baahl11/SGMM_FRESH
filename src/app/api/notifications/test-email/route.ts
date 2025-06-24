import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { template, api_key } = await request.json();

    // Validar que se proporcionen los datos necesarios
    if (!template) {
      return NextResponse.json(
        { error: 'Template de email es requerido' },
        { status: 400 }
      );
    }

    if (!api_key) {
      return NextResponse.json(
        { error: 'API Key de SendGrid es requerida' },
        { status: 400 }
      );
    }

    // Por ahora solo simulamos el envío del email
    // En el futuro aquí se integrará con SendGrid
    console.log('Simulating email test with template:', template);
    console.log('Using SendGrid API Key:', api_key.substring(0, 10) + '...');

    // Simular un delay como si estuviéramos enviando el email
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simular éxito en el 80% de los casos
    const success = Math.random() > 0.2;

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email de prueba enviado exitosamente',
        details: {
          to: 'test@example.com',
          subject: 'Email de Prueba - Sistema de Notificaciones',
          template_used: template,
          sent_at: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Error simulado: No se pudo enviar el email de prueba' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test email endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
