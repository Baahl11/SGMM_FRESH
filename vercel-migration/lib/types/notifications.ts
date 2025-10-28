/**
 * Types for Notifications System
 * Phase 3.3 - Notifications & Reminders
 */

export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'reminder';
export type NotificationCategory = 'invoice' | 'appointment' | 'payment' | 'certificate' | 'system';
export type ReminderType = 'unsent_invoice' | 'unpaid_invoice' | 'expiring_certificate' | 'upcoming_appointment' | 'low_inventory';

export interface Notification {
  id: string;
  user_id: string;
  
  // Content
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  
  // Related entities
  related_invoice_id?: string;
  related_patient_id?: string;
  related_appointment_id?: string;
  
  // Action
  action_url?: string;
  
  // Status
  read: boolean;
  read_at?: string;
  
  // Metadata
  created_at: string;
  expires_at?: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  
  // Channels
  browser_enabled: boolean;
  email_enabled: boolean;
  email_address?: string;
  
  // Types
  notify_unsent_invoices: boolean;
  notify_unpaid_invoices: boolean;
  notify_expiring_certificates: boolean;
  notify_upcoming_appointments: boolean;
  notify_low_inventory: boolean;
  
  // Do Not Disturb
  dnd_start_hour?: number;
  dnd_end_hour?: number;
  
  // Reminder timing
  unsent_invoice_days: number;
  unpaid_invoice_days: number;
  certificate_expiry_days: number;
  appointment_reminder_hours: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface ReminderLog {
  id: string;
  user_id: string;
  reminder_type: string;
  related_entity_id: string;
  sent_at: string;
  sent_date: string; // DATE field for unique constraint
}

export interface CreateNotificationInput {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  related_invoice_id?: string;
  related_patient_id?: string;
  related_appointment_id?: string;
  action_url?: string;
  expires_at?: string;
}

export interface NotificationPreferencesInput {
  browser_enabled?: boolean;
  email_enabled?: boolean;
  email_address?: string;
  notify_unsent_invoices?: boolean;
  notify_unpaid_invoices?: boolean;
  notify_expiring_certificates?: boolean;
  notify_upcoming_appointments?: boolean;
  notify_low_inventory?: boolean;
  dnd_start_hour?: number;
  dnd_end_hour?: number;
  unsent_invoice_days?: number;
  unpaid_invoice_days?: number;
  certificate_expiry_days?: number;
  appointment_reminder_hours?: number;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  browser_enabled: true,
  email_enabled: false,
  email_address: undefined,
  notify_unsent_invoices: true,
  notify_unpaid_invoices: true,
  notify_expiring_certificates: true,
  notify_upcoming_appointments: true,
  notify_low_inventory: false,
  dnd_start_hour: undefined,
  dnd_end_hour: undefined,
  unsent_invoice_days: 3,
  unpaid_invoice_days: 7,
  certificate_expiry_days: 30,
  appointment_reminder_hours: 24,
};

export const NOTIFICATION_ICONS = {
  info: '💡',
  warning: '⚠️',
  success: '✅',
  error: '❌',
  reminder: '⏰',
};

export const NOTIFICATION_CATEGORY_LABELS = {
  invoice: 'Factura',
  appointment: 'Cita',
  payment: 'Pago',
  certificate: 'Certificado',
  system: 'Sistema',
};

export const REMINDER_TYPE_LABELS = {
  unsent_invoice: 'Factura no enviada',
  unpaid_invoice: 'Factura sin pagar',
  expiring_certificate: 'Certificado por vencer',
  upcoming_appointment: 'Cita próxima',
  low_inventory: 'Inventario bajo',
};
