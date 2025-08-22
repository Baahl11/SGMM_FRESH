'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function OAuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkLocalStorage = () => {
    const info = {
      oauth_state: localStorage.getItem('oauth_state'),
      auth_token: localStorage.getItem('auth_token'),
      user_info: localStorage.getItem('user_info'),
      all_keys: Object.keys(localStorage),
    };
    
    console.log('🔍 localStorage Debug Info:', info);
    setDebugInfo(info);
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    console.log('🧹 localStorage cleared');
    setDebugInfo(null);
  };

  const testOAuthInit = async () => {
    try {
      console.log('🧪 Testing OAuth init...');
      
      const response = await fetch('/api/oauth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize OAuth');
      }

      const data = await response.json();
      console.log('🧪 OAuth init response:', data);
      console.log('🧪 OAuth init - auth_url:', data.auth_url);
      console.log('🧪 OAuth init - state:', data.state);
      
      if (data.state) {
        localStorage.setItem('oauth_state', data.state);
        console.log('🧪 State saved:', data.state);
        console.log('🧪 State verified:', localStorage.getItem('oauth_state'));
      } else {
        console.log('🧪 ❌ No state in response!');
      }

      setDebugInfo({
        ...debugInfo,
        test_response: data,
        test_state: data.state,
        saved_state: localStorage.getItem('oauth_state')
      });
      
    } catch (error) {
      console.error('🧪 OAuth init test failed:', error);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">OAuth Debug Panel</h3>
      
      <div className="space-y-2 mb-4">
        <Button onClick={checkLocalStorage} variant="outline" size="sm">
          Check localStorage
        </Button>
        <Button onClick={clearLocalStorage} variant="outline" size="sm">
          Clear localStorage
        </Button>
        <Button onClick={testOAuthInit} variant="outline" size="sm">
          Test OAuth Init
        </Button>
      </div>

      {debugInfo && (
        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="font-medium mb-2">Debug Info:</h4>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
