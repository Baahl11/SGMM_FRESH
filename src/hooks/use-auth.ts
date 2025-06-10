import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthService from '@/lib/auth-service';

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
  };

  const login = async (email: string, password: string) => {
    try {
      const success = await AuthService.login(email, password);
      if (success) {
        setIsAuthenticated(true);
        setUserEmail(AuthService.getUserEmail());
        router.push('/patients');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
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
    logout,
  };
}
