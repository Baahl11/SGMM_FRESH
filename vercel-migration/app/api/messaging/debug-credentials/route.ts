import { NextResponse } from 'next/server';
import { createClient, supabaseAdmin } from '@/lib/supabase/server';
import { decryptMessagingSecret } from '@/lib/crypto/messaging';
import type { EncryptedSecretEnvelope } from '@/types/messaging';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: provider } = await supabaseAdmin
      .from('messaging_providers')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel', 'sms')
      .maybeSingle();

    if (!provider) {
      return NextResponse.json({ error: 'No hay provider SMS' }, { status: 404 });
    }

    const cipherKey = process.env.MESSAGING_CIPHER_KEY;
    if (!cipherKey) {
      return NextResponse.json({ error: 'MESSAGING_CIPHER_KEY falta' }, { status: 500 });
    }

    const envelope = (typeof provider.credentials_encrypted === 'string'
      ? JSON.parse(provider.credentials_encrypted)
      : provider.credentials_encrypted) as EncryptedSecretEnvelope;

    const decrypted = await decryptMessagingSecret<Record<string, unknown>>(envelope, cipherKey);

    return NextResponse.json({ decrypted });
  } catch (error: any) {
    console.error('debug-credentials error', error);
    return NextResponse.json({ error: 'Error interno', details: error.message }, { status: 500 });
  }
}
