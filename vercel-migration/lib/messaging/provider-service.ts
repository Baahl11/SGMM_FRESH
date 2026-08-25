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

  const envelope =
    typeof data.credentials_encrypted === 'string'
      ? JSON.parse(data.credentials_encrypted)
      : data.credentials_encrypted;

  if (!isEncryptedSecretEnvelope(envelope)) return null;

  const decrypted = await decryptMessagingSecret<MetaWhatsAppCredentials>(envelope, cipherKey);
  if (!decrypted?.phone_number_id || !decrypted?.access_token) return null;

  return decrypted;
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
