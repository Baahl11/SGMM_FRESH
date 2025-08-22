import { NextRequest, NextResponse } from 'next/server';

// Store for individual WhatsApp messages (in production, use a database)
let whatsappMessages: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message, template_id, patient_name } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Teléfono y mensaje son requeridos' }, 
        { status: 400 }
      );
    }

    console.log(`🔄 [WHATSAPP-SEND] Enviando mensaje individual a ${phone}...`);

    // En producción, aquí se haría la llamada real a WhatsApp Business API
    // Por ahora simulamos el envío
    const messageRecord = {
      id: `single_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipient: phone,
      patientName: patient_name || 'Paciente',
      message: message,
      status: Math.random() > 0.1 ? 'sent' : 'failed', // 90% éxito
      timestamp: new Date().toISOString(),
      template_id,
      type: 'individual'
    };

    // Simular llamada a WhatsApp Business API
    if (messageRecord.status === 'sent') {
      console.log(`✅ [WHATSAPP-SEND] Mensaje enviado exitosamente a ${phone}`);
      
      // Simular webhook de entrega después de unos segundos
      setTimeout(() => {
        messageRecord.status = 'delivered';
        console.log(`📱 [WHATSAPP-WEBHOOK] Mensaje entregado a ${phone}`);
      }, 2000 + Math.random() * 3000);
    } else {
      console.log(`❌ [WHATSAPP-SEND] Fallo al enviar mensaje a ${phone}`);
    }

    // Agregar a la lista de mensajes
    whatsappMessages.unshift(messageRecord);

    // Mantener solo los últimos 100 mensajes en memoria
    if (whatsappMessages.length > 100) {
      whatsappMessages = whatsappMessages.slice(0, 100);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Mensaje enviado exitosamente',
      message_id: messageRecord.id,
      status: messageRecord.status
    });
  } catch (error) {
    console.error('❌ [WHATSAPP-SEND] Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: 'Error al enviar mensaje' }, 
      { status: 500 }
    );
  }
}

// GET endpoint para obtener mensajes recientes
export async function GET() {
  try {
    // Obtener los últimos 50 mensajes
    const recentMessages = whatsappMessages
      .slice(0, 50)
      .map(msg => ({
        id: msg.id,
        patient_name: msg.patientName,
        phone: msg.recipient,
        message: msg.message.substring(0, 100) + (msg.message.length > 100 ? '...' : ''),
        status: msg.status,
        sent_at: msg.timestamp,
        type: msg.type
      }));

    return NextResponse.json({
      messages: recentMessages,
      total: whatsappMessages.length
    });
  } catch (error) {
    console.error('❌ [WHATSAPP-SEND] Error getting messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' }, 
      { status: 500 }
    );
  }
}
