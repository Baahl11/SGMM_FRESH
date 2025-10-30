"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  SmsReminder,
  SmsReminderConfig,
  ReminderTiming,
  generateReminderId,
  calculateSendTime,
  adjustForQuietHours,
  formatPhoneNumber,
  isValidPhoneNumber,
  generateReminderMessage,
  shouldSendReminder,
  loadSmsConfig,
  saveSmsConfig
} from '@/lib/utils/sms-reminders';

export function useSmsReminders() {
  const [reminders, setReminders] = useState<SmsReminder[]>([]);
  const [config, setConfig] = useState<SmsReminderConfig>(loadSmsConfig());
  const [isSending, setIsSending] = useState(false);

  // Load reminders from localStorage on mount
  useEffect(() => {
    loadReminders();
  }, []);

  // Save reminders to localStorage whenever they change
  useEffect(() => {
    saveReminders();
  }, [reminders]);

  // Auto-send pending reminders
  useEffect(() => {
    if (!config.enabled) return;

    const interval = setInterval(() => {
      checkAndSendPendingReminders();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [config, reminders]);

  const loadReminders = () => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('sms-reminders');
      if (saved) {
        const loaded = JSON.parse(saved);
        setReminders(loaded);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
      toast.error('Error al cargar recordatorios');
    }
  };

  const saveReminders = () => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('sms-reminders', JSON.stringify(reminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  /**
   * Schedule SMS reminder for an appointment
   */
  const scheduleReminder = useCallback((
    appointmentData: {
      appointment_id: number;
      patient_id: number;
      patient_name: string;
      patient_phone: string;
      appointment_date: string;
      appointment_time: string;
      doctor_name?: string;
      location?: string;
    },
    timing: ReminderTiming,
    customHours?: number
  ): SmsReminder | null => {
    // Validate phone number
    if (!isValidPhoneNumber(appointmentData.patient_phone)) {
      toast.error('Número de teléfono inválido', {
        description: 'Verifica el número del paciente'
      });
      return null;
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(appointmentData.patient_phone, config.country_code);

    // Calculate send time
    let sendTime = calculateSendTime(
      appointmentData.appointment_date,
      appointmentData.appointment_time,
      timing,
      customHours
    );

    // Adjust for quiet hours if needed
    sendTime = adjustForQuietHours(sendTime, config);

    // Generate message
    const message = generateReminderMessage(
      config,
      {
        patient_name: appointmentData.patient_name,
        date: appointmentData.appointment_date,
        time: appointmentData.appointment_time,
        doctor_name: appointmentData.doctor_name,
        location: appointmentData.location
      },
      timing
    );

    const newReminder: SmsReminder = {
      id: generateReminderId(),
      appointment_id: appointmentData.appointment_id,
      patient_id: appointmentData.patient_id,
      patient_name: appointmentData.patient_name,
      patient_phone: formattedPhone,
      appointment_date: appointmentData.appointment_date,
      appointment_time: appointmentData.appointment_time,
      doctor_name: appointmentData.doctor_name,
      scheduled_send_time: sendTime.toISOString(),
      status: 'pending',
      message,
      timing,
      custom_hours: customHours,
      provider: config.provider,
      retry_count: 0,
      created_at: new Date().toISOString()
    };

    setReminders(prev => [...prev, newReminder]);

    toast.success('Recordatorio programado', {
      description: `Se enviará ${timing === 'custom' ? `${customHours}h` : timing} antes de la cita`
    });

    return newReminder;
  }, [config]);

  /**
   * Schedule multiple reminders for an appointment
   */
  const scheduleMultipleReminders = useCallback((
    appointmentData: {
      appointment_id: number;
      patient_id: number;
      patient_name: string;
      patient_phone: string;
      appointment_date: string;
      appointment_time: string;
      doctor_name?: string;
      location?: string;
    },
    timings?: ReminderTiming[]
  ): SmsReminder[] => {
    const timingsToSchedule = timings || config.default_timings;
    const scheduled: SmsReminder[] = [];

    timingsToSchedule.forEach(timing => {
      const reminder = scheduleReminder(appointmentData, timing);
      if (reminder) scheduled.push(reminder);
    });

    return scheduled;
  }, [config, scheduleReminder]);

  /**
   * Send SMS reminder immediately
   */
  const sendReminder = useCallback(async (reminderId: string): Promise<boolean> => {
    setIsSending(true);

    try {
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) {
        toast.error('Recordatorio no encontrado');
        return false;
      }

      // TODO: In production, integrate with SMS provider API
      // For now, simulate sending
      console.log('Sending SMS:', {
        to: reminder.patient_phone,
        message: reminder.message,
        provider: config.provider
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update reminder status
      setReminders(prev =>
        prev.map(r =>
          r.id === reminderId
            ? {
                ...r,
                status: 'sent',
                actual_send_time: new Date().toISOString(),
                provider_message_id: `sim-${Date.now()}`
              }
            : r
        )
      );

      toast.success('SMS enviado', {
        description: `A ${reminder.patient_name}`
      });

      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      
      // Update reminder as failed
      setReminders(prev =>
        prev.map(r =>
          r.id === reminderId
            ? {
                ...r,
                status: 'failed',
                error_message: error instanceof Error ? error.message : 'Error desconocido',
                retry_count: r.retry_count + 1
              }
            : r
        )
      );

      toast.error('Error al enviar SMS');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [reminders, config]);

  /**
   * Check and send pending reminders
   */
  const checkAndSendPendingReminders = useCallback(async () => {
    const pending = reminders.filter(r => shouldSendReminder(r, config));

    for (const reminder of pending) {
      await sendReminder(reminder.id);
    }
  }, [reminders, config, sendReminder]);

  /**
   * Cancel reminder
   */
  const cancelReminder = useCallback((reminderId: string) => {
    setReminders(prev =>
      prev.map(r =>
        r.id === reminderId ? { ...r, status: 'cancelled' } : r
      )
    );

    toast.info('Recordatorio cancelado');
  }, []);

  /**
   * Mark reminder as confirmed by patient
   */
  const confirmReminder = useCallback((reminderId: string, response: string) => {
    setReminders(prev =>
      prev.map(r =>
        r.id === reminderId
          ? {
              ...r,
              confirmed_at: new Date().toISOString(),
              confirmation_response: response
            }
          : r
      )
    );

    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      toast.success(`Confirmación recibida de ${reminder.patient_name}`);
    }
  }, [reminders]);

  /**
   * Retry failed reminder
   */
  const retryReminder = useCallback(async (reminderId: string): Promise<boolean> => {
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (!reminder || reminder.retry_count >= 3) {
      toast.error('Límite de reintentos alcanzado');
      return false;
    }

    // Reset status to pending
    setReminders(prev =>
      prev.map(r =>
        r.id === reminderId
          ? { ...r, status: 'pending', error_message: undefined }
          : r
      )
    );

    // Try sending again
    return await sendReminder(reminderId);
  }, [reminders, sendReminder]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<SmsReminderConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    saveSmsConfig(updated);
    toast.success('Configuración actualizada');
  }, [config]);

  /**
   * Get reminders for specific appointment
   */
  const getAppointmentReminders = useCallback((appointmentId: number): SmsReminder[] => {
    return reminders.filter(r => r.appointment_id === appointmentId);
  }, [reminders]);

  /**
   * Get pending reminders
   */
  const getPendingReminders = useCallback((): SmsReminder[] => {
    return reminders.filter(r => r.status === 'pending');
  }, [reminders]);

  /**
   * Delete reminder
   */
  const deleteReminder = useCallback((reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    toast.success('Recordatorio eliminado');
  }, []);

  /**
   * Bulk schedule reminders for multiple appointments
   */
  const bulkSchedule = useCallback((
    appointments: Array<{
      appointment_id: number;
      patient_id: number;
      patient_name: string;
      patient_phone: string;
      appointment_date: string;
      appointment_time: string;
      doctor_name?: string;
      location?: string;
    }>
  ): number => {
    let scheduled = 0;

    appointments.forEach(appointment => {
      const results = scheduleMultipleReminders(appointment);
      scheduled += results.length;
    });

    toast.success(`${scheduled} recordatorios programados`, {
      description: `Para ${appointments.length} citas`
    });

    return scheduled;
  }, [scheduleMultipleReminders]);

  return {
    reminders,
    config,
    isSending,
    scheduleReminder,
    scheduleMultipleReminders,
    sendReminder,
    cancelReminder,
    confirmReminder,
    retryReminder,
    updateConfig,
    getAppointmentReminders,
    getPendingReminders,
    deleteReminder,
    bulkSchedule
  };
}
