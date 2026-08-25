/**
 * Messaging Adapters Factory
 */

import type { MessagingAdapter } from '../types';
import { TwilioAdapter, type TwilioCredentials } from './twilio';
import { MessageBirdAdapter, type MessageBirdCredentials } from './messagebird';
import { PlivoAdapter, type PlivoCredentials } from './plivo';
import { MetaWhatsAppAdapter, type MetaWhatsAppCredentials } from './meta-whatsapp';

export type SupportedProvider = 'twilio' | 'messagebird' | 'plivo' | 'meta_whatsapp';

export function createAdapter(
  provider: SupportedProvider,
  credentials: any
): MessagingAdapter {
  switch (provider) {
    case 'twilio':
      return new TwilioAdapter(credentials as TwilioCredentials);
    case 'messagebird':
      return new MessageBirdAdapter(credentials as MessageBirdCredentials);
    case 'plivo':
      return new PlivoAdapter(credentials as PlivoCredentials);
    case 'meta_whatsapp':
      return new MetaWhatsAppAdapter(credentials as MetaWhatsAppCredentials);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export { TwilioAdapter, MessageBirdAdapter, PlivoAdapter, MetaWhatsAppAdapter };
export type { TwilioCredentials, MessageBirdCredentials, PlivoCredentials, MetaWhatsAppCredentials };
