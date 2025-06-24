import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, itemId: string } }
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
    const itemId = params.itemId;
    
    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/treatments/${treatmentId}/inventory/${itemId}`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Backend error deleting treatment ${treatmentId} inventory item ${itemId}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to delete treatment inventory item', details: errorText },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error deleting treatment inventory item:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
