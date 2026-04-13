import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import emailService from '@/lib/email-service'
import { DRIP_BY_ID } from '@/lib/email/drip-templates'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * POST /api/email/welcome
 * Sends the day0_welcome drip email to the authenticated user.
 * Idempotent: does nothing if already sent.
 */
export async function POST() {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if already sent
  const { data: sub, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('id, onboarding_emails_sent')
    .eq('user_id', user.id)
    .single()

  if (subError || !sub) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const alreadySent: string[] = sub.onboarding_emails_sent ?? []
  if (alreadySent.includes('day0_welcome')) {
    return NextResponse.json({ success: true, skipped: true })
  }

  const template = DRIP_BY_ID['day0_welcome']
  const name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Doctor'

  await emailService.sendCustomEmail(user.email!, template.subject, template.html({ name, email: user.email! }), true)

  await supabaseAdmin
    .from('subscriptions')
    .update({ onboarding_emails_sent: [...alreadySent, 'day0_welcome'] })
    .eq('id', sub.id)

  return NextResponse.json({ success: true })
}
