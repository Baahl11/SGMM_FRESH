/**
 * Waitlist Management Utilities
 * Handles patient waitlist, automatic notifications, and priority queues
 */

export type WaitlistPriority = 'low' | 'normal' | 'high' | 'urgent';

export type WaitlistStatus = 'active' | 'notified' | 'booked' | 'expired' | 'cancelled';

export interface WaitlistEntry {
  id: string;
  patient_id: number;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  doctor_id?: string;
  doctor_name?: string;
  appointment_type_id?: string;
  appointment_type_name?: string;
  preferred_dates?: string[]; // Array of YYYY-MM-DD
  preferred_times?: string[]; // Array of "HH:MM"
  preferred_days_of_week?: number[]; // 0-6, Sunday = 0
  priority: WaitlistPriority;
  status: WaitlistStatus;
  reason?: string;
  notes?: string;
  created_at: string;
  notified_at?: string;
  expires_at?: string;
  auto_book?: boolean; // Auto-book when slot becomes available
}

export interface WaitlistNotification {
  id: string;
  waitlist_entry_id: string;
  patient_id: number;
  available_slot: {
    date: string;
    time: string;
    doctor_name?: string;
  };
  notified_at: string;
  expires_at: string;
  response?: 'accepted' | 'declined' | 'expired';
  responded_at?: string;
}

export interface WaitlistSettings {
  enabled: boolean;
  auto_notify: boolean;
  notification_methods: ('email' | 'sms' | 'whatsapp')[];
  notification_window_hours: number; // Hours before expiration
  max_notifications_per_day: number;
  priority_booking: boolean;
  auto_book_for_vip: boolean;
}

/**
 * Default waitlist settings
 */
export const DEFAULT_WAITLIST_SETTINGS: WaitlistSettings = {
  enabled: true,
  auto_notify: true,
  notification_methods: ['email'],
  notification_window_hours: 24,
  max_notifications_per_day: 10,
  priority_booking: true,
  auto_book_for_vip: false
};

/**
 * Priority levels configuration
 */
export const PRIORITY_CONFIG = {
  low: {
    label: 'Baja',
    color: 'gray',
    weight: 1,
    description: 'Sin urgencia'
  },
  normal: {
    label: 'Normal',
    color: 'blue',
    weight: 2,
    description: 'Prioridad estándar'
  },
  high: {
    label: 'Alta',
    color: 'orange',
    weight: 3,
    description: 'Requiere atención pronta'
  },
  urgent: {
    label: 'Urgente',
    color: 'red',
    weight: 4,
    description: 'Requiere atención inmediata'
  }
} as const;

/**
 * Status labels in Spanish
 */
export const STATUS_LABELS: Record<WaitlistStatus, string> = {
  active: 'En espera',
  notified: 'Notificado',
  booked: 'Agendado',
  expired: 'Expirado',
  cancelled: 'Cancelado'
};

/**
 * Generate unique waitlist entry ID
 */
export function generateWaitlistId(): string {
  return `waitlist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sort waitlist by priority and creation date
 */
export function sortWaitlistByPriority(entries: WaitlistEntry[]): WaitlistEntry[] {
  return entries.sort((a, b) => {
    // First by priority weight (higher first)
    const priorityDiff = PRIORITY_CONFIG[b.priority].weight - PRIORITY_CONFIG[a.priority].weight;
    if (priorityDiff !== 0) return priorityDiff;

    // Then by creation date (older first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/**
 * Check if slot matches waitlist entry preferences
 */
export function matchesPreferences(
  entry: WaitlistEntry,
  slot: { date: string; time: string; doctor_id?: string }
): boolean {
  // Check doctor preference
  if (entry.doctor_id && slot.doctor_id && entry.doctor_id !== slot.doctor_id) {
    return false;
  }

  // Check preferred dates
  if (entry.preferred_dates && entry.preferred_dates.length > 0) {
    if (!entry.preferred_dates.includes(slot.date)) {
      return false;
    }
  }

  // Check preferred times
  if (entry.preferred_times && entry.preferred_times.length > 0) {
    if (!entry.preferred_times.includes(slot.time)) {
      return false;
    }
  }

  // Check preferred days of week
  if (entry.preferred_days_of_week && entry.preferred_days_of_week.length > 0) {
    const dayOfWeek = new Date(slot.date).getDay();
    if (!entry.preferred_days_of_week.includes(dayOfWeek)) {
      return false;
    }
  }

  return true;
}

/**
 * Find matching waitlist entries for a cancelled/available slot
 */
export function findMatchingWaitlistEntries(
  waitlist: WaitlistEntry[],
  slot: { date: string; time: string; doctor_id?: string }
): WaitlistEntry[] {
  const activeEntries = waitlist.filter(entry => entry.status === 'active');
  const matchingEntries = activeEntries.filter(entry => matchesPreferences(entry, slot));
  return sortWaitlistByPriority(matchingEntries);
}

/**
 * Check if waitlist entry has expired
 */
export function isWaitlistExpired(entry: WaitlistEntry): boolean {
  if (!entry.expires_at) return false;
  
  const expiryDate = new Date(entry.expires_at);
  const now = new Date();
  
  return now > expiryDate;
}

/**
 * Calculate waitlist position
 */
export function calculateWaitlistPosition(
  entry: WaitlistEntry,
  allEntries: WaitlistEntry[]
): number {
  const sorted = sortWaitlistByPriority(allEntries.filter(e => e.status === 'active'));
  return sorted.findIndex(e => e.id === entry.id) + 1;
}

/**
 * Get waitlist statistics
 */
export function getWaitlistStats(entries: WaitlistEntry[]): {
  total: number;
  active: number;
  notified: number;
  booked: number;
  expired: number;
  byPriority: Record<WaitlistPriority, number>;
} {
  const stats = {
    total: entries.length,
    active: 0,
    notified: 0,
    booked: 0,
    expired: 0,
    byPriority: {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0
    }
  };

  entries.forEach(entry => {
    switch (entry.status) {
      case 'active':
        stats.active++;
        break;
      case 'notified':
        stats.notified++;
        break;
      case 'booked':
        stats.booked++;
        break;
      case 'expired':
        stats.expired++;
        break;
    }

    stats.byPriority[entry.priority]++;
  });

  return stats;
}

/**
 * Format waitlist entry for notification
 */
export function formatWaitlistNotification(
  entry: WaitlistEntry,
  slot: { date: string; time: string; doctor_name?: string }
): string {
  const date = new Date(slot.date);
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const parts = [
    `Hola ${entry.patient_name},`,
    '',
    '¡Tenemos buenas noticias! Se ha liberado un espacio en la agenda:',
    '',
    `📅 Fecha: ${formattedDate}`,
    `🕐 Hora: ${slot.time}`,
  ];

  if (slot.doctor_name) {
    parts.push(`👨‍⚕️ Doctor: ${slot.doctor_name}`);
  }

  if (entry.appointment_type_name) {
    parts.push(`📋 Tipo: ${entry.appointment_type_name}`);
  }

  parts.push(
    '',
    'Por favor confirma tu disponibilidad lo antes posible.',
    '',
    'Saludos,',
    'AgendaMedPro'
  );

  return parts.join('\n');
}

/**
 * Get priority badge color class
 */
export function getPriorityColorClass(priority: WaitlistPriority): string {
  const colorMap = {
    low: 'bg-gray-100 text-gray-800 border-gray-300',
    normal: 'bg-blue-100 text-blue-800 border-blue-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    urgent: 'bg-red-100 text-red-800 border-red-300'
  };
  return colorMap[priority];
}

/**
 * Get status badge color class
 */
export function getStatusColorClass(status: WaitlistStatus): string {
  const colorMap = {
    active: 'bg-blue-100 text-blue-800 border-blue-300',
    notified: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    booked: 'bg-green-100 text-green-800 border-green-300',
    expired: 'bg-gray-100 text-gray-800 border-gray-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300'
  };
  return colorMap[status];
}

/**
 * Load waitlist settings from localStorage
 */
export function loadWaitlistSettings(): WaitlistSettings {
  if (typeof window === 'undefined') return DEFAULT_WAITLIST_SETTINGS;

  try {
    const saved = localStorage.getItem('waitlist-settings');
    if (saved) {
      return { ...DEFAULT_WAITLIST_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading waitlist settings:', error);
  }

  return DEFAULT_WAITLIST_SETTINGS;
}

/**
 * Save waitlist settings to localStorage
 */
export function saveWaitlistSettings(settings: Partial<WaitlistSettings>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = loadWaitlistSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('waitlist-settings', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving waitlist settings:', error);
  }
}

/**
 * Days of week labels
 */
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];
