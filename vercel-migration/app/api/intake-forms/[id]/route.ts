import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// GET /api/intake-forms/[id] — full form + responses count
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [formRes, countRes] = await Promise.all([
    supabase.from('intake_forms').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('intake_responses').select('id', { count: 'exact', head: true }).eq('form_id', id),
  ])

  if (formRes.error || !formRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ form: formRes.data, responses_count: countRes.count ?? 0 })
}

// PUT /api/intake-forms/[id] — update title/description/fields/is_active
export async function PUT(request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const allowed = ['title', 'description', 'fields', 'is_active']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('intake_forms')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 })
  return NextResponse.json({ form: data })
}

// DELETE /api/intake-forms/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase.from('intake_forms').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
