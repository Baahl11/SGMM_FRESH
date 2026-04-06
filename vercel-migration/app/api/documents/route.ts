import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: templates, error } = await supabase
    .from('document_templates')
    .select('*, document_signatures(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = templates.map(t => {
    const count = (t.document_signatures ?? []).length
    const { document_signatures: _, ...tmpl } = t
    return { ...tmpl, signatures_count: count }
  })

  return NextResponse.json({ templates: result })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const { data: template, error } = await supabase
    .from('document_templates')
    .insert({ user_id: user.id, title, content })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template }, { status: 201 })
}
