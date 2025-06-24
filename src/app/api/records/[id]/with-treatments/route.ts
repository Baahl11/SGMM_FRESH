import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[API] GET /api/records/[id]/with-treatments - Starting request');
  
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      console.log('[API] GET /api/records/[id]/with-treatments - Authentication failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const token = authResult.token;
    console.log('[API] GET /api/records/[id]/with-treatments - Authentication successful');

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/records/${params.id}/with-treatments/`;
    console.log('[API] GET /api/records/[id]/with-treatments - Forwarding to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[API] GET /api/records/[id]/with-treatments - Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GET /api/records/[id]/with-treatments - Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch record with treatments from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API] GET /api/records/[id]/with-treatments - Success');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] GET /api/records/[id]/with-treatments - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[API] PUT /api/records/[id]/with-treatments - Starting request');
  
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      console.log('[API] PUT /api/records/[id]/with-treatments - Authentication failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const token = authResult.token;
    console.log('[API] PUT /api/records/[id]/with-treatments - Authentication successful');

    // Get request body
    const body = await request.json();
    console.log('[API] PUT /api/records/[id]/with-treatments - Request body:', body);

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/records/${params.id}/with-treatments/`;
    console.log('[API] PUT /api/records/[id]/with-treatments - Forwarding to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[API] PUT /api/records/[id]/with-treatments - Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] PUT /api/records/[id]/with-treatments - Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update record with treatments' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API] PUT /api/records/[id]/with-treatments - Success');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] PUT /api/records/[id]/with-treatments - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
