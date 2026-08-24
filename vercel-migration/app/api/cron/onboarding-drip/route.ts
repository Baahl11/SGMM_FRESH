import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import emailService from '@/lib/email-service'
import { DRIP_BY_ID, type DripEmailId } from '@/lib/email/drip-templates'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * Daily cron: sends onboarding drip emails at day 1, 3, and 5 after trial start.
 * Call: GET /api/cron/onboarding-drip  (protected by CRON_SECRET)
 *
 * Relies on subscriptions.onboarding_emails_sent (text[]) to avoid duplicates.
 * Add column first: migrations/add-onboarding-drip-tracking.sql
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[onboarding-drip] CRON_SECRET env var not configured')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Map of drip email id -> days after trial_start_date to send it
  const SCHEDULE: Array<{ id: DripEmailId; day: number }> = [
    { id: 'day1_tips', day: 1 },
    { id: 'day3_patients', day: 3 },
    { id: 'day5_review', day: 5 },
  ]

  const results: Array<{ userId: string; email: string; sent?: DripEmailId[]; skipped?: DripEmailId[] }> = []

  for (const { id: dripId, day } of SCHEDULE) {
    // Find users whose trial started exactly `day` days ago (within ±12h window)
    const windowStart = new Date(now)
    windowStart.setDate(windowStart.getDate() - day)
    windowStart.setHours(windowStart.getHours() - 12)

    const windowEnd = new Date(now)
    windowEnd.setDate(windowEnd.getDate() - day)
    windowEnd.setHours(windowEnd.getHours() + 12)

    const { data: subs, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        user_id,
        trial_start,
        onboarding_emails_sent
      `)
      .eq('status', 'trialing')
      .gte('trial_start', windowStart.toISOString())
      .lte('trial_start', windowEnd.toISOString())

    if (error) {
      console.error(`[onboarding-drip] DB error for ${dripId}:`, error)
      continue
    }

    for (const sub of subs ?? []) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', sub.user_id)
        .maybeSingle()

      if (!user?.email) {
        console.warn(`[onboarding-drip] No email found for ${sub.user_id}`)
        continue
      }
      const alreadySent: string[] = sub.onboarding_emails_sent ?? []

      if (alreadySent.includes(dripId)) {
        const existing = results.find(r => r.userId === sub.user_id)
        if (existing) existing.skipped = [...(existing.skipped ?? []), dripId]
        else results.push({ userId: sub.user_id, email: user.email, skipped: [dripId] })
        continue
      }

      const template = DRIP_BY_ID[dripId]
      const name = user.name ?? user.email?.split('@')[0] ?? 'Doctor'

      try {
        await emailService.sendCustomEmail(user.email, template.subject, template.html({ name, email: user.email }), true)

        // Mark as sent
        await supabaseAdmin
          .from('subscriptions')
          .update({ onboarding_emails_sent: [...alreadySent, dripId] })
          .eq('id', sub.id)

        const existing = results.find(r => r.userId === sub.user_id)
        if (existing) existing.sent = [...(existing.sent ?? []), dripId]
        else results.push({ userId: sub.user_id, email: user.email, sent: [dripId] })
      } catch (err) {
        console.error(`[onboarding-drip] Failed to send ${dripId} to ${user.email}:`, err)
      }
    }
  }

  return NextResponse.json({ success: true, processed: results.length, details: results })
}
