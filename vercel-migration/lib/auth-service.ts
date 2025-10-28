import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface DecodedToken {
  sub: string;  // email
  exp: number;
}

class AuthService {
  private static TOKEN_KEY = "auth_token";
  static async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const responseData: LoginResponse = await response.json();
      // Store token in both localStorage and cookies
      localStorage.setItem(this.TOKEN_KEY, responseData.access_token);
      Cookies.set(this.TOKEN_KEY, responseData.access_token, {
        expires: 1, // 1 day
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      });
      
      // Debug: verify token was stored
      console.log("Token stored successfully:", !!this.getToken());
      console.log("User authenticated:", this.isAuthenticated());
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }

  static async register(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          message: errorData.detail || "Registration failed" 
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      return { 
        success: false, 
        message: "Error de conexión. Intente nuevamente." 
      };
    }
  }

  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    Cookies.remove(this.TOKEN_KEY);
    window.location.href = "/login";
  }

  static getToken(): string | null {
    // Fallback a legacy key sgmm_token y migración silenciosa
    try {
      const cookieToken = Cookies.get(this.TOKEN_KEY);
      const localToken = typeof window !== 'undefined' ? localStorage.getItem(this.TOKEN_KEY) : null;
      let token = cookieToken || localToken;
      if (!token && typeof window !== 'undefined') {
        const legacy = localStorage.getItem('sgmm_token');
        if (legacy) {
          // Migrar a la clave nueva sin perder compatibilidad
            localStorage.setItem(this.TOKEN_KEY, legacy);
            Cookies.set(this.TOKEN_KEY, legacy, {
              expires: 1,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict'
            });
            console.log('🔄 Migrated legacy sgmm_token → auth_token');
            token = legacy;
        }
      }
      return token || null;
    } catch (e) {
      console.warn('AuthService.getToken error:', e);
      return null;
    }
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  }
  static getUserEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.sub;
    } catch {
      return null;
    }
  }
}

export default AuthService;

// Helper function for authenticated API calls
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = AuthService.getToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
