/**
 * API Route: /api/notifications/mark-all-read
 * POST: Mark all notifications as read for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Mark all unread notifications as read
    const { data, error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('read', false)
      .select();

    if (error) {
      console.error('Error marking all as read:', error);
      return NextResponse.json({ error: 'Error al marcar como leídas' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated_count: data?.length || 0,
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/notifications/mark-all-read:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
