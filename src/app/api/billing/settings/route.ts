import { NextRequest, NextResponse } from 'next/server';

// Configuration for Next.js static export
export const dynamic = 'force-dynamic';
export const revalidate = false;

export async function GET(request: NextRequest) {
  try {
    // Temporal: Devolver configuración mock sin backend
    return NextResponse.json({
      id: 1,
      patient_id: null,
      rfc: "XAXX010101000",
      razon_social: "Consultorio Médico Demo",
      domicilio_fiscal: "Calle Demo #123, Col. Centro, CP 12345",
      regimen_fiscal: "612",
      uso_cfdi: "G03",
      forma_pago: "01",
      metodo_pago: "PUE",
      activo: true
    });
  } catch (error) {
    console.error('[API] GET /api/billing/settings - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Temporal: Simular guardado exitoso
    return NextResponse.json({
      ...body,
      id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] POST /api/billing/settings - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Temporal: Simular actualización exitosa
    return NextResponse.json({
      ...body,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] PUT /api/billing/settings - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Temporal: Simular actualización parcial exitosa
    return NextResponse.json({
      ...body,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] PATCH /api/billing/settings - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
