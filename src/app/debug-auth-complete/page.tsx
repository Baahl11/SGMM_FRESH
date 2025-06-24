'use client';

import { useEffect, useState } from 'react';
import AuthService from '@/lib/auth-service';

export default function DebugAuthComplete() {
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [serverCookies, setServerCookies] = useState<any>(null);
  const [apiTest, setApiTest] = useState<any>(null);

  useEffect(() => {
    // Client-side token check
    setClientToken(AuthService.getToken());
    setIsAuthenticated(AuthService.isAuthenticated());
    setUserEmail(AuthService.getUserEmail());
    
    // Server-side cookies check
    checkServerCookies();
  }, []);

  const checkServerCookies = async () => {
    try {
      const response = await fetch('/api/debug/cookies');
      const data = await response.json();
      setServerCookies(data);
    } catch (error) {
      setServerCookies({ error: error?.toString() });
    }
  };
  const testAuthAPI = async () => {
    try {
      const token = AuthService.getToken();
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/test-auth', {
        headers,
      });
      const result = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      };
      setApiTest(result);
    } catch (error) {
      setApiTest({ error: error?.toString() });
    }
  };

  const testInventoryAPI = async () => {
    try {
      const token = AuthService.getToken();
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/inventory', {
        headers,
      });
      const result = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      };
      setApiTest(result);
    } catch (error) {
      setApiTest({ error: error?.toString() });
    }
  };

  const forceLogin = async () => {
    const email = prompt('Email:');
    const password = prompt('Password:');
    
    if (email && password) {
      try {
        const success = await AuthService.login(email, password);
        if (success) {
          alert('Login exitoso! Recargando...');
          window.location.reload();
        } else {
          alert('Error en login');
        }
      } catch (error) {
        alert(`Error: ${error}`);
      }
    }
  };

  const clearAuth = () => {
    AuthService.logout();
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug de Autenticación Completo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client-side info */}
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="text-lg font-bold mb-3">Cliente (Frontend)</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Token:</strong> {clientToken ? `${clientToken.substring(0, 30)}...` : 'No token'}</div>
            <div><strong>Autenticado:</strong> {isAuthenticated ? 'Sí' : 'No'}</div>
            <div><strong>Email:</strong> {userEmail || 'No email'}</div>
            <div><strong>localStorage token:</strong> {localStorage.getItem('auth_token') ? 'Presente' : 'Ausente'}</div>
          </div>
        </div>

        {/* Server-side info */}
        <div className="bg-green-50 p-4 rounded">
          <h2 className="text-lg font-bold mb-3">Servidor (Cookies)</h2>
          {serverCookies ? (
            <div className="space-y-2 text-sm">
              <div><strong>Tiene token:</strong> {serverCookies.hasToken ? 'Sí' : 'No'}</div>
              <div><strong>Token preview:</strong> {serverCookies.tokenPreview || 'No token'}</div>
              <div><strong>Cookies:</strong> {JSON.stringify(serverCookies.allCookies)}</div>
              {serverCookies.error && <div className="text-red-500"><strong>Error:</strong> {serverCookies.error}</div>}
            </div>
          ) : (
            <div>Cargando...</div>
          )}
        </div>

        {/* API Test */}        <div className="bg-yellow-50 p-4 rounded md:col-span-2">
          <h2 className="text-lg font-bold mb-3">Prueba de API</h2>
          <div className="space-x-2 mb-3">
            <button
              onClick={testAuthAPI}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Probar Auth Simple
            </button>
            <button
              onClick={testInventoryAPI}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Probar /api/inventory
            </button>
          </div>
          
          {apiTest && (
            <div className="bg-white p-3 rounded border text-sm">
              <div><strong>Status:</strong> {apiTest.status}</div>
              <div><strong>OK:</strong> {apiTest.ok ? 'Sí' : 'No'}</div>
              <div><strong>Data:</strong> <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(apiTest.data, null, 2)}</pre></div>
              {apiTest.error && <div className="text-red-500"><strong>Error:</strong> {apiTest.error}</div>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="md:col-span-2 space-x-4">
          <button
            onClick={forceLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Forzar Login
          </button>
          
          <button
            onClick={clearAuth}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Limpiar Autenticación
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
}
