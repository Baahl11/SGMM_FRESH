# 02 — Reporte de baseline y validación final

Auditoría fable · ejecutado en sandbox Linux (Ubuntu 24, Node 20, npm 10) · 2026-06-11/12.
Todos los comandos, códigos de salida y conteos son **reales de esta sesión**; nada estimado.

## A. Baseline (estado del ZIP recibido, ANTES de cambios)

| # | Comando | Exit | Resultado | Duración aprox. |
|---|---------|------|-----------|-----------------|
| 1 | `npm ci` | **1** | Falla: `Z_DATA_ERROR` en postinstall de `supabase` (descarga binario de GitHub releases; ver OD-1) | 51 s |
| 2 | `npm ci --ignore-scripts` | 0 | 657 paquetes instalados | 37 s |
| 3 | `npx tsc --noEmit` | **2** | **26 errores** TS (lista completa: apéndice B1 del prompt; verificados 1:1) | 35 s |
| 4 | `npm run lint` | **1** | ESLint **inoperante**: `FlatCompat` + `eslint-config-next@16` ⇒ "property 'react' closes the circle" | 8 s |
| 5 | `npm run build` | — | NO ejecutado en baseline (con `ignoreBuildErrors: true` habría "pasado" ocultando los 26 errores) | — |
| 6 | Tests | — | **No existía ningún test** ni runner configurado | — |
| 7 | CI | — | No existía `.github/` | — |
| 8 | `.env.example` | — | No existía; secretos: **scan limpio** (no hay claves hardcodeadas en el repo) | — |

Notas de baseline:
- `vercel.json` usa `npm install --legacy-peer-deps` (enmascara el fallo de `npm ci` en Vercel).
- `mcp-server/` es un subproyecto con `package.json`/`tsconfig` propios; sus errores contaminaban el typecheck raíz (resuelto vía `exclude`).
- Dependencias faltantes detectadas: `server-only` (importado por código nuevo de seguridad), `@radix-ui/react-radio-group` (3 componentes lo importaban y era la causa de 3 `any` implícitos + TS2307).

## B. Validación final (estado de la rama de auditoría)

| # | Comando | Exit | Resultado | Duración |
|---|---------|------|-----------|----------|
| 1 | `npm ci --ignore-scripts` | 0 | 659 paquetes (+`server-only`, +`@radix-ui/react-radio-group`, +`vitest` dev) | ~37 s |
| 2 | `npm run typecheck` | **0** | **0 errores** | ~35 s |
| 3 | `npm run test` (vitest) | **0** | **10 archivos / 25 tests — todos en verde** | 2.1–13 s* |
| 4 | `npx eslint .` | 1 | Funcional: **641 errores / 347 warnings** de deuda histórica (desglose abajo) | ~50 s |
| 5 | `npm run lint:budget` | **0** | 641 ≤ presupuesto 641 (ratchet: falla si crece) | ~50 s |
| 6 | `npm run build` | **0** | Compila completo: 100+ rutas, middleware, prerender OK (log: 63 s de compilación) | ~3 min |

\* Primera ejecución 13 s (transformación fría del grafo de rutas); siguientes ~2 s. `testTimeout` subido a 20 s para CI.

### Asterisco del build (transparencia total)
El sandbox solo permite egress a registries; `next/font/google` no pudo descargar Inter/JetBrains Mono. **Para verificar el resto del build**, se sustituyeron temporalmente las dos fuentes por stubs, se ejecutó `npm run build` (exit 0) y se **revirtió** el cambio (`git checkout app/layout.tsx` — el repo conserva las fuentes originales). En CI/Vercel (egress abierto) el build corre sin sustitución; el workflow de CI lo cubre como check requerido. **Estado del build con fuentes reales: NO VERIFICADO en sandbox / verificable en CI.**

### Hallazgo del build: next-pwa inerte
El log confirma `▲ Next.js 16.1.1 (Turbopack)` y **cero** menciones a workbox/PWA: `next-pwa@5` es un wrapper de webpack y **no se ejecuta** bajo Turbopack. Consecuencia: ningún build actual emite `sw.js`, por lo que el SW de deploys antiguos (con caché de Supabase de 24 h) **persistiría para siempre** en los navegadores. Mitigación aplicada: `public/sw.js` kill-switch versionado + purga en logout (`lib/pwa/clear-caches.ts`). Decisión futura: OD-8 (doc 19).

## C. Desglose de la deuda ESLint (641 errores) — OD-3

| Errores | Regla |
|---|---|
| 475 | `@typescript-eslint/no-explicit-any` |
| 132 | `react/no-unescaped-entities` |
| 14 | `react-hooks/set-state-in-effect` |
| 5 | `@typescript-eslint/no-require-imports` |
| 5 | `@typescript-eslint/no-empty-object-type` |
| 4+4 | `react-hooks/immutability` / `purity` |
| 2 | `@next/next/no-html-link-for-pages` |
| resto | misceláneos (`prefer-const`, `refs`, …) |

Política adoptada (sin desactivar reglas): los archivos **nuevos** de la auditoría están lint-clean; `.lint-budget` + `scripts/lint-budget.mjs` impiden que la deuda crezca; reducción gradual planificada en doc 12.

## D. Reproducción local

```bash
git checkout audit/fable-agendamedpro-20260610
npm ci --ignore-scripts
npm run typecheck && npm run test && npm run lint:budget
cp .env.example .env.production.local   # rellenar dummies para build local
npm run build
```
