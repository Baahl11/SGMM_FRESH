import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function isMissingColumn(error: { message?: string } | null, column: string) {
  if (!error?.message) return false
  const message = error.message.toLowerCase()
  return message.includes(column.toLowerCase()) && message.includes('does not exist')
}

function normalizeForm(row: any) {
  return {
    ...row,
    title: row?.title ?? row?.name ?? '',
    fields: Array.isArray(row?.fields) ? row.fields : [],
    is_active: row?.is_active ?? row?.active ?? true,
  }
}

// GET /api/intake-forms — list all forms for authenticated user
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const query = await supabase
    .from('intake_forms')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (query.error) return NextResponse.json({ error: query.error.message }, { status: 500 })
  return NextResponse.json({ forms: (query.data || []).map(normalizeForm) })
}

// POST /api/intake-forms — create form
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, fields } = body

  if (!title?.trim()) return NextResponse.json({ error: 'title es requerido' }, { status: 400 })
  if (!Array.isArray(fields)) return NextResponse.json({ error: 'fields debe ser array' }, { status: 400 })

  const titleInsert = await supabase
    .from('intake_forms')
    .insert({ user_id: user.id, title: title.trim(), description: description ?? null, fields })
    .select()
    .single()

  if (!titleInsert.error) {
    return NextResponse.json({ form: normalizeForm(titleInsert.data) }, { status: 201 })
  }

  if (!isMissingColumn(titleInsert.error, 'title')) {
    return NextResponse.json({ error: titleInsert.error.message }, { status: 500 })
  }

  const nameInsert = await supabase
    .from('intake_forms')
    .insert({ user_id: user.id, name: title.trim(), description: description ?? null, fields })
    .select()
    .single()

  if (nameInsert.error) return NextResponse.json({ error: nameInsert.error.message }, { status: 500 })
  return NextResponse.json({ form: normalizeForm(nameInsert.data) }, { status: 201 })
}
