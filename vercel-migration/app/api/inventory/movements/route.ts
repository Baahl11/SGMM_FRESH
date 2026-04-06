import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

/**
 * GET /api/inventory/movements
 * Lista todos los movimientos de inventario del usuario
 * Query params: ?item_id=X&tipo=salida&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthUser();
    if (!user) {
      console.error('❌ Unauthorized: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Query parameters
  const itemId = searchParams.get('item_id');
  const tipo = searchParams.get('tipo'); // entrada, salida, ajuste
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const search = searchParams.get('search');

    // Build query - FILTER BY USER_ID
    let query = supabase
      .from('inventory_movements')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    if (tipo && ['entrada', 'salida', 'ajuste'].includes(tipo)) {
      query = query.eq('tipo', tipo);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    if (search) {
      query = query.ilike('motivo', `%${search}%`);
    }

    const { data: movements, error } = await query;

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: 'Error fetching inventory movements', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(movements || []);
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/movements
 * Crea un movimiento manual de inventario (entrada, salida manual, ajuste)
 * Body: {
 *   item_id: number,
 *   tipo: 'entrada' | 'salida' | 'ajuste',
 *   cantidad: number,
 *   motivo: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item_id, tipo, cantidad, motivo } = body;
    // Validate input
    if (!item_id || !tipo || cantidad === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: item_id, tipo, cantidad' },
        { status: 400 }
      );
    }

    if (!['entrada', 'salida', 'ajuste'].includes(tipo)) {
      return NextResponse.json(
        { error: 'tipo must be one of: entrada, salida, ajuste' },
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

    // Get current stock - VERIFY USER OWNS THE ITEM
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('id, nombre, stock_actual')
      .eq('id', item_id)
      .eq('user_id', user.id)
      .single();

    if (itemError || !item) {
      console.error('❌ Inventory item not found:', item_id);
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    const cantidad_anterior = item.stock_actual;
    let cantidad_nueva = cantidad_anterior;

    // Calculate new stock based on movement type
    if (tipo === 'entrada') {
      cantidad_nueva = cantidad_anterior + Math.abs(cantidad);
    } else if (tipo === 'salida') {
      cantidad_nueva = cantidad_anterior - Math.abs(cantidad);
    } else if (tipo === 'ajuste') {
      // For ajuste, cantidad is the absolute new value
      cantidad_nueva = cantidad;
    }

    // Update inventory stock - VERIFY USER_ID
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ 
        stock_actual: cantidad_nueva,
        updated_at: new Date().toISOString()
      })
      .eq('id', item_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ Error updating stock:', updateError);
      return NextResponse.json(
        { error: 'Error updating inventory stock', details: updateError.message },
        { status: 500 }
      );
    }

    // Create inventory movement record
    const { data: movement, error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        item_id,
        tipo,
        cantidad: tipo === 'ajuste' ? cantidad - cantidad_anterior : cantidad,
        cantidad_anterior,
        cantidad_nueva,
        motivo: motivo || `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} manual`,
        user_id: user.id
      })
      .select()
      .single();

    if (movementError) {
      console.error('❌ Error creating movement record:', movementError);
      return NextResponse.json(
        { error: 'Error creating inventory movement', details: movementError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({
      movement,
      item: {
        id: item.id,
        nombre: item.nombre,
        stock_anterior: cantidad_anterior,
        stock_nuevo: cantidad_nueva
      }
    }, { status: 201 });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
