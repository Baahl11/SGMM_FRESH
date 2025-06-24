import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug endpoint: Starting request (no auth)');
    
    const backendUrl = `${API_BASE}/debug/inventory/health`;
    console.log('🔍 Debug endpoint: Calling backend:', backendUrl);
    
    const response = await fetch(backendUrl);
    
    console.log('🔍 Debug endpoint: Backend response status:', response.status);
    console.log('🔍 Debug endpoint: Backend response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 Debug endpoint: Backend error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('🔍 Debug endpoint: Backend data received:', data);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('🔍 Debug endpoint: Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado del inventario', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
