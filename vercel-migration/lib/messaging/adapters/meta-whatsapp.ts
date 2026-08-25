import type { MessagingAdapter, SendMessageRequest, SendMessageResult, ProviderCredentials } from '../types';

export const GRAPH_API_VERSION = 'v18.0';

export type MetaWhatsAppCredentials = ProviderCredentials & {
  phone_number_id: string;
  access_token: string;
  business_account_id?: string;
};

export interface SendTemplateRequest {
  to: string;
  templateName: string;
  languageCode?: string;
}

export interface ValidateConfigurationResult {
  valid: boolean;
  error?: string;
  verifiedName?: string;
  phoneNumber?: string;
}

export type MetaErrorClass = 'retryable' | 'non_retryable';

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export class MetaWhatsAppAdapter implements MessagingAdapter {
  private credentials: MetaWhatsAppCredentials;

  constructor(credentials: MetaWhatsAppCredentials) {
    this.credentials = credentials;
  }

  getProviderName(): string {
    return 'meta_whatsapp';
  }

  validateCredentials(credentials: any): boolean {
    return !!(
      credentials?.phone_number_id &&
      credentials?.access_token &&
      typeof credentials.phone_number_id === 'string' &&
      typeof credentials.access_token === 'string'
    );
  }

  async send(request: SendMessageRequest): Promise<SendMessageResult> {
    return this.sendText({ to: request.to, message: request.message });
  }

  async sendText(request: { to: string; message: string }): Promise<SendMessageResult> {
    return this.postToGraphApi({
      messaging_product: 'whatsapp',
      to: request.to,
      type: 'text',
      text: { body: request.message },
    });
  }

  async sendTemplate(request: SendTemplateRequest): Promise<SendMessageResult> {
    return this.postToGraphApi({
      messaging_product: 'whatsapp',
      to: request.to,
      type: 'template',
      template: {
        name: request.templateName,
        language: { code: request.languageCode || 'es_MX' },
      },
    });
  }

  async validateConfiguration(): Promise<ValidateConfigurationResult> {
    try {
      const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.credentials.phone_number_id}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.credentials.access_token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        return { valid: false, error: data.error?.message || `HTTP ${response.status}` };
      }

      return {
        valid: true,
        verifiedName: data.verified_name,
        phoneNumber: data.display_phone_number,
      };
    } catch (error: any) {
      return { valid: false, error: error.message || 'Unknown error' };
    }
  }

  classifyError(result: SendMessageResult): MetaErrorClass {
    const status = (result.rawResponse as { status?: number } | undefined)?.status;
    if (typeof status === 'number' && RETRYABLE_STATUS_CODES.has(status)) {
      return 'retryable';
    }
    // Defaults to 'non_retryable' for success results (no status) or when status is not available
    return 'non_retryable';
  }

  private async postToGraphApi(payload: Record<string, unknown>): Promise<SendMessageResult> {
    try {
      const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.credentials.phone_number_id}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          provider: this.getProviderName(),
          rawResponse: { ...data, status: response.status },
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
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
