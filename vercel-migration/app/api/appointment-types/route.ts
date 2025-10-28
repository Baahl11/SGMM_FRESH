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

    // Obtener tipos de cita del usuario (RLS automáticamente filtra por user_id)
    const { data: appointmentTypes, error } = await supabase
      .from('appointment_types')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error fetching appointment types:', error)
      return NextResponse.json(
        { error: 'Error al obtener tipos de cita', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(appointmentTypes)
  } catch (error) {
    console.error('Unexpected error in GET /api/appointment-types:', error)
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
    
    // Validación básica
    if (!body.nombre || body.nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    if (!body.duracion_minutos || body.duracion_minutos <= 0) {
      return NextResponse.json(
        { error: 'La duración debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Preparar datos del tipo de cita
    const appointmentTypeData = {
      nombre: body.nombre.trim(),
      descripcion: body.descripcion?.trim() || null,
      duracion_minutos: body.duracion_minutos,
      color: body.color || '#10b981',
      precio_default: body.precio_default || null,
      requiere_confirmacion: body.requiere_confirmacion !== undefined ? body.requiere_confirmacion : false,
      activo: body.activo !== undefined ? body.activo : true,
      user_id: user.id
    }

    // Insertar tipo de cita
    const { data: newType, error } = await supabase
      .from('appointment_types')
      .insert(appointmentTypeData)
      .select()
      .single()

    if (error) {
      console.error('Error creating appointment type:', error)
      return NextResponse.json(
        { error: 'Error al crear tipo de cita', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(newType, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/appointment-types:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
