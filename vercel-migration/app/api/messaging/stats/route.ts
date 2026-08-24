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

function normalizeConnectionStatus(status: string | null | undefined): 'connected' | 'disconnected' | 'error' {
  if (status === 'connected' || status === 'active') {
    return 'connected';
  }
  if (status === 'error') {
    return 'error';
  }
  return 'disconnected';
}

/**
 * GET /api/messaging/stats
 * Get messaging statistics for current user
 */
export async function GET(request: Request) {
  try {
    const channel = resolveChannel(new URL(request.url).searchParams.get('channel'));
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    let total_sent = 0;
    let total_delivered = 0;
    let total_read = 0;
    let total_failed = 0;
    let today_sent = 0;
    let today_limit = 1000;
    let channel_enabled = false;
    let connection_status: 'connected' | 'disconnected' | 'error' = 'disconnected';

    if (channel === 'whatsapp') {
      const { data: config } = await supabase
        .from('messaging_config')
        .select('daily_message_limit, whatsapp_enabled, connection_status')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: messages, error: messagesError } = await supabase
        .from('whatsapp_messages')
        .select('status, created_at')
        .eq('user_id', user.id);

      if (messagesError) {
        console.error('Error fetching WhatsApp messages:', messagesError);
      }

      const messageList = messages || [];
      total_sent = messageList.filter((m) => m.status !== 'pending' && m.status !== 'failed').length;
      total_delivered = messageList.filter((m) => m.status === 'delivered' || m.status === 'read').length;
      total_read = messageList.filter((m) => m.status === 'read').length;
      total_failed = messageList.filter((m) => m.status === 'failed').length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      today_sent = messageList.filter((m) => {
        const msgDate = new Date(m.created_at);
        return msgDate >= today;
      }).length;

      today_limit = config?.daily_message_limit || 1000;
      channel_enabled = Boolean(config?.whatsapp_enabled);
      connection_status = normalizeConnectionStatus(config?.connection_status);
    } else {
      const { data: provider, error: providerError } = await supabase
        .from('messaging_providers')
        .select('status')
        .eq('user_id', user.id)
        .eq('channel', channel)
        .maybeSingle();

      if (providerError) {
        console.error(`Error fetching ${channel} provider:`, providerError);
      }

      const { data: messages, error: messagesError } = await supabase
        .from('messaging_messages')
        .select('status, created_at')
        .eq('user_id', user.id)
        .eq('channel', channel);

      if (messagesError) {
        console.error(`Error fetching ${channel} messages:`, messagesError);
      }

      const messageList = messages || [];
      total_sent = messageList.filter((m) => ['sent', 'delivered', 'read'].includes(m.status)).length;
      total_delivered = messageList.filter((m) => m.status === 'delivered' || m.status === 'read').length;
      total_read = messageList.filter((m) => m.status === 'read').length;
      total_failed = messageList.filter((m) => m.status === 'failed').length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      today_sent = messageList.filter((m) => {
        const msgDate = new Date(m.created_at);
        return msgDate >= today;
      }).length;

      channel_enabled = provider?.status === 'active';
      connection_status = normalizeConnectionStatus(provider?.status);
    }

    const stats = {
      channel,
      total_sent,
      total_delivered,
      total_read,
      total_failed,
      today_sent,
      today_limit,
      channel_enabled,
      whatsapp_enabled: channel === 'whatsapp' ? channel_enabled : false,
      connection_status,
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
