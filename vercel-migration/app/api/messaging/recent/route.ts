import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

type MessagingChannel = 'whatsapp' | 'sms' | 'email';

function resolveChannel(rawChannel: string | null): MessagingChannel {
  if (rawChannel === 'sms' || rawChannel === 'email' || rawChannel === 'whatsapp') {
    return rawChannel;
  }
  return 'whatsapp';
}

function normalizeStatus(status: string): 'pending' | 'sent' | 'delivered' | 'read' | 'failed' {
  if (status === 'sent' || status === 'delivered' || status === 'read' || status === 'failed') {
    return status;
  }
  if (status === 'queued' || status === 'processing') {
    return 'pending';
  }
  return 'pending';
}

function asContactObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

/**
 * GET /api/messaging/recent
 * Get recent WhatsApp messages for current user
 */
export async function GET(request: Request) {
  try {
    const channel = resolveChannel(new URL(request.url).searchParams.get('channel'));
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    if (channel === 'whatsapp') {
      // Get recent WhatsApp messages with patient info
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
        console.error('Error fetching recent WhatsApp messages:', error);
        return NextResponse.json(
          { error: 'Error al obtener mensajes' },
          { status: 500 }
        );
      }

      const formattedMessages = (messages || []).map((msg: any) => ({
        id: msg.id,
        channel,
        destination: msg.to_phone,
        patient_name: msg.patients
          ? `${msg.patients.nombre} ${msg.patients.apellido || ''}`.trim()
          : 'Paciente desconocido',
        subject: null,
        message_body: msg.message_body,
        status: normalizeStatus(msg.status),
        created_at: msg.created_at,
        sent_at: msg.sent_at,
        delivered_at: msg.delivered_at,
        read_at: msg.read_at,
        failed_at: msg.failed_at,
        error_message: msg.error_message,
      }));

      return NextResponse.json({ messages: formattedMessages, success: true });
    }

    // Get recent SMS/Email messages from unified messaging table
    const { data: messages, error } = await supabase
      .from('messaging_messages')
      .select('id, channel, to_contact, subject, body, status, created_at, sent_at, delivered_at, read_at, failed_at, error_message, patient_id')
      .eq('user_id', user.id)
      .eq('channel', channel)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error(`Error fetching recent ${channel} messages:`, error);
      return NextResponse.json(
        { error: 'Error al obtener mensajes' },
        { status: 500 }
      );
    }

    // Format messages with destination/contact names
    const formattedMessages = (messages || []).map((msg: any) => ({
      id: msg.id,
      channel,
      destination: channel === 'email'
        ? String(asContactObject(msg.to_contact).email || '')
        : String(asContactObject(msg.to_contact).phone || ''),
      patient_name: String(asContactObject(msg.to_contact).name || 'Contacto'),
      subject: msg.subject,
      message_body: msg.body,
      status: normalizeStatus(msg.status),
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
