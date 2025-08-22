import { NextRequest, NextResponse } from 'next/server';

// Force static generation for production build
export const dynamic = "force-static";

// Mock data para desarrollo - en producciÃ³n esto vendrÃ­a de la base de datos
let whatsappConfig = {
  business_id: '',
  access_token: '',
  phone_number_id: '',
  webhook_verify_token: '',
  default_template: 'Hola {nombre_paciente}! ðŸ‘‹\n\nTe recordamos que tienes una cita mÃ©dica programada para:\nðŸ“… {fecha_cita}\nðŸ• {hora_cita}\n\nðŸ¥ Consultorio UME LÃ³pez & LÃ³pez\n\nÂ¡Te esperamos!'
};

export async function GET() {
  try {
    return NextResponse.json(whatsappConfig);
  } catch (error) {
    console.error('Error getting WhatsApp config:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuraciÃ³n' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Actualizar configuraciÃ³n en memoria (en producciÃ³n guardar en DB)
    whatsappConfig = {
      business_id: body.business_id || '',
      access_token: body.access_token || '',
      phone_number_id: body.phone_number_id || '',
      webhook_verify_token: body.webhook_verify_token || '',
      default_template: body.default_template || whatsappConfig.default_template
    };

    // En producciÃ³n aquÃ­ se guardarÃ­a en la base de datos
    
    return NextResponse.json({ 
      success: true, 
      message: 'ConfiguraciÃ³n guardada exitosamente' 
    });
  } catch (error) {
    console.error('Error saving WhatsApp config:', error);
    return NextResponse.json(
      { error: 'Error al guardar configuraciÃ³n' }, 
      { status: 500 }
    );
  }
}
