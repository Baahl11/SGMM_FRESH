import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { template, account_sid, auth_token, from_number } = await request.json();

    // Validar que se proporcionen los datos necesarios
    if (!template) {
      return NextResponse.json(
        { error: 'Template de WhatsApp es requerido' },
        { status: 400 }
      );
    }

    if (!account_sid || !auth_token || !from_number) {
      return NextResponse.json(
        { error: 'Credenciales de Twilio son requeridas (Account SID, Auth Token, Número de teléfono)' },
        { status: 400 }
      );
    }

    // Validar formato del número de WhatsApp
    if (!from_number.startsWith('whatsapp:')) {
      return NextResponse.json(
        { error: 'El número debe tener el formato: whatsapp:+1234567890' },
        { status: 400 }
      );
    }

    // Por ahora solo simulamos el envío del WhatsApp
    // En el futuro aquí se integrará con Twilio
    console.log('Simulating WhatsApp test with template:', template);
    console.log('Using Twilio Account SID:', account_sid.substring(0, 10) + '...');
    console.log('Using WhatsApp number:', from_number);

    // Simular un delay como si estuviéramos enviando el WhatsApp
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simular éxito en el 75% de los casos
    const success = Math.random() > 0.25;

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'WhatsApp de prueba enviado exitosamente',
        details: {
          to: 'whatsapp:+52123456789',
          from: from_number,
          template_used: template,
          sent_at: new Date().toISOString(),
          message_sid: 'SM' + Math.random().toString(36).substr(2, 9)
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Error simulado: No se pudo enviar el WhatsApp de prueba' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test WhatsApp endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
