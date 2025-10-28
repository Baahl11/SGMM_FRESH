import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/messaging/recent
 * Get recent WhatsApp messages for current user
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get recent messages with patient info
    const { data: messages, error } = await supabase
      .from('whatsapp_messages')
      .select(`
        id,
        to_phone,
        message_body,
        status,
        created_at,
        sent_at,
        delivered_at,
        read_at,
        failed_at,
        error_message,
        patient_id,
        patients:patient_id (
          nombre,
          apellido
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching recent messages:', error);
      return NextResponse.json(
        { error: 'Error al obtener mensajes' },
        { status: 500 }
      );
    }

    // Format messages with patient names
    const formattedMessages = (messages || []).map((msg: any) => ({
      id: msg.id,
      to_phone: msg.to_phone,
      patient_name: msg.patients
        ? `${msg.patients.nombre} ${msg.patients.apellido || ''}`.trim()
        : 'Paciente desconocido',
      message_body: msg.message_body,
      status: msg.status,
      created_at: msg.created_at,
      sent_at: msg.sent_at,
      delivered_at: msg.delivered_at,
      read_at: msg.read_at,
      failed_at: msg.failed_at,
      error_message: msg.error_message,
    }));

    return NextResponse.json({ messages: formattedMessages, success: true });
  } catch (error) {
    console.error('Unexpected error in GET /api/messaging/recent:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
