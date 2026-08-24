import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

function inferInventoryCategory(nombre?: string | null, descripcion?: string | null) {
  const value = `${nombre || ''} ${descripcion || ''}`.toLowerCase();

  if (value.includes('toxina') || value.includes('relleno') || value.includes('hialuron')) return 'Inyectables';
  if (value.includes('aguja') || value.includes('jeringa') || value.includes('cánula') || value.includes('canula')) return 'Desechables';
  if (value.includes('vitamina') || value.includes('hidrat') || value.includes('booster')) return 'Activos';
  if (value.includes('limpieza') || value.includes('desinfect') || value.includes('toall')) return 'Higiene';
  if (value.includes('guante') || value.includes('cubreboca') || value.includes('bata')) return 'Protección';
  if (value.includes('crema') || value.includes('serum') || value.includes('gel') || value.includes('peeling')) return 'Dermocosmética';

  return 'General';
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)
      .order('stock_actual', { ascending: true })
      .limit(500);

    if (error) {
      console.error('Error fetching low stock items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const lowStockItems = (data || []).filter((item) => {
      const stockActual = Number(item.stock_actual) || 0;
      const stockMinimo = Number(item.stock_minimo) || 0;
      return stockMinimo > 0 && stockActual <= stockMinimo;
    }).map((item) => ({
      ...item,
      categoria: item.categoria || inferInventoryCategory(item.nombre, item.descripcion),
    }));

    return NextResponse.json({ count: lowStockItems.length, items: lowStockItems });
  } catch (error) {
    console.error('Error in low-stock GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
