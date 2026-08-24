import { NextRequest, NextResponse } from 'next/server'
import { normalizeFunnelEventPayload } from '@/lib/analytics/funnel'
import { persistFunnelEvent } from '@/lib/analytics/funnel-server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const event = normalizeFunnelEventPayload(body)

  if (!event) {
    return NextResponse.json({ error: 'Evento inválido' }, { status: 400 })
  }

  let userId: string | null = null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    // Anonymous tracking continues without auth context.
  }

  try {
    await persistFunnelEvent({
      eventName: event.eventName,
      path: event.path,
      userId,
      context: event.context,
      metadata: event.metadata,
    })

    return NextResponse.json({ recorded: true })
  } catch (error) {
    console.error('[funnel-events] Failed to persist event', {
      eventName: event.eventName,
      errorMessage: (error as Error).message,
    })
    return NextResponse.json({ recorded: false }, { status: 202 })
  }
}
