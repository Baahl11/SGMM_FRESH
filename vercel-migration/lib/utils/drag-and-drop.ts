/**
 * Drag and Drop Utilities for Appointments
 * Handles drag state, validation, and conflict detection
 */

export interface DraggedAppointment {
  id: number;
  patient_name?: string;
  fecha: string;
  appointment_time?: string;
  duration: number; // in minutes
  doctor_id?: string;
  doctor_name?: string;
  status?: string;
}

export interface DropTarget {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  isValid: boolean;
  conflicts?: string[];
}

/**
 * Calculate appointment end time
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return s1 < e2 && s2 < e1;
}

/**
 * Detect conflicts when dropping appointment at new time
 */
export function detectConflicts(
  draggedAppointment: DraggedAppointment,
  dropTarget: DropTarget,
  existingAppointments: any[]
): string[] {
  const conflicts: string[] = [];

  const dropEndTime = calculateEndTime(dropTarget.time, draggedAppointment.duration);

  // Check for time conflicts with other appointments on same date
  const sameDate = existingAppointments.filter(apt => 
    apt.fecha === dropTarget.date && 
    apt.id !== draggedAppointment.id // Exclude the dragged appointment itself
  );

  for (const apt of sameDate) {
    const aptTime = apt.appointment_time || '00:00';
    const aptDuration = apt.duration || 30;
    const aptEndTime = calculateEndTime(aptTime, aptDuration);

    const overlap = timeRangesOverlap(
      dropTarget.time,
      dropEndTime,
      aptTime,
      aptEndTime
    );

    if (overlap) {
      conflicts.push(
        `Conflicto con ${apt.patient_name || 'otra cita'} (${aptTime}-${aptEndTime})`
      );
    }
  }

  // Check if dropping in same doctor's schedule (if multi-doctor)
  if (draggedAppointment.doctor_id) {
    const sameDoctorConflicts = sameDate.filter(apt => 
      apt.doctor_id === draggedAppointment.doctor_id &&
      apt.id !== draggedAppointment.id
    );

    for (const apt of sameDoctorConflicts) {
      const aptTime = apt.appointment_time || '00:00';
      const aptDuration = apt.duration || 30;
      const aptEndTime = calculateEndTime(aptTime, aptDuration);

      const overlap = timeRangesOverlap(
        dropTarget.time,
        dropEndTime,
        aptTime,
        aptEndTime
      );

      if (overlap) {
        const doctorName = draggedAppointment.doctor_name || 'Dr.';
        conflicts.push(
          `${doctorName} ya tiene otra cita en este horario`
        );
      }
    }
  }

  return conflicts;
}

/**
 * Validate drop target
 */
export function validateDropTarget(
  dropTarget: DropTarget,
  draggedAppointment: DraggedAppointment,
  existingAppointments: any[]
): { valid: boolean; message?: string; conflicts?: string[] } {
  // Check if dropping in past
  const dropDate = new Date(dropTarget.date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (dropDate < now) {
    return {
      valid: false,
      message: 'No se puede agendar en fechas pasadas'
    };
  }

  // Check for conflicts
  const conflicts = detectConflicts(draggedAppointment, dropTarget, existingAppointments);

  if (conflicts.length > 0) {
    return {
      valid: false,
      message: 'Conflicto de horario detectado',
      conflicts
    };
  }

  return { valid: true };
}

/**
 * Format drag data for transfer
 */
export function serializeDragData(appointment: DraggedAppointment): string {
  return JSON.stringify(appointment);
}

/**
 * Parse drag data from transfer
 */
export function parseDragData(data: string): DraggedAppointment | null {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing drag data:', error);
    return null;
  }
}

/**
 * Get visual feedback class for drop zone
 */
export function getDropZoneClass(
  isDragOver: boolean,
  isValid: boolean,
  hasConflicts: boolean
): string {
  if (!isDragOver) return '';
  
  if (hasConflicts) {
    return 'ring-2 ring-rose-400/70 bg-rose-500/10';
  }
  
  if (isValid) {
    return 'ring-2 ring-emerald-300/70 bg-emerald-500/10';
  }
  
  return 'ring-2 ring-amber-300/70 bg-amber-500/10';
}

/**
 * Calculate drag preview position
 */
export function calculateDragPreviewPosition(
  event: React.DragEvent,
  elementHeight: number
): { x: number; y: number } {
  return {
    x: event.clientX + 10,
    y: event.clientY - elementHeight / 2
  };
}

/**
 * Check if appointment can be dragged
 */
export function canDragAppointment(appointment: any): { canDrag: boolean; reason?: string } {
  // Don't allow dragging completed appointments
  if (appointment.status === 'completed') {
    return {
      canDrag: false,
      reason: 'No se pueden mover citas completadas'
    };
  }

  // Don't allow dragging cancelled appointments
  if (appointment.status === 'cancelled') {
    return {
      canDrag: false,
      reason: 'No se pueden mover citas canceladas'
    };
  }

  // Check if appointment is in the past
  const aptDate = new Date(appointment.fecha);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (aptDate < now) {
    return {
      canDrag: false,
      reason: 'No se pueden mover citas pasadas'
    };
  }

  return { canDrag: true };
}
