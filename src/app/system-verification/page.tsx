'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
}

export default function SystemVerificationPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (name: string, status: TestResult['status'], message: string, duration?: number) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, status, message, duration } : r);
      } else {
        return [...prev, { name, status, message, duration }];
      }
    });
  };

  const runTest = async (name: string, testFn: () => Promise<void>) => {
    const start = Date.now();
    updateResult(name, 'pending', 'Ejecutando...');
    try {
      await testFn();
      const duration = Date.now() - start;
      updateResult(name, 'success', 'Completado exitosamente', duration);
    } catch (error) {
      const duration = Date.now() - start;
      updateResult(name, 'error', error instanceof Error ? error.message : 'Error desconocido', duration);
    }
  };

  const verifyAuthentication = async () => {
    const response = await fetch('/api/test-auth');
    if (!response.ok) {
      throw new Error(`Error de autenticación: ${response.status}`);
    }
    const data = await response.json();
    if (!data.authenticated) {
      throw new Error('Usuario no autenticado');
    }
  };

  const verifyInventory = async () => {
    const response = await fetch('/api/inventory');
    if (!response.ok) {
      throw new Error(`Error obteniendo inventario: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Respuesta de inventario inválida');
    }
  };

  const verifyInventoryHealth = async () => {
    const response = await fetch('/api/inventory/health');
    if (!response.ok) {
      throw new Error(`Error obteniendo salud del inventario: ${response.status}`);
    }
    const data = await response.json();
    if (typeof data.status !== 'string') {
      throw new Error('Respuesta de salud del inventario inválida');
    }
  };

  const verifyTreatments = async () => {
    const response = await fetch('/api/treatments');
    if (!response.ok) {
      throw new Error(`Error obteniendo tratamientos: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Respuesta de tratamientos inválida');
    }
  };

  const verifyPatients = async () => {
    const response = await fetch('/api/patients');
    if (!response.ok) {
      throw new Error(`Error obteniendo pacientes: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Respuesta de pacientes inválida');
    }
  };

  const verifyRecordCreation = async () => {
    // Primero obtener un paciente y tratamiento de prueba
    const patientsResponse = await fetch('/api/patients');
    if (!patientsResponse.ok) {
      throw new Error('No se pueden obtener pacientes para prueba');
    }
    const patients = await patientsResponse.json();
    if (patients.length === 0) {
      throw new Error('No hay pacientes disponibles para prueba');
    }

    const treatmentsResponse = await fetch('/api/treatments');
    if (!treatmentsResponse.ok) {
      throw new Error('No se pueden obtener tratamientos para prueba');
    }
    const treatments = await treatmentsResponse.json();
    if (treatments.length === 0) {
      throw new Error('No hay tratamientos disponibles para prueba');
    }

    // Crear registro de prueba
    const testRecord = {
      paciente_id: patients[0].id,
      tratamiento_id: treatments[0].id,
      notas: 'Registro de prueba del sistema de verificación',
      costo_final: 100.0
    };

    const response = await fetch('/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRecord),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error creando registro: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.id) {
      throw new Error('Registro creado pero sin ID válido');
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    const tests = [
      { name: 'Autenticación', fn: verifyAuthentication },
      { name: 'Inventario - Lista', fn: verifyInventory },
      { name: 'Inventario - Salud', fn: verifyInventoryHealth },
      { name: 'Tratamientos', fn: verifyTreatments },
      { name: 'Pacientes', fn: verifyPatients },
      { name: 'Creación de Registros', fn: verifyRecordCreation },
    ];

    for (const test of tests) {
      await runTest(test.name, test.fn);
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
          Verificación del Sistema SGMM
        </h1>
        <p className="text-gray-600">
          Ejecuta una verificación completa de todos los componentes del sistema.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Controles de Verificación</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="mb-4"
          >
            {isRunning ? 'Ejecutando Verificación...' : 'Ejecutar Verificación Completa'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Verificación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 border rounded-lg flex items-center justify-between ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-medium">{result.name}</h3>
                      <p className="text-sm text-gray-600">{result.message}</p>
                    </div>
                  </div>
                  {result.duration && (
                    <span className="text-sm text-gray-500">
                      {result.duration}ms
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
