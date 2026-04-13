import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Refresh access token if expired
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) return null;
  return response.json();
}

// Get valid access token
async function getValidAccessToken(userId: string): Promise<string | null> {
  const serviceClient = getServiceClient();
  
  const { data: tokenData, error } = await serviceClient
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) return null;

  const expiresAt = new Date(tokenData.expires_at).getTime();
  const now = Date.now();
  
  if (now > expiresAt - 5 * 60 * 1000) {
    const newTokens = await refreshAccessToken(tokenData.refresh_token);
    if (!newTokens) return null;

    await serviceClient
      .from('google_calendar_tokens')
      .update({
        access_token: newTokens.access_token,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
      })
      .eq('user_id', userId);

    return newTokens.access_token;
  }

  return tokenData.access_token;
}

// GET - List events from Google Calendar
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const accessToken = await getValidAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json({ error: 'No conectado a Google Calendar' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const maxResults = searchParams.get('maxResults') || '100';

    const serviceClient = getServiceClient();
    const { data: tokenConfig } = await serviceClient
      .from('google_calendar_tokens')
      .select('calendar_id')
      .eq('user_id', user.id)
      .single();

    const calendarId = tokenConfig?.calendar_id || 'primary';

    const params = new URLSearchParams({
      timeMin,
      timeMax,
      maxResults,
      singleEvents: 'true',
      orderBy: 'startTime'
    });

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: 'Error obteniendo eventos', details: error }, { status: response.status });
    }

    const data = await response.json();

    // Filter to show only agendamedpro events or all
    const events = (data.items || []).map((event: any) => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      status: event.status,
      agendamedproId: event.extendedProperties?.private?.agendamedpro_id
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json({ error: 'Error obteniendo eventos' }, { status: 500 });
  }
}

// POST - Create event in Google Calendar
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const accessToken = await getValidAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json({ error: 'No conectado a Google Calendar' }, { status: 401 });
    }

    const body = await request.json();
    const { summary, description, startDateTime, endDateTime, appointmentId } = body;

    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    const { data: tokenConfig } = await serviceClient
      .from('google_calendar_tokens')
      .select('calendar_id')
      .eq('user_id', user.id)
      .single();

    const calendarId = tokenConfig?.calendar_id || 'primary';

    const event = {
      summary,
      description,
      start: { dateTime: startDateTime, timeZone: 'America/Mexico_City' },
      end: { dateTime: endDateTime, timeZone: 'America/Mexico_City' },
      extendedProperties: appointmentId ? {
        private: { agendamedpro_id: String(appointmentId) }
      } : undefined
    };

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: 'Error creando evento', details: error }, { status: response.status });
    }

    const createdEvent = await response.json();

    // If linked to appointment, store sync record
    if (appointmentId) {
      await serviceClient
        .from('google_calendar_sync')
        .upsert({
          user_id: user.id,
          appointment_id: appointmentId,
          google_event_id: createdEvent.id,
          last_synced_at: new Date().toISOString()
        }, { onConflict: 'appointment_id,user_id' });
    }

    return NextResponse.json({ event: createdEvent });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Error creando evento' }, { status: 500 });
  }
}

// DELETE - Delete event from Google Calendar
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const accessToken = await getValidAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json({ error: 'No conectado a Google Calendar' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'eventId requerido' }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    const { data: tokenConfig } = await serviceClient
      .from('google_calendar_tokens')
      .select('calendar_id')
      .eq('user_id', user.id)
      .single();

    const calendarId = tokenConfig?.calendar_id || 'primary';

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!response.ok && response.status !== 410) { // 410 = already deleted
      return NextResponse.json({ error: 'Error eliminando evento' }, { status: response.status });
    }

    // Remove sync record if exists
    await serviceClient
      .from('google_calendar_sync')
      .delete()
      .eq('google_event_id', eventId)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Error eliminando evento' }, { status: 500 });
  }
}
