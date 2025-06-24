'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AuthService from '@/lib/auth-service';

export default function InventoryDebugPage() {
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testInventoryEndpoints = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = AuthService.getToken();
      console.log('Using token:', token ? `${token.substring(0, 30)}...` : 'No token');
      
      if (!token) {
        throw new Error('No auth token available');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('=== Testing /api/inventory ===');
      const inventoryResponse = await fetch('/api/inventory', { headers });
      console.log('Inventory response status:', inventoryResponse.status);
      console.log('Inventory response ok:', inventoryResponse.ok);

      if (inventoryResponse.ok) {
        const inventory = await inventoryResponse.json();
        console.log('Inventory data:', inventory);
        setInventoryData(inventory);
      } else {
        const inventoryError = await inventoryResponse.text();
        console.error('Inventory error:', inventoryError);
        throw new Error(`Inventory endpoint error: ${inventoryResponse.status} - ${inventoryError}`);
      }

      console.log('=== Testing /api/inventory/health ===');
      const healthResponse = await fetch('/api/inventory/health', { headers });
      console.log('Health response status:', healthResponse.status);
      console.log('Health response ok:', healthResponse.ok);

      if (healthResponse.ok) {
        const health = await healthResponse.json();
        console.log('Health data:', health);
        setHealthData(health);
      } else {
        const healthError = await healthResponse.text();
        console.error('Health error:', healthError);
        throw new Error(`Health endpoint error: ${healthResponse.status} - ${healthError}`);
      }

      console.log('=== Testing backend directly ===');
      const backendHealthResponse = await fetch('http://localhost:8000/inventory/health', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Backend health response status:', backendHealthResponse.status);
      
      if (backendHealthResponse.ok) {
        const backendHealth = await backendHealthResponse.json();
        console.log('Backend health data:', backendHealth);
      } else {
        const backendError = await backendHealthResponse.text();
        console.error('Backend health error:', backendError);
      }

    } catch (err) {
      console.error('Error testing endpoints:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug de Inventario</h1>
      
      <div className="mb-6">
        <Button 
          onClick={testInventoryEndpoints}
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Probando...' : 'Probar Endpoints de Inventario'}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos de Inventario (/api/inventory)</CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryData ? (
              <div className="space-y-2">
                <p><strong>Total items:</strong> {Array.isArray(inventoryData) ? inventoryData.length : 'No es array'}</p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(inventoryData, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500">No hay datos</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salud del Inventario (/api/inventory/health)</CardTitle>
          </CardHeader>
          <CardContent>
            {healthData ? (
              <div className="space-y-2">
                <p><strong>Total items:</strong> {healthData.total_items}</p>
                <p><strong>Estado general:</strong> {healthData.overall_status}</p>
                <p><strong>Stock alto:</strong> {healthData.high_stock}</p>
                <p><strong>Stock medio:</strong> {healthData.medium_stock}</p>
                <p><strong>Stock bajo:</strong> {healthData.low_stock}</p>
                <p><strong>Sin stock:</strong> {healthData.out_of_stock}</p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(healthData, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500">No hay datos</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. Haz clic en "Probar Endpoints de Inventario"</p>
            <p>2. Revisa la consola del navegador (F12) para logs detallados</p>
            <p>3. Los datos deberían aparecer en las tarjetas de arriba</p>
            <p>4. Si hay errores, aparecerán en la sección de error</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
