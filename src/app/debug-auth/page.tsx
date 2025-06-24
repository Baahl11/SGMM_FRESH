'use client';

import { useEffect, useState } from 'react';
import AuthService from '@/lib/auth-service';

export default function DebugAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setToken(AuthService.getToken());
    setIsAuthenticated(AuthService.isAuthenticated());
    setUserEmail(AuthService.getUserEmail());
  }, []);

  const testInventoryCall = async () => {
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();
      console.log('Inventory API response:', data);
      alert(`Inventory API: ${response.status} - ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('Error calling inventory API:', error);
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug de Autenticación</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'No token'}
        </div>
        <div>
          <strong>Autenticado:</strong> {isAuthenticated ? 'Sí' : 'No'}
        </div>
        <div>
          <strong>Email:</strong> {userEmail || 'No email'}
        </div>
        
        <button
          onClick={testInventoryCall}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Probar llamada a Inventario
        </button>
      </div>
    </div>
  );
}
