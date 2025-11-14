import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/locations
 * Obtiene todas las ubicaciones del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener ubicaciones del usuario
    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', user.id)
      .order('es_principal', { ascending: false }) // Principal primero
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching locations:', error)
      return NextResponse.json(
        { error: 'Error al obtener ubicaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json(locations || [])
  } catch (error) {
    console.error('Unexpected error in GET /api/locations:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/locations
 * Crea una nueva ubicación
 * Body: { nombre, codigo?, direccion?, ciudad?, estado?, pais?, codigo_postal?, telefono?, email?, timezone?, horarios_laborales?, configuracion? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Parsear body
    const body = await request.json()
    const {
      nombre,
      codigo,
      direccion,
      ciudad,
      estado,
      pais,
      codigo_postal,
      telefono,
      email,
      timezone,
      horarios_laborales,
      configuracion,
      es_principal
    } = body

    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre de la ubicación es requerido' },
        { status: 400 }
      )
    }

    // Verificar límite de ubicaciones según el plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_tier, max_locations')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single()

    if (!subscription) {
      return NextResponse.json(
        { error: 'No se encontró suscripción activa' },
        { status: 403 }
      )
    }

    // Contar ubicaciones activas actuales
    const { count: currentCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('activo', true)

    if ((currentCount || 0) >= subscription.max_locations) {
      return NextResponse.json(
        { 
          error: `Has alcanzado el límite de ubicaciones para tu plan ${subscription.plan_tier} (máximo: ${subscription.max_locations})`,
          code: 'LOCATION_LIMIT_REACHED',
          limit: subscription.max_locations,
          current: currentCount
        },
        { status: 403 }
      )
    }

    // Crear la ubicación
    const { data: newLocation, error: createError } = await supabase
      .from('locations')
      .insert({
        user_id: user.id,
        nombre: nombre.trim(),
        codigo: codigo?.trim() || null,
        direccion: direccion?.trim() || null,
        ciudad: ciudad?.trim() || null,
        estado: estado?.trim() || null,
        pais: pais?.trim() || 'México',
        codigo_postal: codigo_postal?.trim() || null,
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        timezone: timezone || 'America/Mexico_City',
        horarios_laborales: horarios_laborales || {},
        configuracion: configuracion || {},
        activo: true,
        es_principal: es_principal || false
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating location:', createError)
      
      // Si el error es por límite de ubicaciones (trigger)
      if (createError.message?.includes('límite de ubicaciones')) {
        return NextResponse.json(
          { 
            error: createError.message,
            code: 'LOCATION_LIMIT_REACHED'
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: 'Error al crear ubicación' },
        { status: 500 }
      )
    }

    return NextResponse.json(newLocation, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/locations:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
