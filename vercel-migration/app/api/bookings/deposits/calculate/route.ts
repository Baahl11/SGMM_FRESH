import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/bookings/deposits/calculate
 * 
 * Calcula si se requiere depósito y cuánto para una reserva
 * 
 * Body:
 * {
 *   clinic_slug: string        // Slug del doctor
 *   service_id?: string         // ID del servicio (opcional)
 *   service_price?: number      // Precio del servicio (opcional)
 * }
 * 
 * Response:
 * {
 *   required: boolean
 *   amount: number
 *   currency: string
 *   type: 'fixed' | 'percentage'
 *   percentage?: number
 *   message: string
 *   refund_policy: string
 *   policy_description: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinic_slug, service_id, service_price } = body;

    if (!clinic_slug) {
      return NextResponse.json(
        { error: 'clinic_slug is required' },
        { status: 400 }
      );
    }

    // Crear cliente de Supabase (sin autenticación requerida - es público)
    const supabase = await createClient();

    // 1. Obtener perfil del doctor por slug
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, name, email')
      .eq('booking_slug', clinic_slug)
      .eq('booking_enabled', true)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Clinic not found or booking disabled' },
        { status: 404 }
      );
    }

    // 2. Obtener configuración de depósitos
    const { data: settings, error: settingsError } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('user_id', profile.user_id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json({
        required: false,
        amount: 0,
        currency: 'MXN',
        type: 'fixed',
        message: 'No se requiere depósito',
        refund_policy: 'not_applicable',
        policy_description: '',
      });
    }

    // 3. Verificar si se requiere depósito
    if (!settings.require_deposit) {
      return NextResponse.json({
        required: false,
        amount: 0,
        currency: 'MXN',
        type: settings.deposit_type || 'fixed',
        message: 'No se requiere depósito',
        refund_policy: 'not_applicable',
        policy_description: '',
      });
    }

    // 4. Si hay servicios específicos que requieren depósito, verificar
    if (service_id && settings.services_requiring_deposit) {
      const requiringServices = settings.services_requiring_deposit as string[];
      if (requiringServices.length > 0 && !requiringServices.includes(service_id)) {
        return NextResponse.json({
          required: false,
          amount: 0,
          currency: 'MXN',
          type: settings.deposit_type || 'fixed',
          message: 'Este servicio no requiere depósito',
          refund_policy: 'not_applicable',
          policy_description: '',
        });
      }
    }

    // 5. Calcular monto del depósito
    let depositAmount = 0;

    if (settings.deposit_type === 'fixed') {
      depositAmount = parseFloat(settings.deposit_amount) || 100;
    } else if (settings.deposit_type === 'percentage' && service_price) {
      const percentage = parseInt(settings.deposit_percentage) || 20;
      depositAmount = (service_price * percentage) / 100;

      // Aplicar límites min/max si están configurados
      if (settings.deposit_min_amount) {
        depositAmount = Math.max(depositAmount, parseFloat(settings.deposit_min_amount));
      }
      if (settings.deposit_max_amount) {
        depositAmount = Math.min(depositAmount, parseFloat(settings.deposit_max_amount));
      }
    } else if (settings.deposit_type === 'percentage') {
      // Si es percentage pero no hay precio, usar el monto mínimo o 100
      depositAmount = parseFloat(settings.deposit_min_amount) || 100;
    }

    // Redondear a 2 decimales
    depositAmount = Math.round(depositAmount * 100) / 100;

    // 6. Obtener descripción de política de reembolso
    const policyDescriptions: Record<string, string> = {
      'no_refund': 'No se realizan reembolsos',
      '24_hours': 'Reembolso completo si cancelas con más de 24 horas de anticipación',
      '48_hours': 'Reembolso completo si cancelas con más de 48 horas de anticipación',
      '72_hours': 'Reembolso completo si cancelas con más de 72 horas de anticipación',
      'anytime': 'Reembolso completo en cualquier momento antes de la cita',
    };

    const refundPolicy = settings.refund_policy || '24_hours';
    const policyDescription = policyDescriptions[refundPolicy] || '';

    // 7. Responder con los detalles del depósito
    return NextResponse.json({
      required: true,
      amount: depositAmount,
      currency: 'MXN',
      type: settings.deposit_type,
      percentage: settings.deposit_type === 'percentage' ? parseInt(settings.deposit_percentage) : undefined,
      message: settings.deposit_message || 'Se requiere un depósito para confirmar tu cita.',
      refund_policy: refundPolicy,
      policy_description: policyDescription,
    });

  } catch (error) {
    console.error('Error calculating deposit:', error);
    return NextResponse.json(
      { 
        error: 'Error al calcular depósito',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
