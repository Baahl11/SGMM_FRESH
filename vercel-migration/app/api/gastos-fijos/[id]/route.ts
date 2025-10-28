import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('gastos_fijos')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching gasto fijo:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in gastos-fijos GET by ID:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('gastos_fijos')
      .update({
        concepto: body.concepto,
        monto: body.monto,
        frecuencia: body.frecuencia,
        activo: body.activo,
        fecha_inicio: body.fecha_inicio,
        notas: body.notas,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating gasto fijo:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in gastos-fijos PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('gastos_fijos')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting gasto fijo:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Gasto fijo deleted successfully' })
  } catch (error) {
    console.error('Error in gastos-fijos DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}