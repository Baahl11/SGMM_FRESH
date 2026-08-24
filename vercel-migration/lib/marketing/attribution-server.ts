import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  normalizeMarketingAttribution,
  type MarketingAttributionContext,
} from './attribution'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export type AttributionEvent =
  | 'signup_created'
  | 'checkout_started'
  | 'trial_started'
  | 'subscription_started'

type PersistAttributionInput = {
  userId: string
  context?: MarketingAttributionContext | unknown | null
  event: AttributionEvent
  stripeCheckoutSessionId?: string | null
  stripeSubscriptionId?: string | null
  client?: SupabaseClient
}

function touchColumns(prefix: 'first_touch' | 'last_touch', touch: MarketingAttributionContext['firstTouch']) {
  return {
    [`${prefix}_source`]: touch.source,
    [`${prefix}_medium`]: touch.medium,
    [`${prefix}_campaign`]: touch.campaign,
    [`${prefix}_content`]: touch.content,
    [`${prefix}_term`]: touch.term,
    [`${prefix}_gclid`]: touch.gclid,
    [`${prefix}_fbclid`]: touch.fbclid,
  }
}

export async function persistMarketingAttribution(input: PersistAttributionInput) {
  const supabaseAdmin = input.client ?? getSupabaseAdmin()
  const context = normalizeMarketingAttribution(input.context)
  const now = new Date().toISOString()
  const eventColumn = `${input.event}_at`

  const { data: existing, error: readError } = await supabaseAdmin
    .from('marketing_attribution')
    .select('id, signup_created_at, checkout_started_at, trial_started_at, subscription_started_at')
    .eq('user_id', input.userId)
    .maybeSingle()

  if (readError && readError.code !== 'PGRST116') {
    throw readError
  }

  if (existing?.id) {
    const existingEventTimestamp = {
      signup_created: existing.signup_created_at,
      checkout_started: existing.checkout_started_at,
      trial_started: existing.trial_started_at,
      subscription_started: existing.subscription_started_at,
    }
    const updatePayload: Record<string, unknown> = {
      updated_at: now,
    }
    if (!existingEventTimestamp[input.event]) {
      updatePayload[eventColumn] = now
    }

    if (context) {
      Object.assign(updatePayload, touchColumns('last_touch', context.lastTouch), {
        anonymous_id: context.anonymousId || null,
        landing_page: context.lastTouch.landingPage,
        referrer: context.lastTouch.referrer,
        calculator_monthly_loss: context.calculator.monthlyLoss,
        calculator_average_ticket: context.calculator.averageTicket,
        calculator_missed_appointments: context.calculator.missedAppointments,
        calculator_appointments_to_cover: context.calculator.appointmentsToCover,
        calculator_recoverable_monthly: context.calculator.recoverableMonthly,
      })
    }

    if (input.stripeCheckoutSessionId) {
      updatePayload.stripe_checkout_session_id = input.stripeCheckoutSessionId
    }
    if (input.stripeSubscriptionId) {
      updatePayload.stripe_subscription_id = input.stripeSubscriptionId
    }

    const { error } = await supabaseAdmin
      .from('marketing_attribution')
      .update(updatePayload)
      .eq('id', existing.id)

    if (error) throw error
    return
  }

  const firstTouch = context?.firstTouch ?? {
    source: null,
    medium: null,
    campaign: null,
    content: null,
    term: null,
    gclid: null,
    fbclid: null,
    landingPage: null,
    referrer: null,
  }
  const lastTouch = context?.lastTouch ?? firstTouch
  const insertPayload: Record<string, unknown> = {
    user_id: input.userId,
    anonymous_id: context?.anonymousId || null,
    ...touchColumns('first_touch', firstTouch),
    ...touchColumns('last_touch', lastTouch),
    landing_page: lastTouch.landingPage,
    referrer: lastTouch.referrer,
    calculator_monthly_loss: context?.calculator.monthlyLoss ?? null,
    calculator_average_ticket: context?.calculator.averageTicket ?? null,
    calculator_missed_appointments: context?.calculator.missedAppointments ?? null,
    calculator_appointments_to_cover: context?.calculator.appointmentsToCover ?? null,
    calculator_recoverable_monthly: context?.calculator.recoverableMonthly ?? null,
    stripe_checkout_session_id: input.stripeCheckoutSessionId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    [eventColumn]: now,
    updated_at: now,
  }
  if (input.event === 'checkout_started' && context) {
    insertPayload.signup_created_at = now
  }

  const { error } = await supabaseAdmin
    .from('marketing_attribution')
    .insert(insertPayload)

  if (error?.code === '23505') {
    await persistMarketingAttribution(input)
    return
  }
  if (error) throw error
}
