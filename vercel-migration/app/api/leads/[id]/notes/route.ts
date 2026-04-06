import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// GET /api/leads/[id]/notes
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Verify lead belongs to user
  const { data: lead } = await supabase.from('leads').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('lead_notes')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes: data })
}

// POST /api/leads/[id]/notes
export async function POST(request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { body: noteBody } = await request.json()

  if (!noteBody?.trim()) return NextResponse.json({ error: 'body es requerido' }, { status: 400 })

  // Verify lead belongs to user
  const { data: lead } = await supabase.from('leads').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('lead_notes')
    .insert({ lead_id: id, user_id: user.id, body: noteBody.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data }, { status: 201 })
}
