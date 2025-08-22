import { NextRequest, NextResponse } from 'next/server';

// Store for email messages (in production, use a database)
let emailMessages: any[] = [];

export async function GET() {
  try {
    console.log('🔄 [EMAIL-MESSAGES] Obteniendo mensajes recientes...');
    
    // Simular algunos mensajes de ejemplo si no hay ninguno
    if (emailMessages.length === 0) {
      emailMessages = [
        {
          id: 'email_1',
          patientName: 'María González',
          recipient: 'maria@email.com',
          subject: 'Recordatorio de Cita - 2025-08-20',
          message: 'Estimada María, le recordamos que tiene una cita médica programada...',
          status: 'sent',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hora atrás
        },
        {
          id: 'email_2',
          patientName: 'Carlos López',
          recipient: 'carlos@email.com',
          subject: '✅ Cita Confirmada - 2025-08-19',
          message: 'Estimado Carlos, su cita médica ha sido confirmada exitosamente...',
          status: 'delivered',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 horas atrás
        },
        {
          id: 'email_3',
          patientName: 'Ana Martínez',
          recipient: 'ana@email.com',
          subject: 'Comunicado Importante - Consultorio UME',
          message: 'Estimada Ana, queremos comunicarle sobre nuestros nuevos horarios...',
          status: 'failed',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 horas atrás
        }
      ];
    }
    
    // Formatear mensajes para la interfaz
    const formattedMessages = emailMessages.slice(0, 50).map(msg => ({
      id: msg.id,
      recipient: msg.recipient,
      patientName: msg.patientName,
      subject: msg.subject,
      message: msg.message,
      status: msg.status,
      timestamp: msg.timestamp
    }));

    console.log(`✅ [EMAIL-MESSAGES] Devueltos ${formattedMessages.length} mensajes`);

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('❌ [EMAIL-MESSAGES] Error getting messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' }, 
      { status: 500 }
    );
  }
}
