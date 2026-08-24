import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'
import { parseFlexibleNumberInput } from '@/lib/number-parsing'

function inferInventoryCategory(nombre?: string | null, descripcion?: string | null) {
  const value = `${nombre || ''} ${descripcion || ''}`.toLowerCase()

  if (value.includes('toxina') || value.includes('relleno') || value.includes('hialuron')) return 'Inyectables'
  if (value.includes('aguja') || value.includes('jeringa') || value.includes('cánula') || value.includes('canula')) return 'Desechables'
  if (value.includes('vitamina') || value.includes('hidrat') || value.includes('booster')) return 'Activos'
  if (value.includes('limpieza') || value.includes('desinfect') || value.includes('toall')) return 'Higiene'
  if (value.includes('guante') || value.includes('cubreboca') || value.includes('bata')) return 'Protección'
  if (value.includes('crema') || value.includes('serum') || value.includes('gel') || value.includes('peeling')) return 'Dermocosmética'

  return 'General'
}

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
      categoria: item.categoria || inferInventoryCategory(item.nombre, item.descripcion),
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

    const nombre = String(body?.nombre ?? '').trim()
    const stockActual = parseFlexibleNumberInput(body?.stock_actual)
    const precioUnitario = parseFlexibleNumberInput(body?.precio_unitario)
    const hasStockMinimo = body?.stock_minimo !== undefined && body?.stock_minimo !== null && String(body.stock_minimo).trim() !== ''
    const stockMinimo = hasStockMinimo ? parseFlexibleNumberInput(body?.stock_minimo) : 0
    const hasStockMaximo = body?.stock_maximo !== undefined && body?.stock_maximo !== null && String(body.stock_maximo).trim() !== ''
    const stockMaximo = hasStockMaximo ? parseFlexibleNumberInput(body?.stock_maximo) : 0

    if (!nombre) {
      return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 })
    }

    if (!Number.isFinite(stockActual) || stockActual < 0) {
      return NextResponse.json({ error: 'Stock actual inválido' }, { status: 400 })
    }

    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
      return NextResponse.json({ error: 'Precio unitario inválido' }, { status: 400 })
    }

    if (hasStockMinimo && (!Number.isFinite(stockMinimo) || stockMinimo < 0)) {
      return NextResponse.json({ error: 'Stock mínimo inválido' }, { status: 400 })
    }

    if (hasStockMaximo && (!Number.isFinite(stockMaximo) || stockMaximo < 0)) {
      return NextResponse.json({ error: 'Stock máximo inválido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([{
        nombre,
        descripcion: body.descripcion || '',
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        stock_maximo: stockMaximo,
        precio_unitario: precioUnitario,
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