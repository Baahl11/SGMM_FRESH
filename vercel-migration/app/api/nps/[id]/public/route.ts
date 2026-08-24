import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  findPublicResource,
  publicRateLimit,
  readJsonBody,
  sanitizeAssociations,
} from '@/lib/security/public-endpoints'

/**
 * Encuesta NPS pública (fable C13): Zod, límites, rate limit por IP,
 * asociaciones verificadas por tenant y lookup por public_token.
 */

type Params = { params: Promise<{ id: string }> }

type SurveyRow = { id: string; title?: string; message?: string; is_active: boolean; user_id: string }

const npsSchema = z
  .object({
    score: z.number().int().min(0).max(10),
    comment: z.string().trim().max(5_000).nullish(),
    respondent_name: z.string().trim().max(200).nullish(),
    respondent_email: z.string().trim().email().max(320).nullish(),
    patient_id: z.string().uuid().nullish(),
    appointment_id: z.string().uuid().nullish(),
  })
  .strict()

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { result, headers } = publicRateLimit(req, 'nps', 'get')
  if (!result.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers })
  }

  const survey = await findPublicResource<SurveyRow>(
    getSupabaseAdmin(),
    'nps_surveys',
    id,
    'id, title, message, is_active'
  )
  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!survey.is_active) return NextResponse.json({ error: 'Survey inactive' }, { status: 410 })
  return NextResponse.json({ survey })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { result, headers } = publicRateLimit(req, 'nps', 'post')
  if (!result.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers })
  }

  const admin = getSupabaseAdmin()
  const survey = await findPublicResource<SurveyRow>(
    admin,
    'nps_surveys',
    id,
    'id, is_active, user_id'
  )
  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!survey.is_active) return NextResponse.json({ error: 'Survey inactive' }, { status: 410 })

  const parsedBody = await readJsonBody(req)
  if ('error' in parsedBody) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status })
  }
  const parsed = npsSchema.safeParse(parsedBody.body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    )
  }
  const body = parsed.data

  const assoc = await sanitizeAssociations(admin, survey.user_id, body, 'nps')

  const { error } = await admin.from('nps_responses').insert({
    survey_id: survey.id,
    score: body.score,
    comment: body.comment ?? null,
    respondent_name: body.respondent_name ?? null,
    respondent_email: body.respondent_email ?? null,
    patient_id: assoc.patient_id,
    appointment_id: assoc.appointment_id,
  })

  if (error) return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
