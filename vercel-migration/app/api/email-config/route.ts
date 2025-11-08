import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    return NextResponse.json({ config: config || null });
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
    } = body;

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
    let finalSmtpPort = smtp_port || 587;
    
    if (!finalSmtpHost && detectedProvider) {
      if (detectedProvider === 'gmail') finalSmtpHost = 'smtp.gmail.com';
      else if (detectedProvider === 'outlook') finalSmtpHost = 'smtp-mail.outlook.com';
      else if (detectedProvider === 'yahoo') finalSmtpHost = 'smtp.mail.yahoo.com';
    }

    // Check if config exists
    const { data: existing } = await supabase
      .from('email_config')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const configData = {
      user_id: user.id,
      smtp_host: finalSmtpHost,
      smtp_port: finalSmtpPort,
      smtp_secure: smtp_secure || false,
      smtp_user,
      smtp_password,
      from_email,
      from_name,
      email_enabled: email_enabled || false,
      signature,
      daily_email_limit: daily_email_limit || (detectedProvider === 'gmail' ? 500 : 300),
      email_provider: detectedProvider,
      use_resend_fallback: use_resend_fallback || false,
      resend_api_key,
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

    return NextResponse.json({ config: result, success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
