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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching inventory item:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({
      ...data,
      categoria: data?.categoria || inferInventoryCategory(data?.nombre, data?.descripcion)
    })
  } catch (error) {
    console.error('Error in inventory GET by ID:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const supabase = await createClient()
    const body = await request.json()

    if (body.nombre !== undefined && !String(body.nombre).trim()) {
      return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 })
    }

    if (body.stock_actual !== undefined) {
      const stockActual = parseFlexibleNumberInput(body.stock_actual)
      if (!Number.isFinite(stockActual) || stockActual < 0) {
        return NextResponse.json({ error: 'Stock actual inválido' }, { status: 400 })
      }
      body.stock_actual = stockActual
    }

    if (body.stock_minimo !== undefined) {
      const stockMinimo = String(body.stock_minimo).trim() === '' ? 0 : parseFlexibleNumberInput(body.stock_minimo)
      if (!Number.isFinite(stockMinimo) || stockMinimo < 0) {
        return NextResponse.json({ error: 'Stock mínimo inválido' }, { status: 400 })
      }
      body.stock_minimo = stockMinimo
    }

    if (body.stock_maximo !== undefined) {
      const stockMaximo = String(body.stock_maximo).trim() === '' ? 0 : parseFlexibleNumberInput(body.stock_maximo)
      if (!Number.isFinite(stockMaximo) || stockMaximo < 0) {
        return NextResponse.json({ error: 'Stock máximo inválido' }, { status: 400 })
      }
      body.stock_maximo = stockMaximo
    }

    if (body.precio_unitario !== undefined) {
      const precioUnitario = parseFlexibleNumberInput(body.precio_unitario)
      if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
        return NextResponse.json({ error: 'Precio unitario inválido' }, { status: 400 })
      }
      body.precio_unitario = precioUnitario
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.stock_actual !== undefined) updateData.stock_actual = body.stock_actual;
    if (body.stock_minimo !== undefined) updateData.stock_minimo = body.stock_minimo;
    if (body.stock_maximo !== undefined) updateData.stock_maximo = body.stock_maximo;
    if (body.precio_unitario !== undefined) updateData.precio_unitario = body.precio_unitario;
    // Note: categoria field doesn't exist in inventory_items table
    if (body.activo !== undefined) updateData.activo = body.activo;
    const { data, error} = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('❌ [Inventory PUT] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ [Inventory PUT] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient()
    
    console.log('🗑️ Deleting inventory item:', id, 'for user:', user.id)
    
    // First delete all treatment_inventory_items that reference this inventory item
    const { error: treatmentItemsError } = await supabase
      .from('treatment_inventory_items')
      .delete()
      .eq('inventory_item_id', id)

    if (treatmentItemsError) {
      console.error('❌ Error deleting treatment_inventory_items:', treatmentItemsError)
      // Continue anyway - the FK constraint might not exist or items might not be referenced
    } else {
      console.log('✅ Deleted related treatment_inventory_items')
    }

    // Now delete the inventory item itself
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Error deleting inventory item:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Inventory item deleted successfully')
    return NextResponse.json({ message: 'Inventory item deleted successfully' })
  } catch (error) {
    console.error('❌ Error in inventory DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}