import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication failed', details: authResult.error },
        { status: 401 }
      );
    }

    const patientId = params.id;
      // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/patients/${patientId}`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authResult.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Backend error for patient ${patientId}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch patient', details: errorText },
        { status: backendResponse.status }
      );
    }

    const patientData = await backendResponse.json();
    return NextResponse.json(patientData);

  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication failed', details: authResult.error },
        { status: 401 }
      );
    }

    const patientId = params.id;
    const body = await request.json();
      // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/patients/${patientId}`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authResult.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Backend error updating patient ${patientId}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to update patient', details: errorText },
        { status: backendResponse.status }
      );
    }

    const updatedPatient = await backendResponse.json();
    return NextResponse.json(updatedPatient);

  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication failed', details: authResult.error },
        { status: 401 }
      );
    }

    const patientId = params.id;
      // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/patients/${patientId}`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authResult.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Backend error deleting patient ${patientId}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to delete patient', details: errorText },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
