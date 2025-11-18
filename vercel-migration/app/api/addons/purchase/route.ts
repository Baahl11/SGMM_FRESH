import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { getAddonConfig } from '@/lib/stripe/addons';
import type { AddonType } from '@/lib/stripe/addons';

/**
 * POST /api/addons/purchase
 * Purchase an add-on (extra location or doctor)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { addon_type, quantity = 1 } = body as { addon_type: AddonType; quantity?: number };

    // Validate addon type
    const addonConfig = getAddonConfig(addon_type);
    if (!addonConfig) {
      return NextResponse.json({ error: 'Tipo de add-on inválido' }, { status: 400 });
    }

    // Validate quantity
    if (quantity < 1 || quantity > addonConfig.maxQuantity) {
      return NextResponse.json(
        { error: `Cantidad debe estar entre 1 y ${addonConfig.maxQuantity}` },
        { status: 400 }
      );
    }

    // Get user's active subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Necesitas una suscripción activa para comprar add-ons' },
        { status: 400 }
      );
    }

    // Check if user already has this add-on (to update quantity instead of creating new)
    const { data: existingAddon } = await supabase
      .from('subscription_addons')
      .select('*')
      .eq('user_id', user.id)
      .eq('addon_type', addon_type)
      .eq('status', 'active')
      .maybeSingle();

    const isRealStripeSubscription = subscription.stripe_subscription_id && 
                                     subscription.stripe_subscription_id.startsWith('sub_');
    
    let stripeSubscriptionItemId: string | null = null;
    let newQuantity: number;

    if (existingAddon) {
      // Update existing add-on quantity
      newQuantity = existingAddon.quantity + quantity;
      
      // Only update Stripe if it's a real subscription
      if (isRealStripeSubscription && existingAddon.stripe_subscription_item_id?.startsWith('si_')) {
        await stripe.subscriptionItems.update(existingAddon.stripe_subscription_item_id, {
          quantity: newQuantity,
        });
      }

      stripeSubscriptionItemId = existingAddon.stripe_subscription_item_id;

      // Update in database
      const { error: updateError } = await supabase
        .from('subscription_addons')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAddon.id);

      if (updateError) {
        console.error('Error updating add-on:', updateError);
        return NextResponse.json({ error: 'Error al actualizar add-on' }, { status: 500 });
      }
    } else {
      // Create new add-on
      newQuantity = quantity;

      // Only create Stripe subscription item for real subscriptions
      if (isRealStripeSubscription) {
        const subscriptionItem = await stripe.subscriptionItems.create({
          subscription: subscription.stripe_subscription_id,
          price: addonConfig.priceId,
          quantity: quantity,
        });
        stripeSubscriptionItemId = subscriptionItem.id;
      }

      // Create new add-on in database (stripe_subscription_item_id can be null for test accounts)
      const { error: insertError } = await supabase
        .from('subscription_addons')
        .insert({
          user_id: user.id,
          subscription_id: subscription.id,
          addon_type,
          stripe_subscription_item_id: stripeSubscriptionItemId,
          stripe_price_id: addonConfig.priceId,
          quantity: newQuantity,
          unit_price: addonConfig.price,
          status: 'active',
        });

      if (insertError) {
        console.error('Error creating add-on:', insertError);
        return NextResponse.json({ error: 'Error al crear add-on' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      addon_type,
      quantity: newQuantity,
      message: `${addonConfig.name} agregado exitosamente`,
    });
  } catch (error) {
    console.error('Error purchasing add-on:', error);
    return NextResponse.json(
      { error: 'Error al procesar compra de add-on' },
      { status: 500 }
    );
  }
}
