'use client'

/**
 * Purga de caches del service worker (auditoría fable 2026-06-11, C6).
 *
 * Aunque el SW nuevo ya NO cachea Supabase (NetworkOnly), los navegadores de
 * usuarios existentes conservan el cache `supabase-api` creado por versiones
 * anteriores (hasta 24h de datos clínicos/fiscales). Esta utilidad se invoca
 * en el logout para eliminar todos los caches de la app y evitar que un
 * segundo usuario del mismo dispositivo vea datos del anterior.
 */
export async function clearAppCaches(): Promise<void> {
  try {
    if (typeof window === 'undefined') return
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
    // fable C6 (hallazgo build): next-pwa@5 NO se ejecuta bajo Turbopack
    // (Next 16), así que los builds actuales no emiten sw.js nuevo que
    // reemplace al antiguo. Los navegadores que registraron el SW de deploys
    // anteriores (webpack) lo conservan indefinidamente con su caché
    // NetworkFirst de Supabase. Desregistrarlo aquí corta esa persistencia.
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((reg) => reg.unregister()))
    }
  } catch {
    // Best-effort: nunca bloquear el logout por un fallo de purga.
  }
}
