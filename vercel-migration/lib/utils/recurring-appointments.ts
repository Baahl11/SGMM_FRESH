/**
 * Recurring Appointments Utilities
 * Manages recurring appointment patterns, series generation, and modifications
 */

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export type RecurrenceEndType = 'never' | 'after' | 'on-date';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0, Saturday = 6

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number; // e.g., 1 = every week, 2 = every 2 weeks
  daysOfWeek?: DayOfWeek[]; // For weekly patterns
  dayOfMonth?: number; // For monthly patterns (1-31)
  endType: RecurrenceEndType;
  endDate?: string; // YYYY-MM-DD
  occurrences?: number; // Number of occurrences if endType = 'after'
}

export interface RecurringAppointment {
  seriesId: string; // Unique ID for the series
  originalDate: string; // Date of first appointment in series
  pattern: RecurrencePattern;
  createdAt: string;
  modifiedInstances?: string[]; // Dates of modified instances
  cancelledInstances?: string[]; // Dates of cancelled instances
}

/**
 * Generate a unique series ID
 */
export function generateSeriesId(): string {
  return `series-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate next occurrence date based on pattern
 */
export function getNextOccurrence(
  currentDate: Date,
  pattern: RecurrencePattern
): Date | null {
  const next = new Date(currentDate);

  switch (pattern.frequency) {
    case 'daily':
      next.setDate(next.getDate() + pattern.interval);
      break;

    case 'weekly':
      next.setDate(next.getDate() + (7 * pattern.interval));
      break;

    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;

    case 'monthly':
      next.setMonth(next.getMonth() + pattern.interval);
      // Handle day of month
      if (pattern.dayOfMonth) {
        next.setDate(pattern.dayOfMonth);
        // If day doesn't exist in month (e.g., Feb 31), use last day
        if (next.getDate() !== pattern.dayOfMonth) {
          next.setDate(0); // Last day of previous month
        }
      }
      break;

    case 'custom':
      next.setDate(next.getDate() + pattern.interval);
      break;

    default:
      return null;
  }

  return next;
}

/**
 * Generate all dates for a recurring series
 */
export function generateRecurrenceDates(
  startDate: string,
  pattern: RecurrencePattern,
  maxDates: number = 100 // Safety limit
): string[] {
  const dates: string[] = [];
  let current = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Always include the start date
  dates.push(formatDate(current));

  let count = 1;

  while (count < maxDates) {
    const next = getNextOccurrence(current, pattern);
    if (!next) break;

    // Check end conditions
    if (pattern.endType === 'after' && pattern.occurrences) {
      if (count >= pattern.occurrences) break;
    }

    if (pattern.endType === 'on-date' && pattern.endDate) {
      const endDate = new Date(pattern.endDate);
      if (next > endDate) break;
    }

    // Stop if date is more than 2 years in future (safety)
    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
    if (next > twoYearsFromNow) break;

    dates.push(formatDate(next));
    current = next;
    count++;
  }

  return dates;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is part of a recurring series
 */
export function isDateInSeries(
  date: string,
  recurringAppointment: RecurringAppointment
): boolean {
  const dates = generateRecurrenceDates(
    recurringAppointment.originalDate,
    recurringAppointment.pattern
  );
  return dates.includes(date);
}

/**
 * Get human-readable description of recurrence pattern
 */
export function getRecurrenceDescription(pattern: RecurrencePattern): string {
  const parts: string[] = [];

  switch (pattern.frequency) {
    case 'daily':
      parts.push(pattern.interval === 1 ? 'Diario' : `Cada ${pattern.interval} días`);
      break;

    case 'weekly':
      parts.push(pattern.interval === 1 ? 'Semanal' : `Cada ${pattern.interval} semanas`);
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const days = pattern.daysOfWeek.map(d => dayNames[d]).join(', ');
        parts.push(`(${days})`);
      }
      break;

    case 'biweekly':
      parts.push('Quincenal');
      break;

    case 'monthly':
      parts.push(pattern.interval === 1 ? 'Mensual' : `Cada ${pattern.interval} meses`);
      if (pattern.dayOfMonth) {
        parts.push(`día ${pattern.dayOfMonth}`);
      }
      break;

    case 'custom':
      parts.push(`Cada ${pattern.interval} días`);
      break;
  }

  // Add end condition
  if (pattern.endType === 'after' && pattern.occurrences) {
    parts.push(`• ${pattern.occurrences} veces`);
  } else if (pattern.endType === 'on-date' && pattern.endDate) {
    const endDate = new Date(pattern.endDate);
    parts.push(`• hasta ${endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`);
  } else {
    parts.push('• sin fecha fin');
  }

  return parts.join(' ');
}

/**
 * Validate recurrence pattern
 */
export function validateRecurrencePattern(pattern: RecurrencePattern): { valid: boolean; error?: string } {
  if (pattern.interval < 1) {
    return { valid: false, error: 'El intervalo debe ser al menos 1' };
  }

  if (pattern.endType === 'after') {
    if (!pattern.occurrences || pattern.occurrences < 2) {
      return { valid: false, error: 'Debe haber al menos 2 ocurrencias' };
    }
  }

  if (pattern.endType === 'on-date') {
    if (!pattern.endDate) {
      return { valid: false, error: 'Debe especificar una fecha de fin' };
    }
    const endDate = new Date(pattern.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (endDate <= today) {
      return { valid: false, error: 'La fecha de fin debe ser futura' };
    }
  }

  if (pattern.frequency === 'monthly' && pattern.dayOfMonth) {
    if (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31) {
      return { valid: false, error: 'El día del mes debe estar entre 1 y 31' };
    }
  }

  return { valid: true };
}

/**
 * Get next N occurrences preview
 */
export function getNextOccurrencesPreview(
  startDate: string,
  pattern: RecurrencePattern,
  count: number = 5
): string[] {
  const dates = generateRecurrenceDates(startDate, pattern, count);
  return dates.slice(0, count);
}

/**
 * Check if appointment is part of a series
 */
export function isRecurringAppointment(appointment: any): boolean {
  return Boolean(appointment.recurring_series_id);
}

/**
 * Get series modification type labels
 */
export const MODIFICATION_TYPES = {
  'this-only': 'Solo esta cita',
  'this-and-following': 'Esta cita y las siguientes',
  'all-in-series': 'Todas las citas de la serie'
} as const;

export type ModificationType = keyof typeof MODIFICATION_TYPES;

/**
 * Common recurrence patterns as presets
 */
export const RECURRENCE_PRESETS: { label: string; pattern: Partial<RecurrencePattern> }[] = [
  {
    label: 'Diario',
    pattern: { frequency: 'daily', interval: 1, endType: 'after', occurrences: 10 }
  },
  {
    label: 'Semanal (mismo día)',
    pattern: { frequency: 'weekly', interval: 1, endType: 'after', occurrences: 10 }
  },
  {
    label: 'Quincenal',
    pattern: { frequency: 'biweekly', interval: 2, endType: 'after', occurrences: 6 }
  },
  {
    label: 'Mensual',
    pattern: { frequency: 'monthly', interval: 1, endType: 'after', occurrences: 6 }
  },
  {
    label: 'Cada 2 semanas',
    pattern: { frequency: 'weekly', interval: 2, endType: 'after', occurrences: 8 }
  }
];
