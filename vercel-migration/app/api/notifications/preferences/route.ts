/**
 * API Route: /api/notifications/preferences
 * GET: Get user notification preferences
 * POST: Update user notification preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { NotificationPreferencesInput } from '@/lib/types/notifications';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/types/notifications';

// GET /api/notifications/preferences - Get preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Error al cargar preferencias' }, { status: 500 });
    }

    // If not found, create default preferences
    if (!preferences) {
      const { data: newPreferences, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          ...DEFAULT_NOTIFICATION_PREFERENCES,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating preferences:', insertError);
        return NextResponse.json({ error: 'Error al crear preferencias' }, { status: 500 });
      }

      return NextResponse.json({ preferences: newPreferences });
    }

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('Unexpected error in GET /api/notifications/preferences:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/notifications/preferences - Update preferences
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: NotificationPreferencesInput = await request.json();

    // Validate DND hours
    if (body.dnd_start_hour !== undefined && (body.dnd_start_hour < 0 || body.dnd_start_hour > 23)) {
      return NextResponse.json({ error: 'dnd_start_hour debe estar entre 0 y 23' }, { status: 400 });
    }
    if (body.dnd_end_hour !== undefined && (body.dnd_end_hour < 0 || body.dnd_end_hour > 23)) {
      return NextResponse.json({ error: 'dnd_end_hour debe estar entre 0 y 23' }, { status: 400 });
    }

    // Validate reminder days
    if (body.unsent_invoice_days !== undefined && body.unsent_invoice_days < 0) {
      return NextResponse.json({ error: 'unsent_invoice_days debe ser positivo' }, { status: 400 });
    }
    if (body.unpaid_invoice_days !== undefined && body.unpaid_invoice_days < 0) {
      return NextResponse.json({ error: 'unpaid_invoice_days debe ser positivo' }, { status: 400 });
    }
    if (body.certificate_expiry_days !== undefined && body.certificate_expiry_days < 0) {
      return NextResponse.json({ error: 'certificate_expiry_days debe ser positivo' }, { status: 400 });
    }
    if (body.appointment_reminder_hours !== undefined && body.appointment_reminder_hours < 0) {
      return NextResponse.json({ error: 'appointment_reminder_hours debe ser positivo' }, { status: 400 });
    }

    // Update preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .update(body)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({ error: 'Error al actualizar preferencias' }, { status: 500 });
    }

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('Unexpected error in POST /api/notifications/preferences:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
