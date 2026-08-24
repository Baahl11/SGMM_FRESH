-- Per-tenant email provider selection and encrypted credentials.
ALTER TABLE public.email_config
  ADD COLUMN IF NOT EXISTS primary_provider TEXT DEFAULT 'smtp',
  ADD COLUMN IF NOT EXISTS enable_fallback BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fallback_provider TEXT,
  ADD COLUMN IF NOT EXISTS smtp_password_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS smtp_password_iv TEXT,
  ADD COLUMN IF NOT EXISTS smtp_password_tag TEXT,
  ADD COLUMN IF NOT EXISTS sendgrid_api_key_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS sendgrid_api_key_iv TEXT,
  ADD COLUMN IF NOT EXISTS sendgrid_api_key_tag TEXT,
  ADD COLUMN IF NOT EXISTS sendgrid_from_email TEXT,
  ADD COLUMN IF NOT EXISTS sendgrid_from_name TEXT,
  ADD COLUMN IF NOT EXISTS resend_api_key_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS resend_api_key_iv TEXT,
  ADD COLUMN IF NOT EXISTS resend_api_key_tag TEXT;

UPDATE public.email_config
SET primary_provider = CASE
  WHEN primary_provider IN ('twilio', 'sendgrid') THEN 'sendgrid'
  ELSE 'smtp'
END
WHERE primary_provider IS NULL OR primary_provider NOT IN ('smtp', 'sendgrid');

UPDATE public.email_config
SET fallback_provider = CASE
  WHEN fallback_provider IN ('twilio', 'sendgrid') THEN 'sendgrid'
  WHEN fallback_provider = 'smtp' THEN 'smtp'
  ELSE NULL
END
WHERE fallback_provider IS NOT NULL;

COMMENT ON COLUMN public.email_config.smtp_password_encrypted
  IS 'AES-256-GCM encrypted SMTP app password.';
COMMENT ON COLUMN public.email_config.sendgrid_api_key_encrypted
  IS 'AES-256-GCM encrypted tenant SendGrid API key.';
COMMENT ON COLUMN public.email_config.resend_api_key_encrypted
  IS 'AES-256-GCM encrypted tenant Resend API key.';
