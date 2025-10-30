/**
 * Buffer Time Utilities
 * Manages time buffers between appointments to prevent back-to-back scheduling
 */

export interface BufferTimeConfig {
  enabled: boolean;
  globalBufferMinutes: number; // Default buffer for all appointments
  bufferByDoctor?: Record<string, number>; // Buffer per doctor ID
  bufferByAppointmentType?: Record<string, number>; // Buffer per appointment type
  applyBeforeAppointment?: boolean; // Apply buffer before appointment
  applyAfterAppointment?: boolean; // Apply buffer after appointment
}

/**
 * Default buffer configuration
 */
export const DEFAULT_BUFFER_CONFIG: BufferTimeConfig = {
  enabled: false,
  globalBufferMinutes: 10,
  applyBeforeAppointment: false,
  applyAfterAppointment: true, // Most common: buffer after appointment
};

/**
 * Get buffer time in minutes for a specific appointment
 */
export function getBufferTimeForAppointment(
  config: BufferTimeConfig,
  doctorId?: string,
  appointmentTypeId?: string
): number {
  if (!config.enabled) return 0;

  // Priority: Appointment Type > Doctor > Global
  if (appointmentTypeId && config.bufferByAppointmentType?.[appointmentTypeId]) {
    return config.bufferByAppointmentType[appointmentTypeId];
  }

  if (doctorId && config.bufferByDoctor?.[doctorId]) {
    return config.bufferByDoctor[doctorId];
  }

  return config.globalBufferMinutes;
}

/**
 * Calculate blocked time slots due to buffer time
 * Returns array of time slots that should be blocked
 */
export function calculateBufferSlots(
  appointmentTime: string, // Format: "HH:MM"
  appointmentDuration: number, // In minutes
  bufferMinutes: number,
  applyBefore: boolean,
  applyAfter: boolean
): string[] {
  const blockedSlots: string[] = [];
  
  if (bufferMinutes === 0) return blockedSlots;

  const [hours, minutes] = appointmentTime.split(':').map(Number);
  const appointmentStart = hours * 60 + minutes;
  const appointmentEnd = appointmentStart + appointmentDuration;

  // Buffer before appointment
  if (applyBefore) {
    const bufferStart = appointmentStart - bufferMinutes;
    for (let time = bufferStart; time < appointmentStart; time += 30) {
      if (time >= 0) {
        const h = Math.floor(time / 60);
        const m = time % 60;
        blockedSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
  }

  // Buffer after appointment
  if (applyAfter) {
    const bufferEnd = appointmentEnd + bufferMinutes;
    for (let time = appointmentEnd; time < bufferEnd; time += 30) {
      const h = Math.floor(time / 60);
      const m = time % 60;
      blockedSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }

  return blockedSlots;
}

/**
 * Check if a time slot is within buffer zone of an appointment
 */
export function isTimeSlotInBuffer(
  slotTime: string, // Format: "HH:MM"
  appointmentTime: string,
  appointmentDuration: number,
  config: BufferTimeConfig,
  doctorId?: string,
  appointmentTypeId?: string
): boolean {
  if (!config.enabled) return false;

  const bufferMinutes = getBufferTimeForAppointment(config, doctorId, appointmentTypeId);
  if (bufferMinutes === 0) return false;

  const blockedSlots = calculateBufferSlots(
    appointmentTime,
    appointmentDuration,
    bufferMinutes,
    config.applyBeforeAppointment || false,
    config.applyAfterAppointment || true
  );

  return blockedSlots.includes(slotTime);
}

/**
 * Get buffer time label for UI
 */
export function getBufferTimeLabel(minutes: number): string {
  if (minutes === 0) return 'Sin buffer';
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/**
 * Load buffer configuration from localStorage
 */
export function loadBufferConfig(): BufferTimeConfig {
  if (typeof window === 'undefined') return DEFAULT_BUFFER_CONFIG;

  try {
    const saved = localStorage.getItem('buffer-time-config');
    if (saved) {
      return { ...DEFAULT_BUFFER_CONFIG, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading buffer config:', error);
  }

  return DEFAULT_BUFFER_CONFIG;
}

/**
 * Save buffer configuration to localStorage
 */
export function saveBufferConfig(config: BufferTimeConfig): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('buffer-time-config', JSON.stringify(config));
  } catch (error) {
    console.error('Error saving buffer config:', error);
  }
}

/**
 * Common buffer time presets
 */
export const BUFFER_TIME_PRESETS = [
  { label: 'Sin buffer', value: 0 },
  { label: '5 minutos', value: 5 },
  { label: '10 minutos', value: 10 },
  { label: '15 minutos', value: 15 },
  { label: '20 minutos', value: 20 },
  { label: '30 minutos', value: 30 },
  { label: '45 minutos', value: 45 },
  { label: '1 hora', value: 60 },
];
