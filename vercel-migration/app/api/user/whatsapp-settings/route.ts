import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user/whatsapp-settings
 * Get user's WhatsApp configuration
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user directly from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('whatsapp_phone, whatsapp_enabled, whatsapp_default_message, whatsapp_config_level')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching WhatsApp settings:', error);
      return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 });
    }

    return NextResponse.json({
      whatsapp_phone: profile?.whatsapp_phone || '',
      whatsapp_enabled: profile?.whatsapp_enabled || false,
      whatsapp_default_message: profile?.whatsapp_default_message || '¡Hola! Me contacto desde AgendaMedPro',
      whatsapp_config_level: profile?.whatsapp_config_level || 'basic',
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/user/whatsapp-settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/user/whatsapp-settings
 * Update user's WhatsApp configuration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user directly from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      whatsapp_phone, 
      whatsapp_enabled, 
      whatsapp_default_message, 
      whatsapp_config_level,
      whatsapp_provider,
      whatsapp_twilio_account_sid,
      whatsapp_twilio_auth_token,
      whatsapp_twilio_phone_number,
      whatsapp_twilio_messaging_service_sid,
      // Meta WhatsApp Cloud API
      whatsapp_phone_number_id,
      whatsapp_business_account_id,
      whatsapp_access_token
    } = body;

    // Validate phone format if provided
    if (whatsapp_phone) {
      const cleanPhone = whatsapp_phone.replace(/\s+/g, '');
      if (!/^\+\d{10,15}$/.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Formato de teléfono inválido. Debe incluir código de país (ej: +52 55 1234 5678)' },
          { status: 400 }
        );
      }
    }

    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado. Por favor contacta soporte.' },
        { status: 404 }
      );
    }

    // Build update object dynamically to avoid updating undefined fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Basic fields
    if (whatsapp_phone !== undefined) updateData.whatsapp_phone = whatsapp_phone || null;
    if (whatsapp_enabled !== undefined) updateData.whatsapp_enabled = whatsapp_enabled;
    if (whatsapp_default_message !== undefined) updateData.whatsapp_default_message = whatsapp_default_message;
    if (whatsapp_config_level !== undefined) updateData.whatsapp_config_level = whatsapp_config_level;
    if (whatsapp_provider !== undefined) updateData.whatsapp_provider = whatsapp_provider;

    // Twilio fields
    if (whatsapp_twilio_account_sid !== undefined) updateData.whatsapp_twilio_account_sid = whatsapp_twilio_account_sid || null;
    if (whatsapp_twilio_auth_token !== undefined) updateData.whatsapp_twilio_auth_token = whatsapp_twilio_auth_token || null;
    if (whatsapp_twilio_phone_number !== undefined) updateData.whatsapp_twilio_phone_number = whatsapp_twilio_phone_number || null;
    if (whatsapp_twilio_messaging_service_sid !== undefined) updateData.whatsapp_twilio_messaging_service_sid = whatsapp_twilio_messaging_service_sid || null;

    // Meta WhatsApp Cloud API fields
    if (whatsapp_phone_number_id !== undefined) updateData.whatsapp_phone_number_id = whatsapp_phone_number_id || null;
    if (whatsapp_business_account_id !== undefined) updateData.whatsapp_business_account_id = whatsapp_business_account_id || null;
    if (whatsapp_access_token !== undefined) updateData.whatsapp_access_token = whatsapp_access_token || null;

    console.log('Updating user_profiles with data:', JSON.stringify(updateData, null, 2));

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating WhatsApp settings:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Error updating settings', 
        details: error.message,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    // Mantener compatibilidad: sincronizar credenciales Meta en la tabla canónica messaging_config
    const shouldSyncMetaToMessagingConfig =
      whatsapp_provider === 'meta'
      || whatsapp_phone_number_id !== undefined
      || whatsapp_business_account_id !== undefined
      || whatsapp_access_token !== undefined
      || whatsapp_enabled !== undefined;

    if (shouldSyncMetaToMessagingConfig) {
      const messagingConfigUpdate: any = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (whatsapp_phone_number_id !== undefined) {
        messagingConfigUpdate.whatsapp_phone_number_id = whatsapp_phone_number_id || null;
      }
      if (whatsapp_business_account_id !== undefined) {
        messagingConfigUpdate.whatsapp_business_id = whatsapp_business_account_id || null;
      }
      if (whatsapp_access_token !== undefined) {
        messagingConfigUpdate.whatsapp_access_token = whatsapp_access_token || null;
      }
      if (whatsapp_enabled !== undefined) {
        messagingConfigUpdate.whatsapp_enabled = Boolean(whatsapp_enabled);
      }

      const { error: syncError } = await supabase
        .from('messaging_config')
        .upsert(messagingConfigUpdate, { onConflict: 'user_id' });

      if (syncError) {
        console.error('Error syncing WhatsApp settings to messaging_config:', JSON.stringify(syncError, null, 2));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in POST /api/user/whatsapp-settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
