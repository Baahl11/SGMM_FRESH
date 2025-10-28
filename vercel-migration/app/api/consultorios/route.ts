import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { canAddLocation } from '@/lib/subscription/quota-service-server'

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

    // Obtener consultorios del usuario (RLS automáticamente filtra por user_id)
    const { data: consultorios, error } = await supabase
      .from('consultorios')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error fetching consultorios:', error)
      return NextResponse.json(
        { error: 'Error al obtener consultorios', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(consultorios)
  } catch (error) {
    console.error('Unexpected error in GET /api/consultorios:', error)
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

    // Validación de cuota (server-side defense)
    const quotaCheck = await canAddLocation(user.id)
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { 
          error: quotaCheck.message,
          reason: 'quota_exceeded',
          current: quotaCheck.current,
          max: quotaCheck.max
        },
        { status: 403 }
      )
    }

    // Preparar datos del consultorio
    const consultorioData = {
      nombre: body.nombre.trim(),
      ubicacion: body.ubicacion?.trim() || null,
      descripcion: body.descripcion?.trim() || null,
      capacidad: body.capacidad || 1,
      activo: body.activo !== undefined ? body.activo : true,
      user_id: user.id
    }

    // Insertar consultorio
    const { data: newConsultorio, error } = await supabase
      .from('consultorios')
      .insert(consultorioData)
      .select()
      .single()

    if (error) {
      console.error('Error creating consultorio:', error)
      return NextResponse.json(
        { error: 'Error al crear consultorio', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(newConsultorio, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/consultorios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
