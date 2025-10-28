// lib/api-interceptor.ts - Legacy FastAPI redirector (DISABLED by default)
// This file previously hijacked all /api/* requests to a local FastAPI backend.
// For Vercel/Supabase, this MUST remain disabled unless explicitly enabled via env.

const ENABLE_LEGACY = process.env.NEXT_PUBLIC_ENABLE_LEGACY_FASTAPI === '1';
const BACKEND_URL = process.env.NEXT_PUBLIC_LEGACY_FASTAPI_URL; // e.g. http://127.0.0.1:8000

if (ENABLE_LEGACY && BACKEND_URL) {
  const BYPASS_HEADERS = {
    'x-sgmm-dev': '1',
    'Content-Type': 'application/json',
  } as const;

  // Override global fetch to intercept API calls
  const originalFetch = global.fetch;

  global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();

    // Redirect all /api/ calls to legacy backend with bypass headers
    if (url.startsWith('/api/')) {
      const backendUrl = url.replace('/api/', `${BACKEND_URL}/`);

      const newInit: RequestInit = {
        ...init,
        headers: {
          ...BYPASS_HEADERS,
          ...(init?.headers || {}),
        },
      };

      console.log(`🔄 [LEGACY FASTAPI ENABLED] ${url} → ${backendUrl}`);
      return originalFetch(backendUrl, newInit);
    }

    // Pass through other requests
    return originalFetch(input, init);
  };
} else {
  // No-op in Vercel/Supabase mode
  // console.log('[api-interceptor] Legacy FastAPI redirector is disabled');
}

export {};
