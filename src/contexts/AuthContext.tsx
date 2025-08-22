'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  google_id?: string;
  created_via_oauth: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setUser(null);
        return;
      }

      // Verificar token con el backend
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        console.log('✅ User authenticated:', userData.user);
      } else {
        // Token inválido
        localStorage.removeItem('auth_token');
        setUser(null);
        console.log('❌ Invalid token, cleared from storage');
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        console.log('✅ Login successful:', data.user);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      // Este método será llamado después del callback de Google
      // El token ya debería estar en localStorage
      await checkAuth();
    } catch (error) {
      console.error('❌ Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // Notificar al backend sobre el logout
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      localStorage.removeItem('auth_token');
      setUser(null);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Limpiar localStorage incluso si hay error
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
