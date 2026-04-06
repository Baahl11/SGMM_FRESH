import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('records')
      .select(`
        *,
        patients!inner(id, nombre, apellido),
        treatments(id, nombre)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching record:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // Transform data to include patient and treatment names
    const transformedData = {
      ...data,
      patient_name: data.patients ? 
        `${data.patients.nombre || ''} ${data.patients.apellido || ''}`.trim() : 
        'Sin paciente',
      treatment_name: data.treatments?.nombre || 'Sin tratamiento'
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in records GET by ID:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('records')
      .update({
        patient_id: body.patient_id,
        treatment_id: body.treatment_id,
        fecha: body.fecha,
        monto_pagado: body.monto_pagado,
        monto_neto: body.monto_neto,
        costo_unitario: body.costo_unitario,
        ganancia: body.ganancia,
        metodo_pago: body.metodo_pago,
        tipo_tarjeta: body.tipo_tarjeta,
        meses_sin_intereses: body.meses_sin_intereses,
        tasa_comision: body.tasa_comision,
        comision_monto: body.comision_monto,
        notas: body.notas,
        nombre_promocion: body.nombre_promocion || null,
        tiene_multiples_tratamientos: body.tiene_multiples_tratamientos || false,
        pendiente_facturar: body.pendiente_facturar !== undefined ? body.pendiente_facturar : false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        patients!inner(id, nombre, apellido),
        treatments(id, nombre)
      `)
      .single()

    if (error) {
      console.error('Error updating record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in records PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Record deleted successfully' })
  } catch (error) {
    console.error('Error in records DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}