import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

/**
 * DELETE /api/addons/[id]
 * Cancel an add-on subscription
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const addonId = params.id;

    // Get the add-on
    const { data: addon, error: fetchError } = await supabase
      .from('subscription_addons')
      .select('*')
      .eq('id', addonId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !addon) {
      return NextResponse.json({ error: 'Add-on no encontrado' }, { status: 404 });
    }

    if (addon.status === 'canceled') {
      return NextResponse.json({ error: 'Add-on ya está cancelado' }, { status: 400 });
    }

    // Cancel in Stripe if it's a real subscription item
    if (addon.stripe_subscription_item_id && addon.stripe_subscription_item_id.startsWith('si_')) {
      try {
        await stripe.subscriptionItems.del(addon.stripe_subscription_item_id);
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription item:', stripeError);
        // Continue anyway to update our database
      }
    }

    // Update add-on status to canceled
    const { error: updateError } = await supabase
      .from('subscription_addons')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', addonId);

    if (updateError) {
      console.error('Error updating add-on:', updateError);
      return NextResponse.json({ error: 'Error al cancelar add-on' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Add-on cancelado exitosamente',
    });
  } catch (error) {
    console.error('Error canceling add-on:', error);
    return NextResponse.json(
      { error: 'Error al cancelar add-on' },
      { status: 500 }
    );
  }
}
