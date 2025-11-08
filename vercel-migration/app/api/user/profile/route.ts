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

    // Obtener perfil del usuario
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json(
        { error: 'Error al obtener perfil', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Unexpected error in GET /api/user/profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
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

    // Si se está actualizando el booking_slug, verificar que sea único
    if (body.booking_slug) {
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('booking_slug', body.booking_slug)
        .neq('user_id', user.id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Este slug ya está en uso. Por favor elige otro.' },
          { status: 400 }
        )
      }

      // Validar formato del slug (solo letras, números y guiones)
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(body.booking_slug)) {
        return NextResponse.json(
          { error: 'El slug solo puede contener letras minúsculas, números y guiones' },
          { status: 400 }
        )
      }
    }

    // Actualizar perfil
    const { data: updated, error } = await supabase
      .from('user_profiles')
      .update(body)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return NextResponse.json(
        { error: 'Error al actualizar perfil', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Unexpected error in PATCH /api/user/profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
