import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Google Calendar no está configurado. Contacta al administrador.' },
        { status: 500 }
      );
    }

    // Create state with user ID for security
    const state = Buffer.from(JSON.stringify({ 
      userId: user.id,
      timestamp: Date.now()
    })).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: state
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Google Calendar auth error:', error);
    return NextResponse.json(
      { error: 'Error al iniciar autenticación' },
      { status: 500 }
    );
  }
}
