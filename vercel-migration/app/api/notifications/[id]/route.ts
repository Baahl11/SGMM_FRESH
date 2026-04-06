/**
 * API Route: /api/notifications/[id]
 * PATCH: Mark notification as read/unread
 * DELETE: Delete notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PATCH /api/notifications/[id] - Mark as read/unread
export async function PATCH(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { read } = body;

    if (typeof read !== 'boolean') {
      return NextResponse.json({ error: 'Campo "read" debe ser boolean' }, { status: 400 });
    }

    // Update notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({
        read,
        read_at: read ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json({ error: 'Error al actualizar notificación' }, { status: 500 });
    }

    if (!notification) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ notification });

  } catch (error) {
    console.error('Unexpected error in PATCH /api/notifications/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Delete notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Error al eliminar notificación' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/notifications/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
