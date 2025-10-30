"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  WaitlistEntry,
  WaitlistSettings,
  generateWaitlistId,
  findMatchingWaitlistEntries,
  loadWaitlistSettings,
  saveWaitlistSettings,
  formatWaitlistNotification
} from '@/lib/utils/waitlist';

export function useWaitlist() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [settings, setSettings] = useState<WaitlistSettings>(loadWaitlistSettings());
  const [isLoading, setIsLoading] = useState(false);

  // Load waitlist from localStorage on mount
  useEffect(() => {
    loadWaitlist();
  }, []);

  // Save waitlist to localStorage whenever it changes
  useEffect(() => {
    saveWaitlist();
  }, [waitlist]);

  const loadWaitlist = () => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('waitlist-entries');
      if (saved) {
        const entries = JSON.parse(saved);
        setWaitlist(entries);
      }
    } catch (error) {
      console.error('Error loading waitlist:', error);
      toast.error('Error al cargar la lista de espera');
    }
  };

  const saveWaitlist = () => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('waitlist-entries', JSON.stringify(waitlist));
    } catch (error) {
      console.error('Error saving waitlist:', error);
    }
  };

  /**
   * Add patient to waitlist
   */
  const addToWaitlist = useCallback((
    entryData: Omit<WaitlistEntry, 'id' | 'created_at' | 'status'>
  ): WaitlistEntry => {
    const newEntry: WaitlistEntry = {
      ...entryData,
      id: generateWaitlistId(),
      created_at: new Date().toISOString(),
      status: 'active'
    };

    setWaitlist(prev => [...prev, newEntry]);
    
    toast.success(
      `${newEntry.patient_name} agregado a la lista de espera`,
      {
        description: `Prioridad: ${newEntry.priority}`
      }
    );

    return newEntry;
  }, []);

  /**
   * Update waitlist entry
   */
  const updateWaitlistEntry = useCallback((
    id: string,
    updates: Partial<WaitlistEntry>
  ) => {
    setWaitlist(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, ...updates } : entry
      )
    );

    toast.success('Entrada actualizada');
  }, []);

  /**
   * Remove from waitlist
   */
  const removeFromWaitlist = useCallback((id: string) => {
    const entry = waitlist.find(e => e.id === id);
    
    setWaitlist(prev => prev.filter(e => e.id !== id));
    
    if (entry) {
      toast.success(`${entry.patient_name} eliminado de la lista de espera`);
    }
  }, [waitlist]);

  /**
   * Cancel waitlist entry
   */
  const cancelWaitlistEntry = useCallback((id: string) => {
    updateWaitlistEntry(id, { status: 'cancelled' });
    
    const entry = waitlist.find(e => e.id === id);
    if (entry) {
      toast.info(`Lista de espera cancelada para ${entry.patient_name}`);
    }
  }, [waitlist, updateWaitlistEntry]);

  /**
   * Mark as booked
   */
  const markAsBooked = useCallback((id: string) => {
    updateWaitlistEntry(id, { status: 'booked' });
    
    const entry = waitlist.find(e => e.id === id);
    if (entry) {
      toast.success(`Cita agendada para ${entry.patient_name}`);
    }
  }, [waitlist, updateWaitlistEntry]);

  /**
   * Notify patient about available slot
   */
  const notifyPatient = useCallback(async (
    entry: WaitlistEntry,
    slot: { date: string; time: string; doctor_name?: string }
  ) => {
    setIsLoading(true);

    try {
      // Format notification message
      const message = formatWaitlistNotification(entry, slot);

      // TODO: In production, send actual notification via email/SMS/WhatsApp
      // For now, just log and update status
      console.log('Notification to send:', {
        patient: entry.patient_name,
        email: entry.patient_email,
        phone: entry.patient_phone,
        message
      });

      // Update entry status
      updateWaitlistEntry(entry.id, {
        status: 'notified',
        notified_at: new Date().toISOString()
      });

      toast.success(
        `Notificación enviada a ${entry.patient_name}`,
        {
          description: `Slot disponible: ${slot.date} ${slot.time}`
        }
      );

      return true;
    } catch (error) {
      console.error('Error notifying patient:', error);
      toast.error('Error al enviar notificación');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateWaitlistEntry]);

  /**
   * Check for matching waitlist entries when slot becomes available
   */
  const checkForMatches = useCallback((
    slot: { date: string; time: string; doctor_id?: string }
  ): WaitlistEntry[] => {
    if (!settings.enabled) return [];

    const matches = findMatchingWaitlistEntries(waitlist, slot);

    if (matches.length > 0 && settings.auto_notify) {
      toast.info(
        `${matches.length} paciente(s) en lista de espera coinciden con este horario`,
        {
          description: 'Haz clic para notificar',
          action: {
            label: 'Notificar',
            onClick: () => {
              const topMatch = matches[0];
              notifyPatient(topMatch, {
                date: slot.date,
                time: slot.time,
                doctor_name: topMatch.doctor_name
              });
            }
          }
        }
      );
    }

    return matches;
  }, [waitlist, settings, notifyPatient]);

  /**
   * Auto-book appointment if enabled
   */
  const tryAutoBook = useCallback((
    entry: WaitlistEntry,
    slot: { date: string; time: string }
  ): boolean => {
    if (!entry.auto_book) return false;

    // TODO: In production, create actual appointment via API
    console.log('Auto-booking appointment:', {
      patient: entry.patient_name,
      slot
    });

    markAsBooked(entry.id);
    
    toast.success(
      `Cita agendada automáticamente para ${entry.patient_name}`,
      {
        description: `${slot.date} a las ${slot.time}`
      }
    );

    return true;
  }, [markAsBooked]);

  /**
   * Update settings
   */
  const updateSettings = useCallback((newSettings: Partial<WaitlistSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveWaitlistSettings(updated);
    toast.success('Configuración actualizada');
  }, [settings]);

  /**
   * Get active waitlist entries
   */
  const getActiveEntries = useCallback(() => {
    return waitlist.filter(e => e.status === 'active');
  }, [waitlist]);

  /**
   * Get notified entries waiting for response
   */
  const getNotifiedEntries = useCallback(() => {
    return waitlist.filter(e => e.status === 'notified');
  }, [waitlist]);

  return {
    waitlist,
    settings,
    isLoading,
    addToWaitlist,
    updateWaitlistEntry,
    removeFromWaitlist,
    cancelWaitlistEntry,
    markAsBooked,
    notifyPatient,
    checkForMatches,
    tryAutoBook,
    updateSettings,
    getActiveEntries,
    getNotifiedEntries
  };
}
