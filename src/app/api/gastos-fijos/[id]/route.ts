import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[API] GET /api/gastos-fijos/[id] - Starting request for ID:', params.id);
  
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      console.log('[API] GET /api/gastos-fijos/[id] - Authentication failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const token = authResult.token;
    console.log('[API] GET /api/gastos-fijos/[id] - Authentication successful');

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/gastos-fijos/${params.id}`;
    console.log('[API] GET /api/gastos-fijos/[id] - Forwarding to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[API] GET /api/gastos-fijos/[id] - Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GET /api/gastos-fijos/[id] - Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch gasto fijo from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API] GET /api/gastos-fijos/[id] - Success');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] GET /api/gastos-fijos/[id] - Error:', error);
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
  console.log('[API] PUT /api/gastos-fijos/[id] - Starting request for ID:', params.id);
  
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      console.log('[API] PUT /api/gastos-fijos/[id] - Authentication failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const token = authResult.token;
    console.log('[API] PUT /api/gastos-fijos/[id] - Authentication successful');

    // Get request body
    const body = await request.json();
    console.log('[API] PUT /api/gastos-fijos/[id] - Request body:', body);

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/gastos-fijos/${params.id}`;
    console.log('[API] PUT /api/gastos-fijos/[id] - Forwarding to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[API] PUT /api/gastos-fijos/[id] - Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] PUT /api/gastos-fijos/[id] - Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update gasto fijo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API] PUT /api/gastos-fijos/[id] - Success');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] PUT /api/gastos-fijos/[id] - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[API] DELETE /api/gastos-fijos/[id] - Starting request for ID:', params.id);
  
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      console.log('[API] DELETE /api/gastos-fijos/[id] - Authentication failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const token = authResult.token;
    console.log('[API] DELETE /api/gastos-fijos/[id] - Authentication successful');

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/gastos-fijos/${params.id}`;
    console.log('[API] DELETE /api/gastos-fijos/[id] - Forwarding to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[API] DELETE /api/gastos-fijos/[id] - Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] DELETE /api/gastos-fijos/[id] - Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to delete gasto fijo' },
        { status: response.status }
      );
    }

    console.log('[API] DELETE /api/gastos-fijos/[id] - Success');
    
    return NextResponse.json({ message: 'Gasto fijo deleted successfully' });
  } catch (error) {
    console.error('[API] DELETE /api/gastos-fijos/[id] - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
