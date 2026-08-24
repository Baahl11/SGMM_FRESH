import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { sendTrialWelcomeEmail } from '@/lib/email/trial-welcome'

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

  const result = await sendTrialWelcomeEmail({
    userId: user.id,
    email: user.email!,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name,
  })

  if (!result.ok) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, skipped: Boolean(result.skipped) })
}
