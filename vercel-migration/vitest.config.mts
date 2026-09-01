import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Config en .mts (no .ts): vitest 4.1.8 carga el config .ts via require()
// y revienta con std-env (ahora ESM-only). Ver commit de este cambio.
// Auditoría fable 2026-06-11 (sección H): primera suite de regresión.
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
