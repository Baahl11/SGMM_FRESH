import { NextResponse } from 'next/server';
import { createClient, supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener provider
    const { data: provider } = await supabaseAdmin
      .from('messaging_providers')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel', 'sms')
      .maybeSingle();

    // Últimos 5 mensajes
    const { data: messages } = await supabaseAdmin
      .from('messaging_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(5);

    // Últimos 5 jobs
    let jobs: any[] = [];
    if (messages && messages.length > 0) {
      const messageIds = messages.map((msg) => msg.id);
      const { data: jobRows } = await supabaseAdmin
        .from('messaging_jobs')
        .select('*')
        .in('message_id', messageIds)
        .order('created_at', { ascending: false })
        .limit(10);
      jobs = jobRows || [];
    }

    return NextResponse.json({
      provider,
      messages,
      jobs,
    });
  } catch (error: any) {
    console.error('debug-status error', error);
    return NextResponse.json({ error: 'Error interno', details: error.message }, { status: 500 });
  }
}
