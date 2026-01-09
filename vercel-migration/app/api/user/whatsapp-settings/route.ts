import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

/**
 * GET /api/user/whatsapp-settings
 * Get user's WhatsApp configuration
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('whatsapp_phone, whatsapp_enabled, whatsapp_default_message, whatsapp_config_level')
      .eq('id', user.id)
      .single();

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
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { whatsapp_phone, whatsapp_enabled, whatsapp_default_message, whatsapp_config_level } = body;

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

    const supabase = await createClient();
    const { error } = await supabase
      .from('user_profiles')
      .update({
        whatsapp_phone: whatsapp_phone || null,
        whatsapp_enabled: whatsapp_enabled || false,
        whatsapp_default_message: whatsapp_default_message || '¡Hola! Me contacto desde AgendaMedPro',
        whatsapp_config_level: whatsapp_config_level || 'basic',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating WhatsApp settings:', error);
      return NextResponse.json({ error: 'Error updating settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in POST /api/user/whatsapp-settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
