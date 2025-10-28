import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';

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
    });

    return NextResponse.json({ count: lowStockItems.length, items: lowStockItems });
  } catch (error) {
    console.error('Error in low-stock GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
