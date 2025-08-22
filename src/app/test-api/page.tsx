'use client';

import { useState } from 'react';

export default function TestRecordsAPI() {
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCreateRecord = async () => {
    try {
      addResult('Iniciando prueba de creación de registro...');
      
      const testRecord = {
        patient_id: 1, // Asume que existe un paciente con ID 1
        treatment_id: 1, // Asume que existe un tratamiento con ID 1
        fecha: new Date().toISOString().split('T')[0], // Fecha actual
        monto_pagado: 1000,
        monto_neto: 900,
        costo_unitario: 500,
        ganancia: 400,
        metodo_pago: 'efectivo',
        notas: 'Prueba de API de registros'
      };

      const response = await fetch('/api/proxy/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRecord),
      });

      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Registro creado exitosamente: ID ${data.id}`);
        return data.id;
      } else {
        const errorData = await response.json();
        addResult(`❌ Error ${response.status}: ${JSON.stringify(errorData)}`);
        return null;
      }
    } catch (error) {
      addResult(`❌ Error en prueba: ${error}`);
      return null;
    }
  };

  const testGetRecords = async () => {
    try {
      addResult('Iniciando prueba de obtención de registros...');
      
      const response = await fetch('/api/proxy/records');
      
      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Registros obtenidos: ${data.length} registros`);
      } else {
        const errorData = await response.json();
        addResult(`❌ Error ${response.status}: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      addResult(`❌ Error en prueba: ${error}`);
    }
  };

  const testInventoryHealth = async () => {
    try {
      addResult('Iniciando prueba de estado de inventario...');
      
      const response = await fetch('/api/proxy/inventory/health');
      
      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Estado de inventario obtenido: ${JSON.stringify(data)}`);
      } else {
        const errorData = await response.json();
        addResult(`❌ Error ${response.status}: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      addResult(`❌ Error en prueba: ${error}`);
    }
  };

  const runAllTests = async () => {
    setResults([]);
    await testGetRecords();
    await testInventoryHealth();
    await testCreateRecord();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pruebas de API</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={runAllTests}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Ejecutar todas las pruebas
        </button>
        
        <button
          onClick={testGetRecords}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
        >
          Probar GET Records
        </button>
        
        <button
          onClick={testCreateRecord}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 ml-2"
        >
          Probar POST Record
        </button>
        
        <button
          onClick={testInventoryHealth}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 ml-2"
        >
          Probar Inventario
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
