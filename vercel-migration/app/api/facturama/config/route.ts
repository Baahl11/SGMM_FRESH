// API Route: Facturama Configuration
// GET/POST /api/facturama/config

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import FacturamaClient from '@/lib/facturama/client';
import { encrypt } from '@/lib/crypto/encryption';
import type { FacturamaConfigInput, ConfigValidationResult } from '@/lib/types/facturama';

// GET - Retrieve user's Facturama configuration
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: config, error } = await supabase
      .from('facturama_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching config:', error);
      return NextResponse.json({ error: 'Error fetching configuration' }, { status: 500 });
    }

    // Don't send encrypted passwords to client
    if (config) {
      const sanitized = {
        ...config,
        api_password_encrypted: undefined,
        certificate_password_encrypted: undefined,
      };
      return NextResponse.json({ config: sanitized });
    }

    return NextResponse.json({ config: null });
  } catch (error) {
    console.error('Error in GET /api/facturama/config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update Facturama configuration
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: FacturamaConfigInput = await request.json();

    // Validate required fields
    const requiredFields = [
      'api_user',
      'api_password',
      'emisor_rfc',
      'emisor_razon_social',
      'emisor_regimen_fiscal',
      'emisor_codigo_postal',
    ];

    const missingFields = requiredFields.filter(field => !body[field as keyof FacturamaConfigInput]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate RFC format
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
    if (!rfcRegex.test(body.emisor_rfc.toUpperCase())) {
      return NextResponse.json({ error: 'RFC inválido' }, { status: 400 });
    }

    // Validate postal code
    if (!/^\d{5}$/.test(body.emisor_codigo_postal)) {
      return NextResponse.json({ error: 'Código postal inválido' }, { status: 400 });
    }

    // Test Facturama connection (use plaintext password for testing)
    const facturamaClient = new FacturamaClient({
      api_user: body.api_user,
      api_password_encrypted: Buffer.from(body.api_password).toString('base64'), // Temporary for testing
      api_password_iv: null,
      api_password_tag: null,
      is_sandbox: body.is_sandbox,
    });

    const testResult = await facturamaClient.testConnection();
    if (!testResult.success) {
      return NextResponse.json(
        { error: `Error al conectar con Facturama: ${testResult.error}` },
        { status: 400 }
      );
    }

    // Encrypt password with AES-256-GCM
    const encryptedPassword = encrypt(body.api_password);

    // Check if config already exists
    const { data: existingConfig } = await supabase
      .from('facturama_config')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const configData = {
      user_id: user.id,
      api_user: body.api_user,
      api_password_encrypted: encryptedPassword.encrypted,
      api_password_iv: encryptedPassword.iv,
      api_password_tag: encryptedPassword.tag,
      encryption_migrated: true, // Mark as using new encryption
      is_sandbox: body.is_sandbox,
      emisor_rfc: body.emisor_rfc.toUpperCase(),
      emisor_razon_social: body.emisor_razon_social,
      emisor_regimen_fiscal: body.emisor_regimen_fiscal,
      emisor_codigo_postal: body.emisor_codigo_postal,
      emisor_email: body.emisor_email,
      emisor_telefono: body.emisor_telefono,
      emisor_direccion: body.emisor_direccion,
      emisor_ciudad: body.emisor_ciudad,
      emisor_estado: body.emisor_estado,
      serie_default: body.serie_default || 'A',
      folio_inicial: body.folio_inicial || 1,
      auto_send_email: body.auto_send_email !== false,
      is_configured: true,
      is_active: true,
      last_validated_at: new Date().toISOString(),
      validation_error: null,
    };

    let result;
    if (existingConfig) {
      // Update
      result = await supabaseAdmin
        .from('facturama_config')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single();
    } else {
      // Insert
      result = await supabaseAdmin
        .from('facturama_config')
        .insert(configData)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving config:', result.error);
      return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
    }

    // Don't send encrypted password back
    const sanitized = {
      ...result.data,
      api_password_encrypted: undefined,
      certificate_password_encrypted: undefined,
    };

    return NextResponse.json({ config: sanitized, message: 'Configuración guardada exitosamente' });
  } catch (error) {
    console.error('Error in POST /api/facturama/config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Test connection
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[PUT /api/facturama/config] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[PUT /api/facturama/config] JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { api_user, api_password, is_sandbox } = body;

    if (!api_user || !api_password) {
      console.error('[PUT /api/facturama/config] Missing credentials:', { api_user, has_password: !!api_password });
      return NextResponse.json({ 
        error: 'Faltan credenciales',
        details: `Usuario: ${api_user ? '✓' : '✗'}, Contraseña: ${api_password ? '✓' : '✗'}`
      }, { status: 400 });
    }

    const facturamaClient = new FacturamaClient({
      api_user,
      api_password_encrypted: Buffer.from(api_password).toString('base64'), // Temporary for testing
      api_password_iv: null,
      api_password_tag: null,
      is_sandbox: is_sandbox !== false, // Default to sandbox
    });
    const result = await facturamaClient.testConnection();

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Conexión exitosa con Facturama' });
    } else {
      console.error('[PUT /api/facturama/config] Connection failed:', result.error);
      return NextResponse.json({ success: false, error: result.error || 'Error desconocido' }, { status: 400 });
    }
  } catch (error) {
    console.error('[PUT /api/facturama/config] Unhandled error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al probar conexión' },
      { status: 500 }
    );
  }
}
