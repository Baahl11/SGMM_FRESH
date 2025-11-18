import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/quota/usage
 * Get current quota usage for authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get subscription with add-ons
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_tier, max_doctors, max_locations, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Get active add-ons
    const { data: addons } = await supabase
      .from('subscription_addons')
      .select('addon_type, quantity')
      .eq('user_id', user.id)
      .eq('status', 'active');

    let extraDoctors = 0;
    let extraLocations = 0;

    if (addons) {
      addons.forEach(addon => {
        if (addon.addon_type === 'extra_doctor') {
          extraDoctors += addon.quantity || 0;
        } else if (addon.addon_type === 'extra_location') {
          extraLocations += addon.quantity || 0;
        }
      });
    }

    // Count current usage
    const [{ count: doctorsCount }, { count: locationsCount }] = await Promise.all([
      supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('consultorios').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    const totalMaxDoctors = subscription.max_doctors + extraDoctors;
    const totalMaxLocations = subscription.max_locations + extraLocations;

    return NextResponse.json({
      usage: {
        current_doctors: doctorsCount || 0,
        max_doctors: totalMaxDoctors,
        current_locations: locationsCount || 0,
        max_locations: totalMaxLocations,
        plan_tier: subscription.plan_tier,
        can_add_doctor: (doctorsCount || 0) < totalMaxDoctors,
        can_add_location: (locationsCount || 0) < totalMaxLocations,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/quota/usage:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
