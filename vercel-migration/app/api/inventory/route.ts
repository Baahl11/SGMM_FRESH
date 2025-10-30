import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search')

    // Build query - FILTER BY USER_ID
    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)

    // Apply filters
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,descripcion.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    const { data, error } = await query
      .order('nombre', { ascending: true })
      .range(skip, skip + limit - 1)

    if (error) {
      console.error('Error fetching inventory:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to ensure consistent field names
    const transformedData = (data || []).map(item => ({
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      stock_actual: item.stock_actual || 0,
      stock_minimo: item.stock_minimo || 0,
      stock_maximo: item.stock_maximo || 0,
      precio_unitario: item.precio_unitario || 0,
      activo: item.activo !== false, // Default to true if null/undefined
      created_at: item.created_at,
      updated_at: item.updated_at
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in inventory GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([{
        nombre: body.nombre,
        descripcion: body.descripcion || '',
        stock_actual: body.stock_actual || 0,
        stock_minimo: body.stock_minimo || 0,
        stock_maximo: body.stock_maximo || 0,
        precio_unitario: body.precio_unitario || 0,
        activo: body.activo !== undefined ? body.activo : true,
        user_id: user.id // ✅ AGREGAR EL USER_ID
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating inventory item:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in inventory POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}