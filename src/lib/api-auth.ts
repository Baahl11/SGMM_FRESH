import { NextRequest } from 'next/server';

export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token && token.trim() !== '') {
        return { success: true, token };
      }
    }

    // Try to get token from cookies
    const tokenFromCookie = request.cookies.get('token')?.value;
    if (tokenFromCookie && tokenFromCookie.trim() !== '') {
      return { success: true, token: tokenFromCookie };
    }

    return { success: false, error: 'No authentication token provided' };
  } catch (error) {
    console.error('Error in authenticateRequest:', error);
    return { success: false, error: 'Authentication error' };
  }
}
