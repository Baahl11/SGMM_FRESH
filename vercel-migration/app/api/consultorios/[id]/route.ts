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

    const { data: consultorio, error } = await supabase
      .from('consultorios')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Consultorio no encontrado' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Error al obtener consultorio' }, { status: 500 })
    }

    return NextResponse.json(consultorio)
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

    const updateData: any = {}
    if (body.nombre !== undefined) updateData.nombre = body.nombre.trim()
    if (body.ubicacion !== undefined) updateData.ubicacion = body.ubicacion?.trim() || null
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion?.trim() || null
    if (body.capacidad !== undefined) updateData.capacidad = body.capacidad
    if (body.activo !== undefined) updateData.activo = body.activo

    const { data: updatedConsultorio, error } = await supabase
      .from('consultorios')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Consultorio no encontrado' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Error al actualizar consultorio' }, { status: 500 })
    }

    return NextResponse.json(updatedConsultorio)
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
