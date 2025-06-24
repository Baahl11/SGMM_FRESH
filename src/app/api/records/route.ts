import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getAuthHeaders(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authentication token found');
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '100';
    const patient_id = searchParams.get('patient_id');
      const queryParams = new URLSearchParams({
      skip,
      limit,
      ...(patient_id && { patient_id })
    });

    const headers = await getAuthHeaders(request);
    const response = await fetch(`${API_BASE}/records/?${queryParams}`, {
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching records:', error);
    if (error instanceof Error && error.message === 'No authentication token found') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Error al obtener registros' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== REAL RECORD CREATION ===');
    console.log('POST /api/records called');
    
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    let headers;
    try {
      headers = await getAuthHeaders(request);
      console.log('Auth headers prepared successfully');
    } catch (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }
    
    // Crear el registro en el backend
    console.log('Calling backend:', `${API_BASE}/records/`);
    console.log('Headers for backend call:', { ...headers, Authorization: headers.Authorization.substring(0, 30) + '...' });
    
    let response;
    try {
      response = await fetch(`${API_BASE}/records/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      console.log('Backend response status:', response.status);
      console.log('Backend response ok:', response.ok);
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      throw new Error(`Failed to connect to backend: ${fetchError}`);
    }
      if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }
      
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If can't parse JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      console.error('Backend error:', errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );    }
      console.log('Backend response OK, parsing JSON...');
    const recordData = await response.json();
    console.log('Record created successfully:', recordData);
    
    // Procesar consumo de inventario si el tratamiento tiene items configurados
    const treatmentId = body.tratamiento_id;
    if (treatmentId) {
      try {
        console.log('Fetching treatment data for inventory processing:', treatmentId);
        const treatmentResponse = await fetch(`${API_BASE}/treatments/${treatmentId}`, {
          headers
        });
        
        if (treatmentResponse.ok) {
          const treatmentData = await treatmentResponse.json();
          
          if (treatmentData?.inventory_items?.length > 0) {
            console.log('Processing inventory consumption for treatment:', treatmentId);
            
            for (const item of treatmentData.inventory_items) {
              try {
                const adjustResponse = await fetch(`${API_BASE}/inventory/${item.inventory_item_id}/adjust`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    quantity_change: -item.quantity_per_treatment,
                    movement_type: 'consumed',
                    notes: `Consumido por tratamiento: ${treatmentData.nombre} (Registro #${recordData.id})`
                  })
                });
                
                if (!adjustResponse.ok) {
                  console.error(`Error adjusting inventory for item ${item.inventory_item_id}:`, await adjustResponse.text());
                } else {
                  console.log(`Successfully consumed ${item.quantity_per_treatment} units of item ${item.inventory_item_id}`);
                }
              } catch (error) {
                console.error(`Error processing inventory item ${item.inventory_item_id}:`, error);
              }
            }
          } else {
            console.log('No inventory items configured for this treatment');
          }
        } else {
          console.error('Failed to fetch treatment data:', treatmentResponse.status);
        }
      } catch (error) {
        console.error('Error processing inventory consumption:', error);
        // No fallar la creación del registro por errores de inventario
      }
    }
    
    return NextResponse.json(recordData);} catch (error) {
    console.error('Error creating record:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Error message:', error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.message === 'No authentication token found') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear registro';
    return NextResponse.json(
      { error: errorMessage, details: String(error) },
      { status: 500 }
    );
  }
}
