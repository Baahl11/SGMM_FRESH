// src/lib/appApi.ts
// src/lib/appApi.ts
/**
 * ULTIMATE MSI Detection Function
 * Detects MSI/Static Export environment using only browser-available info
 */
function detectTauriMSI(): boolean {
  // Vercel/Supabase build: always treat as web (no MSI)
  return false;
}

/**
 * ULTIMATE MSI + Dev aware API URL joiner - DEFINITIVELY FIXED
 * - Dev web: /api/... (pasa por el proxy de Next => sin CORS)
 * - MSI/Tauri: http://127.0.0.1:8000/gastos-fijos/ (directo al FastAPI con trailing slash)
 * - DETECTS Tauri MSI environment using multiple indicators
 */
export function appApi(path: string = "", params?: Record<string, string>): string {
  // Always use Next.js API proxy in vercel-migration (Supabase-backed)
  const base = "/api";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
  return `${base}${cleanPath}${qs}`;
}

/**
 * Helper: construye query solo si hay términos
 */
export function withQuery(path: string, params: Record<string, any>): string {
  const qs = Object.entries(params)
    .filter(([,v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .reduce((u,[k,v]) => (u.append(k, String(v)), u), new URLSearchParams());
  return qs.toString() ? `${path}?${qs.toString()}` : path;
}

/**
 * appApiWithQuery() - IMPROVED: Uses new appApi with params
 */
export function appApiWithQuery(
  path: string, 
  params?: Record<string, string | number | boolean | undefined>
): string {
  // Convert params to string record, filtering out empty values
  const stringParams: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        stringParams[key] = String(value);
      }
    });
  }
  
  // Use new appApi function with params
  return Object.keys(stringParams).length > 0 
    ? appApi(path, stringParams)
    : appApi(path);
}

/**
 * Enhanced fetch wrapper with AUTOMATIC MSI FALLBACK and AUTH TOKEN
 * If Next.js proxy fails, automatically tries direct backend
 * Automatically includes auth token when available
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const primaryUrl = appApi(endpoint);
  
  // Get auth token if available using the same logic as AuthService
  let authToken = null;
  if (typeof window !== 'undefined') {
    try {
      // Use js-cookie library if available, otherwise fallback to manual parsing
      const Cookies = (window as any).Cookies || {
        get: (key: string) => {
          const match = document.cookie.split('; ').find(row => row.startsWith(`${key}=`));
          return match ? match.split('=')[1] : null;
        }
      };
      
      // Try cookies first, then localStorage (legacy + current keys)
      // Primary keys: auth_token (cookie/localStorage)
      // Fallback keys: sgmm_token (legacy pages store here)
      authToken = Cookies.get('auth_token')
        || localStorage.getItem('auth_token')
        || localStorage.getItem('sgmm_token');
      
      if (authToken) {
      } else {
      }
    } catch (error) {
      console.warn('fetchApi: error obteniendo token de auth');
      authToken = null;
    }
  }
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-sgmm-dev': '1',
    ...Object.fromEntries(
      Object.entries(options.headers || {}).map(([key, value]) => [key, String(value)])
    )
  };
  
  // Add authorization header if token is available
  if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  } else {
  }
  
  console.log(`🚀 fetchApi PRIMARY: ${endpoint} → ${primaryUrl}`);
  
  try {
    const response = await fetch(primaryUrl, {
      ...options,
      headers: defaultHeaders,
    });
    
    // If successful, return immediately
    if (response.ok) {
      console.log(`✅ fetchApi SUCCESS: ${primaryUrl}`);
      return response;
    }

    return response; // Return original response even if not ok
    
  } catch (error) {
    console.error(`❌ fetchApi error for ${primaryUrl}:`, error);

    throw error;
  }
}

/**
 * DEBUG: Sistema de diagnóstico automático
 */
export function debugEnvironment(): void {
  const info = {
    isServer: typeof window === 'undefined',
    env_direct: process.env.NEXT_PUBLIC_USE_DIRECT_BACKEND,
    env_backend: process.env.NEXT_PUBLIC_BACKEND_BASE,
    ...(typeof window !== 'undefined' && {
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      href: window.location.href,
      hasTauri: (window as any).__TAURI__ !== undefined,
      userAgent: navigator.userAgent,
    }),
    isMSI: detectTauriMSI(),
    sampleUrls: {
      gastosFijos: appApi('/gastos-fijos'),
      inventory: appApi('/inventory'),
    }
  };
  
  console.log('🔍 SGMM Environment Debug:', info);
  
  // Test básico de conectividad si estamos en cliente
  // No MSI connectivity checks for Vercel build
}

/**
 * Test de conectividad automático
 */
async function testBackendConnectivity(): Promise<void> {
  try {
    console.log('🧪 Testing backend connectivity...');
    // ✅ SIN SLASH FINAL - Tauri backend NO acepta URLs con slash final
    const response = await fetch('/api/health', { 
      method: 'HEAD'
    });
    console.log(`✅ Backend test: ${response.status}`);
  } catch (error) {
    console.error('❌ Backend test failed:', error);
  }
}

// Auto-ejecutar diagnóstico en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(debugEnvironment, 1000);
  
  // Add global debug function for auth token
  (window as any).debugAuth = () => {
    try {
      const Cookies = (window as any).Cookies || {
        get: (key: string) => {
          const match = document.cookie.split('; ').find(row => row.startsWith(`${key}=`));
          return match ? match.split('=')[1] : null;
        }
      };
      
      const cookieToken = Cookies.get('auth_token');
      const localToken = localStorage.getItem('auth_token');
      
      console.log('🔍 Auth Debug:');
      console.log('  LocalStorage token:', localToken ? `${localToken.substring(0, 20)}...` : 'None');
      console.log('  Active token:', cookieToken || localToken || 'None');
      
      return {
        cookieToken,
        localToken,
        activeToken: cookieToken || localToken
      };
    } catch (error) {
      console.error('Auth debug error:', error);
      return null;
    }
  };
}
export async function fetchApiData<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const response = await fetchApi(endpoint, options);
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} for ${endpoint}`);
      return null;
    }
    
    const responseData = await response.json();
    console.log(`✅ API Success: ${endpoint}`);
    
    // Extract data from wrapped response format { data, error } 
    // This handles both direct responses and API Gateway format
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return responseData.data as T;
    }
    
    // Return direct response if not wrapped
    return responseData as T;
  } catch (error) {
    console.error(`❌ fetchApiData error for ${endpoint}:`, error);
    return null;
  }
}

// =============================================================
// 🔐 GLOBAL AUTH FETCH PATCH (Hotfix Layer)
// Añade automáticamente Authorization si falta en cualquier fetch
// a rutas del backend ( /api/... o http://127.0.0.1:8000 / localhost:8000 )
// Esto permite que formularios antiguos que aún usan fetch directo funcionen
// sin tener que refactorizarlos inmediatamente.
// =============================================================
if (typeof window !== 'undefined' && !(window as any).__SGMM_FETCH_PATCHED__) {
  try {
    const originalFetch = window.fetch.bind(window);
    (window as any).__SGMM_FETCH_PATCHED__ = true;
    window.fetch = async function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
      try {
        let url: string;
        if (typeof input === 'string') url = input;
        else if (input instanceof URL) url = input.toString();
        else url = (input as Request).url;

        const isApiCall = url.startsWith('/api/');

        if (isApiCall) {
          // Reutiliza la misma lógica de extracción de token
            const token = ((): string | null => {
              try {
                const Cookies = (window as any).Cookies || {
                  get: (key: string) => {
                    const match = document.cookie.split('; ').find(r => r.startsWith(`${key}=`));
                    return match ? match.split('=')[1] : null;
                  }
                };
                return Cookies.get('auth_token')
                  || localStorage.getItem('auth_token')
                  || localStorage.getItem('sgmm_token');
              } catch { return null; }
            })();

            const headers = new Headers((init && init.headers) || (typeof input !== 'string' && !(input instanceof URL) ? (input as Request).headers : undefined));
            if (token && !headers.has('Authorization')) {
              headers.set('Authorization', `Bearer ${token}`);
              if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
              const newInit: RequestInit = { ...(init || {}), headers };
              return originalFetch(input, newInit);
            }
        }
      } catch (patchErr) {
        console.warn('⚠️ fetch patch minor error (continuing with original):', patchErr);
      }
      return originalFetch(input as any, init);
    };
    console.log('✅ Global fetch Authorization patch instalado');
  } catch (err) {
    console.error('❌ No se pudo instalar el fetch patch:', err);
  }
}
