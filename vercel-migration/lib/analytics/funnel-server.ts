import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { MarketingAttributionContext } from '@/lib/marketing/attribution'
import type { FunnelEventName } from './funnel'

type PersistFunnelEventInput = {
  eventName: FunnelEventName
  path?: string | null
  userId?: string | null
  context?: MarketingAttributionContext | null
  metadata?: Record<string, string | number | boolean | null>
  client?: ReturnType<typeof getSupabaseAdmin>
}

export async function persistFunnelEvent(input: PersistFunnelEventInput) {
  const context = input.context ?? null
  const client = input.client ?? getSupabaseAdmin()

  const { error } = await client.from('funnel_events').insert({
    event_name: input.eventName,
    event_path: input.path ?? null,
    user_id: input.userId ?? null,
    anonymous_id: context?.anonymousId || null,
    first_touch_source: context?.firstTouch.source ?? null,
    first_touch_medium: context?.firstTouch.medium ?? null,
    first_touch_campaign: context?.firstTouch.campaign ?? null,
    first_touch_content: context?.firstTouch.content ?? null,
    first_touch_term: context?.firstTouch.term ?? null,
    first_touch_gclid: context?.firstTouch.gclid ?? null,
    first_touch_fbclid: context?.firstTouch.fbclid ?? null,
    last_touch_source: context?.lastTouch.source ?? null,
    last_touch_medium: context?.lastTouch.medium ?? null,
    last_touch_campaign: context?.lastTouch.campaign ?? null,
    last_touch_content: context?.lastTouch.content ?? null,
    last_touch_term: context?.lastTouch.term ?? null,
    last_touch_gclid: context?.lastTouch.gclid ?? null,
    last_touch_fbclid: context?.lastTouch.fbclid ?? null,
    landing_page: context?.lastTouch.landingPage ?? null,
    referrer: context?.lastTouch.referrer ?? null,
    calculator_monthly_loss: context?.calculator.monthlyLoss ?? null,
    calculator_average_ticket: context?.calculator.averageTicket ?? null,
    calculator_missed_appointments: context?.calculator.missedAppointments ?? null,
    calculator_appointments_to_cover: context?.calculator.appointmentsToCover ?? null,
    calculator_recoverable_monthly: context?.calculator.recoverableMonthly ?? null,
    metadata: input.metadata ?? {},
  })

  if (error) throw error
}
