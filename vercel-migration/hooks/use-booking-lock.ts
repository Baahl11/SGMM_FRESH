/**
 * useBookingLock Hook
 * 
 * React hook para gestionar booking locks y prevenir double-booking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookingLockConfig,
  SlotLock,
  BookingConflict,
  BookingLockUtils,
  loadBookingLockConfig,
  saveBookingLockConfig,
} from '@/lib/utils/booking-lock';
import { toast } from 'sonner';

interface UseBookingLockOptions {
  userId: string;
  userName: string;
  autoCleanup?: boolean;
  onConflict?: (conflict: BookingConflict) => void;
}

interface UseBookingLockReturn {
  config: BookingLockConfig;
  updateConfig: (updates: Partial<BookingLockConfig>) => void;
  
  // Lock management
  acquireLock: (
    slotTime: string,
    doctorId: string,
    appointmentId?: string
  ) => Promise<{ success: boolean; lock?: SlotLock; conflict?: BookingConflict }>;
  
  releaseLock: (lockId: string) => boolean;
  releaseAllLocks: () => number;
  
  // Query
  isSlotLocked: (slotTime: string, doctorId: string) => { locked: boolean; lock?: SlotLock };
  getActiveLocks: (doctorId: string, startTime: string, endTime: string) => SlotLock[];
  
  // Conflict detection
  checkConflicts: (
    slotTime: string,
    duration: number,
    doctorId: string,
    existingAppointments: Array<{
      id: string;
      patientName: string;
      startTime: string;
      duration: number;
      doctorId: string;
    }>,
    bufferTime?: number,
    excludeAppointmentId?: string
  ) => BookingConflict[];
  
  // State
  activeLocks: SlotLock[];
  isInitialized: boolean;
}

export function useBookingLock(options: UseBookingLockOptions): UseBookingLockReturn {
  const { userId, userName, autoCleanup = true, onConflict } = options;
  
  const [config, setConfig] = useState<BookingLockConfig>(loadBookingLockConfig());
  const [activeLocks, setActiveLocks] = useState<SlotLock[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  useEffect(() => {
    // Load initial config
    const loadedConfig = loadBookingLockConfig();
    setConfig(loadedConfig);
    
    // Start auto-cleanup if enabled
    if (autoCleanup && loadedConfig.enabled) {
      BookingLockUtils.startAutoCleanup();
    }
    
    // Refresh active locks periodically (para mostrar en UI)
    refreshIntervalRef.current = setInterval(() => {
      // Force re-read from localStorage para sincronizar entre pestañas
      const allLocks = BookingLockUtils.getActiveLocks('', '', '');
      setActiveLocks(allLocks);
    }, 2000); // cada 2 segundos
    
    setIsInitialized(true);
    
    // Cleanup on unmount
    return () => {
      if (autoCleanup) {
        BookingLockUtils.stopAutoCleanup();
      }
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      // Release all user locks on unmount
      const released = BookingLockUtils.releaseUserLocks(userId);
      if (released > 0) {
        console.log(`Released ${released} locks on unmount`);
      }
    };
  }, [userId, autoCleanup]);
  
  // ============================================================================
  // CONFIG MANAGEMENT
  // ============================================================================
  
  const updateConfig = useCallback((updates: Partial<BookingLockConfig>) => {
    const updated = { ...config, ...updates };
    setConfig(updated);
    saveBookingLockConfig(updates);
    
    // Restart auto-cleanup con nueva configuración
    if (autoCleanup && updated.enabled) {
      BookingLockUtils.stopAutoCleanup();
      BookingLockUtils.startAutoCleanup();
    } else if (!updated.enabled) {
      BookingLockUtils.stopAutoCleanup();
    }
    
    toast.success('Configuración actualizada');
  }, [config, autoCleanup]);
  
  // ============================================================================
  // LOCK MANAGEMENT
  // ============================================================================
  
  const acquireLock = useCallback(
    async (
      slotTime: string,
      doctorId: string,
      appointmentId?: string
    ): Promise<{ success: boolean; lock?: SlotLock; conflict?: BookingConflict }> => {
      if (!config.enabled) {
        return { success: true };
      }
      
      const result = await BookingLockUtils.acquireLockWithRetry(
        slotTime,
        doctorId,
        userId,
        userName,
        appointmentId
      );
      
      if (!result.success && result.conflict) {
        if (config.notifyOnConflict) {
          toast.error(result.conflict.message, {
            duration: 5000,
          });
        }
        
        if (onConflict) {
          onConflict(result.conflict);
        }
      }
      
      // Refresh active locks
      const allLocks = BookingLockUtils.getActiveLocks('', '', '');
      setActiveLocks(allLocks);
      
      return result;
    },
    [config, userId, userName, onConflict]
  );
  
  const releaseLock = useCallback(
    (lockId: string): boolean => {
      const released = BookingLockUtils.releaseLock(lockId, userId);
      
      if (released) {
        // Refresh active locks
        const allLocks = BookingLockUtils.getActiveLocks('', '', '');
        setActiveLocks(allLocks);
      }
      
      return released;
    },
    [userId]
  );
  
  const releaseAllLocks = useCallback((): number => {
    const count = BookingLockUtils.releaseUserLocks(userId);
    
    if (count > 0) {
      // Refresh active locks
      const allLocks = BookingLockUtils.getActiveLocks('', '', '');
      setActiveLocks(allLocks);
      
      console.log(`Released ${count} locks for user ${userId}`);
    }
    
    return count;
  }, [userId]);
  
  // ============================================================================
  // QUERY FUNCTIONS
  // ============================================================================
  
  const isSlotLocked = useCallback(
    (slotTime: string, doctorId: string): { locked: boolean; lock?: SlotLock } => {
      return BookingLockUtils.isSlotLocked(slotTime, doctorId, userId);
    },
    [userId]
  );
  
  const getActiveLocks = useCallback(
    (doctorId: string, startTime: string, endTime: string): SlotLock[] => {
      return BookingLockUtils.getActiveLocks(doctorId, startTime, endTime);
    },
    []
  );
  
  // ============================================================================
  // CONFLICT DETECTION
  // ============================================================================
  
  const checkConflicts = useCallback(
    (
      slotTime: string,
      duration: number,
      doctorId: string,
      existingAppointments: Array<{
        id: string;
        patientName: string;
        startTime: string;
        duration: number;
        doctorId: string;
      }>,
      bufferTime: number = 0,
      excludeAppointmentId?: string
    ): BookingConflict[] => {
      return BookingLockUtils.detectConflicts(
        slotTime,
        duration,
        doctorId,
        existingAppointments,
        bufferTime,
        excludeAppointmentId
      );
    },
    []
  );
  
  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    config,
    updateConfig,
    
    acquireLock,
    releaseLock,
    releaseAllLocks,
    
    isSlotLocked,
    getActiveLocks,
    
    checkConflicts,
    
    activeLocks,
    isInitialized,
  };
}

// ============================================================================
// HELPER HOOK: useSlotLockGuard
// ============================================================================

/**
 * Hook helper para guardar un slot específico durante una operación
 */
export function useSlotLockGuard(
  slotTime: string,
  doctorId: string,
  userId: string,
  userName: string,
  appointmentId?: string
) {
  const lockIdRef = useRef<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const acquire = useCallback(async () => {
    const result = await BookingLockUtils.acquireLockWithRetry(
      slotTime,
      doctorId,
      userId,
      userName,
      appointmentId
    );
    
    if (result.success && result.lock) {
      lockIdRef.current = result.lock.id;
      setIsLocked(true);
      setError(null);
      return true;
    } else {
      setError(result.conflict?.message || 'Failed to acquire lock');
      return false;
    }
  }, [slotTime, doctorId, userId, userName, appointmentId]);
  
  const release = useCallback(() => {
    if (lockIdRef.current) {
      const released = BookingLockUtils.releaseLock(lockIdRef.current, userId);
      if (released) {
        lockIdRef.current = null;
        setIsLocked(false);
      }
    }
  }, [userId]);
  
  // Auto-release on unmount
  useEffect(() => {
    return () => {
      release();
    };
  }, [release]);
  
  return {
    isLocked,
    error,
    acquire,
    release,
  };
}
