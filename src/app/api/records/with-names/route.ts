import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/records/with-names - Starting request');
  
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      console.log('[API] GET /api/records/with-names - Authentication failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const token = authResult.token;
    console.log('[API] GET /api/records/with-names - Authentication successful');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/records/with-names/${queryString ? `?${queryString}` : ''}`;
    console.log('[API] GET /api/records/with-names - Forwarding to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[API] GET /api/records/with-names - Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GET /api/records/with-names - Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch records with names from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API] GET /api/records/with-names - Success, records count:', data?.length || 0);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] GET /api/records/with-names - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
