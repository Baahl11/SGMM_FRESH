'use client';

import { useEffect, useState } from 'react';
import AuthService from '@/lib/auth-service';

export default function AuthTestPage() {
  const [authStatus, setAuthStatus] = useState<any>({});

  useEffect(() => {
    const checkAuth = async () => {
      const token = AuthService.getToken();
      const isAuthenticated = AuthService.isAuthenticated();
      const userEmail = AuthService.getUserEmail();
      
      setAuthStatus({
        hasToken: !!token,
        tokenLength: token?.length || 0,
        isAuthenticated,
        userEmail,
        tokenPreview: token ? token.substring(0, 20) + '...' : null
      });

      // Test API call
      try {
        const response = await fetch('/api/inventory/health');
        const data = await response.json();        setAuthStatus((prev: any) => ({
          ...prev,
          apiTest: {
            status: response.status,
            data
          }
        }));      } catch (error) {
        setAuthStatus((prev: any) => ({
          ...prev,
          apiTest: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Auth Test Page</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(authStatus, null, 2)}
        </pre>
      </div>

      <div className="mt-6">
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh Test
        </button>
      </div>
    </div>
  );
}
