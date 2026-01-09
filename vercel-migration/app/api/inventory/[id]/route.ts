import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'

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

    return NextResponse.json(data)
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
    console.log('📝 [Inventory PUT] Starting update...');
    
    const user = await getAuthUser();
    if (!user) {
      console.log('❌ [Inventory PUT] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [Inventory PUT] User authenticated:', user.id);

    const { id } = await params;
    console.log('📝 [Inventory PUT] Item ID:', id);
    
    const supabase = await createClient()
    const body = await request.json()
    console.log('📝 [Inventory PUT] Request body:', body);

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

    console.log('📝 [Inventory PUT] Update data:', updateData);

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

    console.log('✅ [Inventory PUT] Item updated successfully:', data);
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