import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('[API Proxy - Gastos Fijos ID] GET request received for ID:', resolvedParams.id)

    const response = await fetch(`${BACKEND_URL}/gastos-fijos/${resolvedParams.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    console.log('[API Proxy - Gastos Fijos ID] Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API Proxy - Gastos Fijos ID] Backend error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch gasto fijo' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[API Proxy - Gastos Fijos ID] Success, returning data')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API Proxy - Gastos Fijos ID] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('[API Proxy - Gastos Fijos ID] PUT request received for ID:', resolvedParams.id)
    
    const body = await request.json()
    console.log('[API Proxy - Gastos Fijos ID] Request body:', JSON.stringify(body, null, 2))

    const response = await fetch(`${BACKEND_URL}/gastos-fijos/${resolvedParams.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body)
    })

    console.log('[API Proxy - Gastos Fijos ID] Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API Proxy - Gastos Fijos ID] Backend error:', errorText)
      return NextResponse.json(
        { error: errorText || 'Failed to update gasto fijo' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[API Proxy - Gastos Fijos ID] Success, returning data')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API Proxy - Gastos Fijos ID] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('[API Proxy - Gastos Fijos ID] DELETE request received for ID:', resolvedParams.id)

    const response = await fetch(`${BACKEND_URL}/gastos-fijos/${resolvedParams.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    console.log('[API Proxy - Gastos Fijos ID] Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API Proxy - Gastos Fijos ID] Backend error:', errorText)
      return NextResponse.json(
        { error: errorText || 'Failed to delete gasto fijo' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[API Proxy - Gastos Fijos ID] Success, returning data')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API Proxy - Gastos Fijos ID] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
