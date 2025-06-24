import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    return NextResponse.json({
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      allCookies: cookieStore.getAll().map(cookie => ({
        name: cookie.name,
        hasValue: !!cookie.value
      }))
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error checking cookies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
