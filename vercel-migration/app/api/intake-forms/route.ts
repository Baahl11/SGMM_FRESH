import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/intake-forms — list all forms for authenticated user
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('intake_forms')
    .select('id, title, description, is_active, created_at, fields')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ forms: data })
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

  const { data, error } = await supabase
    .from('intake_forms')
    .insert({ user_id: user.id, title: title.trim(), description: description ?? null, fields })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ form: data }, { status: 201 })
}
