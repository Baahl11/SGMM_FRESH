import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: appointmentType, error } = await supabase
      .from('appointment_types')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Tipo de cita no encontrado' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Error al obtener tipo de cita' }, { status: 500 })
    }

    return NextResponse.json(appointmentType)
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    if (body.nombre !== undefined && body.nombre.trim() === '') {
      return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 })
    }

    if (body.duracion_minutos !== undefined && body.duracion_minutos <= 0) {
      return NextResponse.json({ error: 'La duración debe ser mayor a 0' }, { status: 400 })
    }

    const updateData: any = {}
    if (body.nombre !== undefined) updateData.nombre = body.nombre.trim()
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion?.trim() || null
    if (body.duracion_minutos !== undefined) updateData.duracion_minutos = body.duracion_minutos
    if (body.color !== undefined) updateData.color = body.color
    if (body.precio_default !== undefined) updateData.precio_default = body.precio_default
    if (body.requiere_confirmacion !== undefined) updateData.requiere_confirmacion = body.requiere_confirmacion
    if (body.activo !== undefined) updateData.activo = body.activo

    const { data: updatedType, error } = await supabase
      .from('appointment_types')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Tipo de cita no encontrado' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Error al actualizar tipo de cita' }, { status: 500 })
    }

    return NextResponse.json(updatedType)
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
