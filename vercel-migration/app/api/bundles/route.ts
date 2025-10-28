import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔥 API: Fetching bundles (temporary empty response)');

    // TEMPORAL: Return empty array until tables are created
    const emptyBundles: any[] = [];

    console.log('✅ Bundles fetched (empty for now):', emptyBundles.length);
    return NextResponse.json(emptyBundles);

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 API: Creating new bundle (temporary)');
    
    const body = await request.json();
    const { nombre, descripcion, precio_total, tratamientos } = body;

    if (!nombre || !precio_total || !tratamientos?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // TEMPORAL: Return mock success until database is ready
    const mockBundle = {
      id: `temp-${Date.now()}`,
      nombre,
      descripcion,
      precio_total,
      created_at: new Date().toISOString()
    };

    console.log('✅ Bundle created successfully (mock):', mockBundle.id);
    return NextResponse.json(mockBundle, { status: 201 });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}