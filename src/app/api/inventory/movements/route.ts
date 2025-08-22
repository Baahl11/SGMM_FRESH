// API Route estática para /api/inventory/movements
export async function GET() {
  try {
    console.log('🔥 /api/inventory/movements - fetching from backend');
    
    const response = await fetch('http://127.0.0.1:8000/inventory/movements', {
      headers: { 
        'accept': 'application/json',
        'x-sgmm-dev': '1'
      }
    });
    
    const body = await response.text();
    console.log('🔥 /api/inventory/movements - status:', response.status, 'body length:', body.length);
    
    return new Response(body, { 
      status: response.status, 
      headers: { 
        'content-type': response.headers.get('content-type') ?? 'application/json',
        'x-sgmm-source': 'static-api-route'
      } 
    });
  } catch (error) {
    console.error('❌ /api/inventory/movements error:', error);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }
}
