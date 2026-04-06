import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ id: string }> }

// GET — fetch document content (no auth)
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params

  const { data: template, error } = await supabaseAdmin
    .from('document_templates')
    .select('id, title, content, is_active')
    .eq('id', id)
    .single()

  if (error || !template) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!template.is_active) return NextResponse.json({ error: 'Document unavailable' }, { status: 410 })

  return NextResponse.json({ template })
}

// POST — submit signature (no auth)
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params

  const { data: template } = await supabaseAdmin
    .from('document_templates')
    .select('id, is_active')
    .eq('id', id)
    .single()

  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!template.is_active) return NextResponse.json({ error: 'Document unavailable' }, { status: 410 })

  const body = await req.json()
  const { signer_name, signer_email, signature_data, patient_id, appointment_id } = body

  if (!signer_name?.trim()) return NextResponse.json({ error: 'signer_name required' }, { status: 400 })
  if (!signature_data?.trim()) return NextResponse.json({ error: 'signature_data required' }, { status: 400 })

  // Capture IP for audit trail
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  const { data: sig, error } = await supabaseAdmin
    .from('document_signatures')
    .insert({
      template_id: id,
      signer_name,
      signer_email: signer_email ?? null,
      signature_data,
      ip_address: ip,
      patient_id: patient_id ?? null,
      appointment_id: appointment_id ?? null,
    })
    .select('id, signed_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ signature: sig }, { status: 201 })
}
