import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/gastos-fijos - Starting request');
  
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      console.log('[API] GET /api/gastos-fijos - Authentication failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const token = authResult.token;
    console.log('[API] GET /api/gastos-fijos - Authentication successful');

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/gastos-fijos/`;
    console.log('[API] GET /api/gastos-fijos - Forwarding to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[API] GET /api/gastos-fijos - Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GET /api/gastos-fijos - Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch gastos fijos from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API] GET /api/gastos-fijos - Success, gastos fijos count:', data?.length || 0);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] GET /api/gastos-fijos - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/gastos-fijos - Starting request');
  
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      console.log('[API] POST /api/gastos-fijos - Authentication failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const token = authResult.token;
    console.log('[API] POST /api/gastos-fijos - Authentication successful');

    // Get request body
    const body = await request.json();
    console.log('[API] POST /api/gastos-fijos - Request body:', body);

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/gastos-fijos/`;
    console.log('[API] POST /api/gastos-fijos - Forwarding to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[API] POST /api/gastos-fijos - Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] POST /api/gastos-fijos - Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create gasto fijo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API] POST /api/gastos-fijos - Success, created gasto fijo:', data?.id);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] POST /api/gastos-fijos - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
