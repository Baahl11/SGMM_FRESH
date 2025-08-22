'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

interface OAuthStatus {
  configured: boolean;
  provider: string;
  client_id: string;
  redirect_uri: string;
  status: string;
}

interface GoogleOAuthButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  size = 'md'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar estado OAuth al cargar el componente
  useEffect(() => {
    checkOAuthStatus();
  }, []);

  const checkOAuthStatus = async () => {
    try {
      const response = await fetch('/api/oauth/status/');
      if (response.ok) {
        const status = await response.json();
        setOauthStatus(status);
        console.log('🔐 OAuth Status:', status);
      } else {
        throw new Error('Failed to check OAuth status');
      }
    } catch (err) {
      const errorMsg = 'OAuth no está configurado correctamente';
      setError(errorMsg);
      console.error('❌ OAuth Status Error:', err);
      onError?.(errorMsg);
    }
  };

  const handleGoogleLogin = async () => {
    if (!oauthStatus?.configured) {
      const errorMsg = 'OAuth no está configurado';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Iniciando Google OAuth flow...');
      
      // Llamar al endpoint de inicialización OAuth
      const initResponse = await fetch('/api/oauth/init/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!initResponse.ok) {
        throw new Error('Failed to initialize OAuth');
      }

      const { auth_url, state } = await initResponse.json();
      console.log('🔗 Auth URL generated:', auth_url);
      console.log('🔑 State received from backend:', state);

      // Guardar state en localStorage para verificación posterior
      localStorage.setItem('oauth_state', state);
      console.log('💾 State saved to localStorage:', state);
      console.log('🔍 Verifying saved state:', localStorage.getItem('oauth_state'));

      // Redirigir a Google OAuth
      window.location.href = auth_url;

    } catch (err) {
      console.error('❌ Google OAuth Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error en autenticación';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsLoading(false);
    }
  };

  // Tamaños de botón
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-lg'
  };

  // Si hay error en la configuración, mostrar botón deshabilitado
  if (error && !oauthStatus?.configured) {
    return (
      <Button
        disabled
        variant="outline"
        className={`${sizeClasses[size]} ${className}`}
      >
        <Icons.google className="mr-2 h-4 w-4" />
        OAuth no configurado
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGoogleLogin}
        disabled={isLoading || !oauthStatus?.configured}
        variant="outline"
        className={`${sizeClasses[size]} ${className}`}
      >
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <Icons.google className="mr-2 h-4 w-4" />
            Continuar con Google
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export default GoogleOAuthButton;