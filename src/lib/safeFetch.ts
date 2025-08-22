import { fetchWithAuth } from './api-service';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; data: T };

export async function safeGet<T>(url: string, fallback: T, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    console.log('🔧 safeGet: Using fetchWithAuth for:', url);
    
    // USAR fetchWithAuth del sistema de API en lugar de fetch directo
    const res = await fetchWithAuth(url, {
      cache: "no-store",
      ...init,
    });
    
    if (!res.ok) {
      console.warn('🔧 safeGet: Response not OK:', res.status, url);
      return { ok: false, data: fallback };
    }
    
    const json = (await res.json()) as T;
    console.log('🔧 safeGet: Success for:', url);
    return { ok: true, data: json ?? fallback };
  } catch (error) {
    console.error('🔧 safeGet: Error for:', url, error);
    return { ok: false, data: fallback };
  }
}

// utilidades seguras para colecciones
export function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function sortBy<T>(arr: T[], key: (x: T) => string | number) {
  const a = asArray<T>(arr).slice();
  a.sort((x, y) => {
    const kx = key(x); const ky = key(y);
    if (kx < ky) return -1;
    if (kx > ky) return 1;
    return 0;
  });
  return a;
}
