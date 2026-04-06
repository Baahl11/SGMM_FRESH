import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/nps — list surveys with avg score + response count
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: surveys, error } = await supabase
    .from('nps_surveys')
    .select('*, nps_responses(score)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched = surveys.map(s => {
    const scores: number[] = (s.nps_responses ?? []).map((r: { score: number }) => r.score)
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
    const promoters = scores.filter(n => n >= 9).length
    const detractors = scores.filter(n => n <= 6).length
    const nps = scores.length ? Math.round(((promoters - detractors) / scores.length) * 100) : null
    const { nps_responses: _, ...survey } = s
    return { ...survey, response_count: scores.length, avg_score: avg ? +avg.toFixed(1) : null, nps_score: nps }
  })

  return NextResponse.json({ surveys: enriched })
}

// POST /api/nps — create survey
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, message, send_delay_hours } = body

  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const { data: survey, error } = await supabase
    .from('nps_surveys')
    .insert({ user_id: user.id, title, message, send_delay_hours: send_delay_hours ?? 2 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ survey }, { status: 201 })
}
