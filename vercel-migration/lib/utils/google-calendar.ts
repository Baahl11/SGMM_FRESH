/**
 * Google Calendar Integration Utilities
 * Handles OAuth, API calls, and event synchronization
 */

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret?: string; // Only for server-side
  redirectUri: string;
  scopes: string[];
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // in minutes
  calendarId: string; // 'primary' or specific calendar ID
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  colorId?: string;
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
}

export interface SyncStatus {
  lastSyncAt?: string;
  syncInProgress: boolean;
  syncError?: string;
  eventsImported: number;
  eventsExported: number;
  conflicts: number;
}

/**
 * Default Google Calendar configuration
 */
export const DEFAULT_GOOGLE_CALENDAR_CONFIG: GoogleCalendarConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  redirectUri: typeof window !== 'undefined' 
    ? `${window.location.origin}/api/auth/google/callback`
    : '',
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ],
  enabled: false,
  autoSync: false,
  syncInterval: 15, // 15 minutes
  calendarId: 'primary'
};

/**
 * Convert appointment to Google Calendar event
 */
export function appointmentToGoogleEvent(appointment: any): Partial<GoogleCalendarEvent> {
  const startDateTime = `${appointment.fecha}T${appointment.appointment_time || '09:00'}:00`;
  const duration = appointment.duration || 30; // default 30 min
  
  const endDate = new Date(startDateTime);
  endDate.setMinutes(endDate.getMinutes() + duration);
  const endDateTime = endDate.toISOString().slice(0, 19);

  return {
    summary: `${appointment.patient_name || 'Paciente'} - ${appointment.treatment_name || 'Cita'}`,
    description: [
      appointment.notes,
      appointment.doctor_name ? `Doctor: ${appointment.doctor_name}` : '',
      appointment.phone ? `Tel: ${appointment.phone}` : '',
      appointment.consultorio_name ? `Consultorio: ${appointment.consultorio_name}` : ''
    ].filter(Boolean).join('\n'),
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Mexico_City' // Adjust based on your timezone
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Mexico_City'
    },
    status: appointment.status === 'cancelled' ? 'cancelled' : 'confirmed',
    colorId: getColorIdForStatus(appointment.status),
    extendedProperties: {
      private: {
        agendamedpro_id: appointment.id.toString(),
        agendamedpro_patient_id: appointment.patient_id.toString(),
        agendamedpro_status: appointment.status || 'scheduled'
      }
    }
  };
}

/**
 * Convert Google Calendar event to appointment
 */
export function googleEventToAppointment(event: GoogleCalendarEvent): Partial<any> {
  const startDate = new Date(event.start.dateTime);
  const endDate = new Date(event.end.dateTime);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  return {
    fecha: startDate.toISOString().split('T')[0],
    appointment_time: startDate.toTimeString().slice(0, 5),
    duration,
    patient_name: event.summary,
    notes: event.description,
    status: event.status === 'cancelled' ? 'cancelled' : 'scheduled',
    google_calendar_event_id: event.id,
    synced_with_google: true
  };
}

/**
 * Get Google Calendar color ID for appointment status
 */
function getColorIdForStatus(status?: string): string {
  // Google Calendar color IDs: https://developers.google.com/calendar/api/v3/reference/colors
  const colorMap: Record<string, string> = {
    'confirmed': '10', // Green
    'scheduled': '5',  // Yellow
    'completed': '9',  // Blue
    'cancelled': '11', // Red
    'no-show': '3',    // Purple
    'pendiente': '5'   // Yellow
  };
  return colorMap[status || 'scheduled'] || '5';
}

/**
 * Check if appointment is synced with Google Calendar
 */
export function isSyncedWithGoogle(appointment: any): boolean {
  return Boolean(appointment.google_calendar_event_id);
}

/**
 * Generate OAuth URL for Google Calendar
 */
export function generateGoogleOAuthUrl(config: GoogleCalendarConfig, state?: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state })
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Detect conflicts between local and Google events
 */
export function detectSyncConflicts(
  localAppointment: any,
  googleEvent: GoogleCalendarEvent
): { hasConflict: boolean; conflicts: string[] } {
  const conflicts: string[] = [];

  // Check if times differ
  const localStart = `${localAppointment.fecha}T${localAppointment.appointment_time}:00`;
  const googleStart = googleEvent.start.dateTime.slice(0, 16) + ':00';

  if (localStart !== googleStart) {
    conflicts.push('Horario diferente');
  }

  // Check if summary differs
  const localSummary = `${localAppointment.patient_name} - ${localAppointment.treatment_name}`;
  if (googleEvent.summary !== localSummary) {
    conflicts.push('Título diferente');
  }

  // Check if status differs
  const localStatus = localAppointment.status === 'cancelled' ? 'cancelled' : 'confirmed';
  if (googleEvent.status !== localStatus) {
    conflicts.push('Estado diferente');
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

/**
 * Get sync status label
 */
export function getSyncStatusLabel(status: SyncStatus): string {
  if (status.syncInProgress) {
    return 'Sincronizando...';
  }
  
  if (status.syncError) {
    return 'Error en sincronización';
  }

  if (status.lastSyncAt) {
    const lastSync = new Date(status.lastSyncAt);
    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - lastSync.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Sincronizado ahora';
    if (diffMinutes < 60) return `Sincronizado hace ${diffMinutes} min`;
    
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `Sincronizado hace ${diffHours}h`;
    
    return `Sincronizado ${lastSync.toLocaleDateString('es-ES')}`;
  }

  return 'No sincronizado';
}

/**
 * Load Google Calendar config from localStorage
 */
export function loadGoogleCalendarConfig(): GoogleCalendarConfig {
  if (typeof window === 'undefined') return DEFAULT_GOOGLE_CALENDAR_CONFIG;

  try {
    const saved = localStorage.getItem('google-calendar-config');
    if (saved) {
      return { ...DEFAULT_GOOGLE_CALENDAR_CONFIG, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading Google Calendar config:', error);
  }

  return DEFAULT_GOOGLE_CALENDAR_CONFIG;
}

/**
 * Save Google Calendar config to localStorage
 */
export function saveGoogleCalendarConfig(config: Partial<GoogleCalendarConfig>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = loadGoogleCalendarConfig();
    const updated = { ...current, ...config };
    localStorage.setItem('google-calendar-config', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving Google Calendar config:', error);
  }
}

/**
 * Load sync status from localStorage
 */
export function loadSyncStatus(): SyncStatus {
  if (typeof window === 'undefined') {
    return { syncInProgress: false, eventsImported: 0, eventsExported: 0, conflicts: 0 };
  }

  try {
    const saved = localStorage.getItem('google-calendar-sync-status');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading sync status:', error);
  }

  return { syncInProgress: false, eventsImported: 0, eventsExported: 0, conflicts: 0 };
}

/**
 * Save sync status to localStorage
 */
export function saveSyncStatus(status: SyncStatus): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('google-calendar-sync-status', JSON.stringify(status));
  } catch (error) {
    console.error('Error saving sync status:', error);
  }
}

/**
 * Clear Google Calendar sync data
 */
export function clearGoogleCalendarData(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('google-calendar-config');
    localStorage.removeItem('google-calendar-sync-status');
    localStorage.removeItem('google-calendar-access-token');
    localStorage.removeItem('google-calendar-refresh-token');
  } catch (error) {
    console.error('Error clearing Google Calendar data:', error);
  }
}

/**
 * Conflict resolution strategies
 */
export const CONFLICT_RESOLUTION_STRATEGIES = {
  'local-wins': 'Local (AgendaMedPro) gana',
  'google-wins': 'Google Calendar gana',
  'newest-wins': 'El más reciente gana',
  'manual': 'Resolver manualmente'
} as const;

export type ConflictResolutionStrategy = keyof typeof CONFLICT_RESOLUTION_STRATEGIES;
