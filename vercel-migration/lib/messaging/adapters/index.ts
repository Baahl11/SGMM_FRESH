/**
 * Messaging Adapters Factory
 */

import type { MessagingAdapter } from '../types';
import { TwilioAdapter, type TwilioCredentials } from './twilio';
import { MessageBirdAdapter, type MessageBirdCredentials } from './messagebird';
import { PlivoAdapter, type PlivoCredentials } from './plivo';

export type SupportedProvider = 'twilio' | 'messagebird' | 'plivo';

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
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export { TwilioAdapter, MessageBirdAdapter, PlivoAdapter };
export type { TwilioCredentials, MessageBirdCredentials, PlivoCredentials };
