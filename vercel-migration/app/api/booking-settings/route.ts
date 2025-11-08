import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener configuración de booking del usuario
    const { data: settings, error } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // Si no existe configuración, devolver valores por defecto
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          time_ranges: {},
          slot_duration_minutes: 30,
          buffer_time_minutes: 5,
          min_advance_hours: 2,
          max_advance_days: 60,
          services: [],
          page_title: 'Agendar cita',
          welcome_message: null,
          show_prices: true,
          require_phone: true,
          auto_confirm: false,
          send_confirmation_email: true,
          send_confirmation_sms: false,
          send_confirmation_whatsapp: true,
        })
      }

      console.error('Error fetching booking settings:', error)
      return NextResponse.json(
        { error: 'Error al obtener configuración', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Unexpected error in GET /api/booking-settings:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Verificar si ya existe configuración
    const { data: existing } = await supabase
      .from('booking_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Actualizar configuración existente
      const { data: updated, error } = await supabase
        .from('booking_settings')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating booking settings:', error)
        return NextResponse.json(
          { error: 'Error al actualizar configuración', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json(updated)
    } else {
      // Crear nueva configuración
      const { data: created, error } = await supabase
        .from('booking_settings')
        .insert({
          user_id: user.id,
          ...body
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating booking settings:', error)
        return NextResponse.json(
          { error: 'Error al crear configuración', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json(created, { status: 201 })
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/booking-settings:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
