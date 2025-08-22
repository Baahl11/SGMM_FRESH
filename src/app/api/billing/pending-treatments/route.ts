import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  try {
    // Intentar conectar al backend primero
    const backendResponse = await fetch(`${BACKEND_URL}/api/billing/pending-treatments/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.log('[API] Backend not available for pending treatments, using fallback data');
  }

  // Fallback data si el backend no responde
  return NextResponse.json({
    data: [
      { 
        id: 1, 
        patient_id: 1, 
        treatment_id: 1,
        patient_name: 'Juan Pérez',
        treatment: 'Limpieza Dental', 
        amount: 600, 
        status: 'pending',
        fecha_programada: '2025-08-21'
      },
      { 
        id: 2, 
        patient_id: 2, 
        treatment_id: 2,
        patient_name: 'María García',
        treatment: 'Consulta Especializada', 
        amount: 1200, 
        status: 'pending',
        fecha_programada: '2025-08-22'
      }
    ]
  });
}
