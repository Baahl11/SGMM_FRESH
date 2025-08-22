import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const backendResponse = await fetch(`${BACKEND_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: errorText || 'Registration failed' }, 
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Auth register proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
