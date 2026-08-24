// Auditoría fable 2026-06-11 (B3): eslint-config-next@16 exporta flat configs
// nativos (Linter.Config[]). Envolverlos con FlatCompat (patrón de Next ≤14)
// producía el error circular "property 'react' closes the circle" y dejaba el
// lint inutilizable. Se importan directamente.
import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'mcp-server/**', // subproyecto con su propio lint (mcp-server/package.json)
      'public/**',
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    files: ['*.js', 'scripts/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]

export default eslintConfig
