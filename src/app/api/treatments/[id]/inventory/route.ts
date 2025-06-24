import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication failed', details: authResult.error },
        { status: 401 }
      );
    }

    const treatmentId = params.id;
    
    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/treatments/${treatmentId}/inventory`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Backend error for treatment ${treatmentId} inventory:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch treatment inventory', details: errorText },
        { status: backendResponse.status }
      );
    }

    const inventoryData = await backendResponse.json();
    return NextResponse.json(inventoryData);

  } catch (error) {
    console.error('Error fetching treatment inventory:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication failed', details: authResult.error },
        { status: 401 }
      );
    }

    const treatmentId = params.id;
    const body = await request.json();
    
    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/treatments/${treatmentId}/inventory`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Backend error adding treatment ${treatmentId} inventory:`, errorText);
      return NextResponse.json(
        { error: 'Failed to add treatment inventory', details: errorText },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error adding treatment inventory:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
