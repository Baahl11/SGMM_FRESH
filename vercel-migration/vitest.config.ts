import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Auditoría fable 2026-06-11 (sección H del prompt): primera suite de
// regresión del repo. 'server-only' lanza fuera de RSC, se stubea en tests.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
    // El primer import de una ruta de Next transforma un grafo grande; en
    // máquinas lentas/CI excede los 5s por defecto.
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
})
