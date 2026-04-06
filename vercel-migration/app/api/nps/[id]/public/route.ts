import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ id: string }> }

// GET /api/nps/[id]/public — fetch survey definition (no auth)
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params

  const { data: survey, error } = await supabaseAdmin
    .from('nps_surveys')
    .select('id, title, message, is_active')
    .eq('id', id)
    .single()

  if (error || !survey) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!survey.is_active) return NextResponse.json({ error: 'Survey inactive' }, { status: 410 })

  return NextResponse.json({ survey })
}

// POST /api/nps/[id]/public — submit NPS score (no auth)
export async function POST(req: Request, { params }: Params) {
  const { id } = await params

  // Verify survey exists and is active
  const { data: survey } = await supabaseAdmin
    .from('nps_surveys')
    .select('id, is_active')
    .eq('id', id)
    .single()

  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!survey.is_active) return NextResponse.json({ error: 'Survey inactive' }, { status: 410 })

  const body = await req.json()
  const { score, comment, respondent_name, respondent_email, appointment_id, patient_id } = body

  if (typeof score !== 'number' || score < 0 || score > 10) {
    return NextResponse.json({ error: 'score must be 0-10' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('nps_responses')
    .insert({
      survey_id: id,
      score,
      comment: comment ?? null,
      respondent_name: respondent_name ?? null,
      respondent_email: respondent_email ?? null,
      appointment_id: appointment_id ?? null,
      patient_id: patient_id ?? null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
