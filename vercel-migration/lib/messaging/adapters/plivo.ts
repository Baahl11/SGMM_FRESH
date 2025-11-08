/**
 * Plivo SMS Adapter
 * Docs: https://www.plivo.com/docs/sms/api/message
 */

import type { MessagingAdapter, SendMessageRequest, SendMessageResult, ProviderCredentials } from '../types';

export interface PlivoCredentials extends ProviderCredentials {
  auth_id: string;
  auth_token: string;
  phone_number: string;
}

export class PlivoAdapter implements MessagingAdapter {
  private credentials: PlivoCredentials;

  constructor(credentials: PlivoCredentials) {
    this.credentials = credentials;
  }

  getProviderName(): string {
    return 'plivo';
  }

  validateCredentials(credentials: any): boolean {
    return !!(
      credentials?.auth_id &&
      credentials?.auth_token &&
      credentials?.phone_number &&
      credentials.auth_id.length > 15 &&
      credentials.phone_number.startsWith('+')
    );
  }

  async send(request: SendMessageRequest): Promise<SendMessageResult> {
    try {
      const { auth_id, auth_token, phone_number } = this.credentials;
      const from = request.from || phone_number;

      // Plivo API endpoint
      const url = `https://api.plivo.com/v1/Account/${auth_id}/Message/`;

      // Basic Auth
      const authHeader = Buffer.from(`${auth_id}:${auth_token}`).toString('base64');

      const payload = {
        src: from,
        dst: request.to,
        text: request.message,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          provider: this.getProviderName(),
          rawResponse: data,
        };
      }

      return {
        success: true,
        messageId: data.message_uuid?.[0] || data.api_id,
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
