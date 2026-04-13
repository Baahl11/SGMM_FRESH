import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Service client for admin operations
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle errors from Google
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard/settings/google-calendar?error=auth_denied', request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/google-calendar?error=missing_params', request.url)
      );
    }

    // Decode and validate state
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        new URL('/dashboard/settings/google-calendar?error=invalid_state', request.url)
      );
    }

    const { userId, timestamp } = stateData;

    // Check state is not too old (15 minutes max)
    if (Date.now() - timestamp > 15 * 60 * 1000) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/google-calendar?error=expired', request.url)
      );
    }

    // Verify user is logged in
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/google-calendar?error=unauthorized', request.url)
      );
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/google-calendar?error=not_configured', request.url)
      );
    }

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/dashboard/settings/google-calendar?error=token_failed', request.url)
      );
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google to get email
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    let googleEmail = null;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      googleEmail = userInfo.email;
    }

    // Store tokens in database using service client
    const serviceClient = getServiceClient();
    
    const tokenData = {
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      scope: tokens.scope,
      google_email: googleEmail,
      calendar_id: 'primary',
      sync_enabled: true,
      auto_sync: true,
      sync_interval_minutes: 15
    };

    // Upsert - update if exists, insert if not
    const { error: upsertError } = await serviceClient
      .from('google_calendar_tokens')
      .upsert(tokenData, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Failed to store tokens:', upsertError);
      return NextResponse.redirect(
        new URL('/dashboard/settings/google-calendar?error=storage_failed', request.url)
      );
    }

    // Success - redirect back to settings
    return NextResponse.redirect(
      new URL('/dashboard/settings/google-calendar?success=connected', request.url)
    );
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings/google-calendar?error=unknown', request.url)
    );
  }
}
