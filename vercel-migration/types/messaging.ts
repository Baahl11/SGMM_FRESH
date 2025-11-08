export type MessagingChannel = 'sms' | 'whatsapp' | 'email';

export type MessagingProviderType =
  | 'twilio'
  | 'messagebird'
  | 'plivo'
  | 'meta_whatsapp'
  | 'sendgrid'
  | 'resend';

export type MessagingProviderStatus = 'pending' | 'active' | 'error' | 'disabled';

export type MessagingTemplateTrigger =
  | 'confirmation'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'follow_up'
  | 'custom';

export type MessagingMessageStatus =
  | 'queued'
  | 'processing'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'cancelled';

export type MessagingJobStatus =
  | 'pending'
  | 'processing'
  | 'done'
  | 'failed'
  | 'cancelled';

export interface EncryptedSecretEnvelope {
  version: number;
  algorithm: 'xchacha20poly1305' | 'aes-256-gcm';
  nonce: string;
  ciphertext: string;
  created_at?: string;
}

export interface MessagingProviderConfig {
  default_sender?: string;
  fallback_sender?: string;
  silence_window?: {
    start: string;
    end: string;
    timezone?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface MessagingProvider {
  id: string;
  user_id: string;
  account_id: string | null;
  channel: MessagingChannel;
  provider: MessagingProviderType;
  credentials_encrypted: EncryptedSecretEnvelope | string; // parse JSON before use
  config: MessagingProviderConfig;
  status: MessagingProviderStatus;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessagingTemplate {
  id: string;
  user_id: string;
  provider_id: string | null;
  channel: MessagingChannel;
  trigger_name: MessagingTemplateTrigger;
  name: string;
  locale: string;
  body: string;
  rich_content: Record<string, unknown> | null;
  variables: string[];
  is_default: boolean;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface MessagingContact {
  phone?: string;
  email?: string;
  name?: string;
  country_code?: string;
  [key: string]: unknown;
}

export interface MessagingMessage {
  id: string;
  user_id: string;
  provider_id: string | null;
  template_id: string | null;
  channel: MessagingChannel;
  provider: MessagingProviderType | null;
  to_contact: MessagingContact;
  patient_id: string | null;
  appointment_id: string | null;
  subject: string | null;
  body: string | null;
  payload: Record<string, unknown> | null;
  status: MessagingMessageStatus;
  error_code: string | null;
  error_message: string | null;
  provider_message_id: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessagingJob {
  id: string;
  message_id: string;
  run_at: string;
  status: MessagingJobStatus;
  attempts: number;
  last_error: string | null;
  locked_at: string | null;
  locked_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMessagingProviderDTO {
  channel: MessagingChannel;
  provider: MessagingProviderType;
  credentials: Record<string, unknown>;
  config?: MessagingProviderConfig;
}

export interface CreateMessagingTemplateDTO {
  channel: MessagingChannel;
  trigger_name: MessagingTemplateTrigger;
  name: string;
  locale?: string;
  body: string;
  rich_content?: Record<string, unknown>;
  variables?: string[];
  is_default?: boolean;
}

export interface QueueMessagingMessageDTO {
  provider_id: string | null;
  template_id: string | null;
  channel: MessagingChannel;
  to_contact: MessagingContact;
  patient_id?: string | null;
  appointment_id?: string | null;
  subject?: string | null;
  body?: string | null;
  payload?: Record<string, unknown>;
  scheduled_at?: string | null;
}
