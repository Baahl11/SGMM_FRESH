import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// GET /api/nps/[id]
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [surveyRes, responsesRes] = await Promise.all([
    supabase.from('nps_surveys').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('nps_responses').select('*').eq('survey_id', id).order('submitted_at', { ascending: false }).limit(200),
  ])

  if (surveyRes.error) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const responses: { score: number }[] = responsesRes.data ?? []
  const scores = responses.map(r => r.score)
  const promoters = scores.filter(n => n >= 9).length
  const passives  = scores.filter(n => n >= 7 && n <= 8).length
  const detractors = scores.filter(n => n <= 6).length
  const nps = scores.length ? Math.round(((promoters - detractors) / scores.length) * 100) : null
  const avg = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null

  return NextResponse.json({
    survey: surveyRes.data,
    responses,
    stats: { total: scores.length, promoters, passives, detractors, nps_score: nps, avg_score: avg },
  })
}

// PUT /api/nps/[id]
export async function PUT(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = ['title', 'message', 'send_delay_hours', 'is_active']
  const patch: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) patch[k] = body[k]

  const { data: survey, error } = await supabase
    .from('nps_surveys')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ survey })
}

// DELETE /api/nps/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('nps_surveys')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
