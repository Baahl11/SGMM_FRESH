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
}

class SimpleCalendarService {
  private config: CalendarConfig = {
    enabled: false,
    doctorEmail: '',
  };

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('calendar_config');
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
      }
    }
  }

  configure(doctorEmail: string) {
    this.config = {
      enabled: true,
      doctorEmail,
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
    return this.config.enabled && !!this.config.doctorEmail;
  }

  getConfig(): CalendarConfig {
    return { ...this.config };
  }

  disconnect() {
    this.config = {
      enabled: false,
      doctorEmail: '',
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
