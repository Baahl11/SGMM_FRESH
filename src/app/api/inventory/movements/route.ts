import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getAuthHeaders(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authentication token found');
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '100';
    const item_id = searchParams.get('item_id');
    
    const queryParams = new URLSearchParams({
      skip,
      limit,
      ...(item_id && { item_id })
    });    const headers = await getAuthHeaders(request);
    const response = await fetch(`${API_BASE}/inventory/movements/?${queryParams}`, {
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    if (error instanceof Error && error.message === 'No authentication token found') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Error al obtener movimientos de inventario' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {  try {
    const body = await request.json();
    const headers = await getAuthHeaders(request);
    
    const response = await fetch(`${API_BASE}/inventory/movements/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, data: ${errorData}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating inventory movement:', error);
    if (error instanceof Error && error.message === 'No authentication token found') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Error al crear movimiento de inventario' },
      { status: 500 }
    );
  }
}
