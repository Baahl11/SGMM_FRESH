/**
 * API Route: /api/notifications
 * GET: List all notifications for current user
 * POST: Create new notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreateNotificationInput, Notification } from '@/lib/types/notifications';

// GET /api/notifications - List notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Error al cargar notificaciones' }, { status: 500 });
    }

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      unread_count: unreadOnly ? count : undefined,
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/notifications:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: CreateNotificationInput = await request.json();

    // Validate required fields
    if (!body.title || !body.message || !body.type || !body.category) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: body.user_id || user.id,
        title: body.title,
        message: body.message,
        type: body.type,
        category: body.category,
        related_invoice_id: body.related_invoice_id,
        related_patient_id: body.related_patient_id,
        related_appointment_id: body.related_appointment_id,
        action_url: body.action_url,
        expires_at: body.expires_at,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Error al crear notificación' }, { status: 500 });
    }

    return NextResponse.json({ notification });

  } catch (error) {
    console.error('Unexpected error in POST /api/notifications:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
