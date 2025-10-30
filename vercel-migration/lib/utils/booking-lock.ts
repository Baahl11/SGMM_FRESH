/**
 * Booking Lock System - Double-booking Prevention
 * 
 * Sistema de bloqueo temporal de slots para prevenir reservas dobles
 * cuando múltiples usuarios intentan reservar el mismo horario simultáneamente.
 * 
 * Features:
 * - Slot locking con timeout automático
 * - Optimistic locking con version numbers
 * - Real-time conflict detection
 * - Lock cleanup automático
 * - Visual feedback de slots bloqueados
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SlotLock {
  id: string;
  slotTime: string; // ISO timestamp del slot
  doctorId: string;
  lockedBy: string; // User ID
  lockedByName: string; // Display name
  lockedAt: number; // Timestamp
  expiresAt: number; // Timestamp
  appointmentId?: string; // Si está editando una cita existente
  status: 'locked' | 'expired' | 'released';
}

export interface BookingConflict {
  conflictType: 'double-booking' | 'slot-locked' | 'version-mismatch' | 'buffer-conflict';
  slotTime: string;
  doctorId: string;
  existingAppointment?: {
    id: string;
    patientName: string;
    startTime: string;
    endTime: string;
  };
  lockInfo?: {
    lockedBy: string;
    lockedByName: string;
    expiresIn: number; // milliseconds
  };
  message: string;
  canOverride: boolean;
}

export interface BookingLockConfig {
  enabled: boolean;
  lockDuration: number; // milliseconds (default: 60000 = 1 min)
  cleanupInterval: number; // milliseconds (default: 10000 = 10s)
  maxRetries: number; // default: 3
  retryDelay: number; // milliseconds (default: 1000)
  showVisualIndicators: boolean;
  allowAdminOverride: boolean;
  notifyOnConflict: boolean;
}

export interface OptimisticLockData {
  appointmentId: string;
  version: number;
  lastModified: number;
  modifiedBy: string;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

export const DEFAULT_BOOKING_LOCK_CONFIG: BookingLockConfig = {
  enabled: true,
  lockDuration: 60000, // 1 minuto
  cleanupInterval: 10000, // 10 segundos
  maxRetries: 3,
  retryDelay: 1000, // 1 segundo
  showVisualIndicators: true,
  allowAdminOverride: true,
  notifyOnConflict: true,
};

// ============================================================================
// LOCAL STORAGE
// ============================================================================

const STORAGE_KEY = 'sgmm_booking_lock_config';
const LOCKS_STORAGE_KEY = 'sgmm_active_slot_locks';

export function loadBookingLockConfig(): BookingLockConfig {
  if (typeof window === 'undefined') return DEFAULT_BOOKING_LOCK_CONFIG;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_BOOKING_LOCK_CONFIG, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading booking lock config:', error);
  }
  
  return DEFAULT_BOOKING_LOCK_CONFIG;
}

export function saveBookingLockConfig(config: Partial<BookingLockConfig>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const current = loadBookingLockConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving booking lock config:', error);
  }
}

// ============================================================================
// SLOT LOCK MANAGEMENT
// ============================================================================

/**
 * Genera un ID único para el slot lock
 */
export function generateLockId(slotTime: string, doctorId: string): string {
  return `lock_${doctorId}_${new Date(slotTime).getTime()}`;
}

/**
 * Crea un nuevo slot lock
 */
export function createSlotLock(
  slotTime: string,
  doctorId: string,
  userId: string,
  userName: string,
  appointmentId?: string
): SlotLock {
  const config = loadBookingLockConfig();
  const now = Date.now();
  
  return {
    id: generateLockId(slotTime, doctorId),
    slotTime,
    doctorId,
    lockedBy: userId,
    lockedByName: userName,
    lockedAt: now,
    expiresAt: now + config.lockDuration,
    appointmentId,
    status: 'locked',
  };
}

/**
 * Guarda locks activos en localStorage (sincronización entre pestañas)
 */
function saveActiveLocks(locks: SlotLock[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(LOCKS_STORAGE_KEY, JSON.stringify(locks));
  } catch (error) {
    console.error('Error saving active locks:', error);
  }
}

/**
 * Carga locks activos desde localStorage
 */
function loadActiveLocks(): SlotLock[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem(LOCKS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading active locks:', error);
  }
  
  return [];
}

/**
 * Adquiere un lock para un slot
 */
export function acquireSlotLock(
  slotTime: string,
  doctorId: string,
  userId: string,
  userName: string,
  appointmentId?: string
): { success: boolean; lock?: SlotLock; conflict?: BookingConflict } {
  const config = loadBookingLockConfig();
  
  if (!config.enabled) {
    // Si los locks están deshabilitados, siempre success
    return { success: true };
  }
  
  const locks = loadActiveLocks();
  const lockId = generateLockId(slotTime, doctorId);
  
  // Verificar si ya existe un lock activo para este slot
  const existingLock = locks.find(l => l.id === lockId && l.status === 'locked');
  
  if (existingLock) {
    const now = Date.now();
    
    // Si el lock expiró, lo marcamos como expirado
    if (now >= existingLock.expiresAt) {
      existingLock.status = 'expired';
      saveActiveLocks(locks);
    } else if (existingLock.lockedBy !== userId) {
      // Slot bloqueado por otro usuario
      const conflict: BookingConflict = {
        conflictType: 'slot-locked',
        slotTime,
        doctorId,
        lockInfo: {
          lockedBy: existingLock.lockedBy,
          lockedByName: existingLock.lockedByName,
          expiresIn: existingLock.expiresAt - now,
        },
        message: `Este slot está siendo editado por ${existingLock.lockedByName}. Expira en ${Math.ceil((existingLock.expiresAt - now) / 1000)} segundos.`,
        canOverride: config.allowAdminOverride,
      };
      
      return { success: false, conflict };
    } else {
      // El mismo usuario ya tiene el lock (renovar)
      existingLock.expiresAt = Date.now() + config.lockDuration;
      saveActiveLocks(locks);
      return { success: true, lock: existingLock };
    }
  }
  
  // Crear nuevo lock
  const newLock = createSlotLock(slotTime, doctorId, userId, userName, appointmentId);
  locks.push(newLock);
  saveActiveLocks(locks);
  
  return { success: true, lock: newLock };
}

/**
 * Libera un lock específico
 */
export function releaseSlotLock(lockId: string, userId: string): boolean {
  const locks = loadActiveLocks();
  const lockIndex = locks.findIndex(l => l.id === lockId);
  
  if (lockIndex === -1) return false;
  
  const lock = locks[lockIndex];
  
  // Solo el dueño del lock puede liberarlo
  if (lock.lockedBy !== userId) {
    console.warn('Attempted to release lock owned by another user');
    return false;
  }
  
  lock.status = 'released';
  locks.splice(lockIndex, 1);
  saveActiveLocks(locks);
  
  return true;
}

/**
 * Libera todos los locks de un usuario
 */
export function releaseUserLocks(userId: string): number {
  const locks = loadActiveLocks();
  const userLocks = locks.filter(l => l.lockedBy === userId && l.status === 'locked');
  
  userLocks.forEach(lock => {
    lock.status = 'released';
  });
  
  const remainingLocks = locks.filter(l => l.lockedBy !== userId || l.status !== 'released');
  saveActiveLocks(remainingLocks);
  
  return userLocks.length;
}

/**
 * Limpia locks expirados
 */
export function cleanupExpiredLocks(): number {
  const locks = loadActiveLocks();
  const now = Date.now();
  
  let expiredCount = 0;
  
  const activeLocks = locks.filter(lock => {
    if (lock.status === 'locked' && now >= lock.expiresAt) {
      lock.status = 'expired';
      expiredCount++;
      return false;
    }
    return lock.status === 'locked';
  });
  
  if (expiredCount > 0) {
    saveActiveLocks(activeLocks);
  }
  
  return expiredCount;
}

/**
 * Obtiene locks activos para un doctor en un rango de tiempo
 */
export function getActiveLocks(
  doctorId: string,
  startTime: string,
  endTime: string
): SlotLock[] {
  const locks = loadActiveLocks();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  
  return locks.filter(lock => {
    if (lock.status !== 'locked') return false;
    if (lock.doctorId !== doctorId) return false;
    
    const lockTime = new Date(lock.slotTime).getTime();
    return lockTime >= start && lockTime <= end;
  });
}

/**
 * Verifica si un slot está bloqueado
 */
export function isSlotLocked(
  slotTime: string,
  doctorId: string,
  excludeUserId?: string
): { locked: boolean; lock?: SlotLock } {
  const locks = loadActiveLocks();
  const lockId = generateLockId(slotTime, doctorId);
  const now = Date.now();
  
  const lock = locks.find(l => 
    l.id === lockId && 
    l.status === 'locked' && 
    now < l.expiresAt &&
    (!excludeUserId || l.lockedBy !== excludeUserId)
  );
  
  return {
    locked: !!lock,
    lock,
  };
}

// ============================================================================
// OPTIMISTIC LOCKING (Version-based)
// ============================================================================

/**
 * Verifica versión antes de actualizar (previene race conditions)
 */
export function validateOptimisticLock(
  appointmentId: string,
  expectedVersion: number,
  currentVersion: number
): { valid: boolean; conflict?: BookingConflict } {
  if (expectedVersion !== currentVersion) {
    const conflict: BookingConflict = {
      conflictType: 'version-mismatch',
      slotTime: '',
      doctorId: '',
      message: 'Esta cita fue modificada por otro usuario. Por favor recarga los datos.',
      canOverride: false,
    };
    
    return { valid: false, conflict };
  }
  
  return { valid: true };
}

/**
 * Incrementa versión después de modificación exitosa
 */
export function incrementVersion(currentVersion: number): number {
  return currentVersion + 1;
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Detecta conflictos de reserva (double-booking, buffer conflicts, etc.)
 */
export function detectBookingConflicts(
  slotTime: string,
  duration: number, // minutos
  doctorId: string,
  existingAppointments: Array<{
    id: string;
    patientName: string;
    startTime: string;
    duration: number;
    doctorId: string;
  }>,
  bufferTime: number = 0, // minutos
  excludeAppointmentId?: string
): BookingConflict[] {
  const conflicts: BookingConflict[] = [];
  const requestStart = new Date(slotTime).getTime();
  const requestEnd = requestStart + (duration * 60000);
  
  // Agregar buffer time
  const requestStartWithBuffer = requestStart - (bufferTime * 60000);
  const requestEndWithBuffer = requestEnd + (bufferTime * 60000);
  
  for (const apt of existingAppointments) {
    // Skip si es la misma cita que estamos editando
    if (excludeAppointmentId && apt.id === excludeAppointmentId) continue;
    
    // Skip si es otro doctor
    if (apt.doctorId !== doctorId) continue;
    
    const aptStart = new Date(apt.startTime).getTime();
    const aptEnd = aptStart + (apt.duration * 60000);
    
    // Verificar overlap con buffer
    const hasOverlap = requestStartWithBuffer < aptEnd && requestEndWithBuffer > aptStart;
    
    if (hasOverlap) {
      const isBufferConflict = 
        (requestStart >= aptEnd && requestStartWithBuffer < aptEnd) ||
        (requestEnd <= aptStart && requestEndWithBuffer > aptStart);
      
      conflicts.push({
        conflictType: isBufferConflict ? 'buffer-conflict' : 'double-booking',
        slotTime,
        doctorId,
        existingAppointment: {
          id: apt.id,
          patientName: apt.patientName,
          startTime: apt.startTime,
          endTime: new Date(aptEnd).toISOString(),
        },
        message: isBufferConflict
          ? `Conflicto de buffer time con cita de ${apt.patientName}`
          : `Ya existe una cita con ${apt.patientName} en este horario`,
        canOverride: false,
      });
    }
  }
  
  return conflicts;
}

// ============================================================================
// VISUAL INDICATORS
// ============================================================================

/**
 * Genera clase CSS para indicador visual de slot bloqueado
 */
export function getSlotLockClass(lock?: SlotLock): string {
  if (!lock) return '';
  
  const config = loadBookingLockConfig();
  if (!config.showVisualIndicators) return '';
  
  const now = Date.now();
  const timeRemaining = lock.expiresAt - now;
  
  if (timeRemaining <= 0) return 'slot-lock-expired';
  if (timeRemaining <= 15000) return 'slot-lock-expiring'; // < 15s
  
  return 'slot-lock-active';
}

/**
 * Genera tooltip para slot bloqueado
 */
export function getSlotLockTooltip(lock: SlotLock): string {
  const now = Date.now();
  const seconds = Math.ceil((lock.expiresAt - now) / 1000);
  
  if (seconds <= 0) return 'Lock expirado';
  
  return `Bloqueado por ${lock.lockedByName} (expira en ${seconds}s)`;
}

// ============================================================================
// AUTO-CLEANUP
// ============================================================================

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Inicia cleanup automático de locks expirados
 */
export function startAutoCleanup(): void {
  if (cleanupInterval) return; // Ya está corriendo
  
  const config = loadBookingLockConfig();
  
  cleanupInterval = setInterval(() => {
    const expired = cleanupExpiredLocks();
    if (expired > 0) {
      console.log(`Cleaned up ${expired} expired locks`);
    }
  }, config.cleanupInterval);
}

/**
 * Detiene cleanup automático
 */
export function stopAutoCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Reintenta adquirir lock con backoff
 */
export async function acquireSlotLockWithRetry(
  slotTime: string,
  doctorId: string,
  userId: string,
  userName: string,
  appointmentId?: string
): Promise<{ success: boolean; lock?: SlotLock; conflict?: BookingConflict }> {
  const config = loadBookingLockConfig();
  
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    const result = acquireSlotLock(slotTime, doctorId, userId, userName, appointmentId);
    
    if (result.success) {
      return result;
    }
    
    // Si el conflicto no permite override, no reintentar
    if (result.conflict && !result.conflict.canOverride) {
      return result;
    }
    
    // Esperar antes de reintentar
    if (attempt < config.maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, config.retryDelay * (attempt + 1)));
    }
  }
  
  return {
    success: false,
    conflict: {
      conflictType: 'slot-locked',
      slotTime,
      doctorId,
      message: `No se pudo adquirir el lock después de ${config.maxRetries} intentos`,
      canOverride: false,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const BookingLockUtils = {
  // Config
  loadConfig: loadBookingLockConfig,
  saveConfig: saveBookingLockConfig,
  
  // Lock management
  acquireLock: acquireSlotLock,
  acquireLockWithRetry: acquireSlotLockWithRetry,
  releaseLock: releaseSlotLock,
  releaseUserLocks,
  isSlotLocked,
  getActiveLocks,
  
  // Cleanup
  cleanupExpiredLocks,
  startAutoCleanup,
  stopAutoCleanup,
  
  // Conflict detection
  detectConflicts: detectBookingConflicts,
  validateOptimisticLock,
  incrementVersion,
  
  // Visual helpers
  getSlotLockClass,
  getSlotLockTooltip,
};
