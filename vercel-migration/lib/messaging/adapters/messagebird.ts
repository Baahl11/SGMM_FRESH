/**
 * MessageBird SMS Adapter
 * Docs: https://developers.messagebird.com/api/sms-messaging/
 */

import type { MessagingAdapter, SendMessageRequest, SendMessageResult, ProviderCredentials } from '../types';

export interface MessageBirdCredentials extends ProviderCredentials {
  api_key: string;
  originator: string; // Sender ID or phone number
}

export class MessageBirdAdapter implements MessagingAdapter {
  private credentials: MessageBirdCredentials;

  constructor(credentials: MessageBirdCredentials) {
    this.credentials = credentials;
  }

  getProviderName(): string {
    return 'messagebird';
  }

  validateCredentials(credentials: any): boolean {
    return !!(
      credentials?.api_key &&
      credentials?.originator &&
      credentials.api_key.length > 20
    );
  }

  async send(request: SendMessageRequest): Promise<SendMessageResult> {
    try {
      const { api_key, originator } = this.credentials;
      const from = request.from || originator;

      // MessageBird API endpoint
      const url = 'https://rest.messagebird.com/messages';

      const payload = {
        originator: from,
        recipients: [request.to],
        body: request.message,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `AccessKey ${api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.errors?.[0]?.description || `HTTP ${response.status}`;
        return {
          success: false,
          error: errorMsg,
          provider: this.getProviderName(),
          rawResponse: data,
        };
      }

      return {
        success: true,
        messageId: data.id,
        provider: this.getProviderName(),
        rawResponse: data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        provider: this.getProviderName(),
      };
    }
  }
}
