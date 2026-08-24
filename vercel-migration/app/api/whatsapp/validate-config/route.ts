import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit';

/**
 * POST /api/whatsapp/validate-config
 * Valida credenciales de WhatsApp API haciendo una petición de prueba a la Graph API de Meta.
 * Requiere sesión (fable/reception-ai fase 0, P0): antes era pública y servía como
 * proxy/oráculo no autenticado hacia la Graph API de Meta.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const rate = checkRateLimit(`whatsapp-validate-config:user:${user.id}`, {
      limit: 5,
      windowMs: 60_000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Espera un momento e intenta de nuevo.' },
        { status: 429, headers: rateLimitHeaders(rate) }
      );
    }

    const body = await request.json();
    const { phone_number_id, access_token } = body;

    if (process.env.WHATSAPP_DRY_RUN === 'true') {
      return NextResponse.json({
        success: true,
        phone_number: phone_number_id || 'dry-run-number',
        verified_name: 'Dry Run Mode',
        quality_rating: 'N/A',
        dry_run: true,
      });
    }

    if (!phone_number_id || !access_token) {
      return NextResponse.json({
        success: false,
        error: 'Faltan credenciales'
      }, { status: 400 });
    }

    // Test connection to Meta Graph API
    const url = `https://graph.facebook.com/v18.0/${phone_number_id}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();

      let errorMessage = 'Error desconocido';
      if (error.error?.message) {
        errorMessage = error.error.message;

        if (errorMessage.includes('Invalid OAuth access token')) {
          errorMessage = 'Token de acceso inválido. Verifica que sea un token permanente.';
        } else if (errorMessage.includes('Invalid parameter')) {
          errorMessage = 'Phone Number ID inválido. Verifica que sea correcto.';
        } else if (errorMessage.includes('token has expired')) {
          errorMessage = 'Token expirado. Genera un token permanente (System User).';
        } else if (errorMessage.includes('Application does not have permission')) {
          errorMessage = 'Tu app no tiene permisos de WhatsApp. Agrega el producto WhatsApp en Meta.';
        }
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: error
      }, { status: 400 });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      phone_number: data.display_phone_number,
      verified_name: data.verified_name,
      quality_rating: data.quality_rating
    });

  } catch (error) {
    console.error('Error validating WhatsApp config:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al validar configuración. Verifica tus credenciales.'
    }, { status: 500 });
  }
}
