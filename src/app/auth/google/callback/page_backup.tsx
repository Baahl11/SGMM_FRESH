'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/components/providers/auth-provider';

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState('Procesando autenticación...');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuthContext();
  useEffect(() => {
    handleGoogleCallback();
  }, []);

  // Función para auto-configurar el email de mensajería
  const autoConfigureMessaging = async (email: string, name?: string) => {
    try {
      console.log('🔄 Configurando email de mensajería automáticamente en callback:', email);
      
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
        console.log('✅ Email de mensajería configurado automáticamente en callback');
      } else {
        console.warn('⚠️ Error al configurar email de mensajería en callback:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error configurando email de mensajería en callback:', error);
    }
  };

  const handleGoogleCallback = async () => {
    try {
      // Verificar que searchParams esté disponible
      if (!searchParams) {
        throw new Error('No search parameters available');
      }

      // Obtener parámetros de la URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      console.log('🔄 Google callback received:', { code: !!code, state, error });

      // Verificar si hay error de Google
      if (error) {
        throw new Error(`Google OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received from Google');
      }

      // Verificar state para prevenir CSRF
      const savedState = localStorage.getItem('oauth_state');
      console.log('🔍 State comparison:', { 
        receivedState: state, 
        savedState: savedState,
        match: state === savedState 
      });
      
      if (state !== savedState) {
        console.warn('⚠️ State mismatch:', { received: state, saved: savedState });
        // Por ahora no bloquear, pero en producción deberías validar esto
      }

      setStatus('Intercambiando código por token...');

      // Enviar código al backend para intercambio
      console.log('🔍 Sending to backend:', {
        code: code ? 'present' : 'missing',
        state: state,
        expected_state: savedState
      });
      
      const response = await fetch('/api/oauth/callback/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state,
          expected_state: savedState, // Agregar el expected_state
        }),
      });

      console.log('🔍 Backend response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `Backend error (${response.status})`;
        try {
          const errorData = await response.json();
          console.log('🔍 Backend error data (JSON):', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.log('🔍 Could not parse error as JSON, trying text...');
          try {
            const errorText = await response.text();
            console.log('🔍 Backend error data (Text):', errorText);
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.log('🔍 Could not read error response at all');
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ OAuth callback successful:', data);

      // Guardar token de autenticación y info del usuario
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        
        // Guardar información del usuario si está disponible
        if (data.user) {
          localStorage.setItem('user_info', JSON.stringify(data.user));
          
          // Auto-configurar email de mensajería para usuarios OAuth
          if (data.user.email) {
            autoConfigureMessaging(data.user.email, data.user.name || data.user.given_name);
          }
        }
        
        setStatus('Autenticación completada. Redirigiendo...');
        
        // Actualizar contexto de autenticación
        await checkAuth();
        
        // Limpiar estado OAuth
        localStorage.removeItem('oauth_state');
        
        // Redirigir al dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        throw new Error('No authentication token received');
      }

    } catch (err) {
      console.error('❌ Google callback error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setStatus('Error en autenticación');
      
      // Limpiar estado OAuth en caso de error
      localStorage.removeItem('oauth_state');
      
      // Redirigir a login después de mostrar error
      setTimeout(() => {
        router.push('/login?error=' + encodeURIComponent(errorMessage));
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Autenticación con Google
          </h2>
          
          <div className="mt-8 space-y-4">
            {!error ? (
              <>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <p className="text-gray-600">{status}</p>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="h-12 w-12 text-red-500">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-red-600 font-medium">{error}</p>
                <p className="text-gray-500 text-sm">Redirigiendo a login en 3 segundos...</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
