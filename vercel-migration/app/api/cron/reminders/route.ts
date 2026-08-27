/**
 * Cron Job: Auto-Reminders
 * Runs periodically to check and create automatic notifications
 * 
 * Checks:
 * 1. Unsent invoices (3+ days old)
 * 2. Unpaid invoices (7+ days old)
 * 3. Expiring certificates (30 days before)
 * 4. Upcoming appointments (24 hours before)
 * 5. Low inventory items
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { NotificationPreferences } from '@/lib/types/notifications';
import { clinicDateStringRangeUtc, dateStringInTimezone } from '@/lib/timezone';

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-change-in-production';

/**
 * Check if current time is within DND hours
 */
function isDNDActive(prefs: NotificationPreferences): boolean {
  if (!prefs.dnd_start_hour || !prefs.dnd_end_hour) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  
  const start = prefs.dnd_start_hour;
  const end = prefs.dnd_end_hour;
  
  // Case 1: DND within same day (e.g., 9-17)
  if (start < end) {
    return currentHour >= start && currentHour < end;
  }
  
  // Case 2: DND crosses midnight (e.g., 22-8)
  return currentHour >= start || currentHour < end;
}

/**
 * Check if reminder was already sent today
 */
async function wasReminderSentToday(
  userId: string,
  reminderType: string,
  entityId: string
): Promise<boolean> {
  // Adenda V2.1, A-5: "hoy" en el calendario local de la clinica, no el
  // dia UTC del proceso
  const today = dateStringInTimezone(new Date());
  const { startUtc: todayStartUtc } = clinicDateStringRangeUtc(today);

  const { data, error } = await supabaseAdmin
    .from('reminder_log')
    .select('id')
    .eq('user_id', userId)
    .eq('reminder_type', reminderType)
    .eq('related_entity_id', entityId)
    .gte('sent_at', todayStartUtc.toISOString())
    .limit(1);
  
  if (error) {
    console.error('Error checking reminder log:', error);
    return false;
  }
  
  return (data?.length || 0) > 0;
}

/**
 * Create notification and log reminder
 */
async function createReminderNotification(
  userId: string,
  reminderType: string,
  entityId: string,
  notificationData: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'reminder';
    category: 'invoice' | 'appointment' | 'payment' | 'certificate' | 'system';
    action_url?: string;
    related_invoice_id?: string;
    related_patient_id?: string;
    related_appointment_id?: string;
  }
): Promise<void> {
  try {
    // Create notification
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        ...notificationData,
      });
    
    if (notifError) {
      console.error('Error creating notification:', notifError);
      return;
    }
    
    // Log reminder to prevent duplicates
    const { error: logError } = await supabaseAdmin
      .from('reminder_log')
      .insert({
        user_id: userId,
        reminder_type: reminderType,
        related_entity_id: entityId,
      });
    
    if (logError) {
      console.error('Error logging reminder:', logError);
    }
  } catch (error) {
    console.error('Error in createReminderNotification:', error);
  }
}

/**
 * Check for unsent invoices
 */
async function checkUnsentInvoices(userId: string, prefs: NotificationPreferences) {
  if (!prefs.notify_unsent_invoices) return 0;
  
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - prefs.unsent_invoice_days);
  
  // Query invoices that are 'emitida' but not sent
  const { data: invoices, error } = await supabaseAdmin
    .from('invoices')
    .select('id, serie, folio, fecha_emision, patient_id')
    .eq('user_id', userId)
    .eq('status', 'emitida')
    .lt('fecha_emision', daysAgo.toISOString())
    .limit(50);
  
  if (error || !invoices) {
    console.error('Error fetching unsent invoices:', error);
    return 0;
  }
  
  let count = 0;
  
  for (const invoice of invoices) {
    const entityId = `invoice-${invoice.id}`;
    
    // Check if already sent today
    if (await wasReminderSentToday(userId, 'unsent_invoice', entityId)) {
      continue;
    }
    
    const daysSince = Math.floor(
      (Date.now() - new Date(invoice.fecha_emision).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    await createReminderNotification(
      userId,
      'unsent_invoice',
      entityId,
      {
        title: `Factura ${invoice.serie}-${invoice.folio} sin enviar`,
        message: `Esta factura lleva ${daysSince} días sin enviar al cliente`,
        type: 'warning',
        category: 'invoice',
        action_url: `/billing/invoices/${invoice.id}`,
        related_invoice_id: invoice.id,
        related_patient_id: invoice.patient_id,
      }
    );
    
    count++;
  }
  
  return count;
}

/**
 * Check for unpaid invoices
 */
async function checkUnpaidInvoices(userId: string, prefs: NotificationPreferences) {
  if (!prefs.notify_unpaid_invoices) return 0;
  
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - prefs.unpaid_invoice_days);
  
  // Query invoices that are 'enviada' but not paid
  const { data: invoices, error } = await supabaseAdmin
    .from('invoices')
    .select('id, serie, folio, fecha_envio, patient_id')
    .eq('user_id', userId)
    .eq('status', 'enviada')
    .lt('fecha_envio', daysAgo.toISOString())
    .limit(50);
  
  if (error || !invoices) {
    console.error('Error fetching unpaid invoices:', error);
    return 0;
  }
  
  let count = 0;
  
  for (const invoice of invoices) {
    const entityId = `invoice-unpaid-${invoice.id}`;
    
    if (await wasReminderSentToday(userId, 'unpaid_invoice', entityId)) {
      continue;
    }
    
    const daysSince = Math.floor(
      (Date.now() - new Date(invoice.fecha_envio).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    await createReminderNotification(
      userId,
      'unpaid_invoice',
      entityId,
      {
        title: `Factura ${invoice.serie}-${invoice.folio} pendiente de pago`,
        message: `Esta factura lleva ${daysSince} días pendiente de pago`,
        type: 'warning',
        category: 'payment',
        action_url: `/billing/invoices/${invoice.id}`,
        related_invoice_id: invoice.id,
        related_patient_id: invoice.patient_id,
      }
    );
    
    count++;
  }
  
  return count;
}

/**
 * Check for expiring certificates
 */
async function checkExpiringCertificates(userId: string, prefs: NotificationPreferences) {
  if (!prefs.notify_expiring_certificates) return 0;
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + prefs.certificate_expiry_days);
  
  // Query certificates expiring soon
  const { data: certificates, error } = await supabaseAdmin
    .from('certificates')
    .select('id, name, expires_at, patient_id')
    .eq('user_id', userId)
    .lte('expires_at', futureDate.toISOString())
    .gte('expires_at', new Date().toISOString())
    .limit(50);
  
  if (error || !certificates) {
    console.error('Error fetching expiring certificates:', error);
    return 0;
  }
  
  let count = 0;
  
  for (const cert of certificates) {
    const entityId = `certificate-${cert.id}`;
    
    if (await wasReminderSentToday(userId, 'expiring_certificate', entityId)) {
      continue;
    }
    
    const daysUntil = Math.ceil(
      (new Date(cert.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    await createReminderNotification(
      userId,
      'expiring_certificate',
      entityId,
      {
        title: `Certificado "${cert.name}" próximo a vencer`,
        message: `Este certificado vence en ${daysUntil} días`,
        type: 'reminder',
        category: 'certificate',
        action_url: `/certificates/${cert.id}`,
        related_patient_id: cert.patient_id,
      }
    );
    
    count++;
  }
  
  return count;
}

/**
 * Check for upcoming appointments
 */
async function checkUpcomingAppointments(userId: string, prefs: NotificationPreferences) {
  if (!prefs.notify_upcoming_appointments) return 0;
  
  const now = new Date();
  const futureTime = new Date();
  futureTime.setHours(futureTime.getHours() + prefs.appointment_reminder_hours);
  
  // Query appointments in the reminder window
  const { data: appointments, error } = await supabaseAdmin
    .from('appointments')
    .select('id, patient_id, start_time, notes')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .gte('start_time', now.toISOString())
    .lte('start_time', futureTime.toISOString())
    .limit(50);
  
  if (error || !appointments) {
    console.error('Error fetching upcoming appointments:', error);
    return 0;
  }
  
  let count = 0;
  
  for (const appt of appointments) {
    const entityId = `appointment-${appt.id}`;
    
    if (await wasReminderSentToday(userId, 'upcoming_appointment', entityId)) {
      continue;
    }
    
    const hoursUntil = Math.round(
      (new Date(appt.start_time).getTime() - Date.now()) / (1000 * 60 * 60)
    );
    
    // Get patient name
    const { data: patient } = await supabaseAdmin
      .from('patient_records')
      .select('nombre, apellido_paterno')
      .eq('id', appt.patient_id)
      .single();
    
    const patientName = patient 
      ? `${patient.nombre} ${patient.apellido_paterno}`
      : 'Paciente';
    
    await createReminderNotification(
      userId,
      'upcoming_appointment',
      entityId,
      {
        title: `Cita próxima con ${patientName}`,
        message: `Tienes una cita en ${hoursUntil} horas`,
        type: 'reminder',
        category: 'appointment',
        action_url: `/appointments/${appt.id}`,
        related_appointment_id: appt.id,
        related_patient_id: appt.patient_id,
      }
    );
    
    count++;
  }
  
  return count;
}

/**
 * Check for low inventory items
 */
async function checkLowInventory(userId: string, prefs: NotificationPreferences) {
  if (!prefs.notify_low_inventory) return 0;
  
  // Query items with low stock
  const { data: items, error } = await supabaseAdmin
    .from('inventory_items')
    .select('id, nombre, stock_actual, stock_minimo')
    .eq('user_id', userId)
    .limit(50);
  
  if (error || !items) {
    console.error('Error fetching low inventory:', error);
    return 0;
  }
  
  let count = 0;
  
  for (const item of items) {
    const stockActual = Number(item.stock_actual) || 0;
    const stockMinimo = Number(item.stock_minimo) || 0;
    if (!(stockMinimo > 0 && stockActual <= stockMinimo)) {
      continue;
    }

    const entityId = `inventory-${item.id}`;
    
    if (await wasReminderSentToday(userId, 'low_inventory', entityId)) {
      continue;
    }
    
    await createReminderNotification(
      userId,
      'low_inventory',
      entityId,
      {
        title: `Stock bajo: ${item.nombre}`,
        message: `Quedan ${stockActual} unidades (mínimo: ${stockMinimo})`,
        type: 'warning',
        category: 'system',
        action_url: `/inventory/${item.id}`,
      }
    );
    
    count++;
  }
  
  return count;
}

/**
 * Main cron handler
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError || !users) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
    const results = {
      users_processed: 0,
      users_skipped_dnd: 0,
      reminders_created: {
        unsent_invoices: 0,
        unpaid_invoices: 0,
        expiring_certificates: 0,
        upcoming_appointments: 0,
        low_inventory: 0,
      },
      errors: [] as string[],
    };
    
    for (const user of users.users) {
      try {
        // Get or create user preferences
        let { data: prefs, error: prefsError } = await supabaseAdmin
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (prefsError || !prefs) {
          // Create default preferences
          const { data: newPrefs, error: createError } = await supabaseAdmin
            .from('notification_preferences')
            .insert({
              user_id: user.id,
              browser_enabled: true,
              email_enabled: false,
              notify_unsent_invoices: true,
              notify_unpaid_invoices: true,
              notify_expiring_certificates: true,
              notify_upcoming_appointments: true,
              notify_low_inventory: false,
              unsent_invoice_days: 3,
              unpaid_invoice_days: 7,
              certificate_expiry_days: 30,
              appointment_reminder_hours: 24,
            })
            .select()
            .single();
          
          if (createError || !newPrefs) {
            console.error(`Error creating preferences for user ${user.id}:`, createError);
            results.errors.push(`User ${user.email}: Failed to create preferences`);
            continue;
          }
          
          prefs = newPrefs;
        }
        
        // Check DND hours
        if (isDNDActive(prefs)) {
          results.users_skipped_dnd++;
          continue;
        }
        // Run all checks
        results.reminders_created.unsent_invoices += await checkUnsentInvoices(user.id, prefs);
        results.reminders_created.unpaid_invoices += await checkUnpaidInvoices(user.id, prefs);
        results.reminders_created.expiring_certificates += await checkExpiringCertificates(user.id, prefs);
        results.reminders_created.upcoming_appointments += await checkUpcomingAppointments(user.id, prefs);
        results.reminders_created.low_inventory += await checkLowInventory(user.id, prefs);
        
        results.users_processed++;
        
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        results.errors.push(`User ${user.email}: ${userError}`);
      }
    }
    
    const totalReminders = Object.values(results.reminders_created).reduce((a, b) => a + b, 0);
    return NextResponse.json({
      success: true,
      ...results,
      total_reminders: totalReminders,
    });
    
  } catch (error) {
    console.error('❌ Fatal error in cron job:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
