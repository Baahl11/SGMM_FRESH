import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/leads  — list with optional ?status= and ?q= filters
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  let query = supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (q) {
    query = query.or(
      `nombre.ilike.%${q}%,email.ilike.%${q}%,telefono.ilike.%${q}%`
    )
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data })
}

// POST /api/leads  — create
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { nombre, email, telefono, source, notas, utm_source, utm_medium, utm_campaign } = body

  if (!nombre?.trim()) return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('leads')
    .insert({ user_id: user.id, nombre: nombre.trim(), email, telefono, source: source ?? 'manual', notas, utm_source, utm_medium, utm_campaign })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data }, { status: 201 })
}
