"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { DataCacheUtils } from '@/hooks/use-data-cache';

/**
 * Hook que detecta navegación entre páginas específicas y dispara invalidaciones
 * Útil para asegurar que los reportes se actualicen cuando se viene de páginas que modifican datos
 */
export function useNavigationRefresh() {
  const pathname = usePathname();
  const previousPath = useRef<string>('');
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Verificar que pathname no sea null
    if (!pathname) return;
    
    // Evitar la primera renderización
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousPath.current = pathname;
      return;
    }

    const currentPath = pathname;
    const prevPath = previousPath.current;

    console.log('🧭 [NavigationRefresh] Navigation detected:', {
      from: prevPath,
      to: currentPath,
      timestamp: new Date().toISOString()
    });

    // Definir rutas que modifican datos
    const dataModifyingRoutes = [
      '/patients/new',
      '/patients',
      /^\/patients\/\d+\/edit$/,  // Regex para /patients/[id]/edit
      /^\/patients\/\d+$/,        // Regex para /patients/[id] (detalles)
      '/treatments',
      '/records',
      '/dashboard'
    ];

    // Definir rutas que muestran reportes
    const reportRoutes = ['/reports'];

    // Función para verificar si una ruta coincide (incluyendo regex)
    const matchesRoute = (path: string, patterns: (string | RegExp)[]) => {
      return patterns.some(pattern => {
        if (typeof pattern === 'string') {
          return path === pattern || path.startsWith(pattern);
        } else {
          return pattern.test(path);
        }
      });
    };

    // Detectar navegación desde páginas que modifican datos hacia reportes
    const cameFromDataModifying = matchesRoute(prevPath, dataModifyingRoutes);
    const goingToReports = matchesRoute(currentPath, reportRoutes);

    if (cameFromDataModifying && goingToReports) {
      console.log('🔄 [NavigationRefresh] Data-modifying → Reports navigation detected, invalidating cache');
      
      // Pequeño delay para permitir que el componente se monte
      setTimeout(() => {
        DataCacheUtils.invalidateCache('reports-data');
        DataCacheUtils.invalidateCache('dashboard-data');
      }, 100);
    }

    // Detectar navegación entre páginas de modificación de datos
    if (cameFromDataModifying && matchesRoute(currentPath, dataModifyingRoutes)) {
      console.log('🔄 [NavigationRefresh] Data-modifying → Data-modifying navigation, soft refresh');
      
      setTimeout(() => {
        DataCacheUtils.invalidateCache('patients-list');
      }, 100);
    }

    // Actualizar path anterior
    previousPath.current = currentPath;

  }, [pathname]);

  // Función manual para forzar refresh
  const forceRefresh = (cacheKeys: string[] = ['reports-data', 'dashboard-data']) => {
    console.log('🔄 [NavigationRefresh] Manual refresh triggered for:', cacheKeys);
    DataCacheUtils.invalidateCaches(cacheKeys);
  };

  return {
    currentPath: pathname || '',
    previousPath: previousPath.current,
    forceRefresh
  };
}
