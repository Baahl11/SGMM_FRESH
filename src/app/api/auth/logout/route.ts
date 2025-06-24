import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/auth/logout - Starting request');
  
  try {
    // Create response to logout user
    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    // Clear the token cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0), // Expire immediately
      path: '/',
    });
    
    console.log('[API] POST /api/auth/logout - Success');
    return response;
  } catch (error) {
    console.error('[API] POST /api/auth/logout - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
