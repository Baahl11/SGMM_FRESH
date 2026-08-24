// API Route: Upload CSD Certificates (.cer and .key files)
// POST /api/facturama/certificates

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto/encryption';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = {
  cer: ['application/x-x509-ca-cert', 'application/pkix-cert', 'application/octet-stream'],
  key: ['application/x-pem-file', 'application/octet-stream', 'text/plain'],
};

// POST - Upload .cer and .key certificate files
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const cerFile = formData.get('certificate_cer') as File | null;
    const keyFile = formData.get('certificate_key') as File | null;
    const keyPassword = formData.get('key_password') as string | null;

    // Validate files
    if (!cerFile || !keyFile) {
      return NextResponse.json(
        { error: 'Se requieren ambos archivos: .cer y .key' },
        { status: 400 }
      );
    }

    if (!keyPassword) {
      return NextResponse.json(
        { error: 'Se requiere la contraseña del archivo .key' },
        { status: 400 }
      );
    }

    // Validate file sizes
    if (cerFile.size > MAX_FILE_SIZE || keyFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Los archivos no deben superar 5MB' },
        { status: 400 }
      );
    }

    // Validate file extensions
    const cerExt = cerFile.name.split('.').pop()?.toLowerCase();
    const keyExt = keyFile.name.split('.').pop()?.toLowerCase();

    if (cerExt !== 'cer') {
      return NextResponse.json(
        { error: 'El archivo de certificado debe tener extensión .cer' },
        { status: 400 }
      );
    }

    if (keyExt !== 'key') {
      return NextResponse.json(
        { error: 'El archivo de llave privada debe tener extensión .key' },
        { status: 400 }
      );
    }

    // Convert files to buffers
    const cerBuffer = Buffer.from(await cerFile.arrayBuffer());
    const keyBuffer = Buffer.from(await keyFile.arrayBuffer());

    // Generate storage paths (user-specific folder)
    const userFolder = user.id;
    const cerPath = `${userFolder}/certificate.cer`;
    const keyPath = `${userFolder}/certificate.key`;
    // Upload .cer file
    const { data: cerUpload, error: cerError } = await supabaseAdmin.storage
      .from('facturama-certificates')
      .upload(cerPath, cerBuffer, {
        contentType: 'application/x-x509-ca-cert',
        upsert: true, // Replace if exists
      });

    if (cerError) {
      console.error('[Upload CSD] Error uploading .cer:', cerError);
      return NextResponse.json(
        { error: `Error al subir archivo .cer: ${cerError.message}` },
        { status: 500 }
      );
    }

    // Upload .key file
    const { data: keyUpload, error: keyError } = await supabaseAdmin.storage
      .from('facturama-certificates')
      .upload(keyPath, keyBuffer, {
        contentType: 'application/x-pem-file',
        upsert: true, // Replace if exists
      });

    if (keyError) {
      console.error('[Upload CSD] Error uploading .key:', keyError);
      // Rollback .cer if .key fails
      await supabaseAdmin.storage.from('facturama-certificates').remove([cerPath]);
      return NextResponse.json(
        { error: `Error al subir archivo .key: ${keyError.message}` },
        { status: 500 }
      );
    }

    // fable C4/G1: el bucket es PRIVADO; getPublicUrl generaba URLs muertas
    // (y un incentivo peligroso a volver público el bucket de llaves CSD).
    // Se almacenan las RUTAS; cualquier consumidor futuro debe usar
    // storage.download(path) server-side o signed URLs de corta duración.

    // Encrypt .key password with AES-256-GCM
    const encryptedPassword = encrypt(keyPassword);

    // Update facturama_config with certificate URLs and encrypted password
    const { data: config, error: updateError } = await supabaseAdmin
      .from('facturama_config')
      .update({
        certificate_cer_url: cerPath,
        certificate_key_url: keyPath,
        certificate_password_encrypted: encryptedPassword.encrypted,
        certificate_password_iv: encryptedPassword.iv,
        certificate_password_tag: encryptedPassword.tag,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Upload CSD] Error updating config:', updateError);
      // Rollback uploaded files
      await supabaseAdmin.storage.from('facturama-certificates').remove([cerPath, keyPath]);
      return NextResponse.json(
        { error: `Error al actualizar configuración: ${updateError.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Certificados CSD subidos exitosamente',
      // fable G1: nunca devolver URLs de los archivos .cer/.key al cliente;
      // sólo confirmación. Las rutas viven en facturama_config (server-side).
      certificates_stored: true,
    });
  } catch (error) {
    console.error('[Upload CSD] Unhandled error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir certificados' },
      { status: 500 }
    );
  }
}

// GET - Check if user has certificates uploaded
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: config, error } = await supabase
      .from('facturama_config')
      .select('certificate_cer_url, certificate_key_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[Check CSD] Error:', error);
      return NextResponse.json({ error: 'Error al verificar certificados' }, { status: 500 });
    }

    const hasCertificates = !!(config?.certificate_cer_url && config?.certificate_key_url);

    return NextResponse.json({
      has_certificates: hasCertificates,
      certificate_cer_url: config?.certificate_cer_url || null,
      certificate_key_url: config?.certificate_key_url || null,
    });
  } catch (error) {
    console.error('[Check CSD] Unhandled error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al verificar certificados' },
      { status: 500 }
    );
  }
}

// DELETE - Remove certificates
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userFolder = user.id;
    const cerPath = `${userFolder}/certificate.cer`;
    const keyPath = `${userFolder}/certificate.key`;

    // Delete files from storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from('facturama-certificates')
      .remove([cerPath, keyPath]);

    if (deleteError) {
      console.error('[Delete CSD] Error deleting files:', deleteError);
      // Continue anyway - files might not exist
    }

    // Update facturama_config to remove URLs
    const { error: updateError } = await supabaseAdmin
      .from('facturama_config')
      .update({
        certificate_cer_url: null,
        certificate_key_url: null,
        certificate_password_encrypted: null,
        certificate_password_iv: null,
        certificate_password_tag: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[Delete CSD] Error updating config:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Certificados eliminados exitosamente',
    });
  } catch (error) {
    console.error('[Delete CSD] Unhandled error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar certificados' },
      { status: 500 }
    );
  }
}
