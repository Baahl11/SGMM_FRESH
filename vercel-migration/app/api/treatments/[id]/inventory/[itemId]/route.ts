import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

/**
 * DELETE /api/treatments/[id]/inventory/[itemId]
 * Elimina la asignación de un consumible a un tratamiento
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const params = await context.params;
  try {
    const treatmentId = params.id;
    const treatmentInventoryItemId = params.itemId;
    // Authenticate user
    const user = await getAuthUser();
    if (!user) {
      console.error('❌ Unauthorized: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Delete the treatment_inventory_item (RLS ensures user owns it)
    const { error } = await supabase
      .from('treatment_inventory_items')
      .delete()
      .eq('id', treatmentInventoryItemId)
      .eq('treatment_id', treatmentId); // Double check it belongs to this treatment

    if (error) {
      console.error('❌ Supabase delete error:', error);
      return NextResponse.json(
        { error: 'Error deleting treatment inventory item', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({
      message: 'Treatment inventory item deleted successfully'
    });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/treatments/[id]/inventory/[itemId]
 * Actualiza la cantidad requerida de un consumible
 * Body: { cantidad_requerida: number }
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const params = await context.params;
  try {
    const treatmentId = params.id;
    const treatmentInventoryItemId = params.itemId;
    const body = await request.json();
    const { cantidad_requerida } = body;
    // Validate input
    if (!cantidad_requerida || cantidad_requerida <= 0) {
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

    // Update the treatment_inventory_item
    const { data: updatedItem, error } = await supabase
      .from('treatment_inventory_items')
      .update({ cantidad_requerida })
      .eq('id', treatmentInventoryItemId)
      .eq('treatment_id', treatmentId)
      .select(`
        id,
        treatment_id,
        inventory_item_id,
        cantidad_requerida,
        created_at,
        updated_at,
        inventory_items:inventory_item_id (
          id,
          nombre,
          descripcion,
          stock_actual,
          stock_minimo,
          precio_unitario
        )
      `)
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      return NextResponse.json(
        { error: 'Error updating treatment inventory item', details: error.message },
        { status: 500 }
      );
    }

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Treatment inventory item not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
