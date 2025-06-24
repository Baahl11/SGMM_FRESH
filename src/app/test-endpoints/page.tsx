'use client';

import { useState } from 'react';
import AuthService from '@/lib/auth-service';

export default function TestEndpoints() {
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = AuthService.getToken();
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, {
      ...options,
      headers,
    });
  };

  const testEndpoint = async (name: string, url: string, method: string = 'GET', body?: any) => {
    try {
      addResult(`Testing ${name}...`);
      
      const options: RequestInit = { method };
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await authenticatedFetch(url, options);
      
      if (response.ok) {
        const data = await response.json();
        addResult(`✅ ${name}: OK (${response.status})`);
        console.log(`${name} data:`, data);
      } else {
        const errorData = await response.json().catch(() => response.statusText);
        addResult(`❌ ${name}: ${response.status} - ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      addResult(`❌ ${name}: Error - ${error}`);
    }
  };

  const runAllTests = async () => {
    setResults([]);
    
    // Test basic endpoints
    await testEndpoint('Inventory Health', '/api/inventory/health');
    await testEndpoint('Inventory List', '/api/inventory');
    await testEndpoint('Inventory Movements', '/api/inventory/movements');
    
    // Test records
    await testEndpoint('Records List', '/api/records');
    
    // Test creating a simple inventory item
    await testEndpoint('Create Inventory Item', '/api/inventory', 'POST', {
      name: 'Test Item',
      description: 'Item de prueba',
      current_stock: 10,
      min_stock: 5,
      unit: 'unidad',
      cost_per_unit: 100
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pruebas de Endpoints</h1>
      
      <div className="mb-6">
        <button
          onClick={runAllTests}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Ejecutar todas las pruebas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => testEndpoint('Inventory Health', '/api/inventory/health')}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Test Health
        </button>
        
        <button
          onClick={() => testEndpoint('Inventory List', '/api/inventory')}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Test Inventory
        </button>
        
        <button
          onClick={() => testEndpoint('Records List', '/api/records')}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          Test Records
        </button>
        
        <button
          onClick={() => testEndpoint('Movements', '/api/inventory/movements')}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
        >
          Test Movements
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
        <h3 className="font-bold mb-2">Resultados:</h3>
        {results.length === 0 ? (
          <p className="text-gray-500">No hay resultados aún. Ejecuta una prueba.</p>
        ) : (
          <ul className="space-y-1">
            {results.map((result, index) => (
              <li key={index} className="text-sm font-mono">
                {result}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
