/**
 * Marketing constants — single source of truth for copy and external links.
 * Update WHATSAPP_SALES_NUMBER with the real AgendaMedPro sales/demo WhatsApp number.
 * Format: country code + number, no spaces, no +. Example: 5215512345678
 * Currently defaulting to the support number (522223404585) until a dedicated sales line is set.
 */
export const WHATSAPP_SALES_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_SALES_NUMBER ?? '522223404585'

export const WHATSAPP_DEMO_URL = `https://wa.me/${WHATSAPP_SALES_NUMBER}?text=Hola%2C%20quiero%20agendar%20una%20demo%20de%20AgendaMedPro`
export const WHATSAPP_SALES_URL = `https://wa.me/${WHATSAPP_SALES_NUMBER}`
export const WHATSAPP_CALCULATOR_URL = `https://wa.me/${WHATSAPP_SALES_NUMBER}?text=Hola%2C%20us%C3%A9%20la%20calculadora%20y%20quiero%20ver%20c%C3%B3mo%20recuperar%20ingresos%20perdidos%20por%20no-shows`
