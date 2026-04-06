import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * GET /api/intake-forms/[id]/public — fetch form definition (no auth)
 * POST /api/intake-forms/[id]/public — submit response (no auth)
 */

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('intake_forms')
    .select('id, title, description, fields')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })
  return NextResponse.json({ form: data })
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params

  // Verify form is active
  const { data: form } = await supabaseAdmin
    .from('intake_forms')
    .select('id')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!form) return NextResponse.json({ error: 'Formulario no encontrado o inactivo' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { nombre, email, telefono, answers, patient_id, appointment_id } = body as Record<string, string>

  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'answers es requerido' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('intake_responses').insert({
    form_id: id,
    patient_id: patient_id ?? null,
    appointment_id: appointment_id ?? null,
    nombre: nombre ?? null,
    email: email ?? null,
    telefono: telefono ?? null,
    answers,
  })

  if (error) {
    console.error('[intake public submit]', error)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
