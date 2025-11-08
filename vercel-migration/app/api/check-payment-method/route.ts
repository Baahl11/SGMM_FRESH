import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json({ hasPaymentMethod: false });
    }

    // Obtener métodos de pago del cliente
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Verificar si tiene al menos un método de pago activo
    const hasPaymentMethod = paymentMethods.data.length > 0;

    return NextResponse.json({ hasPaymentMethod });
  } catch (error) {
    console.error('Error checking payment method:', error);
    return NextResponse.json({ hasPaymentMethod: false });
  }
}
