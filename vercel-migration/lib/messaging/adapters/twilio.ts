/**
 * Twilio SMS Adapter
 * Docs: https://www.twilio.com/docs/sms/api
 */

import type { MessagingAdapter, SendMessageRequest, SendMessageResult, ProviderCredentials } from '../types';

export interface TwilioCredentials extends ProviderCredentials {
  account_sid: string;
  auth_token: string;
  phone_number: string;
}

export class TwilioAdapter implements MessagingAdapter {
  private credentials: TwilioCredentials;

  constructor(credentials: TwilioCredentials) {
    this.credentials = credentials;
  }

  getProviderName(): string {
    return 'twilio';
  }

  validateCredentials(credentials: any): boolean {
    return !!(
      credentials?.account_sid &&
      credentials?.auth_token &&
      credentials?.phone_number &&
      credentials.account_sid.startsWith('AC') &&
      credentials.phone_number.startsWith('+')
    );
  }

  async send(request: SendMessageRequest): Promise<SendMessageResult> {
    try {
      const { account_sid, auth_token, phone_number } = this.credentials;
      const from = request.from || phone_number;

      // Twilio API endpoint
      const url = `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`;

      // Basic Auth credentials
      const authHeader = Buffer.from(`${account_sid}:${auth_token}`).toString('base64');

      // Prepare form data
      const formData = new URLSearchParams({
        To: request.to,
        From: from,
        Body: request.message,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
          provider: this.getProviderName(),
          rawResponse: data,
        };
      }

      return {
        success: true,
        messageId: data.sid,
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
