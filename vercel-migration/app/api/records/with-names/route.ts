import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    // fable F1: verificación explícita de sesión (defensa en profundidad;
    // antes la protección dependía únicamente de RLS).
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search')
    const patientId = searchParams.get('patient_id')

    // Build query with joins to get patient and treatment names
    let query = supabase
      .from('records')
      .select(`
        *,
        patients!inner(id, nombre, apellido),
        treatments(id, nombre)
      `)

    query = query.eq('user_id', user.id) // fable F1: tenant explícito

    // Apply filters
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (search) {
      query = query.or(`patients.nombre.ilike.%${search}%,treatments.nombre.ilike.%${search}%,notas.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    const { data, error } = await query
      .order('fecha', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) {
      console.error('Error fetching records with names:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to include patient and treatment names at root level
    const transformedData = (data || []).map(record => ({
      id: record.id,
      patient_id: record.patient_id,
      treatment_id: record.treatment_id,
      fecha: record.fecha,
      monto_pagado: record.monto_pagado || 0,
      monto_neto: record.monto_neto || 0,
      costo_unitario: record.costo_unitario || 0,
      ganancia: record.ganancia || 0,
      metodo_pago: record.metodo_pago || 'efectivo',
      tipo_tarjeta: record.tipo_tarjeta,
      meses_sin_intereses: record.meses_sin_intereses || 0,
      tasa_comision: record.tasa_comision || 0,
      comision_monto: record.comision_monto || 0,
      notas: record.notas || '',
      created_at: record.created_at,
      updated_at: record.updated_at,
      // Include names for dashboard display
      patient_name: record.patients ? 
        `${record.patients.nombre || ''} ${record.patients.apellido || ''}`.trim() : 
        'Sin paciente',
      treatment_name: record.treatments?.nombre || 'Sin tratamiento'
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in records/with-names GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}