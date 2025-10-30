/**
 * Utility functions for appointment color coding
 * Features status-based colors + doctor-based colors
 */

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | 'pendiente';

export interface AppointmentColorScheme {
  background: string;
  border: string;
  hover: string;
  text: string;
  badgeBackground: string;
  badgeText: string;
}

/**
 * Get color scheme based on appointment status
 * Priority: Status colors override doctor colors
 */
export function getAppointmentColorsByStatus(
  status: AppointmentStatus | undefined,
  doctorColor?: string
): AppointmentColorScheme {
  
  // Status-based colors (PRIORITY)
  const statusColors: Record<string, { base: string; name: string }> = {
    'confirmed': { base: '#10b981', name: 'Verde' },      // 🟢 Green - Confirmada
    'scheduled': { base: '#f59e0b', name: 'Amarillo' },   // 🟡 Yellow/Amber - Programada
    'pendiente': { base: '#f59e0b', name: 'Amarillo' },   // 🟡 Yellow/Amber - Pendiente (alias)
    'completed': { base: '#3b82f6', name: 'Azul' },       // 🔵 Blue - Completada
    'cancelled': { base: '#ef4444', name: 'Rojo' },       // 🔴 Red - Cancelada
    'no-show': { base: '#8b5cf6', name: 'Morado' },       // 🟣 Purple - No presentado
  };

  // Determine which color to use
  let baseColor: string;
  
  if (status && statusColors[status]) {
    // Use status color
    baseColor = statusColors[status].base;
  } else if (doctorColor) {
    // Fallback to doctor color if provided
    baseColor = doctorColor;
  } else {
    // Default fallback: blue
    baseColor = '#3b82f6';
  }

  // Convert hex to RGB
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return {
    background: `rgba(${r}, ${g}, ${b}, 0.12)`,    // Very light background
    border: `rgba(${r}, ${g}, ${b}, 0.4)`,         // Medium border
    hover: `rgba(${r}, ${g}, ${b}, 0.2)`,          // Light hover
    text: baseColor,                                // Full color for text/icons
    badgeBackground: `rgba(${r}, ${g}, ${b}, 0.2)`, // Badge bg
    badgeText: baseColor,                           // Badge text
  };
}

/**
 * Get human-readable status name in Spanish
 */
export function getStatusLabel(status: AppointmentStatus | undefined): string {
  const labels: Record<string, string> = {
    'scheduled': 'Programada',
    'pendiente': 'Pendiente',
    'confirmed': 'Confirmada',
    'completed': 'Completada',
    'cancelled': 'Cancelada',
    'no-show': 'No presentó',
  };

  return status ? labels[status] || 'Programada' : 'Programada';
}

/**
 * Get status icon emoji
 */
export function getStatusIcon(status: AppointmentStatus | undefined): string {
  const icons: Record<string, string> = {
    'scheduled': '🟡',
    'pendiente': '🟡',
    'confirmed': '🟢',
    'completed': '🔵',
    'cancelled': '🔴',
    'no-show': '🟣',
  };

  return status ? icons[status] || '🟡' : '🟡';
}

/**
 * Determine if appointment is in the past
 */
export function isAppointmentPast(fecha: string, appointmentTime?: string): boolean {
  try {
    const now = new Date();
    const appointmentDate = new Date(fecha);
    
    if (appointmentTime) {
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      appointmentDate.setHours(hours, minutes, 0, 0);
    }
    
    return appointmentDate < now;
  } catch {
    return false;
  }
}

/**
 * Auto-suggest status based on appointment date/time
 */
export function suggestAppointmentStatus(
  currentStatus: AppointmentStatus | undefined,
  fecha: string,
  appointmentTime?: string
): AppointmentStatus {
  // Don't override manually set statuses
  if (currentStatus === 'confirmed' || currentStatus === 'cancelled' || currentStatus === 'no-show') {
    return currentStatus;
  }

  const isPast = isAppointmentPast(fecha, appointmentTime);
  
  if (isPast && !currentStatus) {
    return 'completed'; // Auto-mark as completed if past and no status set
  }

  return currentStatus || 'scheduled';
}
