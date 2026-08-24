/**
 * Contacto oficial centralizado (auditoría fable 2026-06-11, K4).
 *
 * ANTES: app/soporte/page.tsx contenía números de WhatsApp distintos
 * (52 222 340 4585 en el héroe y placeholders 81/55 1234 5678 en tarjetas).
 * PENDIENTE NEGOCIO: confirmar que el número por defecto es el correcto.
 */
export const SUPPORT_WHATSAPP_E164 =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '522223404585'

export const SUPPORT_WHATSAPP_DISPLAY =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_DISPLAY ?? '+52 222 340 4585'

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'soporte@agendamedpro.com'

export function supportWhatsAppLink(message?: string): string {
  const base = `https://wa.me/${SUPPORT_WHATSAPP_E164}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
