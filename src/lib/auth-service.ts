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
      formData.append("username", email);
      formData.append("password", password);

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

      const data: LoginResponse = await response.json();
      // Store token in both localStorage and cookies
      localStorage.setItem(this.TOKEN_KEY, data.access_token);
      Cookies.set(this.TOKEN_KEY, data.access_token, {
        expires: 1, // 1 day
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
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
