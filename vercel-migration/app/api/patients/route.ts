import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { createClient } from '@/lib/supabase/server'

// GET /api/patients - Obtener todos los pacientes
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use server client with cookies to respect RLS policies
    const supabase = await createClient()

    
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching patients:', error)
      return NextResponse.json(
        { error: 'Error fetching patients', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(patients || [])
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/patients - Crear nuevo paciente
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.nombre) {
      return NextResponse.json(
        { error: 'Missing required field: nombre' },
        { status: 400 }
      )
    }

    // Use server client with cookies to respect RLS policies
    const supabase = await createClient()

    // Prepare patient data with user_id
    const patientData = {
      nombre: body.nombre,
      apellido: body.apellido || '',
      fecha_nacimiento: body.fecha_nacimiento || null,
      telefono: body.telefono || '',
      email: body.email || '',
      direccion: body.direccion || '',
      notas: body.notas || '',
      activo: body.activo !== undefined ? body.activo : true,
      user_id: user.id
    }
    
    const { data: patient, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating patient:', error)
      return NextResponse.json(
        { error: 'Error creating patient', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}