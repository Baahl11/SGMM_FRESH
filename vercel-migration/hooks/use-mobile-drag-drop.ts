"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TouchDragState,
  MobileDragConfig,
  createInitialTouchState,
  isTouchDevice,
  triggerHaptic,
  calculateDistance,
  getTouchCoordinates,
  findDraggableElement,
  findDropZoneFromPoint,
  createDragClone,
  updateClonePosition,
  removeDragClone,
  handleAutoScroll,
  addDropZoneFeedback,
  removeDropZoneFeedback,
  addDraggingStyles,
  removeDraggingStyles,
  preventTouchDefaults,
  loadMobileDragConfig
} from '@/lib/utils/mobile-drag-drop';

interface UseMobileDragDropOptions {
  onDragStart?: (appointmentId: string, data: any) => void;
  onDragMove?: (appointmentId: string, x: number, y: number) => void;
  onDragEnd?: (appointmentId: string, dropZoneData: any) => void;
  onDrop?: (appointmentId: string, dropZoneData: any) => boolean;
  isValidDropZone?: (appointmentId: string, dropZoneData: any) => boolean;
  config?: Partial<MobileDragConfig>;
}

export function useMobileDragDrop(options: UseMobileDragDropOptions = {}) {
  const [dragState, setDragState] = useState<TouchDragState>(createInitialTouchState());
  const [config] = useState<MobileDragConfig>(() => ({
    ...loadMobileDragConfig(),
    ...options.config
  }));
  
  const dragCloneRef = useRef<HTMLElement | null>(null);
  const currentDropZoneRef = useRef<HTMLElement | null>(null);
  const isTouchSupported = useRef(isTouchDevice());

  /**
   * Start long press timer
   */
  const startLongPress = useCallback((
    element: HTMLElement,
    appointmentId: string,
    data: any,
    x: number,
    y: number
  ) => {
    const timer = setTimeout(() => {
      // Check if finger hasn't moved too much
      const distance = calculateDistance(
        dragState.startX,
        dragState.startY,
        x,
        y
      );
      
      if (distance <= config.longPressThreshold) {
        // Trigger long press - start dragging
        if (config.hapticFeedback) {
          triggerHaptic('medium');
        }
        
        // Create visual clone
        const clone = createDragClone(element);
        dragCloneRef.current = clone;
        
        // Calculate offset from touch point to element top-left
        const rect = element.getBoundingClientRect();
        const offsetX = x - rect.left;
        const offsetY = y - rect.top;
        
        // Update clone position
        updateClonePosition(clone, x, y, offsetX, offsetY);
        
        // Add dragging styles to original
        addDraggingStyles(element);
        
        // Update state
        setDragState(prev => ({
          ...prev,
          isDragging: true,
          isLongPress: true,
          draggedElement: element,
          draggedAppointmentId: appointmentId,
          draggedData: data,
          offsetX,
          offsetY
        }));
        
        // Callback
        options.onDragStart?.(appointmentId, data);
      }
    }, config.longPressDuration);
    
    setDragState(prev => ({
      ...prev,
      longPressTimer: timer
    }));
  }, [dragState.startX, dragState.startY, config, options]);

  /**
   * Cancel long press timer
   */
  const cancelLongPress = useCallback(() => {
    if (dragState.longPressTimer) {
      clearTimeout(dragState.longPressTimer);
      setDragState(prev => ({
        ...prev,
        longPressTimer: null
      }));
    }
  }, [dragState.longPressTimer]);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((event: TouchEvent) => {
    const target = event.target as HTMLElement;
    const draggableElement = findDraggableElement(target);
    
    if (!draggableElement) return;
    
    const { x, y } = getTouchCoordinates(event);
    const appointmentId = draggableElement.dataset.appointmentId || '';
    const data = JSON.parse(draggableElement.dataset.dragData || '{}');
    
    // Reset state
    setDragState({
      ...createInitialTouchState(),
      startX: x,
      startY: y,
      currentX: x,
      currentY: y
    });
    
    // Start long press timer
    startLongPress(draggableElement, appointmentId, data, x, y);
  }, [startLongPress]);

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback((event: TouchEvent) => {
    const { x, y } = getTouchCoordinates(event);
    
    // Update current position
    setDragState(prev => ({
      ...prev,
      currentX: x,
      currentY: y
    }));
    
    // If not dragging yet, check if movement exceeds threshold
    if (!dragState.isDragging && dragState.longPressTimer) {
      const distance = calculateDistance(
        dragState.startX,
        dragState.startY,
        x,
        y
      );
      
      if (distance > config.longPressThreshold) {
        // Cancel long press if moved too much
        cancelLongPress();
      }
      return;
    }
    
    // If dragging
    if (dragState.isDragging && dragCloneRef.current) {
      // Prevent default scroll
      if (config.preventScroll) {
        preventTouchDefaults(event);
      }
      
      // Update clone position
      updateClonePosition(
        dragCloneRef.current,
        x,
        y,
        dragState.offsetX,
        dragState.offsetY
      );
      
      // Find drop zone under touch
      const dropZone = findDropZoneFromPoint(x, y, dragCloneRef.current);
      
      // Remove feedback from previous drop zone
      if (currentDropZoneRef.current && currentDropZoneRef.current !== dropZone) {
        removeDropZoneFeedback(currentDropZoneRef.current);
        currentDropZoneRef.current = null;
      }
      
      // Add feedback to new drop zone
      if (dropZone && dropZone !== currentDropZoneRef.current) {
        const dropZoneData = JSON.parse(dropZone.dataset.dropzoneData || '{}');
        const isValid = options.isValidDropZone?.(
          dragState.draggedAppointmentId || '',
          dropZoneData
        ) ?? true;
        
        addDropZoneFeedback(dropZone, isValid);
        currentDropZoneRef.current = dropZone;
        
        if (config.hapticFeedback && isValid) {
          triggerHaptic('light');
        }
      }
      
      // Handle auto-scroll
      if (dragState.scrollInterval) {
        clearInterval(dragState.scrollInterval);
      }
      
      const scrollInterval = handleAutoScroll(y, config);
      if (scrollInterval) {
        setDragState(prev => ({
          ...prev,
          scrollInterval
        }));
      }
      
      // Callback
      options.onDragMove?.(dragState.draggedAppointmentId || '', x, y);
    }
  }, [dragState, config, cancelLongPress, options]);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    // Cancel long press timer
    cancelLongPress();
    
    // Clear auto-scroll
    if (dragState.scrollInterval) {
      clearInterval(dragState.scrollInterval);
    }
    
    // If was dragging
    if (dragState.isDragging && dragCloneRef.current) {
      const { x, y } = getTouchCoordinates(event);
      
      // Find drop zone
      const dropZone = findDropZoneFromPoint(x, y, dragCloneRef.current);
      
      let dropSuccess = false;
      
      if (dropZone) {
        const dropZoneData = JSON.parse(dropZone.dataset.dropzoneData || '{}');
        const isValid = options.isValidDropZone?.(
          dragState.draggedAppointmentId || '',
          dropZoneData
        ) ?? true;
        
        if (isValid) {
          // Perform drop
          dropSuccess = options.onDrop?.(
            dragState.draggedAppointmentId || '',
            dropZoneData
          ) ?? true;
          
          if (dropSuccess && config.hapticFeedback) {
            triggerHaptic('heavy');
          }
        }
        
        // Remove feedback
        removeDropZoneFeedback(dropZone);
      }
      
      // Remove clone
      removeDragClone(dragCloneRef.current);
      dragCloneRef.current = null;
      
      // Remove dragging styles from original
      if (dragState.draggedElement) {
        removeDraggingStyles(dragState.draggedElement);
      }
      
      // Callback
      options.onDragEnd?.(
        dragState.draggedAppointmentId || '',
        dropZone ? JSON.parse(dropZone.dataset.dropzoneData || '{}') : null
      );
    }
    
    // Reset state
    setDragState(createInitialTouchState());
    currentDropZoneRef.current = null;
  }, [dragState, config, cancelLongPress, options]);

  /**
   * Handle touch cancel
   */
  const handleTouchCancel = useCallback(() => {
    // Same as touch end but no drop
    cancelLongPress();
    
    if (dragState.scrollInterval) {
      clearInterval(dragState.scrollInterval);
    }
    
    if (dragCloneRef.current) {
      removeDragClone(dragCloneRef.current);
      dragCloneRef.current = null;
    }
    
    if (dragState.draggedElement) {
      removeDraggingStyles(dragState.draggedElement);
    }
    
    if (currentDropZoneRef.current) {
      removeDropZoneFeedback(currentDropZoneRef.current);
      currentDropZoneRef.current = null;
    }
    
    setDragState(createInitialTouchState());
  }, [dragState, cancelLongPress]);

  /**
   * Setup touch event listeners
   */
  useEffect(() => {
    if (!isTouchSupported.current) return;
    
    const options: AddEventListenerOptions = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);
    document.addEventListener('touchcancel', handleTouchCancel, options);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (dragState.longPressTimer) {
        clearTimeout(dragState.longPressTimer);
      }
      if (dragState.scrollInterval) {
        clearInterval(dragState.scrollInterval);
      }
      if (dragCloneRef.current) {
        removeDragClone(dragCloneRef.current);
      }
    };
  }, []);

  return {
    isDragging: dragState.isDragging,
    draggedAppointmentId: dragState.draggedAppointmentId,
    isTouchSupported: isTouchSupported.current,
    dragState
  };
}
