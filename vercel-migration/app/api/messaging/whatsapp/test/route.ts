import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

/**
 * POST /api/messaging/whatsapp/test
 * Test connection to WhatsApp Business API
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { whatsapp_business_id, whatsapp_phone_number_id, whatsapp_access_token } = body;

    if (!whatsapp_business_id || !whatsapp_phone_number_id || !whatsapp_access_token) {
      return NextResponse.json(
        { error: 'Faltan credenciales requeridas' },
        { status: 400 }
      );
    }

    // Test connection by calling WhatsApp Business API
    // Get phone number details to validate credentials
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${whatsapp_phone_number_id}`;
    
    const response = await fetch(whatsappApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${whatsapp_access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('WhatsApp API error:', errorData);
      
      return NextResponse.json(
        { 
          error: 'Credenciales inválidas o error de conexión con WhatsApp',
          details: errorData.error?.message || 'Error desconocido',
          success: false 
        },
        { status: 400 }
      );
    }

    const phoneData = await response.json();

    // Update messaging_config with connection test timestamp
    const supabase = await createClient();
    
    await supabase
      .from('messaging_config')
      .update({
        connection_status: 'connected',
        last_connection_test: new Date().toISOString(),
        whatsapp_phone_number: phoneData.display_phone_number || null,
        whatsapp_verified: phoneData.verified_name ? true : false,
      })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      phone_data: {
        display_phone_number: phoneData.display_phone_number,
        verified_name: phoneData.verified_name,
        code_verification_status: phoneData.code_verification_status,
        quality_rating: phoneData.quality_rating,
      },
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/messaging/whatsapp/test:', error);
    return NextResponse.json(
      { error: 'Error interno al probar conexión', success: false },
      { status: 500 }
    );
  }
}
