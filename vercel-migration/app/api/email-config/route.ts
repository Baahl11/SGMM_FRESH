import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto/encryption';
import { sanitizeEmailConfig } from '@/lib/email/user-config';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: config, error } = await supabase
      .from('email_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching email config:', error);
      return NextResponse.json({ error: 'Error loading config' }, { status: 500 });
    }

    return NextResponse.json({
      config: config ? sanitizeEmailConfig(config) : null,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_user,
      smtp_password,
      from_email,
      from_name,
      email_enabled,
      signature,
      daily_email_limit,
      email_provider,
      use_resend_fallback,
      resend_api_key,
      primary_provider,
      enable_fallback,
      fallback_provider,
      sendgrid_api_key,
      sendgrid_from_email,
      sendgrid_from_name,
    } = body;

    const normalizedPrimaryProvider =
      primary_provider === 'twilio' || primary_provider === 'sendgrid'
        ? 'sendgrid'
        : 'smtp';
    const normalizedFallbackProvider =
      fallback_provider === 'twilio' || fallback_provider === 'sendgrid'
        ? 'sendgrid'
        : fallback_provider === 'smtp'
          ? 'smtp'
          : null;

    // Auto-detect provider if not specified
    let detectedProvider = email_provider;
    if (!detectedProvider && from_email) {
      const domain = from_email.split('@')[1]?.toLowerCase();
      if (domain?.includes('gmail')) detectedProvider = 'gmail';
      else if (domain?.includes('outlook') || domain?.includes('hotmail')) detectedProvider = 'outlook';
      else if (domain?.includes('yahoo')) detectedProvider = 'yahoo';
      else detectedProvider = 'custom';
    }

    // Auto-fill SMTP settings for common providers
    let finalSmtpHost = smtp_host;
    const finalSmtpPort = smtp_port || 587;
    
    if (!finalSmtpHost && detectedProvider) {
      if (detectedProvider === 'gmail') finalSmtpHost = 'smtp.gmail.com';
      else if (detectedProvider === 'outlook') finalSmtpHost = 'smtp-mail.outlook.com';
      else if (detectedProvider === 'yahoo') finalSmtpHost = 'smtp.mail.yahoo.com';
    }

    // Check if config exists
    const { data: existing } = await supabase
      .from('email_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const encryptedSmtpPassword = smtp_password ? encrypt(smtp_password) : null;
    const encryptedSendGridKey = sendgrid_api_key ? encrypt(sendgrid_api_key) : null;
    const encryptedResendKey = resend_api_key ? encrypt(resend_api_key) : null;

    if (normalizedPrimaryProvider === 'smtp') {
      const hasSmtpPassword = Boolean(
        encryptedSmtpPassword ||
        existing?.smtp_password_encrypted ||
        existing?.smtp_password
      );
      if (!smtp_user || !from_email || !hasSmtpPassword) {
        return NextResponse.json(
          { error: 'Usuario SMTP, remitente y contraseña de aplicación son requeridos' },
          { status: 400 }
        );
      }
    } else {
      const hasSendGridKey = Boolean(
        encryptedSendGridKey || existing?.sendgrid_api_key_encrypted
      );
      if (!sendgrid_from_email || !hasSendGridKey) {
        return NextResponse.json(
          { error: 'Email remitente y API key de SendGrid son requeridos' },
          { status: 400 }
        );
      }
    }

    const configData = {
      user_id: user.id,
      smtp_host: finalSmtpHost,
      smtp_port: finalSmtpPort,
      smtp_secure: smtp_secure || false,
      smtp_user,
      smtp_password: encryptedSmtpPassword ? null : existing?.smtp_password || null,
      smtp_password_encrypted:
        encryptedSmtpPassword?.encrypted || existing?.smtp_password_encrypted || null,
      smtp_password_iv:
        encryptedSmtpPassword?.iv || existing?.smtp_password_iv || null,
      smtp_password_tag:
        encryptedSmtpPassword?.tag || existing?.smtp_password_tag || null,
      from_email,
      from_name,
      email_enabled: email_enabled || false,
      signature,
      daily_email_limit: daily_email_limit || (detectedProvider === 'gmail' ? 500 : 300),
      email_provider: detectedProvider,
      use_resend_fallback: use_resend_fallback || false,
      resend_api_key: encryptedResendKey ? null : existing?.resend_api_key || null,
      resend_api_key_encrypted:
        encryptedResendKey?.encrypted || existing?.resend_api_key_encrypted || null,
      resend_api_key_iv:
        encryptedResendKey?.iv || existing?.resend_api_key_iv || null,
      resend_api_key_tag:
        encryptedResendKey?.tag || existing?.resend_api_key_tag || null,
      primary_provider: normalizedPrimaryProvider,
      enable_fallback: Boolean(enable_fallback),
      fallback_provider: normalizedFallbackProvider,
      sendgrid_api_key_encrypted:
        encryptedSendGridKey?.encrypted || existing?.sendgrid_api_key_encrypted || null,
      sendgrid_api_key_iv:
        encryptedSendGridKey?.iv || existing?.sendgrid_api_key_iv || null,
      sendgrid_api_key_tag:
        encryptedSendGridKey?.tag || existing?.sendgrid_api_key_tag || null,
      sendgrid_from_email,
      sendgrid_from_name,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existing) {
      const { data, error } = await supabase
        .from('email_config')
        .update(configData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating email config:', error);
        return NextResponse.json({ error: 'Error updating config' }, { status: 500 });
      }

      result = data;
    } else {
      const { data, error } = await supabase
        .from('email_config')
        .insert([configData])
        .select()
        .single();

      if (error) {
        console.error('Error inserting email config:', error);
        return NextResponse.json({ error: 'Error saving config' }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({
      config: sanitizeEmailConfig(result),
      success: true,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
