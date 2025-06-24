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
    console.log('🔍 Health endpoint: Starting request');
    
    // Get auth headers
    let headers;
    try {
      headers = await getAuthHeaders(request);
      console.log('🔍 Health endpoint: Auth headers obtained');
    } catch (authError) {
      console.error('🔍 Health endpoint: Auth error:', authError);
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const backendUrl = `${API_BASE}/inventory/health`;
    console.log('🔍 Health endpoint: Calling backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers,
    });
    
    console.log('🔍 Health endpoint: Backend response status:', response.status);
    console.log('🔍 Health endpoint: Backend response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 Health endpoint: Backend error:', errorText);
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('🔍 Health endpoint: Backend data received:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('🔍 Health endpoint: Error fetching inventory health:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado del inventario', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
