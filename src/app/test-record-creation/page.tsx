'use client';

import { useState } from 'react';
import AuthService from '@/lib/auth-service';

export default function TestRecordCreation() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRecordCreation = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const token = AuthService.getToken();
      console.log('Token available:', !!token);
      
      const testData = {
        patient_id: 1,
        treatment_id: 1,
        fecha: new Date().toISOString().split('T')[0],
        monto_pagado: 1000,
        monto_neto: 900,
        costo_unitario: 500,
        ganancia: 400,
        metodo_pago: 'efectivo',
        notas: 'Prueba de creación de registro con consumo automático de inventario'
      };
      
      console.log('Sending test data:', testData);
      
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('Request headers:', headers);
      
      const response = await fetch('/api/test-record', {
        method: 'POST',
        headers,
        body: JSON.stringify(testData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: responseData,
        raw: responseText
      });
      
    } catch (error) {
      console.error('Test error:', error);
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Prueba de Creación de Registro</h1>
      
      <div className="mb-6">
        <button
          onClick={testRecordCreation}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Probar Creación de Registro'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Resultado:</h3>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-yellow-100 rounded">
        <h3 className="font-bold mb-2">Instrucciones:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Haz clic en "Probar Creación de Registro"</li>
          <li>Revisa la consola del navegador (F12) para ver los logs detallados</li>
          <li>Revisa el terminal del backend para ver si aparecen los logs del servidor</li>
          <li>Si funciona aquí pero no en la ruta real, sabremos que el problema está específicamente en /api/records</li>
        </ol>
      </div>
    </div>
  );
}
