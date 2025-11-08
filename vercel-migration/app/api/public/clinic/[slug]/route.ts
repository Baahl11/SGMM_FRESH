import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUBLIC API: Get clinic information by booking slug
 * Used by booking page to display clinic details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  try {
    // Create Supabase client with service role (bypass RLS for reading public clinic info)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 1. Find clinic by slug
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, name, email, booking_enabled')
      .eq('booking_slug', slug)
      .eq('booking_enabled', true) // Only return if booking is enabled
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Clínica no encontrada o booking no habilitado' },
        { status: 404 }
      )
    }

    // 2. Get booking settings
    const { data: settings, error: settingsError } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('user_id', profile.user_id)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Configuración de booking no encontrada' },
        { status: 404 }
      )
    }

    // 3. Get clinic branding (if available)
    const { data: branding } = await supabase
      .from('clinic_settings')
      .select('logo_url, primary_color, clinic_name')
      .eq('user_id', profile.user_id)
      .maybeSingle()

    // 4. Return public clinic information
    return NextResponse.json({
      clinic: {
        name: branding?.clinic_name || profile.name,
        logoUrl: branding?.logo_url,
        primaryColor: branding?.primary_color || '#3b82f6',
      },
      settings: {
        pageTitle: settings.page_title,
        welcomeMessage: settings.welcome_message,
        showPrices: settings.show_prices,
        services: settings.services || [],
        slotDurationMinutes: settings.slot_duration_minutes,
        minAdvanceHours: settings.min_advance_hours,
        maxAdvanceDays: settings.max_advance_days,
      },
    })
  } catch (error) {
    console.error('Error fetching clinic info:', error)
    return NextResponse.json(
      { error: 'Error al obtener información de la clínica' },
      { status: 500 }
    )
  }
}
