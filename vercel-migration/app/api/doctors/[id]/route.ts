import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { data: doctor, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id) // RLS extra validation
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Doctor no encontrado' },
          { status: 404 }
        )
      }
      console.error('Error fetching doctor:', error)
      return NextResponse.json(
        { error: 'Error al obtener doctor', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(doctor)
  } catch (error) {
    console.error('Unexpected error in GET /api/doctors/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Validación básica
    if (body.nombre !== undefined && body.nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre no puede estar vacío' },
        { status: 400 }
      )
    }

    // Preparar datos para actualizar (solo campos permitidos)
    const updateData: any = {}
    if (body.nombre !== undefined) updateData.nombre = body.nombre.trim()
    if (body.especialidad !== undefined) updateData.especialidad = body.especialidad?.trim() || null
    if (body.cedula_profesional !== undefined) updateData.cedula_profesional = body.cedula_profesional?.trim() || null
    if (body.telefono !== undefined) updateData.telefono = body.telefono?.trim() || null
    if (body.email !== undefined) updateData.email = body.email?.trim() || null
    if (body.color !== undefined) updateData.color = body.color
    if (body.activo !== undefined) updateData.activo = body.activo

    // Actualizar doctor
    const { data: updatedDoctor, error } = await supabase
      .from('doctors')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id) // RLS enforcement
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Doctor no encontrado o no autorizado' },
          { status: 404 }
        )
      }
      console.error('Error updating doctor:', error)
      return NextResponse.json(
        { error: 'Error al actualizar doctor', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedDoctor)
  } catch (error) {
    console.error('Unexpected error in PUT /api/doctors/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Soft delete: marcar como inactivo en lugar de eliminar
    const { data: deletedDoctor, error } = await supabase
      .from('doctors')
      .update({ activo: false })
      .eq('id', params.id)
      .eq('user_id', user.id) // RLS enforcement
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Doctor no encontrado o no autorizado' },
          { status: 404 }
        )
      }
      console.error('Error deleting doctor:', error)
      return NextResponse.json(
        { error: 'Error al eliminar doctor', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Doctor desactivado exitosamente',
      doctor: deletedDoctor 
    })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/doctors/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
