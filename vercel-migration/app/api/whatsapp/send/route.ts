import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/whatsapp/send
 * Send WhatsApp message via Meta Cloud API (official WhatsApp API)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, message } = body;

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing "to" or "message"' }, { status: 400 });
    }

    // Get user's WhatsApp Cloud API credentials
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('whatsapp_enabled, whatsapp_phone_number_id, whatsapp_access_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile || !profile.whatsapp_enabled) {
      return NextResponse.json(
        { error: 'WhatsApp no está habilitado para tu cuenta' },
        { status: 403 }
      );
    }

    const phoneNumberId = profile.whatsapp_phone_number_id;
    const accessToken = profile.whatsapp_access_token;

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: 'Configura tu WhatsApp Cloud API en Ajustes' },
        { status: 400 }
      );
    }

    // Clean phone number (remove spaces, dashes, plus sign if present)
    const cleanTo = to.replace(/[\s\-\+]/g, '');
    // Meta Cloud API request
    const metaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: {
            body: message
          }
        }),
      }
    );

    if (!metaResponse.ok) {
      const errorData = await metaResponse.json();
      console.error('[WhatsApp Cloud API] Error:', errorData);
      return NextResponse.json(
        { error: 'Error enviando mensaje', details: errorData },
        { status: 500 }
      );
    }

    const data = await metaResponse.json();
    
    return NextResponse.json({
      success: true,
      message_id: data.messages?.[0]?.id || 'unknown',
      status: 'sent'
    });

  } catch (error) {
    console.error('[WhatsApp Cloud API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
