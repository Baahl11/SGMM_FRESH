import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

/**
 * POST /api/bookings/deposits/webhook
 * 
 * Webhook de Stripe para confirmar pagos de depósitos
 * Configurar en Stripe Dashboard:
 * - URL: https://tudominio.com/api/bookings/deposits/webhook
 * - Eventos: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_DEPOSITS || process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Actualizar el depósito a "processing"
        const { data: deposit } = await supabase
          .from('booking_deposits')
          .update({
            payment_status: 'processing',
          })
          .eq('checkout_session_id', session.id)
          .select()
          .single();

        if (deposit) {
          // Actualizar la reserva
          await supabase
            .from('public_bookings')
            .update({ deposit_status: 'paid' })
            .eq('id', deposit.booking_id);
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Obtener detalles del método de pago
        const paymentMethod = paymentIntent.payment_method
          ? await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string)
          : null;

        // Actualizar el depósito a "succeeded"
        const { data: deposit, error: updateError } = await supabase
          .from('booking_deposits')
          .update({
            payment_status: 'succeeded',
            paid_at: new Date().toISOString(),
            payment_method_type: paymentMethod?.type || null,
            last4: paymentMethod?.type === 'card' ? paymentMethod.card?.last4 : null,
            card_brand: paymentMethod?.type === 'card' ? paymentMethod.card?.brand : null,
          })
          .eq('payment_intent_id', paymentIntent.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating deposit:', updateError);
          break;
        }

        if (deposit) {
          // Actualizar la reserva a confirmada
          await supabase
            .from('public_bookings')
            .update({
              deposit_status: 'paid',
              status: 'confirmed', // Auto-confirmar cuando se paga el depósito
            })
            .eq('id', deposit.booking_id);

          // Obtener datos de la reserva para enviar notificación
          const { data: booking } = await supabase
            .from('public_bookings')
            .select('*')
            .eq('id', deposit.booking_id)
            .single();

          if (booking) {
            // Enviar notificación de confirmación
            try {
              await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  booking_id: booking.id,
                  event_type: 'booking_confirmed',
                  send_email: true,
                  send_whatsapp: true,
                }),
              });
            } catch (notifError) {
              console.error('Error sending notification:', notifError);
            }
          }
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Actualizar el depósito a "failed"
        const { data: deposit } = await supabase
          .from('booking_deposits')
          .update({
            payment_status: 'failed',
            metadata: {
              error: paymentIntent.last_payment_error?.message || 'Payment failed',
            },
          })
          .eq('payment_intent_id', paymentIntent.id)
          .select()
          .single();

        if (deposit) {
          // Actualizar la reserva
          await supabase
            .from('public_bookings')
            .update({ deposit_status: 'failed' })
            .eq('id', deposit.booking_id);
        }

        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Actualizar el depósito a "cancelled"
        const { data: deposit } = await supabase
          .from('booking_deposits')
          .update({
            payment_status: 'cancelled',
          })
          .eq('payment_intent_id', paymentIntent.id)
          .select()
          .single();

        if (deposit) {
          // Actualizar la reserva
          await supabase
            .from('public_bookings')
            .update({ deposit_status: 'failed' })
            .eq('id', deposit.booking_id);
        }

        break;
      }

      default:
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
