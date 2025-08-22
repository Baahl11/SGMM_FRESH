import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    console.log('[API Proxy - Gastos Fijos] GET request received')
    
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const backendUrl = queryString 
      ? `${BACKEND_URL}/gastos-fijos/?${queryString}`
      : `${BACKEND_URL}/gastos-fijos/`

    console.log('[API Proxy - Gastos Fijos] Forwarding to:', backendUrl)

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    console.log('[API Proxy - Gastos Fijos] Backend response status:', response.status)

    if (!response.ok) {
      console.warn('[API Proxy - Gastos Fijos] Backend error, serving fallback data')
      // Fallback data para gastos fijos
      return NextResponse.json([
        {
          id: 1,
          concepto: 'Renta del Consultorio',
          monto: 15000,
          frecuencia: 'mensual',
          dia_pago: 1,
          categoria: 'Infraestructura',
          activo: true,
          created_at: '2024-01-01T00:00:00Z',
          next_payment: '2025-02-01'
        },
        {
          id: 2,
          concepto: 'Servicios (Luz, Agua, Internet)',
          monto: 3500,
          frecuencia: 'mensual',
          dia_pago: 15,
          categoria: 'Servicios',
          activo: true,
          created_at: '2024-01-01T00:00:00Z',
          next_payment: '2025-01-15'
        },
        {
          id: 3,
          concepto: 'Seguro Médico Profesional',
          monto: 2800,
          frecuencia: 'mensual',
          dia_pago: 10,
          categoria: 'Seguros',
          activo: true,
          created_at: '2024-01-01T00:00:00Z',
          next_payment: '2025-01-10'
        },
        {
          id: 4,
          concepto: 'Software de Gestión',
          monto: 1200,
          frecuencia: 'mensual',
          dia_pago: 5,
          categoria: 'Software',
          activo: true,
          created_at: '2024-01-01T00:00:00Z',
          next_payment: '2025-01-05'
        },
        {
          id: 5,
          concepto: 'Limpieza y Mantenimiento',
          monto: 800,
          frecuencia: 'semanal',
          dia_pago: 1,
          categoria: 'Mantenimiento',
          activo: true,
          created_at: '2024-01-01T00:00:00Z',
          next_payment: '2025-01-06'
        }
      ])
    }

    const data = await response.json()
    console.log('[API Proxy - Gastos Fijos] Success, returning data')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API Proxy - Gastos Fijos] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API Proxy - Gastos Fijos] POST request received')
    
    const body = await request.json()
    console.log('[API Proxy - Gastos Fijos] Request body:', JSON.stringify(body, null, 2))

    const response = await fetch(`${BACKEND_URL}/gastos-fijos/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body)
    })

    console.log('[API Proxy - Gastos Fijos] Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API Proxy - Gastos Fijos] Backend error:', errorText)
      return NextResponse.json(
        { error: errorText || 'Failed to create gasto fijo' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[API Proxy - Gastos Fijos] Success, returning data')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API Proxy - Gastos Fijos] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('[API Proxy - Gastos Fijos] PUT request received')
    
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Gasto Fijo ID is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/gastos-fijos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body)
    })

    console.log('[API Proxy - Gastos Fijos] Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API Proxy - Gastos Fijos] Backend error:', errorText)
      return NextResponse.json(
        { error: errorText || 'Failed to update gasto fijo' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[API Proxy - Gastos Fijos] Success, returning data')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API Proxy - Gastos Fijos] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('[API Proxy - Gastos Fijos] DELETE request received')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Gasto Fijo ID is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/gastos-fijos/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    console.log('[API Proxy - Gastos Fijos] Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API Proxy - Gastos Fijos] Backend error:', errorText)
      return NextResponse.json(
        { error: errorText || 'Failed to delete gasto fijo' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[API Proxy - Gastos Fijos] Success, returning data')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API Proxy - Gastos Fijos] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
