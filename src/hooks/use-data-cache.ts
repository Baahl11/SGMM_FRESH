"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom hook for managing data cache with invalidation
 * Provides auto-refresh functionality when data changes are detected
 */
export function useDataCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    refreshOnFocus?: boolean;
    refreshOnNavigate?: boolean;
    refreshInterval?: number;
    dependencies?: any[];
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    refreshOnFocus = true,
    refreshOnNavigate = true,
    refreshInterval = 30000, // 30 seconds
    dependencies = []
  } = options;

  // Función principal para cargar datos
  const loadData = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Evitar fetches muy frecuentes (menos de 1 segundo)
    if (!force && (now - lastFetchTime.current) < 1000) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 [DataCache-${key}] Loading data...`);
      const result = await fetcher();
      setData(result);
      lastFetchTime.current = now;
      console.log(`✅ [DataCache-${key}] Data loaded successfully`);
    } catch (err) {
      console.error(`❌ [DataCache-${key}] Error loading data:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [key, fetcher]);

  // Función pública para refrescar datos
  const refreshData = useCallback(() => {
    console.log(`🔄 [DataCache-${key}] Manual refresh triggered`);
    loadData(true);
  }, [loadData, key]);

  // Función para invalidar datos
  const invalidateData = useCallback(() => {
    console.log(`💥 [DataCache-${key}] Data invalidated`);
    setData(null);
    refreshData();
  }, [refreshData, key]);

  // Event listener para invalidación global
  useEffect(() => {
    const handleInvalidation = (event: CustomEvent) => {
      const { cacheKeys } = event.detail;
      if (cacheKeys.includes(key) || cacheKeys.includes('*')) {
        console.log(`📡 [DataCache-${key}] Received invalidation event`);
        invalidateData();
      }
    };

    // Listener para eventos de invalidación específicos
    window.addEventListener(`data-invalidate-${key}` as any, handleInvalidation);
    window.addEventListener('data-invalidate-all' as any, handleInvalidation);
    
    return () => {
      window.removeEventListener(`data-invalidate-${key}` as any, handleInvalidation);
      window.removeEventListener('data-invalidate-all' as any, handleInvalidation);
    };
  }, [key, invalidateData]);

  // Auto-refresh en focus de ventana
  useEffect(() => {
    if (!refreshOnFocus) return;

    const handleFocus = () => {
      console.log(`👀 [DataCache-${key}] Window focused, refreshing data`);
      refreshData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshOnFocus, refreshData, key]);

  // Auto-refresh en navegación (pageshow event)
  useEffect(() => {
    if (!refreshOnNavigate) return;

    const handlePageShow = (event: PageTransitionEvent) => {
      // Solo refrescar si la página viene del cache (navegación)
      if (event.persisted) {
        console.log(`🧭 [DataCache-${key}] Page navigation detected, refreshing data`);
        refreshData();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [refreshOnNavigate, refreshData, key]);

  // Auto-refresh por intervalo
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    refreshTimeoutRef.current = setInterval(() => {
      console.log(`⏰ [DataCache-${key}] Interval refresh (${refreshInterval}ms)`);
      refreshData();
    }, refreshInterval);

    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [refreshInterval, refreshData, key]);

  // Cargar datos inicial y cuando cambien las dependencias
  useEffect(() => {
    loadData();
  }, [loadData, ...dependencies]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh: refreshData,
    invalidate: invalidateData
  };
}

/**
 * Utility functions para invalidación manual
 */
export const DataCacheUtils = {
  // Invalidar cache específico
  invalidateCache: (cacheKey: string) => {
    console.log(`📤 [DataCacheUtils] Invalidating cache: ${cacheKey}`);
    window.dispatchEvent(new CustomEvent(`data-invalidate-${cacheKey}`, {
      detail: { cacheKeys: [cacheKey] }
    }));
  },

  // Invalidar múltiples caches
  invalidateCaches: (cacheKeys: string[]) => {
    console.log(`📤 [DataCacheUtils] Invalidating caches:`, cacheKeys);
    cacheKeys.forEach(key => {
      window.dispatchEvent(new CustomEvent(`data-invalidate-${key}`, {
        detail: { cacheKeys: [key] }
      }));
    });
  },

  // Invalidar todos los caches
  invalidateAll: () => {
    console.log(`📤 [DataCacheUtils] Invalidating ALL caches`);
    window.dispatchEvent(new CustomEvent('data-invalidate-all', {
      detail: { cacheKeys: ['*'] }
    }));
  },

  // Notificar cambio de datos (para que otros componentes se actualicen)
  notifyDataChange: (entityType: 'patients' | 'records' | 'treatments' | 'gastos-fijos', action: 'create' | 'update' | 'delete') => {
    console.log(`📢 [DataCacheUtils] Data change notification: ${entityType} ${action}`);
    
    // Disparar notificación visual
    window.dispatchEvent(new CustomEvent('data-update-notification', {
      detail: { entityType, action }
    }));
    
    // Mapear tipos de entidad a claves de cache relevantes
    const cacheKeysMap: { [key: string]: string[] } = {
      'patients': ['reports-data', 'dashboard-data', 'patients-list'],
      'records': ['reports-data', 'dashboard-data', 'patients-records'],
      'treatments': ['reports-data', 'dashboard-data', 'treatments-list'],
      'gastos-fijos': ['reports-data', 'dashboard-data', 'gastos-fijos-list']
    };

    const relevantCacheKeys = cacheKeysMap[entityType] || [];
    
    // Pequeño delay para permitir que la base de datos se actualice
    setTimeout(() => {
      DataCacheUtils.invalidateCaches(relevantCacheKeys);
    }, 100);
  }
};
