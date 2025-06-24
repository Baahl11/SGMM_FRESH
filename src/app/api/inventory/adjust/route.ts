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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = await getAuthHeaders(request);
    
    const response = await fetch(`${API_BASE}/inventory/adjust`, {
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
    console.error('Error adjusting inventory:', error);
    if (error instanceof Error && error.message === 'No authentication token found') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Error al ajustar inventario' },
      { status: 500 }
    );
  }
}
