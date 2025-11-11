import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search')
    const onlyActive = searchParams.get('only_active') === 'true'

    // Build query
    let query = supabase
      .from('gastos_fijos')
      .select('*')

    // Apply filters
    if (search) {
      query = query.or(`concepto.ilike.%${search}%,notas.ilike.%${search}%`)
    }

    if (onlyActive) {
      query = query.eq('activo', true)
    }

    // Apply pagination and ordering
    const { data, error } = await query
      .order('concepto', { ascending: true })
      .range(skip, skip + limit - 1)

    if (error) {
      console.error('Error fetching gastos fijos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in gastos-fijos GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()

    const { data, error } = await supabase
      .from('gastos_fijos')
      .insert([{
        user_id: user.id,
        concepto: body.concepto,
        monto: body.monto,
        frecuencia: body.frecuencia || 'mensual',
        activo: body.activo !== undefined ? body.activo : true,
        fecha_inicio: body.fecha_inicio,
        notas: body.notas || ''
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating gasto fijo:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in gastos-fijos POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}