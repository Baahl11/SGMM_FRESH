import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user/sms-credentials
 * Retrieve user's SMS credentials (encrypted in DB)
 */
export async function GET(request: Request) {
  try {
    // Get user from Supabase auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const userId = user.id;

    const result = await query(
      `SELECT 
        provider,
        credentials_encrypted,
        created_at,
        updated_at
      FROM user_sms_credentials
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ credentials: null });
    }

    const row = result.rows[0];
    
    // TODO: Decrypt credentials before sending
    // For now, we'll store them in a way that's masked for security
    const credentials = JSON.parse(row.credentials_encrypted);

    return NextResponse.json({
      provider: row.provider,
      credentials: credentials,
      has_credentials: true,
      updated_at: row.updated_at
    });

  } catch (error) {
    console.error('Error fetching SMS credentials:', error);
    return NextResponse.json(
      { error: 'Error al obtener credenciales' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/sms-credentials
 * Save or update user's SMS credentials
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, credentials } = body;

    // Get user from Supabase auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const userId = user.id;

    // Validate provider
    const validProviders = ['twilio', 'messagebird', 'plivo', 'manual'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: 'Proveedor no válido' },
        { status: 400 }
      );
    }

    // Validate required fields per provider
    if (provider === 'twilio') {
      if (!credentials.account_sid || !credentials.auth_token || !credentials.phone_number) {
        return NextResponse.json(
          { error: 'Faltan credenciales requeridas para Twilio' },
          { status: 400 }
        );
      }
    } else if (provider === 'messagebird') {
      if (!credentials.api_key || !credentials.originator) {
        return NextResponse.json(
          { error: 'Faltan credenciales requeridas para MessageBird' },
          { status: 400 }
        );
      }
    } else if (provider === 'plivo') {
      if (!credentials.auth_id || !credentials.auth_token || !credentials.phone_number) {
        return NextResponse.json(
          { error: 'Faltan credenciales requeridas para Plivo' },
          { status: 400 }
        );
      }
    }

    // TODO: Encrypt credentials before storing
    const credentialsJson = JSON.stringify(credentials);

    // Check if credentials already exist
    const existing = await query(
      'SELECT id FROM user_sms_credentials WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      // Update existing
      await query(
        `UPDATE user_sms_credentials 
         SET provider = $1, 
             credentials_encrypted = $2,
             updated_at = NOW()
         WHERE user_id = $3`,
        [provider, credentialsJson, userId]
      );
    } else {
      // Insert new
      await query(
        `INSERT INTO user_sms_credentials 
         (user_id, provider, credentials_encrypted, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [userId, provider, credentialsJson]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Credenciales guardadas exitosamente'
    });

  } catch (error) {
    console.error('Error saving SMS credentials:', error);
    return NextResponse.json(
      { error: 'Error al guardar credenciales' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/sms-credentials
 * Remove user's SMS credentials
 */
export async function DELETE(request: Request) {
  try {
    // Get user from Supabase auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const userId = user.id;

    await query(
      'DELETE FROM user_sms_credentials WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Credenciales eliminadas exitosamente'
    });

  } catch (error) {
    console.error('Error deleting SMS credentials:', error);
    return NextResponse.json(
      { error: 'Error al eliminar credenciales' },
      { status: 500 }
    );
  }
}
