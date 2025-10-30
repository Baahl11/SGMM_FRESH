'use client';

import { useState, useCallback } from 'react';
import {
  DraggedAppointment,
  DropTarget,
  validateDropTarget,
  parseDragData,
  canDragAppointment
} from '@/lib/utils/drag-and-drop';

interface UseDragAndDropOptions {
  appointments: any[];
  onAppointmentMove: (appointmentId: number, newDate: string, newTime: string) => Promise<void>;
  onConflictDetected?: (conflicts: string[]) => void;
}

export function useDragAndDrop({
  appointments,
  onAppointmentMove,
  onConflictDetected
}: UseDragAndDropOptions) {
  const [draggedAppointment, setDraggedAppointment] = useState<DraggedAppointment | null>(null);
  const [currentDropTarget, setCurrentDropTarget] = useState<DropTarget | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Start dragging
  const handleDragStart = useCallback((appointment: any, event: React.DragEvent) => {
    const dragCheck = canDragAppointment(appointment);
    
    if (!dragCheck.canDrag) {
      event.preventDefault();
      if (dragCheck.reason) {
        console.warn(dragCheck.reason);
      }
      return;
    }

    const dragData: DraggedAppointment = {
      id: appointment.id,
      patient_name: appointment.patient_name,
      fecha: appointment.fecha,
      appointment_time: appointment.appointment_time,
      duration: appointment.duration || 30,
      doctor_id: appointment.doctor_id,
      doctor_name: appointment.doctor_name,
      status: appointment.status
    };

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    
    setDraggedAppointment(dragData);
    setIsDragging(true);

    // Optional: Set custom drag image
    if (event.dataTransfer.setDragImage) {
      const dragImage = event.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.5';
      event.dataTransfer.setDragImage(dragImage, 0, 0);
    }
  }, []);

  // Drag over drop zone
  const handleDragOver = useCallback((date: string, time: string, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (!draggedAppointment) return;

    const dropTarget: DropTarget = {
      date,
      time,
      isValid: true
    };

    const validation = validateDropTarget(dropTarget, draggedAppointment, appointments);
    dropTarget.isValid = validation.valid;
    dropTarget.conflicts = validation.conflicts;

    setCurrentDropTarget(dropTarget);
  }, [draggedAppointment, appointments]);

  // Enter drop zone
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  // Leave drop zone
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    // Only clear if we're actually leaving the drop zone (not entering a child)
    if (event.currentTarget === event.target) {
      setCurrentDropTarget(null);
    }
  }, []);

  // Drop appointment
  const handleDrop = useCallback(async (date: string, time: string, event: React.DragEvent) => {
    event.preventDefault();

    const data = event.dataTransfer.getData('application/json');
    const appointment = parseDragData(data);

    if (!appointment) {
      console.error('Invalid drag data');
      setIsDragging(false);
      setDraggedAppointment(null);
      setCurrentDropTarget(null);
      return;
    }

    const dropTarget: DropTarget = {
      date,
      time,
      isValid: true
    };

    const validation = validateDropTarget(dropTarget, appointment, appointments);

    if (!validation.valid) {
      if (validation.conflicts && onConflictDetected) {
        onConflictDetected(validation.conflicts);
      }
      setIsDragging(false);
      setDraggedAppointment(null);
      setCurrentDropTarget(null);
      return;
    }

    // Check if actually moved
    if (appointment.fecha === date && appointment.appointment_time === time) {
      // Dropped in same slot, no change needed
      setIsDragging(false);
      setDraggedAppointment(null);
      setCurrentDropTarget(null);
      return;
    }

    try {
      await onAppointmentMove(appointment.id, date, time);
    } catch (error) {
      console.error('Error moving appointment:', error);
    }

    setIsDragging(false);
    setDraggedAppointment(null);
    setCurrentDropTarget(null);
  }, [appointments, onAppointmentMove, onConflictDetected]);

  // End drag (cleanup)
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedAppointment(null);
    setCurrentDropTarget(null);
  }, []);

  // Check if a specific slot is the current drop target
  const isDropTarget = useCallback((date: string, time: string) => {
    return currentDropTarget?.date === date && currentDropTarget?.time === time;
  }, [currentDropTarget]);

  // Check if drop target is valid
  const isValidDropTarget = useCallback((date: string, time: string) => {
    if (!isDropTarget(date, time)) return false;
    return currentDropTarget?.isValid || false;
  }, [currentDropTarget, isDropTarget]);

  // Get conflicts for current drop target
  const getDropTargetConflicts = useCallback((date: string, time: string) => {
    if (!isDropTarget(date, time)) return [];
    return currentDropTarget?.conflicts || [];
  }, [currentDropTarget, isDropTarget]);

  return {
    isDragging,
    draggedAppointment,
    currentDropTarget,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    isDropTarget,
    isValidDropTarget,
    getDropTargetConflicts
  };
}
