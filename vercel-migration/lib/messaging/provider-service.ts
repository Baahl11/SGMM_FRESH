import type { SupabaseClient } from '@supabase/supabase-js';
import { decryptMessagingSecret, isEncryptedSecretEnvelope } from '@/lib/crypto/messaging';
import type { MetaWhatsAppCredentials } from './adapters/meta-whatsapp';

export async function getWhatsAppCredentials(
  supabase: SupabaseClient,
  userId: string
): Promise<MetaWhatsAppCredentials | null> {
  const canonical = await getFromMessagingProviders(supabase, userId);
  if (canonical) return canonical;

  return getFromMessagingConfig(supabase, userId);
}

async function getFromMessagingProviders(
  supabase: SupabaseClient,
  userId: string
): Promise<MetaWhatsAppCredentials | null> {
  const { data } = await supabase
    .from('messaging_providers')
    .select('credentials_encrypted, status')
    .eq('user_id', userId)
    .eq('channel', 'whatsapp')
    .eq('provider', 'meta_whatsapp')
    .eq('status', 'active')
    .maybeSingle();

  if (!data?.credentials_encrypted) return null;

  const cipherKey = process.env.MESSAGING_CIPHER_KEY;
  if (!cipherKey) return null;

  // Un envelope malformado (JSON.parse) o indescifrable (clave incorrecta,
  // auth tag invalido, algoritmo legacy rechazado por lib/crypto/messaging)
  // lanza. Sin este try/catch la excepcion escaparia de
  // getWhatsAppCredentials() y el fallback legacy nunca correria: se degrada
  // a null para que el llamador pueda seguir con messaging_config.
  try {
    const envelope =
      typeof data.credentials_encrypted === 'string'
        ? JSON.parse(data.credentials_encrypted)
        : data.credentials_encrypted;

    if (!isEncryptedSecretEnvelope(envelope)) return null;

    const decrypted = await decryptMessagingSecret<MetaWhatsAppCredentials>(envelope, cipherKey);
    if (!decrypted?.phone_number_id || !decrypted?.access_token) return null;

    return decrypted;
  } catch (error) {
    // Solo se registra el modo de falla, nunca el payload ni el secreto. El
    // mensaje nativo de JSON.parse incluye un fragmento del texto de entrada
    // (es decir, del envelope almacenado), asi que ese caso se reemplaza por
    // una descripcion fija.
    const reason =
      error instanceof SyntaxError
        ? 'credentials_encrypted no es JSON valido'
        : error instanceof Error
          ? error.message
          : 'unknown error';

    console.warn(
      '[getWhatsAppCredentials] fallo al descifrar credenciales canonicas, usando fallback legacy:',
      reason
    );
    return null;
  }
}

async function getFromMessagingConfig(
  supabase: SupabaseClient,
  userId: string
): Promise<MetaWhatsAppCredentials | null> {
  const { data } = await supabase
    .from('messaging_config')
    .select('whatsapp_enabled, whatsapp_phone_number_id, whatsapp_business_id, whatsapp_access_token')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data?.whatsapp_enabled || !data.whatsapp_phone_number_id || !data.whatsapp_access_token) {
    return null;
  }

  return {
    phone_number_id: data.whatsapp_phone_number_id,
    access_token: data.whatsapp_access_token,
    business_account_id: data.whatsapp_business_id || undefined,
  };
}
