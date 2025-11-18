import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/addons
 * Get all active add-ons for current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get user's active add-ons
    const { data: addons, error } = await supabase
      .from('subscription_addons')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching add-ons:', error);
      return NextResponse.json({ error: 'Error al obtener add-ons' }, { status: 500 });
    }

    return NextResponse.json({ addons: addons || [] });
  } catch (error) {
    console.error('Error in GET /api/addons:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
