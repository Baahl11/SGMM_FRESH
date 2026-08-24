import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  findPublicResource,
  publicRateLimit,
  readJsonBody,
  sanitizeAssociations,
} from '@/lib/security/public-endpoints'

/**
 * Intake form público (fable C13): Zod, límites, rate limit por IP,
 * asociaciones verificadas por tenant y lookup por public_token con
 * compatibilidad legacy por id.
 */

type Params = { params: Promise<{ id: string }> }

type FormRow = {
  id: string
  title?: string
  description?: string
  fields?: unknown
  user_id: string
}

const submitSchema = z
  .object({
    nombre: z.string().trim().max(200).nullish(),
    email: z.string().trim().email().max(320).nullish(),
    telefono: z.string().trim().max(30).nullish(),
    answers: z.record(z.string(), z.unknown()),
    patient_id: z.string().uuid().nullish(),
    appointment_id: z.string().uuid().nullish(),
  })
  .strict()

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { result, headers } = publicRateLimit(req, 'intake', 'get')
  if (!result.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers })
  }

  const admin = getSupabaseAdmin()
  const form = await findPublicResource<FormRow & { is_active?: boolean }>(
    admin,
    'intake_forms',
    id,
    'id, title, description, fields, is_active'
  )
  if (!form || form.is_active === false) {
    return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })
  }
  const { is_active: _omit, ...publicForm } = form
  void _omit
  return NextResponse.json({ form: publicForm })
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const { result, headers } = publicRateLimit(request, 'intake', 'post')
  if (!result.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers })
  }

  const admin = getSupabaseAdmin()
  const form = await findPublicResource<FormRow & { is_active?: boolean }>(
    admin,
    'intake_forms',
    id,
    'id, is_active, user_id'
  )
  if (!form || form.is_active === false) {
    return NextResponse.json({ error: 'Formulario no encontrado o inactivo' }, { status: 404 })
  }

  const parsedBody = await readJsonBody(request)
  if ('error' in parsedBody) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status })
  }
  const parsed = submitSchema.safeParse(parsedBody.body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    )
  }
  const body = parsed.data

  const assoc = await sanitizeAssociations(admin, form.user_id, body, 'intake-forms')

  const { error } = await admin.from('intake_responses').insert({
    form_id: form.id,
    patient_id: assoc.patient_id,
    appointment_id: assoc.appointment_id,
    nombre: body.nombre ?? null,
    email: body.email ?? null,
    telefono: body.telefono ?? null,
    answers: body.answers,
  })

  if (error) {
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
  return NextResponse.json({ success: true }, { status: 201 })
}
