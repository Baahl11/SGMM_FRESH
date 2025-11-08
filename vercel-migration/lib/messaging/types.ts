/**
 * Common types for messaging adapters
 */

export interface SendMessageRequest {
  to: string;
  message: string;
  from?: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  rawResponse?: any;
}

export interface MessagingAdapter {
  send(request: SendMessageRequest): Promise<SendMessageResult>;
  validateCredentials(credentials: any): boolean;
  getProviderName(): string;
}

export interface ProviderCredentials {
  [key: string]: string;
}
