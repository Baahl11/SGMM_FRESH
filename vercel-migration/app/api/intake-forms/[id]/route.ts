import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

function normalizeForm(row: any) {
  return {
    ...row,
    title: row?.title ?? row?.name ?? '',
    fields: Array.isArray(row?.fields) ? row.fields : [],
    is_active: row?.is_active ?? row?.active ?? true,
  }
}

// GET /api/intake-forms/[id] — full form + responses count
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let formRes: any
  let countRes: any

  ;[formRes, countRes] = await Promise.all([
    supabase.from('intake_forms').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('intake_responses').select('id', { count: 'exact', head: true }).eq('form_id', id),
  ])

  if (formRes.error || !formRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ form: normalizeForm(formRes.data), responses_count: countRes.count ?? 0 })
}

// PUT /api/intake-forms/[id] — update title/description/fields/is_active
export async function PUT(request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const { data: currentForm, error: currentFormError } = await supabase
    .from('intake_forms')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (currentFormError || !currentForm) {
    return NextResponse.json({ error: currentFormError?.message ?? 'Not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}

  if ('title' in body) {
    if ('title' in currentForm || !('name' in currentForm)) updates.title = body.title
    else updates.name = body.title
  }
  if ('description' in body && 'description' in currentForm) updates.description = body.description
  if ('fields' in body && 'fields' in currentForm) updates.fields = body.fields
  if ('is_active' in body) {
    if ('is_active' in currentForm) updates.is_active = body.is_active
    else if ('active' in currentForm) updates.active = body.is_active
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ form: normalizeForm(currentForm) })
  }

  const updateResult = await supabase
    .from('intake_forms')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateResult.error || !updateResult.data) {
    return NextResponse.json({ error: updateResult.error?.message ?? 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ form: normalizeForm(updateResult.data) })
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
