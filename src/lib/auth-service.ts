import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

const API_URL = "http://localhost:8000";

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
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
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
      const response = await fetch(`${API_URL}/register`, {
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
    return Cookies.get(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
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
