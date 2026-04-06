import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// GET /api/intake-forms/[id]/responses — paginated list of responses
export async function GET(request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Verify form belongs to user
  const { data: form } = await supabase
    .from('intake_forms')
    .select('id, fields')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 100)
  const offset = Number(searchParams.get('offset') ?? '0')

  const { data, error, count } = await supabase
    .from('intake_responses')
    .select('*', { count: 'exact' })
    .eq('form_id', id)
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ responses: data, total: count ?? 0, fields: form.fields })
}
