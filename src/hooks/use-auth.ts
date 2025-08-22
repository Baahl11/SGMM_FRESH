import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthService from '../lib/auth-service';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  google_id?: string;
  created_via_oauth: boolean;
}

export function useAuth() {
  console.log('🔧 USE AUTH - Hook inicializando');
  
  // ⚡ HARD-CODE BYPASS TEMPORAL PARA PRODUCCIÓN
  const initialAuthState = true; // FORZAR BYPASS = true
  console.log('🔧 USE AUTH - Initial auth state (HARD-CODED):', initialAuthState);
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuthState);
  const [isLoading, setIsLoading] = useState<boolean>(!initialAuthState); // Si bypass=true, no loading
  const [userEmail, setUserEmail] = useState<string | null>(initialAuthState ? 'demo@sgmm.pro' : null);
  const [user, setUser] = useState<User | null>(initialAuthState ? {
    id: 'demo-user',
    email: 'demo@sgmm.pro',
    name: 'Usuario Demo',
    created_via_oauth: false
  } : null);
  const router = useRouter();

  console.log('🔧 USE AUTH - Estados iniciales:', { isAuthenticated, isLoading });

  const checkAuth = async () => {
    console.log('🔧 CHECK AUTH - Función iniciando');
    
    // Timeout de seguridad para evitar loading infinito
    const timeoutId = setTimeout(() => {
      console.log('⚠️ CHECK AUTH - TIMEOUT reached, setting not authenticated');
      setIsAuthenticated(false);
      setIsLoading(false);
    }, 2500); // 2.5 segundos máximo
    
    try {
      setIsLoading(true);
      console.log('🔧 CHECK AUTH - setIsLoading(true) llamado');
      
      // 🚀 BYPASS COMPLETO PARA DEMO/TAURI - HARD-CODED
      console.log('🔧 CHECK AUTH - Verificando bypass (HARD-CODED)');
      // FORZAR BYPASS = TRUE en producción
      if (true) {
        console.log('🚀 BYPASS AUTH - Skipping all auth checks (HARD-CODED)');
        clearTimeout(timeoutId);
        setIsAuthenticated(true);
        setUserEmail("demo@sgmm.pro");
        setUser({ 
          id: "demo-user", 
          email: "demo@sgmm.pro", 
          name: "Usuario Demo", 
          created_via_oauth: false 
        });
        setIsLoading(false);
        return;
      }
      
      // Fast-path: verificar si hay token primero
      const token = localStorage.getItem('auth_token');
      const userInfo = localStorage.getItem('user_info');
      
      console.log('🔍 use-auth checkAuth - Raw token:', token);
      console.log('🔍 use-auth checkAuth - Raw userInfo:', userInfo);
      
      if (!token) {
        console.log('[SGMM][useAuth] no token -> UNAUTH');
        clearTimeout(timeoutId);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      console.log('[SGMM][useAuth] token found -> validating…');
      
      const authenticated = AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setUserEmail(AuthService.getUserEmail());
      
      if (token && userInfo) {
        try {
          const userData = JSON.parse(userInfo!); // Fix: Non-null assertion
          console.log('🔍 use-auth checkAuth - Parsed userData:', userData);
          setUser(userData);
          setIsAuthenticated(true);
          
          // Extraer email del OAuth info
          const oauthEmail = userData.oauth_info?.email || userData.email;
          setUserEmail(oauthEmail);
          
          console.log('✅ OAuth user loaded from localStorage:', userData);
          
          // Auto-configurar email de mensajería para usuarios OAuth
          if (oauthEmail) {
            autoConfigureMessaging(oauthEmail, userData.oauth_info?.name || userData.name);
          }
        } catch (error) {
          console.error('Error parsing user info:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_info');
        }
      } else if (authenticated) {
        // Usuario tradicional sin OAuth
        console.log('🔍 use-auth checkAuth - Traditional user, no OAuth');
        setUser(null);
      } else {
        console.log('🔍 use-auth checkAuth - No authentication found');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      clearTimeout(timeoutId);
      setIsAuthenticated(false);
      setIsLoading(false);
    } finally {
      // Asegurar que always limpiamos timeout y loading
      clearTimeout(timeoutId);
      console.log('🔧 CHECK AUTH - Finally block, setting isLoading to false');
      setIsLoading(false);
    }
  };
  
  // BACKUP 1: useEffect tradicional
  useEffect(() => {
    console.log('🔧 USE AUTH - useEffect ejecutándose, llamando checkAuth');
    checkAuth();
  }, []);
  
  // BACKUP 2: timer como última opción
  useEffect(() => {
    const backupTimer = setTimeout(() => {
      console.log('🔧 USE AUTH - BACKUP timer ejecutándose');
      if (isLoading) {
        console.log('⚠️ USE AUTH - Still loading after 1s, forcing checkAuth');
        checkAuth();
      }
    }, 1000);
    
    return () => clearTimeout(backupTimer);
  }, [isLoading]);

  const login = async (email: string, password: string) => {
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

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // Logout OAuth - limpiar tokens locales
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('oauth_state');
      }
      
      // Logout tradicional
      AuthService.logout();
      
      setIsAuthenticated(false);
      setUserEmail(null);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Forzar logout local
      AuthService.logout();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('oauth_state');
      setIsAuthenticated(false);
      setUserEmail(null);
      setUser(null);
      router.push('/login');
    }
  };

  // Función para auto-configurar el email de mensajería
  const autoConfigureMessaging = async (email: string, name?: string) => {
    try {
      console.log('🔄 Configurando email de mensajería automáticamente:', email);
      
      const response = await fetch('/api/messaging/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || 'Usuario',
          auto_configured: true
        }),
      });

      if (response.ok) {
        console.log('✅ Email de mensajería configurado automáticamente');
      } else {
        console.warn('⚠️ Error al configurar email de mensajería:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error configurando email de mensajería:', error);
    }
  };

  return {
    isAuthenticated,
    isLoading,
    userEmail,
    user,
    login,
    register,
    logout,
    checkAuth,
  };
}

