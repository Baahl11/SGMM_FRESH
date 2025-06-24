import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthService from '../lib/auth-service';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const authenticated = AuthService.isAuthenticated();
    setIsAuthenticated(authenticated);
    setUserEmail(AuthService.getUserEmail());
    setIsLoading(false);
  };  const login = async (email: string, password: string) => {
    try {
      const success = await AuthService.login(email, password);
      if (success) {
        setIsAuthenticated(true);
        setUserEmail(AuthService.getUserEmail());
        // Small delay to ensure cookies are set before redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const result = await AuthService.register(email, password);
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: "Error durante el registro. Intente nuevamente." 
      };
    }
  };

  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUserEmail(null);
    router.push('/login');
  };

  return {
    isAuthenticated,
    isLoading,
    userEmail,
    login,
    register,
    logout,
  };
}

