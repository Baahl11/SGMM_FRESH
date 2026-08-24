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
 * Documento público para firma (fable C13).
 * GET: definición (por public_token, con fallback legacy por id).
 * POST: firma con validación Zod, límite de payload, rate limit por IP y
 * asociaciones patient/appointment verificadas contra el tenant dueño.
 */

type Params = { params: Promise<{ id: string }> }

const signatureSchema = z
  .object({
    signer_name: z.string().trim().min(1).max(200),
    signer_email: z.string().trim().email().max(320).nullish(),
    signature_data: z
      .string()
      .min(1)
      .max(200_000)
      .refine((v) => v.startsWith('data:image/'), 'signature_data debe ser data URL de imagen'),
    patient_id: z.string().uuid().nullish(),
    appointment_id: z.string().uuid().nullish(),
  })
  .strict()

type TemplateRow = { id: string; title?: string; content?: string; is_active: boolean; user_id: string }

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { result, headers } = publicRateLimit(req, 'doc', 'get')
  if (!result.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers })
  }

  const template = await findPublicResource<TemplateRow>(
    getSupabaseAdmin(),
    'document_templates',
    id,
    'id, title, content, is_active'
  )
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!template.is_active) return NextResponse.json({ error: 'Document unavailable' }, { status: 410 })

  const { user_id: _omit, ...publicTemplate } = template as TemplateRow & { user_id?: string }
  void _omit
  return NextResponse.json({ template: publicTemplate })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { result, headers } = publicRateLimit(req, 'doc', 'post')
  if (!result.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers })
  }

  const admin = getSupabaseAdmin()
  const template = await findPublicResource<TemplateRow>(
    admin,
    'document_templates',
    id,
    'id, is_active, user_id'
  )
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!template.is_active) return NextResponse.json({ error: 'Document unavailable' }, { status: 410 })

  const parsedBody = await readJsonBody(req)
  if ('error' in parsedBody) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status })
  }
  const parsed = signatureSchema.safeParse(parsedBody.body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    )
  }
  const body = parsed.data

  // fable C13: las asociaciones del navegador sólo se aceptan si pertenecen al
  // tenant dueño de la plantilla; de lo contrario se descartan.
  const assoc = await sanitizeAssociations(admin, template.user_id, body, 'documents')

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  const { data: sig, error } = await admin
    .from('document_signatures')
    .insert({
      template_id: template.id,
      signer_name: body.signer_name,
      signer_email: body.signer_email ?? null,
      signature_data: body.signature_data,
      ip_address: ip,
      patient_id: assoc.patient_id,
      appointment_id: assoc.appointment_id,
    })
    .select('id, signed_at')
    .single()

  if (error) return NextResponse.json({ error: 'Error al guardar la firma' }, { status: 500 })
  return NextResponse.json({ signature: sig }, { status: 201 })
}
