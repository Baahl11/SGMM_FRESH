import { NextRequest, NextResponse } from 'next/server';
import { validateBooking } from '@/lib/calendar-utils';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/public/validate-slot
 * Validates if a time slot is available before booking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, date, time, duration } = body;

    if (!slug || !date || !time || !duration) {
      return NextResponse.json(
        { error: 'slug, date, time, and duration are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find clinic by slug
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('booking_slug', slug)
      .eq('booking_enabled', true)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Clínica no encontrada' },
        { status: 404 }
      );
    }

    // Validate the booking
    const validation = await validateBooking(
      profile.user_id,
      date,
      time,
      duration
    );

    if (!validation.valid) {
      return NextResponse.json({
        available: false,
        error: validation.error,
        suggestion: validation.suggestion,
      });
    }

    return NextResponse.json({
      available: true,
      message: 'Horario disponible',
    });
  } catch (error) {
    console.error('Error validating slot:', error);
    return NextResponse.json(
      { error: 'Error al validar horario' },
      { status: 500 }
    );
  }
}
