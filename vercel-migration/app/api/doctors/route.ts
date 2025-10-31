import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { canAddDoctor } from '@/lib/subscription/quota-service-server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔥 [doctors] GET request, user:', user?.id);
    
    if (authError || !user) {
      console.log('❌ [doctors] Unauthorized');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener doctores del usuario (RLS automáticamente filtra por user_id)
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true })

    if (error) {
      console.error('❌ [doctors] Error fetching doctors:', error)
      return NextResponse.json(
        { error: 'Error al obtener doctores', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ [doctors] Found ${doctors?.length || 0} doctors`);
    // Return array directly for compatibility with frontend
    return NextResponse.json(doctors || [])
  } catch (error) {
    console.error('❌ [doctors] Unexpected error:', error)
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
    const quotaCheck = await canAddDoctor(user.id)
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

    // Preparar datos del doctor
    const doctorData = {
      nombre: body.nombre.trim(),
      especialidad: body.especialidad?.trim() || null,
      cedula_profesional: body.cedula_profesional?.trim() || null,
      telefono: body.telefono?.trim() || null,
      email: body.email?.trim() || null,
      color: body.color || '#3b82f6',
      activo: body.activo !== undefined ? body.activo : true,
      user_id: user.id
    }

    // Insertar doctor
    const { data: newDoctor, error } = await supabase
      .from('doctors')
      .insert(doctorData)
      .select()
      .single()

    if (error) {
      console.error('Error creating doctor:', error)
      return NextResponse.json(
        { error: 'Error al crear doctor', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(newDoctor, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/doctors:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
