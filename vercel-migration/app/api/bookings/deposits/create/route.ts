import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

/**
 * POST /api/bookings/deposits/create
 * 
 * Crea un PaymentIntent de Stripe para el depósito de la reserva
 * 
 * Body:
 * {
 *   booking_id: string         // ID de la reserva
 *   amount: number             // Monto del depósito en MXN
 *   patient_email: string      // Email del paciente
 *   patient_name: string       // Nombre del paciente
 * }
 * 
 * Response:
 * {
 *   deposit_id: string
 *   checkout_url: string        // URL de Stripe Checkout
 *   payment_intent_id: string
 *   client_secret: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id, amount, patient_email, patient_name } = body;

    // Validaciones
    if (!booking_id || !amount || !patient_email || !patient_name) {
      return NextResponse.json(
        { error: 'booking_id, amount, patient_email, and patient_name are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Verificar que la reserva existe y obtener datos
    const { data: booking, error: bookingError } = await supabase
      .from('public_bookings')
      .select('*, user_profiles!clinic_user_id(name, email)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // 2. Verificar si ya existe un depósito para esta reserva
    const { data: existingDeposit } = await supabase
      .from('booking_deposits')
      .select('*')
      .eq('booking_id', booking_id)
      .in('payment_status', ['pending', 'processing', 'succeeded'])
      .single();

    if (existingDeposit) {
      // Si ya existe un depósito exitoso, retornar error
      if (existingDeposit.payment_status === 'succeeded') {
        return NextResponse.json(
          { error: 'Deposit already paid for this booking' },
          { status: 400 }
        );
      }

      // Si existe uno pendiente, retornar el mismo checkout URL
      if (existingDeposit.checkout_url) {
        return NextResponse.json({
          deposit_id: existingDeposit.id,
          checkout_url: existingDeposit.checkout_url,
          payment_intent_id: existingDeposit.payment_intent_id,
          status: existingDeposit.payment_status,
        });
      }
    }

    // 3. Obtener configuración de depósitos para la política de reembolso
    const { data: settings } = await supabase
      .from('booking_settings')
      .select('refund_policy')
      .eq('user_id', booking.clinic_user_id)
      .single();

    const refundPolicy = settings?.refund_policy || '24_hours';

    // 4. Crear Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: patient_email,
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Depósito - ${booking.service_name}`,
              description: `Depósito para cita con ${booking.user_profiles?.name || 'Doctor'}\nFecha: ${booking.booking_date} ${booking.booking_time}`,
              images: [],
            },
            unit_amount: Math.round(amount * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          deposit_type: 'booking_deposit',
          booking_id,
          clinic_user_id: booking.clinic_user_id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/cancelled?booking_id=${booking_id}`,
      metadata: {
        deposit_type: 'booking_deposit',
        booking_id,
        clinic_user_id: booking.clinic_user_id,
        patient_name,
        patient_email,
        service_name: booking.service_name,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
      },
    });

    // 5. Crear registro de depósito en la base de datos
    const { data: deposit, error: depositError } = await supabase
      .from('booking_deposits')
      .insert({
        booking_id,
        clinic_user_id: booking.clinic_user_id,
        amount,
        currency: 'MXN',
        payment_intent_id: session.payment_intent as string,
        checkout_session_id: session.id,
        checkout_url: session.url,
        payment_status: 'pending',
        applied_refund_policy: refundPolicy,
        metadata: {
          patient_name,
          patient_email,
          service_name: booking.service_name,
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
        },
      })
      .select()
      .single();

    if (depositError) {
      console.error('Error creating deposit record:', depositError);
      // Intentar cancelar la sesión de Stripe
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        console.error('Error expiring Stripe session:', expireError);
      }

      return NextResponse.json(
        { error: 'Error creating deposit record' },
        { status: 500 }
      );
    }

    // 6. Actualizar la reserva con el estado del depósito
    await supabase
      .from('public_bookings')
      .update({
        deposit_required: true,
        deposit_amount: amount,
        deposit_status: 'pending',
      })
      .eq('id', booking_id);

    // 7. Retornar URL de checkout
    return NextResponse.json({
      deposit_id: deposit.id,
      checkout_url: session.url,
      payment_intent_id: session.payment_intent,
      checkout_session_id: session.id,
      status: 'pending',
    });

  } catch (error) {
    console.error('Error creating deposit payment:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear el pago del depósito',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
