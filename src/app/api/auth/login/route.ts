import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/auth/login - Starting request');
    try {
    // Get request body
    const body = await request.json();
    console.log('[API] POST /api/auth/login - Request body:', { email: body.email });    // Transform email to username for backend compatibility
    const backendBody = {
      username: body.email || body.username,
      password: body.password
    };

    // Create form data for backend
    const formData = new URLSearchParams();
    formData.append('username', backendBody.username);
    formData.append('password', backendBody.password);

    // Forward request to backend
    const backendUrl = `${BACKEND_URL}/auth/login`;
    console.log('[API] POST /api/auth/login - Forwarding to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    console.log('[API] POST /api/auth/login - Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] POST /api/auth/login - Backend error:', errorText);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API] POST /api/auth/login - Success');
    
    // Create response with the token data
    const responseData = NextResponse.json(data);
    
    // Set the token as an httpOnly cookie for security
    if (data.access_token) {
      responseData.cookies.set('token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }
    
    return responseData;
  } catch (error) {
    console.error('[API] POST /api/auth/login - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}