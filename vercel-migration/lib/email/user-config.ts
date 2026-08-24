import 'server-only'

import { decryptDatabaseField } from '@/lib/crypto/encryption'
import emailService, {
  type EmailAttachment,
  type SMTPConfig,
  type SendGridConfig,
} from '@/lib/email-service'

type Provider = 'smtp' | 'sendgrid'

export interface StoredEmailConfig {
  email_enabled?: boolean | null
  primary_provider?: string | null
  enable_fallback?: boolean | null
  fallback_provider?: string | null
  smtp_host?: string | null
  smtp_port?: number | null
  smtp_secure?: boolean | null
  smtp_user?: string | null
  smtp_password?: string | null
  smtp_password_encrypted?: string | null
  smtp_password_iv?: string | null
  smtp_password_tag?: string | null
  from_email?: string | null
  from_name?: string | null
  sendgrid_api_key_encrypted?: string | null
  sendgrid_api_key_iv?: string | null
  sendgrid_api_key_tag?: string | null
  sendgrid_from_email?: string | null
  sendgrid_from_name?: string | null
  resend_api_key?: string | null
  resend_api_key_encrypted?: string | null
  resend_api_key_iv?: string | null
  resend_api_key_tag?: string | null
}

interface SendOptions {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: EmailAttachment[]
}

function normalizeProvider(value: string | null | undefined): Provider {
  return value === 'sendgrid' || value === 'twilio' ? 'sendgrid' : 'smtp'
}

function readSecret(
  encrypted: string | null | undefined,
  iv: string | null | undefined,
  tag: string | null | undefined,
  legacy: string | null | undefined
) {
  if (encrypted) {
    return decryptDatabaseField(encrypted, iv || null, tag || null)
  }
  return legacy || null
}

function getSmtpConfig(config: StoredEmailConfig): SMTPConfig | null {
  const password = readSecret(
    config.smtp_password_encrypted,
    config.smtp_password_iv,
    config.smtp_password_tag,
    config.smtp_password
  )

  if (
    !config.smtp_host ||
    !config.smtp_user ||
    !password ||
    !config.from_email
  ) {
    return null
  }

  return {
    smtp_host: config.smtp_host,
    smtp_port: config.smtp_port || 587,
    smtp_secure: Boolean(config.smtp_secure),
    smtp_user: config.smtp_user,
    smtp_password: password,
    from_email: config.from_email,
    from_name: config.from_name || 'AgendaMedPro',
  }
}

function getSendGridConfig(config: StoredEmailConfig): SendGridConfig | null {
  const apiKey = readSecret(
    config.sendgrid_api_key_encrypted,
    config.sendgrid_api_key_iv,
    config.sendgrid_api_key_tag,
    null
  )

  if (!apiKey || !config.sendgrid_from_email) {
    return null
  }

  return {
    api_key: apiKey,
    from_email: config.sendgrid_from_email,
    from_name: config.sendgrid_from_name || 'AgendaMedPro',
  }
}

async function sendWithProvider(
  provider: Provider,
  config: StoredEmailConfig,
  options: SendOptions
) {
  if (provider === 'sendgrid') {
    const sendGridConfig = getSendGridConfig(config)
    if (!sendGridConfig) {
      throw new Error('Configuración SendGrid incompleta')
    }
    return emailService.sendViaSendGrid(sendGridConfig, options)
  }

  const smtpConfig = getSmtpConfig(config)
  if (!smtpConfig) {
    throw new Error('Configuración SMTP incompleta')
  }
  return emailService.sendViaSMTP(
    smtpConfig,
    options.to,
    options.subject,
    options.html,
    options.text,
    options.attachments
  )
}

export async function sendWithUserEmailConfig(
  config: StoredEmailConfig,
  options: SendOptions
) {
  const primary = normalizeProvider(config.primary_provider)

  try {
    return await sendWithProvider(primary, config, options)
  } catch (primaryError) {
    const fallback = config.enable_fallback
      ? normalizeProvider(config.fallback_provider)
      : null

    if (!fallback || fallback === primary) {
      throw primaryError
    }

    console.warn('[Email] Primary provider failed; trying configured fallback', {
      primary,
      fallback,
      message: primaryError instanceof Error ? primaryError.message : 'Unknown error',
    })
    return sendWithProvider(fallback, config, options)
  }
}

export function sanitizeEmailConfig<T extends StoredEmailConfig & Record<string, unknown>>(
  config: T
) {
  const {
    smtp_password,
    smtp_password_encrypted,
    smtp_password_iv,
    smtp_password_tag,
    sendgrid_api_key_encrypted,
    sendgrid_api_key_iv,
    sendgrid_api_key_tag,
    resend_api_key,
    resend_api_key_encrypted,
    resend_api_key_iv,
    resend_api_key_tag,
    ...safe
  } = config

  return {
    ...safe,
    smtp_password: '',
    sendgrid_api_key: '',
    resend_api_key: '',
    has_smtp_password: Boolean(smtp_password_encrypted || smtp_password),
    has_sendgrid_api_key: Boolean(sendgrid_api_key_encrypted),
    has_resend_api_key: Boolean(resend_api_key_encrypted || resend_api_key),
  }
}
