// Simple Calendar Integration - Generates Google Calendar links
interface CalendarEvent {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  patientEmail?: string;
  patientName: string;
  patientPhone: string;
  location?: string;
}

interface CalendarConfig {
  enabled: boolean;
  doctorEmail: string;
  calendarId: string;
  serviceAccountKey?: string;
}

class SimpleCalendarService {
  private config: CalendarConfig = {
    enabled: false,
    doctorEmail: '',
    calendarId: 'primary',
    serviceAccountKey: undefined,
  };

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('calendar_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig) as Partial<CalendarConfig>;
        this.config = {
          ...this.config,
          ...parsed,
        };
      }
    }
  }

  async initialize(serviceAccountKey: string, calendarId: string) {
    this.config = {
      ...this.config,
      enabled: true,
      calendarId,
      serviceAccountKey,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('calendar_config', JSON.stringify(this.config));
    }
  }

  configure(doctorEmail: string) {
    this.config = {
      enabled: true,
      doctorEmail,
      calendarId: this.config.calendarId,
      serviceAccountKey: this.config.serviceAccountKey,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('calendar_config', JSON.stringify(this.config));
    }
  }

  createGoogleCalendarLink(eventData: CalendarEvent): string {
    // Formatear fechas para Google Calendar (YYYYMMDDTHHMMSSZ)
    const formatDateForGoogle = (dateTimeString: string): string => {
      const date = new Date(dateTimeString);
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = formatDateForGoogle(eventData.startDateTime);
    const endDate = formatDateForGoogle(eventData.endDateTime);

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: eventData.title,
      dates: `${startDate}/${endDate}`,
      details: `${eventData.description}\n\nPaciente: ${eventData.patientName}\nTeléfono: ${eventData.patientPhone}`,
      location: eventData.location || 'Consultorio Médico',
    });

    // Agregar invitados si están configurados
    const guests = [];
    if (this.config.doctorEmail) {
      guests.push(this.config.doctorEmail);
    }
    if (eventData.patientEmail) {
      guests.push(eventData.patientEmail);
    }
    
    if (guests.length > 0) {
      params.append('add', guests.join(','));
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  openCalendarEvent(eventData: CalendarEvent) {
    const link = this.createGoogleCalendarLink(eventData);
    window.open(link, '_blank');
  }

  isConfigured(): boolean {
    return this.config.enabled && (!!this.config.doctorEmail || !!this.config.serviceAccountKey);
  }

  getConfig(): CalendarConfig {
    return { ...this.config };
  }

  disconnect() {
    this.config = {
      enabled: false,
      doctorEmail: '',
      calendarId: 'primary',
      serviceAccountKey: undefined,
    };

    if (typeof window !== 'undefined') {
      localStorage.removeItem('calendar_config');
    }
  }
}

// Singleton instance
const simpleCalendarService = new SimpleCalendarService();
export default simpleCalendarService;
export type { CalendarEvent, CalendarConfig };
