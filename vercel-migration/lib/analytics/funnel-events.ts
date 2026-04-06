/**
 * Funnel Analytics Utility — AgendaMedPro
 *
 * Wraps Google Analytics 4 (GA4) gtag calls.
 * Set NEXT_PUBLIC_GA_MEASUREMENT_ID in your .env to activate.
 *
 * All events follow the funnel defined in the roadmap:
 *   Visitor → Interested → CTA click → Demo/Signup → Trial started → Activated → Paying
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

function track(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  window.gtag('event', eventName, params)
}

// ─── Landing page funnel events ──────────────────────────────────────────────

/** Visitor lands on the public landing page */
export function trackPageView(path: string) {
  track('page_view', { page_path: path })
}

/** Visitor clicks any CTA button */
export function trackCtaClick(label: string, destination: string) {
  track('cta_click', { cta_label: label, cta_destination: destination })
}

/** Visitor clicks the WhatsApp demo button */
export function trackWhatsAppDemoClick() {
  track('whatsapp_demo_click', { event_category: 'lead_generation', event_label: 'whatsapp_demo' })
}

/** Visitor clicks "Prueba gratis" / signup button */
export function trackSignupIntent() {
  track('signup_intent', { event_category: 'conversion', event_label: 'free_trial' })
}

/** Visitor clicks pricing link */
export function trackPricingView() {
  track('pricing_view', { event_category: 'interest', event_label: 'pricing' })
}

/** Visitor views the success cases / testimonials section */
export function trackTestimonialsView() {
  track('testimonials_view', { event_category: 'interest', event_label: 'social_proof' })
}

// ─── Auth funnel events ───────────────────────────────────────────────────────

/** User completes the signup form */
export function trackSignupCompleted(method: 'email' | 'google') {
  track('sign_up', { method })
}

/** Trial period activated for a user */
export function trackTrialStarted(plan: string) {
  track('trial_started', { plan, event_category: 'activation' })
}

/** User adds billing details / card — high-intent event */
export function trackBillingInfoAdded() {
  track('add_payment_info', { event_category: 'activation' })
}

/** User converts from trial to paid */
export function trackConversionToPaid(plan: string, value: number) {
  track('purchase', { plan, value, currency: 'MXN', event_category: 'revenue' })
}

// ─── Activation events ────────────────────────────────────────────────────────

/** User creates their first appointment — key activation signal */
export function trackFirstAppointmentCreated() {
  track('first_appointment_created', { event_category: 'activation' })
}

/** User sends their first WhatsApp/SMS reminder */
export function trackFirstReminderSent() {
  track('first_reminder_sent', { event_category: 'activation' })
}

/** User generates their first invoice */
export function trackFirstInvoiceCreated() {
  track('first_invoice_created', { event_category: 'activation' })
}
