/**
 * SMS Reminders System
 * Handles automatic SMS reminders for appointments with Twilio integration
 */

export type ReminderTiming = '24h' | '12h' | '6h' | '2h' | '1h' | 'custom';

export type ReminderStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';

export type SmsProvider = 'twilio' | 'messagebird' | 'vonage' | 'manual';

export interface SmsReminderConfig {
  enabled: boolean;
  provider: SmsProvider;
  default_timings: ReminderTiming[];
  send_confirmation: boolean; // Send confirmation when appointment is booked
  send_day_before: boolean;
  send_hours_before: number;
  custom_hours?: number[];
  include_doctor_name: boolean;
  include_location: boolean;
  include_cancelation_link: boolean;
  require_confirmation: boolean;
  auto_cancel_on_no_response: boolean;
  country_code: string;
  business_hours_only: boolean;
  quiet_hours_start: string; // "22:00"
  quiet_hours_end: string; // "08:00"
}

export interface SmsReminder {
  id: string;
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  appointment_date: string;
  appointment_time: string;
  doctor_name?: string;
  scheduled_send_time: string;
  actual_send_time?: string;
  status: ReminderStatus;
  message: string;
  timing: ReminderTiming;
  custom_hours?: number;
  provider: SmsProvider;
  provider_message_id?: string;
  error_message?: string;
  confirmed_at?: string;
  confirmation_response?: string;
  retry_count: number;
  created_at: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  timing: ReminderTiming;
  message: string;
  variables: string[]; // ['patient_name', 'date', 'time', 'doctor_name', etc]
  is_default: boolean;
}

export interface SmsStats {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_pending: number;
  delivery_rate: number;
  confirmation_rate: number;
  last_sent?: string;
}

/**
 * Default SMS reminder configuration
 */
export const DEFAULT_SMS_CONFIG: SmsReminderConfig = {
  enabled: false,
  provider: 'twilio',
  default_timings: ['24h', '2h'],
  send_confirmation: true,
  send_day_before: true,
  send_hours_before: 2,
  include_doctor_name: true,
  include_location: false,
  include_cancelation_link: false,
  require_confirmation: false,
  auto_cancel_on_no_response: false,
  country_code: '+52',
  business_hours_only: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00'
};

/**
 * Default SMS templates
 */
export const DEFAULT_SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'confirmation',
    name: 'Confirmación de Cita',
    timing: '24h',
    message: 'Hola {patient_name}, tu cita con {doctor_name} ha sido confirmada para el {date} a las {time}. ¡Te esperamos!',
    variables: ['patient_name', 'doctor_name', 'date', 'time'],
    is_default: true
  },
  {
    id: 'reminder-24h',
    name: 'Recordatorio 24 horas',
    timing: '24h',
    message: 'Recordatorio: Tienes cita mañana {date} a las {time} con {doctor_name}. Responde SI para confirmar.',
    variables: ['patient_name', 'date', 'time', 'doctor_name'],
    is_default: true
  },
  {
    id: 'reminder-2h',
    name: 'Recordatorio 2 horas',
    timing: '2h',
    message: '⏰ Tu cita con {doctor_name} es en 2 horas ({time}). Te esperamos en {location}.',
    variables: ['patient_name', 'doctor_name', 'time', 'location'],
    is_default: true
  },
  {
    id: 'reminder-1h',
    name: 'Recordatorio 1 hora',
    timing: '1h',
    message: '⏰ Tu cita es en 1 hora ({time}). ¡No olvides llegar 10 minutos antes!',
    variables: ['time'],
    is_default: true
  }
];

/**
 * Timing options configuration
 */
export const TIMING_OPTIONS = {
  '24h': { label: '24 horas antes', hours: 24 },
  '12h': { label: '12 horas antes', hours: 12 },
  '6h': { label: '6 horas antes', hours: 6 },
  '2h': { label: '2 horas antes', hours: 2 },
  '1h': { label: '1 hora antes', hours: 1 },
  'custom': { label: 'Personalizado', hours: 0 }
} as const;

/**
 * SMS Provider configuration
 */
export const SMS_PROVIDERS = {
  twilio: {
    name: 'Twilio',
    requires: ['account_sid', 'auth_token', 'phone_number'],
    pricing: '$0.0075 por SMS',
    features: ['Entrega confirmada', 'Respuestas bidireccionales', 'URLs cortas']
  },
  messagebird: {
    name: 'MessageBird',
    requires: ['api_key'],
    pricing: '$0.006 por SMS',
    features: ['Multi-país', 'Número virtual', 'APIs REST']
  },
  vonage: {
    name: 'Vonage (Nexmo)',
    requires: ['api_key', 'api_secret'],
    pricing: '$0.0057 por SMS',
    features: ['Global', 'Verificación 2FA', 'APIs avanzadas']
  },
  manual: {
    name: 'Manual',
    requires: [],
    pricing: 'Gratis',
    features: ['Sin integración', 'Copiar y pegar', 'Para testing']
  }
} as const;

/**
 * Generate unique reminder ID
 */
export function generateReminderId(): string {
  return `reminder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate when to send reminder based on timing
 */
export function calculateSendTime(
  appointmentDate: string,
  appointmentTime: string,
  timing: ReminderTiming,
  customHours?: number
): Date {
  const [year, month, day] = appointmentDate.split('-').map(Number);
  const [hours, minutes] = appointmentTime.split(':').map(Number);
  
  const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
  
  let hoursBeforeAppointment: number;
  
  if (timing === 'custom' && customHours !== undefined) {
    hoursBeforeAppointment = customHours;
  } else {
    hoursBeforeAppointment = TIMING_OPTIONS[timing].hours;
  }
  
  const sendTime = new Date(appointmentDateTime);
  sendTime.setHours(sendTime.getHours() - hoursBeforeAppointment);
  
  return sendTime;
}

/**
 * Check if send time is within quiet hours
 */
export function isWithinQuietHours(
  sendTime: Date,
  config: SmsReminderConfig
): boolean {
  const hour = sendTime.getHours();
  const minute = sendTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  const [quietStartHour, quietStartMinute] = config.quiet_hours_start.split(':').map(Number);
  const quietStartMinutes = quietStartHour * 60 + quietStartMinute;
  
  const [quietEndHour, quietEndMinute] = config.quiet_hours_end.split(':').map(Number);
  const quietEndMinutes = quietEndHour * 60 + quietEndMinute;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (quietStartMinutes > quietEndMinutes) {
    return timeInMinutes >= quietStartMinutes || timeInMinutes <= quietEndMinutes;
  }
  
  return timeInMinutes >= quietStartMinutes && timeInMinutes <= quietEndMinutes;
}

/**
 * Adjust send time if it falls within quiet hours
 */
export function adjustForQuietHours(
  sendTime: Date,
  config: SmsReminderConfig
): Date {
  if (!config.business_hours_only) return sendTime;
  
  if (isWithinQuietHours(sendTime, config)) {
    const [endHour, endMinute] = config.quiet_hours_end.split(':').map(Number);
    const adjustedTime = new Date(sendTime);
    adjustedTime.setHours(endHour, endMinute, 0, 0);
    
    // If adjustment pushes it past appointment time, send immediately
    return adjustedTime;
  }
  
  return sendTime;
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string, countryCode: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If already has country code, return as is
  if (digits.startsWith(countryCode.replace('+', ''))) {
    return `+${digits}`;
  }
  
  // Add country code
  return `${countryCode}${digits}`;
}

/**
 * Validate phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Replace template variables with actual values
 */
export function formatSmsMessage(
  template: string,
  variables: Record<string, string>
): string {
  let message = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return message;
}

/**
 * Get SMS template by timing
 */
export function getTemplateByTiming(timing: ReminderTiming): SmsTemplate | undefined {
  return DEFAULT_SMS_TEMPLATES.find(
    template => template.timing === timing && template.is_default
  );
}

/**
 * Generate reminder message
 */
export function generateReminderMessage(
  config: SmsReminderConfig,
  appointment: {
    patient_name: string;
    date: string;
    time: string;
    doctor_name?: string;
    location?: string;
  },
  timing: ReminderTiming
): string {
  const template = getTemplateByTiming(timing);
  
  if (!template) {
    // Fallback message
    return `Recordatorio: Tu cita es el ${appointment.date} a las ${appointment.time}.`;
  }
  
  const variables: Record<string, string> = {
    patient_name: appointment.patient_name,
    date: new Date(appointment.date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }),
    time: appointment.time
  };
  
  if (config.include_doctor_name && appointment.doctor_name) {
    variables.doctor_name = appointment.doctor_name;
  }
  
  if (config.include_location && appointment.location) {
    variables.location = appointment.location;
  }
  
  return formatSmsMessage(template.message, variables);
}

/**
 * Check if reminder should be sent
 */
export function shouldSendReminder(
  reminder: SmsReminder,
  config: SmsReminderConfig
): boolean {
  // Don't send if disabled
  if (!config.enabled) return false;
  
  // Don't send if already sent or cancelled
  if (reminder.status === 'sent' || reminder.status === 'cancelled') return false;
  
  // Check if it's time to send
  const now = new Date();
  const sendTime = new Date(reminder.scheduled_send_time);
  
  return now >= sendTime;
}

/**
 * Get reminders statistics
 */
export function getReminderStats(reminders: SmsReminder[]): SmsStats {
  const total_sent = reminders.filter(r => r.status === 'sent' || r.status === 'delivered').length;
  const total_delivered = reminders.filter(r => r.status === 'delivered').length;
  const total_failed = reminders.filter(r => r.status === 'failed').length;
  const total_pending = reminders.filter(r => r.status === 'pending').length;
  
  const delivery_rate = total_sent > 0 ? (total_delivered / total_sent) * 100 : 0;
  
  const confirmed = reminders.filter(r => r.confirmed_at !== undefined).length;
  const confirmation_rate = total_sent > 0 ? (confirmed / total_sent) * 100 : 0;
  
  const lastSent = reminders
    .filter(r => r.actual_send_time)
    .sort((a, b) => new Date(b.actual_send_time!).getTime() - new Date(a.actual_send_time!).getTime())[0];
  
  return {
    total_sent,
    total_delivered,
    total_failed,
    total_pending,
    delivery_rate: Math.round(delivery_rate * 10) / 10,
    confirmation_rate: Math.round(confirmation_rate * 10) / 10,
    last_sent: lastSent?.actual_send_time
  };
}

/**
 * Get status badge color
 */
export function getReminderStatusColor(status: ReminderStatus): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    sent: 'bg-blue-100 text-blue-800 border-blue-300',
    delivered: 'bg-green-100 text-green-800 border-green-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-300'
  };
  return colors[status];
}

/**
 * Get status label in Spanish
 */
export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: 'Pendiente',
  sent: 'Enviado',
  delivered: 'Entregado',
  failed: 'Fallido',
  cancelled: 'Cancelado'
};

/**
 * Load SMS config from localStorage
 */
export function loadSmsConfig(): SmsReminderConfig {
  if (typeof window === 'undefined') return DEFAULT_SMS_CONFIG;
  
  try {
    const saved = localStorage.getItem('sms-reminder-config');
    if (saved) {
      return { ...DEFAULT_SMS_CONFIG, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading SMS config:', error);
  }
  
  return DEFAULT_SMS_CONFIG;
}

/**
 * Save SMS config to localStorage
 */
export function saveSmsConfig(config: Partial<SmsReminderConfig>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const current = loadSmsConfig();
    const updated = { ...current, ...config };
    localStorage.setItem('sms-reminder-config', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving SMS config:', error);
  }
}

/**
 * Estimate SMS cost
 */
export function estimateMonthlyCost(
  appointmentsPerDay: number,
  remindersPerAppointment: number,
  provider: SmsProvider
): { total: number; perAppointment: number; currency: string } {
  const pricing: Record<SmsProvider, number> = {
    twilio: 0.0075,
    messagebird: 0.006,
    vonage: 0.0057,
    manual: 0
  };
  
  const costPerSms = pricing[provider];
  const dailyCost = appointmentsPerDay * remindersPerAppointment * costPerSms;
  const monthlyCost = dailyCost * 30;
  
  return {
    total: Math.round(monthlyCost * 100) / 100,
    perAppointment: Math.round(remindersPerAppointment * costPerSms * 100) / 100,
    currency: 'USD'
  };
}
