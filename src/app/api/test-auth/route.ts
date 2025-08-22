import { NextRequest, NextResponse } from 'next/server';

// Force static generation for production build
export const dynamic = "force-static";

async function getAuthHeaders(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authentication token found');
  }
  
  const token = authHeader.substring(7);
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('Auth test called');
    const headers = await getAuthHeaders(request);
    console.log('Token extracted successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Authentication working correctly',
      hasToken: true
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      hasToken: false
    }, { status: 401 });
  }
}
