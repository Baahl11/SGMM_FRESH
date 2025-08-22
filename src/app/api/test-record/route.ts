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

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST RECORD CREATION ===');
    console.log('POST /api/test-record called');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const headers = await getAuthHeaders(request);
    console.log('Auth headers prepared successfully');
    console.log('Authorization header:', headers.Authorization.substring(0, 30) + '...');
    
    // Test simple response without backend call
    const mockRecord = {
      id: Math.floor(Math.random() * 1000),
      ...body,
      created_at: new Date().toISOString()
    };
    
    console.log('Returning mock record:', mockRecord);
    return NextResponse.json(mockRecord);
    
  } catch (error) {
    console.error('=== ERROR IN TEST RECORD ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
