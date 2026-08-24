import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/log';
import { checkRateLimit, clientIpFromHeaders, rateLimitHeaders } from '@/lib/security/rate-limit';

const log = createLogger('api/check-payment-method');

/**
 * Auditoría fable 2026-06-11 — hallazgo C11 (P1):
 * El endpoint aceptaba cualquier `customerId` sin autenticación y consultaba
 * Stripe con la clave secreta (enumeración + consumo de API).
 *
 * Ahora: exige usuario autenticado, IGNORA cualquier customerId del cliente y
 * resuelve el customer desde la suscripción del propio usuario. Rate limit por
 * usuario/IP. La respuesta conserva el shape { hasPaymentMethod } usado por el
 * frontend/middleware.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers);
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ hasPaymentMethod: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rl = checkRateLimit(`cpm:user:${user.id}:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { hasPaymentMethod: false, error: 'Too many requests' },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const customerId = subscription?.stripe_customer_id;
    if (!customerId || customerId.startsWith('demo_')) {
      return NextResponse.json({ hasPaymentMethod: false });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      log.warn('STRIPE_SECRET_KEY ausente');
      return NextResponse.json({ hasPaymentMethod: false });
    }
    const stripe = new Stripe(secretKey, { apiVersion: '2025-09-30.clover' });

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 1,
    });

    return NextResponse.json({ hasPaymentMethod: paymentMethods.data.length > 0 });
  } catch (error) {
    log.error('Fallo verificando método de pago', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    return NextResponse.json({ hasPaymentMethod: false });
  }
}
