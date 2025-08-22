// API Route estática para /api/inventory
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    
    console.log('🔥 /api/inventory - search:', search);
    
    // Llamada directa al backend FastAPI (SIN /api prefix - FastAPI usa /inventory/items)
    const backendUrl = `http://127.0.0.1:8000/inventory/items${search ? `?search=${encodeURIComponent(search)}` : ''}`;
    console.log('🔥 /api/inventory - fetching:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: { 
        'accept': 'application/json',
        'x-sgmm-dev': '1' // bypass header
      }
    });
    
    const body = await response.text();
    console.log('🔥 /api/inventory - status:', response.status, 'body length:', body.length);
    
    return new Response(body, { 
      status: response.status, 
      headers: { 
        'content-type': response.headers.get('content-type') ?? 'application/json',
        'x-sgmm-source': 'static-api-route'
      } 
    });
  } catch (error) {
    console.error('❌ /api/inventory error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    console.log('🔥 /api/inventory POST - body length:', body.length);
    
    const response = await fetch('http://127.0.0.1:8000/inventory/items', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-sgmm-dev': '1'
      },
      body
    });
    
    const responseBody = await response.text();
    console.log('🔥 /api/inventory POST - status:', response.status);
    
    return new Response(responseBody, { 
      status: response.status, 
      headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' } 
    });
  } catch (error) {
    console.error('❌ /api/inventory POST error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
