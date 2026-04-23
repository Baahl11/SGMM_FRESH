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

// Get valid access token, refreshing if needed
async function getValidAccessToken(userId: string): Promise<string | null> {
  const serviceClient = getServiceClient();
  
  const { data: tokenData, error } = await serviceClient
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) return null;

  // Check if token is expired (with 5 min buffer)
  const expiresAt = new Date(tokenData.expires_at).getTime();
  const now = Date.now();
  
  if (now > expiresAt - 5 * 60 * 1000) {
    // Token expired, refresh it
    const newTokens = await refreshAccessToken(tokenData.refresh_token);
    if (!newTokens) return null;

    // Update tokens in database
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

// Convert appointment to Google Calendar event
function appointmentToGoogleEvent(appointment: any) {
  const startTime = new Date(appointment.fecha_hora);
  const durationMinutes = Number(appointment.duracion_minutos) || 30;
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const patientName = appointment.patient_name || 'Paciente';
  const appointmentType = appointment.appointment_type_name || 'Cita';
  const notes = appointment.notas || appointment.notes || 'Sin notas';

  return {
    summary: `${patientName} - ${appointmentType}`,
    description: `Paciente: ${patientName}\nTeléfono: ${appointment.patient_phone || 'N/A'}\nNotas: ${notes}`,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'America/Mexico_City'
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'America/Mexico_City'
    },
    extendedProperties: {
      private: {
        agendamedpro_id: String(appointment.id),
        patient_id: String(appointment.patient_id || '')
      }
    }
  };
}

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

    const serviceClient = getServiceClient();
    
    // Get user's token config
    const { data: tokenConfig } = await serviceClient
      .from('google_calendar_tokens')
      .select('calendar_id, last_sync_at')
      .eq('user_id', user.id)
      .single();

    const calendarId = tokenConfig?.calendar_id || 'primary';

    // Get appointments that need syncing (created/updated since last sync)
    let appointmentsQuery = supabase
      .from('appointments')
      .select(`
        id,
        fecha_hora,
        duracion_minutos,
        estado,
        notas,
        patient_id,
        patient:patients(id, nombre, apellido, telefono),
        appointment_type:appointment_types!appointments_appointment_type_id_fkey(nombre, duracion_minutos)
      `)
      .eq('user_id', user.id)
      .in('estado', ['programada', 'confirmada'])
      .gte('fecha_hora', new Date().toISOString());

    if (tokenConfig?.last_sync_at) {
      appointmentsQuery = appointmentsQuery.gt('updated_at', tokenConfig.last_sync_at);
    }

    const { data: appointments, error: appointmentsError } = await appointmentsQuery;

    if (appointmentsError) {
      return NextResponse.json({ error: 'Error obteniendo citas' }, { status: 500 });
    }

    let eventsExported = 0;
    let eventsUpdated = 0;
    let errors: string[] = [];

    // Process each appointment
    for (const apt of appointments || []) {
      // Handle joined data - Supabase returns single object or null for singular relations
      const patient = Array.isArray(apt.patient) ? apt.patient[0] : apt.patient;
      const appointmentType = Array.isArray(apt.appointment_type) ? apt.appointment_type[0] : apt.appointment_type;

      const patientName = patient?.nombre || patient?.apellido
        ? `${patient?.nombre || ''} ${patient?.apellido || ''}`.trim()
        : undefined;

      const appointment = {
        ...apt,
        patient_name: patientName,
        patient_phone: patient?.telefono,
        appointment_type_name: appointmentType?.nombre,
        duracion_minutos: appointmentType?.duracion_minutos || apt.duracion_minutos,
        notas: apt.notas
      };

      const googleEvent = appointmentToGoogleEvent(appointment);

      // Check if this appointment already has a Google event ID
      const { data: syncRecord } = await serviceClient
        .from('google_calendar_sync')
        .select('google_event_id')
        .eq('appointment_id', appointment.id)
        .eq('user_id', user.id)
        .single();

      try {
        if (syncRecord?.google_event_id) {
          // Update existing event
          const response = await fetch(
            `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/${syncRecord.google_event_id}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(googleEvent)
            }
          );

          if (response.ok) {
            eventsUpdated++;
          } else {
            errors.push(`Error actualizando evento para cita ${appointment.id}`);
          }
        } else {
          // Create new event
          const response = await fetch(
            `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(googleEvent)
            }
          );

          if (response.ok) {
            const createdEvent = await response.json();
            
            // Store sync record
            await serviceClient
              .from('google_calendar_sync')
              .insert({
                user_id: user.id,
                appointment_id: appointment.id,
                google_event_id: createdEvent.id,
                last_synced_at: new Date().toISOString()
              });

            eventsExported++;
          } else {
            errors.push(`Error creando evento para cita ${appointment.id}`);
          }
        }
      } catch (err) {
        errors.push(`Error procesando cita ${appointment.id}`);
      }
    }

    // Update last sync timestamp
    await serviceClient
      .from('google_calendar_tokens')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      eventsExported,
      eventsUpdated,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Error de sincronización' }, { status: 500 });
  }
}

// GET - Get sync status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const serviceClient = getServiceClient();
    
    const { data: tokenData, error } = await serviceClient
      .from('google_calendar_tokens')
      .select('google_email, calendar_id, sync_enabled, auto_sync, sync_interval_minutes, last_sync_at')
      .eq('user_id', user.id)
      .single();

    if (error || !tokenData) {
      return NextResponse.json({ connected: false });
    }

    // Count synced appointments
    const { count } = await serviceClient
      .from('google_calendar_sync')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      connected: true,
      googleEmail: tokenData.google_email,
      calendarId: tokenData.calendar_id,
      syncEnabled: tokenData.sync_enabled,
      autoSync: tokenData.auto_sync,
      syncIntervalMinutes: tokenData.sync_interval_minutes,
      lastSyncAt: tokenData.last_sync_at,
      syncedEventsCount: count || 0
    });
  } catch (error) {
    console.error('Get status error:', error);
    return NextResponse.json({ error: 'Error obteniendo estado' }, { status: 500 });
  }
}

// DELETE - Disconnect Google Calendar
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const serviceClient = getServiceClient();

    // Delete tokens
    await serviceClient
      .from('google_calendar_tokens')
      .delete()
      .eq('user_id', user.id);

    // Delete sync records
    await serviceClient
      .from('google_calendar_sync')
      .delete()
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: 'Error desconectando' }, { status: 500 });
  }
}
