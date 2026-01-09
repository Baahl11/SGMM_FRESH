/**
 * WhatsApp Helper Functions
 * Generate WhatsApp links and buttons
 */

interface WhatsAppLinkParams {
  phone: string;
  message?: string;
}

/**
 * Generate a WhatsApp link
 */
export function generateWhatsAppLink({ phone, message }: WhatsAppLinkParams): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

/**
 * Generate WhatsApp message for appointment reminder
 */
export function generateAppointmentReminderMessage({
  doctorName,
  clinicName,
  patientName,
  appointmentDate,
  appointmentTime,
}: {
  doctorName: string;
  clinicName?: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
}): string {
  const clinic = clinicName ? ` en ${clinicName}` : '';
  return `Hola Dr. ${doctorName}, soy ${patientName}. Tengo cita${clinic} el ${appointmentDate} a las ${appointmentTime}.`;
}

/**
 * Generate WhatsApp message for contact
 */
export function generateContactMessage({
  doctorName,
  clinicName,
  customMessage,
}: {
  doctorName?: string;
  clinicName?: string;
  customMessage?: string;
}): string {
  if (customMessage) return customMessage;
  
  const doctor = doctorName ? `Dr. ${doctorName}` : '';
  const clinic = clinicName ? ` de ${clinicName}` : '';
  
  if (doctor || clinic) {
    return `¡Hola${doctor}${clinic}! Me contacto desde AgendaMedPro`;
  }
  
  return '¡Hola! Me contacto desde AgendaMedPro';
}
