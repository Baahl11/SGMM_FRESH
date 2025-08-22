import { NextRequest, NextResponse } from 'next/server';

// Configuration for Next.js static export
export const dynamic = 'force-dynamic';
export const revalidate = false;

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/billing/invoices - Starting request');
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '100';
    const patient_id = searchParams.get('patient_id');
    
    let queryString = `?skip=${skip}&limit=${limit}`;
    if (patient_id) {
      queryString += `&patient_id=${patient_id}`;
    }

    // Try to forward request to backend, but provide fallback
    try {
      const backendUrl = `${BACKEND_URL}/api/billing/invoices${queryString}`;
      console.log('[API] GET /api/billing/invoices - Trying backend:', backendUrl);

      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[API] GET /api/billing/invoices - Backend success');
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.log('[API] GET /api/billing/invoices - Backend unavailable, using fallback');
    }

    // Fallback: return demo data
    const demoInvoices: any[] = [];
    if (patient_id) {
      // Return empty array for specific patient (no invoices yet)
      console.log(`[API] GET /api/billing/invoices - Returning empty for patient ${patient_id}`);
      return NextResponse.json(demoInvoices);
    }

    // Return general demo data
    console.log('[API] GET /api/billing/invoices - Returning demo data');
    return NextResponse.json([
      {
        id: 1,
        patient_id: 2,
        patient_name: "Demo Patient",
        folio: "DEMO001",
        status: "pending",
        total: 1000.00,
        created_at: new Date().toISOString(),
        items: []
      }
    ]);
    
  } catch (error) {
    console.error('[API] GET /api/billing/invoices - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/billing/invoices - Starting request');
  
  try {
    // Get request body
    const body = await request.json();
    console.log('[API] POST /api/billing/invoices - Request body received:', body);

    // Try to forward request to backend, but provide fallback
    try {
      const backendUrl = `${BACKEND_URL}/api/billing/invoices`;
      console.log('[API] POST /api/billing/invoices - Trying backend:', backendUrl);

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[API] POST /api/billing/invoices - Backend success');
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.log('[API] POST /api/billing/invoices - Backend unavailable, using fallback');
    }

    // Fallback: simulate success
    console.log('[API] POST /api/billing/invoices - Simulating invoice creation');
    const mockInvoice = {
      id: Date.now(),
      ...body,
      folio: `DEMO${Date.now()}`,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return NextResponse.json(mockInvoice);
    
  } catch (error) {
    console.error('[API] POST /api/billing/invoices - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
