import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching inventory item:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in inventory GET by ID:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient()
    const body = await request.json()

    const { data, error} = await supabase
      .from('inventory_items')
      .update({
        nombre: body.nombre,
        descripcion: body.descripcion,
        stock_actual: body.stock_actual,
        stock_minimo: body.stock_minimo,
        stock_maximo: body.stock_maximo,
        precio_unitario: body.precio_unitario,
        categoria: body.categoria,
        activo: body.activo,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating inventory item:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in inventory PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient()
    
    console.log('🗑️ Deleting inventory item:', params.id, 'for user:', user.id)
    
    // First delete all treatment_inventory_items that reference this inventory item
    const { error: treatmentItemsError } = await supabase
      .from('treatment_inventory_items')
      .delete()
      .eq('inventory_item_id', params.id)

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
      .eq('id', params.id)
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