import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

const SAFE_COLUMNS =
  'id, user_id, whatsapp_business_id, whatsapp_phone_number_id, whatsapp_phone_number, whatsapp_verified, whatsapp_enabled, auto_reminders_enabled, reminder_24h_enabled, reminder_1h_enabled, daily_message_limit, current_daily_usage, usage_reset_date, connection_status, last_connection_test, created_at, updated_at, whatsapp_access_token, whatsapp_webhook_verify_token';

function toSafeConfig(row: Record<string, unknown> | null) {
  if (!row) return null;
  const { whatsapp_access_token, whatsapp_webhook_verify_token, ...safe } = row;
  return {
    ...safe,
    has_whatsapp_access_token: Boolean(whatsapp_access_token),
    has_whatsapp_webhook_verify_token: Boolean(whatsapp_webhook_verify_token),
  };
}

/**
 * GET /api/messaging/config
 * Retrieve WhatsApp configuration for current user (DTO seguro: nunca
 * devuelve whatsapp_access_token ni whatsapp_webhook_verify_token — fable/
 * reception-ai fase 0, P0).
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      console.error('[Messaging Config API] No authenticated user found');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get current user's session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      console.error('[Messaging Config API] No active session found');
      return NextResponse.json({ error: 'No autorizado - sesión inválida' }, { status: 401 });
    }

    // Get user's messaging config
    const { data: config, error } = await supabase
      .from('messaging_config')
      .select(SAFE_COLUMNS)
      .eq('user_id', session.user.id)
      .single();
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (not an error, just no config yet)
      console.error('[Messaging Config API] Database error:', error);
      return NextResponse.json({
        error: 'Error al obtener configuración',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ config: toSafeConfig(config as Record<string, unknown> | null) });
  } catch (error) {
    console.error('[Messaging Config API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/messaging/config
 * Save/update WhatsApp configuration for current user
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get current user's session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      whatsapp_business_id,
      whatsapp_phone_number_id,
      whatsapp_access_token,
      whatsapp_phone_number,
      whatsapp_enabled,
      auto_reminders_enabled,
      reminder_24h_enabled,
      reminder_1h_enabled,
      daily_message_limit,
      doctor_name,
      clinic_name,
      clinic_address,
      clinic_phone,
      custom_message_signature,
    } = body;

    // Validate required fields if WhatsApp is enabled
    if (whatsapp_enabled) {
      if (!whatsapp_business_id || !whatsapp_phone_number_id || !whatsapp_access_token) {
        return NextResponse.json(
          { error: 'Business ID, Phone Number ID y Access Token son requeridos' },
          { status: 400 }
        );
      }
    }

    // Check if config already exists
    const { data: existingConfig } = await supabase
      .from('messaging_config')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    const configData = {
      user_id: session.user.id,
      whatsapp_business_id,
      whatsapp_phone_number_id,
      whatsapp_access_token,
      whatsapp_phone_number,
      whatsapp_enabled,
      auto_reminders_enabled,
      reminder_24h_enabled,
      reminder_1h_enabled,
      daily_message_limit: daily_message_limit || 1000,
      doctor_name: doctor_name || null,
      clinic_name: clinic_name || null,
      clinic_address: clinic_address || null,
      clinic_phone: clinic_phone || null,
      custom_message_signature: custom_message_signature || null,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existingConfig) {
      // Update existing config
      const { data, error } = await supabase
        .from('messaging_config')
        .update(configData)
        .eq('user_id', session.user.id)
        .select(SAFE_COLUMNS)
        .single();

      if (error) {
        console.error('Error updating messaging config:', error);
        return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
      }

      result = data;
    } else {
      // Insert new config
      const { data, error } = await supabase
        .from('messaging_config')
        .insert([configData])
        .select(SAFE_COLUMNS)
        .single();

      if (error) {
        console.error('Error inserting messaging config:', error);
        return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({ config: toSafeConfig(result as Record<string, unknown> | null), success: true });
  } catch (error) {
    console.error('Unexpected error in POST /api/messaging/config:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
