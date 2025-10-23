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

    // Try to get Supabase access token from cookies
    // Supabase stores the token in a cookie with the project ref
    const cookies = request.cookies.getAll();
    for (const cookie of cookies) {
      // Look for cookies that match Supabase pattern: sb-<project-ref>-auth-token
      if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
        try {
          const authData = JSON.parse(cookie.value);
          if (authData && authData.access_token) {
            return { success: true, token: authData.access_token };
          }
        } catch (e) {
          // Try next cookie if JSON parse fails
          continue;
        }
      }
    }

    // Fallback: try old token cookie
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
