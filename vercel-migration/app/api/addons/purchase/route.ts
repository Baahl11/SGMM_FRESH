import { NextResponse } from 'next/server';
import { createClient, supabaseAdmin } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { getAddonConfig } from '@/lib/stripe/addons';
import type { AddonType } from '@/lib/stripe/addons';

/**
 * POST /api/addons/purchase
 * Inicia el flujo de compra para un add-on. Si el usuario tiene una
 * suscripción real en Stripe, se genera una sesión de Checkout para que
 * complete el pago. En entornos sin Stripe se mantiene el flujo "manual".
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { addon_type, quantity = 1 } = body as { addon_type: AddonType; quantity?: number };

    const addonConfig = getAddonConfig(addon_type);
    if (!addonConfig) {
      return NextResponse.json({ error: 'Tipo de add-on inválido' }, { status: 400 });
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'La cantidad debe ser mayor o igual a 1' },
        { status: 400 }
      );
    }

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Necesitas una suscripción activa para comprar add-ons' },
        { status: 400 }
      )
    }

    // 🔥 Obtener sales_team de la suscripción para mantener consistencia
    const salesTeam = subscription.sales_team || 'internal'

    const metadata = await hydrateStripeMetadata({
      subscription,
      userId: user.id,
      userEmail: user.email || undefined,
    });

    if (metadata.stripeCustomerId) {
      subscription.stripe_customer_id = metadata.stripeCustomerId;
    }
    if (metadata.stripeSubscriptionId) {
      subscription.stripe_subscription_id = metadata.stripeSubscriptionId;
    }

    const { data: existingAddon } = await supabase
      .from('subscription_addons')
      .select('*')
      .eq('user_id', user.id)
      .eq('addon_type', addon_type)
      .eq('status', 'active')
      .maybeSingle();

    const existingQuantity = existingAddon?.quantity ?? 0;
    const desiredQuantity = existingQuantity + quantity;

    if (desiredQuantity > addonConfig.maxQuantity) {
      return NextResponse.json(
        { error: `Solo puedes tener hasta ${addonConfig.maxQuantity} unidades de este add-on` },
        { status: 400 }
      );
    }

    const hasStripeSubscription = Boolean(
      subscription.stripe_subscription_id && subscription.stripe_subscription_id.startsWith('sub_')
    );
    const hasStripeCustomer = Boolean(
      subscription.stripe_customer_id && subscription.stripe_customer_id.startsWith('cus_')
    );

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      'http://localhost:3000';

    console.log('[Addons] Purchase request', {
      userId: user.id,
      addonType: addon_type,
      quantity,
      existingQuantity,
      desiredQuantity,
      hasStripeSubscription,
      hasStripeCustomer,
      subscriptionId: subscription.id,
    });

    if (!hasStripeCustomer) {
      console.error('[Addons] Unable to determine Stripe customer for user', user.id);
      return NextResponse.json({ error: 'No se pudo obtener el cliente de Stripe' }, { status: 400 });
    }

    if (!hasStripeSubscription) {
      console.log('[Addons] Creating add-on subscription via Checkout (no existing subscription)', {
        userId: user.id,
        addonType: addon_type,
        quantity,
      });

      const successUrl = new URL('/dashboard/settings/addons?status=success', origin).toString();
      const cancelUrl = new URL('/dashboard/settings/addons?status=cancel', origin).toString();

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: subscription.stripe_customer_id!,
        line_items: [
          {
            price: addonConfig.priceId,
            quantity,
          },
        ],
        metadata: {
          purchase_type: 'addon',
          addon_type,
          quantity: String(quantity),
          user_id: user.id,
          subscription_id: subscription.id,
        },
        subscription_data: {
          metadata: {
            user_id: user.id,
            addon_seed: 'true',
          },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return NextResponse.json({
        success: true,
        checkoutUrl: session.url,
        message: 'Redirigiéndote a Stripe para completar el pago del add-on.',
      });
    }

    let stripeSubscriptionItemId = existingAddon?.stripe_subscription_item_id || null;

    if (existingAddon?.stripe_subscription_item_id?.startsWith('si_')) {
      await stripe.subscriptionItems.update(existingAddon.stripe_subscription_item_id, {
        quantity: desiredQuantity,
      });

      const { error: updateError } = await supabase
        .from('subscription_addons')
        .update({
          quantity: desiredQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAddon.id);

      if (updateError) {
        console.error('Error updating add-on:', updateError);
        return NextResponse.json({ error: 'Error al actualizar add-on' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        addon_type,
        quantity: desiredQuantity,
        message: `${addonConfig.name} actualizado exitosamente`,
      });
    }

    const subscriptionItem = await stripe.subscriptionItems.create({
      subscription: subscription.stripe_subscription_id!,
      price: addonConfig.priceId,
      quantity: desiredQuantity,
    });
    stripeSubscriptionItemId = subscriptionItem.id;

    if (existingAddon) {
      const { error: updateError } = await supabase
        .from('subscription_addons')
        .update({
          quantity: desiredQuantity,
          stripe_subscription_item_id: stripeSubscriptionItemId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAddon.id);

      if (updateError) {
        console.error('Error updating add-on after Stripe sync:', updateError);
        return NextResponse.json({ error: 'Error al actualizar add-on' }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase
        .from('subscription_addons')
        .insert({
          user_id: user.id,
          subscription_id: subscription.id,
          addon_type,
          stripe_subscription_item_id: stripeSubscriptionItemId,
          stripe_price_id: addonConfig.priceId,
          quantity: desiredQuantity,
          unit_price: addonConfig.price,
          status: 'active',
          sales_team: salesTeam, // 🔥 Mantener consistencia con la suscripción
        });

      if (insertError) {
        console.error('Error creating add-on:', insertError);
        return NextResponse.json({ error: 'Error al crear add-on' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      addon_type,
      quantity: desiredQuantity,
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

async function hydrateStripeMetadata({
  subscription,
  userId,
  userEmail,
}: {
  subscription: any;
  userId: string;
  userEmail?: string;
}) {
  let stripeCustomerId: string | null = subscription.stripe_customer_id || null;
  let stripeSubscriptionId: string | null = subscription.stripe_subscription_id || null;
  const updates: Record<string, string> = {};

  try {
    const missingCustomer = !stripeCustomerId?.startsWith('cus_');
    const missingSubscription = !stripeSubscriptionId?.startsWith('sub_');

    if (missingCustomer || missingSubscription) {
      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('stripe_customer_id, stripe_subscription_id')
        .eq('id', userId)
        .maybeSingle();

      if (userProfile) {
        const profileCustomerId = userProfile.stripe_customer_id;
        const profileSubscriptionId = userProfile.stripe_subscription_id;

        if (missingCustomer && profileCustomerId && profileCustomerId.startsWith('cus_')) {
          stripeCustomerId = profileCustomerId;
          updates.stripe_customer_id = profileCustomerId;
        }
        if (missingSubscription && profileSubscriptionId && profileSubscriptionId.startsWith('sub_')) {
          stripeSubscriptionId = profileSubscriptionId;
          updates.stripe_subscription_id = profileSubscriptionId;
        }
      }
    }

    if (!stripeCustomerId && userEmail) {
      const searchResults = await stripe.customers.search({ query: `email:"${userEmail}"` });
      const customerMatch = searchResults.data[0];
      if (customerMatch) {
        stripeCustomerId = customerMatch.id;
        updates.stripe_customer_id = customerMatch.id;
      }
    }

    if (!stripeCustomerId && userEmail) {
      const newCustomer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
      stripeCustomerId = newCustomer.id;
      updates.stripe_customer_id = newCustomer.id;
    }

    if (!stripeSubscriptionId && stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 10,
      });
      const activeSub = subscriptions.data.find(sub => sub.status !== 'canceled');
      if (activeSub) {
        stripeSubscriptionId = activeSub.id;
        updates.stripe_subscription_id = activeSub.id;
      }
    }

    if (Object.keys(updates).length > 0) {
      await supabaseAdmin
        .from('subscriptions')
        .update(updates)
        .eq('id', subscription.id);
    }
  } catch (error) {
    console.error('[Addons] Error hydrating Stripe metadata:', error);
  }

  return { stripeCustomerId, stripeSubscriptionId };
}
