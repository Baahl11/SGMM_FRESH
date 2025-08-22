// 🛡️ HELPER PARA CONSTRUIR URLs DE API CORRECTAMENTE
// Garantiza que todas las URLs vayan por /api/proxy/ y sean absolutas

export function apiPath(path: string, params?: Record<string, string | number | undefined>) {
  // Normalizar path: asegurar que empiece con /
  const p = path.startsWith('/') ? path : '/' + path;
  
  // Asegurar que termine con / para consistencia
  const withSlash = p.endsWith('/') ? p : p + '/';
  
  // Construir URL completa con proxy
  const u = new URL('/api/proxy' + withSlash, window.location.origin);
  
  // Añadir parámetros de query si existen
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && String(v).trim() !== '') {
      u.searchParams.set(k, String(v));
    }
  });
  
  return u.pathname + u.search;
}

// 🔥 EJEMPLOS DE USO:
// apiPath('inventory') → '/api/proxy/inventory/'
// apiPath('inventory', { search: 'test' }) → '/api/proxy/inventory/?search=test'
// apiPath('inventory/movements') → '/api/proxy/inventory/movements/'
