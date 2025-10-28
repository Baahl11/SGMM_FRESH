import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/messaging/stats
 * Get messaging statistics for current user
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get messaging config
    const { data: config } = await supabase
      .from('messaging_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get message statistics
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('status, created_at')
      .eq('user_id', user.id);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    const messageList = messages || [];

    // Calculate stats
    const total_sent = messageList.filter((m) => m.status !== 'pending' && m.status !== 'failed').length;
    const total_delivered = messageList.filter((m) => m.status === 'delivered' || m.status === 'read').length;
    const total_read = messageList.filter((m) => m.status === 'read').length;
    const total_failed = messageList.filter((m) => m.status === 'failed').length;

    // Today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMessages = messageList.filter((m) => {
      const msgDate = new Date(m.created_at);
      return msgDate >= today;
    });

    const stats = {
      total_sent,
      total_delivered,
      total_read,
      total_failed,
      today_sent: todayMessages.length,
      today_limit: config?.daily_message_limit || 1000,
      whatsapp_enabled: config?.whatsapp_enabled || false,
      connection_status: config?.connection_status || 'disconnected',
    };

    return NextResponse.json({ stats, success: true });
  } catch (error) {
    console.error('Unexpected error in GET /api/messaging/stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
