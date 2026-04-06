import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

/**
 * GET /api/treatments/[id]/inventory
 * Lista todos los consumibles (items de inventario) asociados a un tratamiento
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const treatmentId = params.id;
    // Authenticate user
    const user = await getAuthUser();
    if (!user) {
      console.error('❌ Unauthorized: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();
    // Fetch treatment inventory items
    const { data: items, error } = await supabase
      .from('treatment_inventory_items')
      .select('*')
      .eq('treatment_id', treatmentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Supabase error fetching treatment items:', error);
      console.error('[Inventory GET] Supabase error payload:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Error fetching treatment inventory items', details: error.message },
        { status: 500 }
      );
    }
    // If no items, return empty array
    if (!items || items.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch inventory_items details for each item
    const itemIds = items.map(item => item.inventory_item_id);
    const { data: inventoryDetails, error: invError } = await supabase
      .from('inventory_items')
      .select('id, nombre, descripcion, stock_actual, stock_minimo, precio_unitario')
      .in('id', itemIds);

    if (invError) {
      console.error('❌ Supabase error fetching inventory details:', invError);
      console.error('[Inventory GET] Inventory details error payload:', JSON.stringify(invError, null, 2));
      // Return items without details rather than failing
      return NextResponse.json(items);
    }

    // Merge the data
    const itemsWithDetails = items.map(item => ({
      ...item,
      inventory_items: inventoryDetails?.find(inv => inv.id === item.inventory_item_id) || null
    }));
    return NextResponse.json(itemsWithDetails);
  } catch (error) {
    console.error('❌ API error:', error);
    if (error instanceof Error) {
      console.error('[Inventory GET] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/treatments/[id]/inventory
 * Asigna un consumible a un tratamiento
 * Body: { inventory_item_id: string, cantidad_requerida: number }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const treatmentId = params.id; // UUID string, no parseInt!
    const body = await request.json();
    const { inventory_item_id, cantidad_requerida } = body;
    // Validate input
    if (!inventory_item_id || !cantidad_requerida) {
      console.error('❌ Missing fields:', { inventory_item_id, cantidad_requerida });
      return NextResponse.json(
        { error: 'Missing required fields: inventory_item_id, cantidad_requerida' },
        { status: 400 }
      );
    }

    if (cantidad_requerida <= 0) {
      return NextResponse.json(
        { error: 'cantidad_requerida must be greater than 0' },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await getAuthUser();
    if (!user) {
      console.error('❌ Unauthorized: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    // Verify that inventory_item exists
    const { data: inventoryItem, error: itemError } = await supabase
      .from('inventory_items')
      .select('id, nombre')
      .eq('id', inventory_item_id)
      .single();

    if (itemError || !inventoryItem) {
      console.error('❌ Inventory item not found:', inventory_item_id);
      if (itemError) {
        console.error('[Inventory POST] Inventory item error payload:', JSON.stringify(itemError, null, 2));
      }
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Insert treatment_inventory_item
    const { data: newItem, error: insertError } = await supabase
      .from('treatment_inventory_items')
      .insert({
        treatment_id: treatmentId,
        inventory_item_id,
        cantidad_requerida,
        user_id: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Supabase insert error:', insertError);
      console.error('[Inventory POST] Insert error payload:', JSON.stringify(insertError, null, 2));
      
      // Check if duplicate
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'This item is already assigned to this treatment' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error assigning item to treatment', details: insertError.message },
        { status: 500 }
      );
    }

    // Fetch inventory item details separately
    const { data: inventoryDetails, error: detailsError } = await supabase
      .from('inventory_items')
      .select('id, nombre, descripcion, stock_actual, stock_minimo, precio_unitario')
      .eq('id', inventory_item_id)
      .single();

    // Merge the data
    const result = {
      ...newItem,
      inventory_items: inventoryDetails || null
    };
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('❌ API error:', error);
    if (error instanceof Error) {
      console.error('[Inventory POST] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
