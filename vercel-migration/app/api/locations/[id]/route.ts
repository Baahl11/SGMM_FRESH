import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/locations/[id]
 * Obtiene una ubicación específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener la ubicación
    const { data: location, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !location) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error in GET /api/locations/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/locations/[id]
 * Actualiza una ubicación existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que la ubicación pertenece al usuario
    const { data: existingLocation } = await supabase
      .from('locations')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada' },
        { status: 404 }
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
      activo,
      es_principal
    } = body

    // Preparar datos de actualización (solo campos proporcionados)
    const updateData: any = {}
    
    if (nombre !== undefined) updateData.nombre = nombre.trim()
    if (codigo !== undefined) updateData.codigo = codigo?.trim() || null
    if (direccion !== undefined) updateData.direccion = direccion?.trim() || null
    if (ciudad !== undefined) updateData.ciudad = ciudad?.trim() || null
    if (estado !== undefined) updateData.estado = estado?.trim() || null
    if (pais !== undefined) updateData.pais = pais?.trim() || null
    if (codigo_postal !== undefined) updateData.codigo_postal = codigo_postal?.trim() || null
    if (telefono !== undefined) updateData.telefono = telefono?.trim() || null
    if (email !== undefined) updateData.email = email?.trim() || null
    if (timezone !== undefined) updateData.timezone = timezone
    if (horarios_laborales !== undefined) updateData.horarios_laborales = horarios_laborales
    if (configuracion !== undefined) updateData.configuracion = configuracion
    if (activo !== undefined) updateData.activo = activo
    if (es_principal !== undefined) updateData.es_principal = es_principal

    // Actualizar la ubicación
    const { data: updatedLocation, error: updateError } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating location:', updateError)
      
      // Si el error es por límite de ubicaciones (trigger al activar)
      if (updateError.message?.includes('límite de ubicaciones')) {
        return NextResponse.json(
          { 
            error: updateError.message,
            code: 'LOCATION_LIMIT_REACHED'
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: 'Error al actualizar ubicación' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedLocation)
  } catch (error) {
    console.error('Error in PUT /api/locations/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/locations/[id]
 * Elimina una ubicación (solo si NO es la principal)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que la ubicación existe y no es principal
    const { data: location } = await supabase
      .from('locations')
      .select('es_principal')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!location) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada' },
        { status: 404 }
      )
    }

    if (location.es_principal) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar la ubicación principal',
          code: 'CANNOT_DELETE_PRINCIPAL'
        },
        { status: 400 }
      )
    }

    // Eliminar la ubicación
    const { error: deleteError } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting location:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar ubicación' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/locations/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
