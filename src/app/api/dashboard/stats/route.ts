import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/dashboard/stats - Starting request');
  
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      console.log('[API] GET /api/dashboard/stats - Authentication failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const token = authResult.token;
    console.log('[API] GET /api/dashboard/stats - Authentication successful');

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/dashboard/stats/`;
    console.log('[API] GET /api/dashboard/stats - Forwarding to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[API] GET /api/dashboard/stats - Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GET /api/dashboard/stats - Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard stats from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API] GET /api/dashboard/stats - Success:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] GET /api/dashboard/stats - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
