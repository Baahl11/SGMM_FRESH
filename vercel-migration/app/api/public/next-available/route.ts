import { NextRequest, NextResponse } from 'next/server';
import { findNextAvailableSlot } from '@/lib/calendar-utils';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/public/next-available?slug=dr-melgarejo&duration=30&from=2025-11-04
 * Find next available time slot for a clinic
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const durationStr = searchParams.get('duration');
  const fromDate = searchParams.get('from') || new Date().toISOString().split('T')[0];
  const daysToSearch = parseInt(searchParams.get('days') || '14');

  if (!slug || !durationStr) {
    return NextResponse.json(
      { error: 'slug and duration are required' },
      { status: 400 }
    );
  }

  const duration = parseInt(durationStr);

  try {
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
      .select('user_id, name, clinic_name')
      .eq('booking_slug', slug)
      .eq('booking_enabled', true)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Clínica no encontrada' },
        { status: 404 }
      );
    }

    // Find next available slot
    const nextSlot = await findNextAvailableSlot(
      profile.user_id,
      fromDate,
      duration,
      daysToSearch
    );

    if (!nextSlot) {
      return NextResponse.json({
        available: false,
        message: `No hay horarios disponibles en los próximos ${daysToSearch} días`,
      });
    }

    return NextResponse.json({
      available: true,
      slot: nextSlot,
      clinic_name: profile.clinic_name || profile.name,
    });
  } catch (error) {
    console.error('Error finding next available slot:', error);
    return NextResponse.json(
      { error: 'Error al buscar horarios disponibles' },
      { status: 500 }
    );
  }
}
