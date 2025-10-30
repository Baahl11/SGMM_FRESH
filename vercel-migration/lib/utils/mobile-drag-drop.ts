/**
 * Mobile Drag & Drop Utilities
 * Touch-optimized drag and drop for mobile devices
 */

export interface TouchDragState {
  isDragging: boolean;
  draggedElement: HTMLElement | null;
  draggedAppointmentId: string | null;
  draggedData: any;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  longPressTimer: NodeJS.Timeout | null;
  scrollInterval: NodeJS.Timeout | null;
  isLongPress: boolean;
}

export interface MobileDragConfig {
  longPressDuration: number; // milliseconds to trigger drag
  longPressThreshold: number; // pixels of movement allowed during long press
  scrollSpeed: number; // pixels per frame for auto-scroll
  scrollZoneSize: number; // pixels from edge to trigger auto-scroll
  hapticFeedback: boolean; // vibration feedback
  visualFeedback: boolean; // scale/shadow effects
  preventScroll: boolean; // prevent page scroll during drag
}

export const DEFAULT_MOBILE_DRAG_CONFIG: MobileDragConfig = {
  longPressDuration: 500, // 500ms long press
  longPressThreshold: 10, // 10px movement tolerance
  scrollSpeed: 3,
  scrollZoneSize: 50,
  hapticFeedback: true,
  visualFeedback: true,
  preventScroll: true
};

/**
 * Initialize default touch drag state
 */
export function createInitialTouchState(): TouchDragState {
  return {
    isDragging: false,
    draggedElement: null,
    draggedAppointmentId: null,
    draggedData: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    offsetX: 0,
    offsetY: 0,
    longPressTimer: null,
    scrollInterval: null,
    isLongPress: false
  };
}

/**
 * Check if device supports touch events
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Trigger haptic feedback (vibration)
 */
export function triggerHaptic(pattern: 'light' | 'medium' | 'heavy' = 'medium'): void {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  
  const patterns = {
    light: 10,
    medium: 20,
    heavy: 50
  };
  
  try {
    navigator.vibrate(patterns[pattern]);
  } catch (error) {
    console.warn('Haptic feedback not supported:', error);
  }
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get touch coordinates from event
 */
export function getTouchCoordinates(event: TouchEvent): { x: number; y: number } {
  const touch = event.touches[0] || event.changedTouches[0];
  return {
    x: touch.clientX,
    y: touch.clientY
  };
}

/**
 * Find draggable appointment element from touch target
 */
export function findDraggableElement(target: HTMLElement): HTMLElement | null {
  let element: HTMLElement | null = target;
  
  while (element) {
    if (element.dataset.draggable === 'true' || element.draggable) {
      return element;
    }
    element = element.parentElement;
  }
  
  return null;
}

/**
 * Get element under touch point (excluding dragged element)
 */
export function getElementFromPoint(
  x: number,
  y: number,
  excludeElement?: HTMLElement
): Element | null {
  if (excludeElement) {
    const originalDisplay = excludeElement.style.display;
    excludeElement.style.display = 'none';
    const element = document.elementFromPoint(x, y);
    excludeElement.style.display = originalDisplay;
    return element;
  }
  
  return document.elementFromPoint(x, y);
}

/**
 * Find drop zone element from point
 */
export function findDropZoneFromPoint(
  x: number,
  y: number,
  draggedElement?: HTMLElement
): HTMLElement | null {
  const element = getElementFromPoint(x, y, draggedElement) as HTMLElement;
  
  if (!element) return null;
  
  // Check if element itself is a drop zone
  if (element.dataset.dropzone === 'true' || element.classList.contains('drop-zone')) {
    return element;
  }
  
  // Search up the tree for drop zone
  let parent = element.parentElement;
  while (parent) {
    if (parent.dataset.dropzone === 'true' || parent.classList.contains('drop-zone')) {
      return parent;
    }
    parent = parent.parentElement;
  }
  
  return null;
}

/**
 * Create visual clone of dragged element
 */
export function createDragClone(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  const rect = element.getBoundingClientRect();
  
  // Style the clone
  clone.style.position = 'fixed';
  clone.style.zIndex = '9999';
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.pointerEvents = 'none';
  clone.style.opacity = '0.9';
  clone.style.transform = 'scale(1.05)';
  clone.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
  clone.style.transition = 'transform 0.2s ease';
  clone.classList.add('drag-clone');
  
  // Add dragging indicator
  clone.style.border = '2px solid #3b82f6';
  clone.style.borderRadius = '8px';
  
  document.body.appendChild(clone);
  
  return clone;
}

/**
 * Update clone position
 */
export function updateClonePosition(
  clone: HTMLElement,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number
): void {
  clone.style.left = `${x - offsetX}px`;
  clone.style.top = `${y - offsetY}px`;
}

/**
 * Remove drag clone
 */
export function removeDragClone(clone: HTMLElement): void {
  clone.style.transition = 'all 0.2s ease';
  clone.style.opacity = '0';
  clone.style.transform = 'scale(0.9)';
  
  setTimeout(() => {
    if (clone.parentElement) {
      clone.parentElement.removeChild(clone);
    }
  }, 200);
}

/**
 * Check if touch is in scroll zone (near edges)
 */
export function isInScrollZone(
  y: number,
  scrollZoneSize: number
): 'top' | 'bottom' | null {
  const windowHeight = window.innerHeight;
  
  if (y < scrollZoneSize) {
    return 'top';
  }
  
  if (y > windowHeight - scrollZoneSize) {
    return 'bottom';
  }
  
  return null;
}

/**
 * Auto-scroll when near edges
 */
export function handleAutoScroll(
  y: number,
  config: MobileDragConfig
): NodeJS.Timeout | null {
  const scrollZone = isInScrollZone(y, config.scrollZoneSize);
  
  if (!scrollZone) return null;
  
  const interval = setInterval(() => {
    const scrollAmount = scrollZone === 'top' ? -config.scrollSpeed : config.scrollSpeed;
    window.scrollBy(0, scrollAmount);
  }, 16); // ~60fps
  
  return interval;
}

/**
 * Add visual feedback to drop zone
 */
export function addDropZoneFeedback(
  dropZone: HTMLElement,
  isValid: boolean
): void {
  dropZone.classList.remove('drop-zone-valid', 'drop-zone-invalid', 'drop-zone-hover');
  
  if (isValid) {
    dropZone.classList.add('drop-zone-valid', 'drop-zone-hover');
  } else {
    dropZone.classList.add('drop-zone-invalid', 'drop-zone-hover');
  }
}

/**
 * Remove visual feedback from drop zone
 */
export function removeDropZoneFeedback(dropZone: HTMLElement): void {
  dropZone.classList.remove('drop-zone-valid', 'drop-zone-invalid', 'drop-zone-hover');
}

/**
 * Add dragging styles to original element
 */
export function addDraggingStyles(element: HTMLElement): void {
  element.style.opacity = '0.3';
  element.classList.add('dragging-original');
}

/**
 * Remove dragging styles from original element
 */
export function removeDraggingStyles(element: HTMLElement): void {
  element.style.opacity = '';
  element.classList.remove('dragging-original');
}

/**
 * Prevent default touch behaviors
 */
export function preventTouchDefaults(event: TouchEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Get scroll parent element
 */
export function getScrollParent(element: HTMLElement): HTMLElement {
  let parent = element.parentElement;
  
  while (parent) {
    const overflow = window.getComputedStyle(parent).overflow;
    if (overflow === 'auto' || overflow === 'scroll') {
      return parent;
    }
    parent = parent.parentElement;
  }
  
  return document.documentElement as HTMLElement;
}

/**
 * Load mobile drag config from localStorage
 */
export function loadMobileDragConfig(): MobileDragConfig {
  if (typeof window === 'undefined') return DEFAULT_MOBILE_DRAG_CONFIG;
  
  try {
    const saved = localStorage.getItem('mobile-drag-config');
    if (saved) {
      return { ...DEFAULT_MOBILE_DRAG_CONFIG, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading mobile drag config:', error);
  }
  
  return DEFAULT_MOBILE_DRAG_CONFIG;
}

/**
 * Save mobile drag config to localStorage
 */
export function saveMobileDragConfig(config: Partial<MobileDragConfig>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const current = loadMobileDragConfig();
    const updated = { ...current, ...config };
    localStorage.setItem('mobile-drag-config', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving mobile drag config:', error);
  }
}

/**
 * Detect if current device is mobile/tablet
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor;
  
  // Check for mobile patterns
  const mobilePatterns = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i
  ];
  
  return mobilePatterns.some(pattern => pattern.test(userAgent)) || 
         (window.innerWidth <= 768 && isTouchDevice());
}

/**
 * Get optimal long press duration based on device
 */
export function getOptimalLongPressDuration(): number {
  // iOS typically needs longer press
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS ? 600 : 500;
}

/**
 * Format touch event data for logging
 */
export function formatTouchEventData(event: TouchEvent): {
  type: string;
  touches: number;
  x: number;
  y: number;
} {
  const touch = event.touches[0] || event.changedTouches[0];
  return {
    type: event.type,
    touches: event.touches.length,
    x: touch?.clientX || 0,
    y: touch?.clientY || 0
  };
}

/**
 * CSS classes for mobile drag & drop
 */
export const MOBILE_DRAG_CLASSES = {
  dragging: 'mobile-dragging',
  draggingOriginal: 'dragging-original',
  dragClone: 'drag-clone',
  dropZone: 'drop-zone',
  dropZoneHover: 'drop-zone-hover',
  dropZoneValid: 'drop-zone-valid',
  dropZoneInvalid: 'drop-zone-invalid',
  touchTarget: 'touch-drag-target'
} as const;
