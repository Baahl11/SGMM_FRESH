import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUBLIC API: Get clinic information by booking slug
 * Used by booking page to display clinic details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

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
      .select('user_id, name, email, booking_enabled, phone, specialty, clinic_name, clinic_address, clinic_phone, clinic_email')
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

    const clinicName = branding?.clinic_name || profile.clinic_name || profile.name || 'Clínica'
    const clinicPhone = profile.clinic_phone || profile.phone || null
    const clinicAddress = profile.clinic_address || null
    const clinicSpecialty = profile.specialty || null

    // 4. Return public clinic information
    return NextResponse.json({
      clinic: {
        name: clinicName,
        nombre_clinica: clinicName,
        direccion_clinica: clinicAddress,
        telefono_clinica: clinicPhone,
        especialidad: clinicSpecialty,
        logoUrl: branding?.logo_url,
        primaryColor: branding?.primary_color || '#3b82f6',
      },
      settings: {
        page_title: settings.page_title,
        pageTitle: settings.page_title,
        welcome_message: settings.welcome_message,
        welcomeMessage: settings.welcome_message,
        show_prices: settings.show_prices,
        showPrices: settings.show_prices,
        require_phone: settings.require_phone,
        requirePhone: settings.require_phone,
        services: settings.services || [],
        slot_duration_minutes: settings.slot_duration_minutes,
        slotDurationMinutes: settings.slot_duration_minutes,
        min_advance_hours: settings.min_advance_hours,
        minAdvanceHours: settings.min_advance_hours,
        max_advance_days: settings.max_advance_days,
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
