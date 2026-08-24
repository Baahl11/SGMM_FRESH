import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeMarketingAttribution } from '@/lib/marketing/attribution'
import { persistMarketingAttribution } from '@/lib/marketing/attribution-server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  if (body?.event !== 'signup_created') {
    return NextResponse.json({ error: 'Evento no permitido' }, { status: 400 })
  }

  const context = normalizeMarketingAttribution(body?.context)
  if (!context) {
    return NextResponse.json({ error: 'Contexto inválido o vencido' }, { status: 400 })
  }

  try {
    await persistMarketingAttribution({
      userId: user.id,
      context,
      event: 'signup_created',
    })
    return NextResponse.json({ persisted: true })
  } catch (error) {
    console.error('[marketing-attribution] Failed to persist signup attribution', {
      userId: user.id,
      errorMessage: (error as Error).message,
    })
    return NextResponse.json({ error: 'No se pudo guardar la atribución' }, { status: 500 })
  }
}
