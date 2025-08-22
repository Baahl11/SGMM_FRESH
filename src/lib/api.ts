export function apiPath(path: string) {
  const p = path.replace(/^\/+/, '');                // sin / inicial
  // SIEMPRE usar el proxy - NO más construcción de URLs directas
  return `/api/proxy/${p}`;
}

export async function apiGet<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(apiPath(path), {
    ...init,
    headers: { 'x-sgmm-dev': '1', ...(init.headers || {}) },
    cache: 'no-store',
  });
  
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`API ${path} no JSON (${ct}): ${text.slice(0,200)}`);
  }
  
  return res.json() as Promise<T>;
}

export async function apiPost<T = any>(path: string, data: any, init: RequestInit = {}): Promise<T> {
  const res = await fetch(apiPath(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-sgmm-dev': '1',
      ...(init.headers || {})
    },
    body: JSON.stringify(data),
    cache: 'no-store',
    ...init,
  });
  
  if (!res.ok) throw new Error(`API POST ${path} -> ${res.status}`);
  
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`API POST ${path} no JSON (${ct}): ${text.slice(0,200)}`);
  }
  
  return res.json() as Promise<T>;
}

// Función helper para arrays seguros - MÁS ROBUSTA
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (value && typeof value === 'object' && 'data' in value) {
    // Si es un objeto con .data, extrae el array
    const data = (value as any).data;
    return Array.isArray(data) ? data as T[] : [];
  }
  if (value && typeof value === 'object' && 'records' in value) {
    // Si es un objeto con .records, extrae el array
    const records = (value as any).records;
    return Array.isArray(records) ? records as T[] : [];
  }
  return [];
}

// Función helper para sort seguro - ULTRA DEFENSIVA
export function safeSort<T>(arr: unknown, compareFn?: (a: T, b: T) => number): T[] {
  const safeArray = asArray<T>(arr);
  if (safeArray.length === 0) return [];
  
  try {
    return safeArray.slice().sort(compareFn);
  } catch (error) {
    console.error('[safeSort] Error sorting array:', error, safeArray);
    return safeArray; // devuelve sin ordenar en caso de error
  }
}
