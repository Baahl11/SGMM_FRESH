import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test endpoint: Starting request (bypassing auth)');
    
    const backendUrl = `${API_BASE}/inventory/health`;
    console.log('🔍 Test endpoint: Calling backend:', backendUrl);
    
    // Create a dummy auth header to test the endpoint
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔍 Test endpoint: Backend response status:', response.status);
    console.log('🔍 Test endpoint: Backend response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 Test endpoint: Backend error:', errorText);
      
      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Auth test - this is expected', status: 401 },
          { status: 200 }
        );
      } else if (response.status === 422) {
        return NextResponse.json(
          { success: false, error: 'Route conflict still exists!', status: 422, details: errorText },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: `HTTP ${response.status}`, details: errorText },
        { status: 200 }
      );
    }
    
    const data = await response.json();
    console.log('🔍 Test endpoint: Backend data received:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('🔍 Test endpoint: Error:', error);
    return NextResponse.json(
      { success: false, error: 'Request failed', details: error instanceof Error ? error.message : String(error) },
      { status: 200 }
    );
  }
}
