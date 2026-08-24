import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  encryptMessagingSecret,
  decryptMessagingSecret,
  isEncryptedSecretEnvelope,
} from '@/lib/crypto/messaging';
import type {
  MessagingChannel,
  MessagingProvider,
  MessagingProviderStatus,
  MessagingProviderType,
} from '@/types/messaging';

const CHANNEL: MessagingChannel = 'sms';

type ProviderRow = Omit<MessagingProvider, 'config' | 'credentials_encrypted'> & {
  config: unknown;
  credentials_encrypted: unknown;
};

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

function getCipherKey(): string {
  const key = process.env.MESSAGING_CIPHER_KEY;
  if (!key) {
    throw new Error('MESSAGING_CIPHER_KEY is not configured.');
  }
  return key;
}

const VALID_PROVIDERS: MessagingProviderType[] = [
  'twilio',
  'messagebird',
  'plivo',
];

function validateProvider(provider: string): provider is MessagingProviderType {
  return (VALID_PROVIDERS as string[]).includes(provider);
}

function validateCredentials(provider: MessagingProviderType, credentials: Record<string, unknown>) {
  switch (provider) {
    case 'twilio':
      if (!credentials.account_sid || !credentials.auth_token || !credentials.phone_number) {
        throw new Error('Faltan credenciales requeridas para Twilio');
      }
      break;
    case 'messagebird':
      if (!credentials.api_key || !credentials.originator) {
        throw new Error('Faltan credenciales requeridas para MessageBird');
      }
      break;
    case 'plivo':
      if (!credentials.auth_id || !credentials.auth_token || !credentials.phone_number) {
        throw new Error('Faltan credenciales requeridas para Plivo');
      }
      break;
    default:
      break;
  }
}

function maskCredentials(payload: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length <= 4) {
        masked[field] = '*'.repeat(trimmed.length);
      } else {
        masked[field] = `${'*'.repeat(Math.max(trimmed.length - 4, 0))}${trimmed.slice(-4)}`;
      }
    } else {
      masked[field] = '[secure]';
    }
  }
  return masked;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: rows, error: queryError } = await supabase
      .from('messaging_providers')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel', CHANNEL);

    if (queryError) {
      console.error('Error querying providers:', queryError);
      return NextResponse.json({ error: 'Error al consultar credenciales' }, { status: 500 });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ provider: null, has_credentials: false });
    }

    const providerRow = rows[0] as ProviderRow;

    const providerConfig = (() => {
      if (!providerRow.config) {
        return {};
      }
      if (typeof providerRow.config === 'string') {
        try {
          return JSON.parse(providerRow.config);
        } catch {
          return {};
        }
      }
      return providerRow.config;
    })();

    let envelopeMeta: Record<string, unknown> | null = null;
    let credentialsMasked: Record<string, unknown> | null = null;

    if (providerRow.credentials_encrypted) {
      try {
        const parsed = typeof providerRow.credentials_encrypted === 'string'
          ? JSON.parse(providerRow.credentials_encrypted)
          : providerRow.credentials_encrypted;

        if (isEncryptedSecretEnvelope(parsed)) {
          envelopeMeta = {
            version: parsed.version,
            algorithm: parsed.algorithm,
            created_at: parsed.created_at ?? providerRow.updated_at,
          };

          const key = getCipherKey();
          const decrypted = await decryptMessagingSecret<Record<string, unknown>>(parsed, key);
          credentialsMasked = maskCredentials(decrypted);
        }
      } catch (maskError) {
        console.warn('Unable to parse/decrypt credentials envelope', maskError);
      }
    }

    return NextResponse.json({
      id: providerRow.id,
      channel: CHANNEL,
      provider: providerRow.provider,
      status: providerRow.status,
  config: providerConfig,
  has_credentials: Boolean(providerRow.credentials_encrypted),
      credentials_masked: credentialsMasked,
      envelope: envelopeMeta,
      last_synced_at: providerRow.last_synced_at,
      created_at: providerRow.created_at,
      updated_at: providerRow.updated_at,
    });
  } catch (error) {
    console.error('Error fetching SMS credentials:', error);
    return NextResponse.json({ error: 'Error al obtener credenciales' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, credentials } = body;

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!validateProvider(provider)) {
      return NextResponse.json({ error: 'Proveedor no válido' }, { status: 400 });
    }

    if (typeof credentials !== 'object' || credentials === null) {
      return NextResponse.json({ error: 'Se requieren credenciales válidas.' }, { status: 400 });
    }

    try {
      validateCredentials(provider, credentials as Record<string, unknown>);
    } catch (validationError) {
      return NextResponse.json(
        { error: validationError instanceof Error ? validationError.message : 'Credenciales inválidas' },
        { status: 400 }
      );
    }

    const key = getCipherKey();
    const envelope = await encryptMessagingSecret(credentials as Record<string, unknown>, key);
  const status: MessagingProviderStatus = body.status && body.status !== '' ? body.status : 'active';
    const config = body.config ?? {};

    const supabase = await createClient();
    const { data: row, error: insertError } = await supabase
      .from('messaging_providers')
      .upsert({
        user_id: user.id,
        account_id: null,
        channel: CHANNEL,
        provider,
        credentials_encrypted: JSON.stringify(envelope),
        config,
        status,
      }, {
        onConflict: 'user_id,channel'
      })
      .select()
      .single();

    if (insertError || !row) {
      console.error('Error upserting provider:', insertError);
      return NextResponse.json({ error: 'Error al guardar credenciales' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Credenciales guardadas exitosamente',
      provider: row.provider,
      status: row.status,
      updated_at: row.updated_at,
      created_at: row.created_at,
    });
  } catch (error) {
    console.error('Error saving SMS credentials:', error);
    return NextResponse.json({ error: 'Error al guardar credenciales' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = await createClient();
    const { error: deleteError } = await supabase
      .from('messaging_providers')
      .delete()
      .eq('user_id', user.id)
      .eq('channel', CHANNEL);

    if (deleteError) {
      console.error('Error deleting provider:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar credenciales' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Credenciales eliminadas exitosamente',
    });
  } catch (error) {
    console.error('Error deleting SMS credentials:', error);
    return NextResponse.json({ error: 'Error al eliminar credenciales' }, { status: 500 });
  }
}
