'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertTriangle, Package, Minus } from 'lucide-react';
import AuthService from '@/lib/auth-service';

interface InventoryItem {
  id: number;
  nombre: string;
  stock_actual: number;
  unidad_medida: string;
}

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

export default function InventoryConsumptionTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [inventoryBefore, setInventoryBefore] = useState<InventoryItem[]>([]);
  const [inventoryAfter, setInventoryAfter] = useState<InventoryItem[]>([]);

  const updateResult = (name: string, status: TestResult['status'], message: string, data?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, status, message, data } : r);
      } else {
        return [...prev, { name, status, message, data }];
      }
    });
  };

  const fetchInventory = async (): Promise<InventoryItem[]> => {
    const token = AuthService.getToken();
    const response = await fetch('/api/inventory', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching inventory: ${response.status}`);
    }
    
    return await response.json();
  };

  const createTestRecord = async () => {
    const token = AuthService.getToken();
    const testData = {
      patient_id: 1,
      treatment_id: 1, // Botox treatment with inventory
      fecha: new Date().toISOString().split('T')[0],
      monto_pagado: 1000,
      monto_neto: 900,
      costo_unitario: 500,
      ganancia: 400,
      metodo_pago: 'efectivo',
      notas: 'Prueba de consumo automático de inventario'
    };

    const response = await fetch('/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error creating record: ${response.status} - ${errorText}`);
    }

    return await response.json();
  };

  const runInventoryConsumptionTest = async () => {
    setIsRunning(true);
    setResults([]);
    setInventoryBefore([]);
    setInventoryAfter([]);

    try {
      // Step 1: Get inventory state before
      updateResult('inventory-before', 'pending', 'Obteniendo estado inicial del inventario...');
      const beforeInventory = await fetchInventory();
      setInventoryBefore(beforeInventory);
      updateResult('inventory-before', 'success', `Inventario inicial obtenido: ${beforeInventory.length} items`, beforeInventory);

      // Step 2: Create record
      updateResult('create-record', 'pending', 'Creando registro de tratamiento...');
      const recordResult = await createTestRecord();
      updateResult('create-record', 'success', `Registro creado exitosamente: ID ${recordResult.id}`, recordResult);

      // Step 3: Wait a moment for processing
      updateResult('wait-processing', 'pending', 'Esperando procesamiento de inventario...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateResult('wait-processing', 'success', 'Tiempo de espera completado');

      // Step 4: Get inventory state after
      updateResult('inventory-after', 'pending', 'Obteniendo estado final del inventario...');
      const afterInventory = await fetchInventory();
      setInventoryAfter(afterInventory);
      updateResult('inventory-after', 'success', `Inventario final obtenido: ${afterInventory.length} items`, afterInventory);

      // Step 5: Compare inventory changes
      updateResult('compare-inventory', 'pending', 'Comparando cambios en el inventario...');
      const changes = [];
      
      for (const beforeItem of beforeInventory) {
        const afterItem = afterInventory.find(item => item.id === beforeItem.id);
        if (afterItem && afterItem.stock_actual !== beforeItem.stock_actual) {
          const change = afterItem.stock_actual - beforeItem.stock_actual;
          changes.push({
            item: beforeItem.nombre,
            before: beforeItem.stock_actual,
            after: afterItem.stock_actual,
            change: change,
            unit: beforeItem.unidad_medida
          });
        }
      }

      if (changes.length > 0) {
        updateResult('compare-inventory', 'success', `Se detectaron ${changes.length} cambios en el inventario`, changes);
      } else {
        updateResult('compare-inventory', 'warning', 'No se detectaron cambios en el inventario. Posible problema en el consumo automático.');
      }

    } catch (error) {
      updateResult('test-error', 'error', error instanceof Error ? error.message : 'Error desconocido');
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'pending':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prueba de Consumo Automático de Inventario
        </h1>
        <p className="text-gray-600">
          Verifica que el inventario se consume automáticamente al crear registros de tratamiento.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Controles de Prueba</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runInventoryConsumptionTest} 
            disabled={isRunning}
            className="mb-4"
          >
            {isRunning ? 'Ejecutando Prueba...' : 'Ejecutar Prueba de Consumo de Inventario'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resultados de la Prueba</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 border rounded-lg flex items-start justify-between ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <h3 className="font-medium">{result.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                      
                      {result.name === 'compare-inventory' && result.data && (
                        <div className="mt-2 space-y-1">
                          <h4 className="font-medium text-sm">Cambios detectados:</h4>
                          {result.data.map((change: any, idx: number) => (
                            <div key={idx} className="flex items-center space-x-2 text-sm">
                              <Minus className="h-4 w-4 text-red-500" />
                              <span>
                                <strong>{change.item}:</strong> {change.before} → {change.after} {change.unit} 
                                <span className={change.change < 0 ? 'text-red-600' : 'text-green-600'}>
                                  ({change.change > 0 ? '+' : ''}{change.change})
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(inventoryBefore.length > 0 || inventoryAfter.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inventoryBefore.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventario Antes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inventoryBefore.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{item.nombre}</span>
                      <span className="text-sm">
                        {item.stock_actual} {item.unidad_medida}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {inventoryAfter.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventario Después</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inventoryAfter.map((item) => {
                    const beforeItem = inventoryBefore.find(b => b.id === item.id);
                    const hasChanged = beforeItem && beforeItem.stock_actual !== item.stock_actual;
                    
                    return (
                      <div key={item.id} className={`flex justify-between items-center p-2 rounded ${
                        hasChanged ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                      }`}>
                        <span className="font-medium">{item.nombre}</span>
                        <span className="text-sm">
                          {item.stock_actual} {item.unidad_medida}
                          {hasChanged && (
                            <span className="ml-2 text-red-600 font-medium">
                              ({item.stock_actual - beforeItem!.stock_actual})
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
