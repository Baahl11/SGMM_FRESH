'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  loadGoogleCalendarConfig,
  loadSyncStatus,
  saveSyncStatus,
  appointmentToGoogleEvent,
  googleEventToAppointment,
  detectSyncConflicts,
  isSyncedWithGoogle,
  GoogleCalendarEvent,
  SyncStatus
} from '@/lib/utils/google-calendar';
import { toast } from 'sonner';

interface UseGoogleCalendarSyncOptions {
  onImportEvent?: (appointment: any) => Promise<void>;
  onExportEvent?: (appointment: any, eventId?: string) => Promise<string>; // Returns Google event ID
  onUpdateEvent?: (appointmentId: number, googleEventId: string, updates: any) => Promise<void>;
  onDeleteEvent?: (appointmentId: number, googleEventId: string) => Promise<void>;
}

export function useGoogleCalendarSync({
  onImportEvent,
  onExportEvent,
  onUpdateEvent,
  onDeleteEvent
}: UseGoogleCalendarSyncOptions) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(loadSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [config] = useState(loadGoogleCalendarConfig());

  // Auto-sync effect
  useEffect(() => {
    if (!config.enabled || !config.autoSync) return;

    const interval = setInterval(() => {
      syncAll();
    }, config.syncInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [config.enabled, config.autoSync, config.syncInterval]);

  /**
   * Sync all appointments with Google Calendar
   */
  const syncAll = useCallback(async () => {
    if (!config.enabled) {
      toast.error('Sincronización no activada');
      return;
    }

    setIsSyncing(true);
    const newStatus: SyncStatus = {
      ...syncStatus,
      syncInProgress: true
    };
    setSyncStatus(newStatus);
    saveSyncStatus(newStatus);

    try {
      // TODO: Implement actual API calls to Google Calendar
      // This is a placeholder for the actual implementation
      
      // 1. Get events from Google Calendar
      // const googleEvents = await fetchGoogleCalendarEvents();
      
      // 2. Get local appointments
      // const localAppointments = await fetchLocalAppointments();
      
      // 3. Compare and sync
      // - Import new Google events
      // - Export new local appointments
      // - Update changed items
      // - Detect conflicts

      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      const updatedStatus: SyncStatus = {
        lastSyncAt: new Date().toISOString(),
        syncInProgress: false,
        eventsImported: 5,
        eventsExported: 3,
        conflicts: 0
      };

      setSyncStatus(updatedStatus);
      saveSyncStatus(updatedStatus);

      toast.success('Sincronización completada');
    } catch (error) {
      console.error('Sync error:', error);
      
      const errorStatus: SyncStatus = {
        ...syncStatus,
        syncInProgress: false,
        syncError: error instanceof Error ? error.message : 'Error desconocido'
      };
      
      setSyncStatus(errorStatus);
      saveSyncStatus(errorStatus);
      
      toast.error('Error en sincronización');
    } finally {
      setIsSyncing(false);
    }
  }, [config.enabled, syncStatus]);

  /**
   * Export a single appointment to Google Calendar
   */
  const exportAppointment = useCallback(async (appointment: any) => {
    if (!onExportEvent) {
      toast.error('Función de exportar no configurada');
      return;
    }

    try {
      const googleEvent = appointmentToGoogleEvent(appointment);
      const eventId = await onExportEvent(appointment, appointment.google_calendar_event_id);

      toast.success('Cita exportada a Google Calendar');
      return eventId;
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar cita');
      throw error;
    }
  }, [onExportEvent]);

  /**
   * Import a Google Calendar event as appointment
   */
  const importEvent = useCallback(async (googleEvent: GoogleCalendarEvent) => {
    if (!onImportEvent) {
      toast.error('Función de importar no configurada');
      return;
    }

    try {
      const appointment = googleEventToAppointment(googleEvent);
      await onImportEvent(appointment);

      toast.success('Evento importado de Google Calendar');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Error al importar evento');
      throw error;
    }
  }, [onImportEvent]);

  /**
   * Update synced appointment
   */
  const updateSyncedAppointment = useCallback(async (
    appointmentId: number,
    googleEventId: string,
    updates: any
  ) => {
    if (!onUpdateEvent) {
      toast.error('Función de actualizar no configurada');
      return;
    }

    try {
      await onUpdateEvent(appointmentId, googleEventId, updates);
      toast.success('Cita actualizada en ambos calendarios');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Error al actualizar cita sincronizada');
      throw error;
    }
  }, [onUpdateEvent]);

  /**
   * Delete synced appointment
   */
  const deleteSyncedAppointment = useCallback(async (
    appointmentId: number,
    googleEventId: string
  ) => {
    if (!onDeleteEvent) {
      toast.error('Función de eliminar no configurada');
      return;
    }

    try {
      await onDeleteEvent(appointmentId, googleEventId);
      toast.success('Cita eliminada de ambos calendarios');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Error al eliminar cita sincronizada');
      throw error;
    }
  }, [onDeleteEvent]);

  /**
   * Check for conflicts between local and Google data
   */
  const checkConflicts = useCallback((
    localAppointment: any,
    googleEvent: GoogleCalendarEvent
  ) => {
    return detectSyncConflicts(localAppointment, googleEvent);
  }, []);

  /**
   * Manually trigger sync
   */
  const triggerSync = useCallback(() => {
    syncAll();
  }, [syncAll]);

  return {
    syncStatus,
    isSyncing,
    isEnabled: config.enabled,
    exportAppointment,
    importEvent,
    updateSyncedAppointment,
    deleteSyncedAppointment,
    checkConflicts,
    triggerSync,
    isSyncedWithGoogle
  };
}
