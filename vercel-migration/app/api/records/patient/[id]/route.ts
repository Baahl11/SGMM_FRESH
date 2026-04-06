import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: patientId } = await params

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Build query with joins to get patient and treatment info
    const { data: records, error } = await supabase
      .from('records')
      .select(`
        *,
        patients!inner(id, nombre, apellido),
        treatments(id, nombre)
      `)
      .eq('patient_id', patientId)
      .order('fecha', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) {
      console.error('Error fetching patient records:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to include patient and treatment names
    const transformedData = (records || []).map(record => ({
      ...record,
      patient_name: record.patients ? 
        `${record.patients.nombre || ''} ${record.patients.apellido || ''}`.trim() : 
        'Sin paciente',
      treatment_name: record.treatments?.nombre || 'Sin tratamiento'
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in patient records GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}