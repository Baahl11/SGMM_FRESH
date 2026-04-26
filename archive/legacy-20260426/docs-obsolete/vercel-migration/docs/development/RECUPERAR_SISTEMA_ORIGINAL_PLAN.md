# Plan de recuperación: Restaurar el sistema original en vercel-migration

Objetivo: Volver a tener, dentro de `vercel-migration/`, las mismas páginas y flujos del sistema original (Supabase-first), sin acoplarlos al backend MSI/Tauri. Luego, aplicar fixes puntuales página por página.

## Alcance y criterios de éxito
- Todas las rutas de la App Router presentes en el sistema original estarán clonadas en `vercel-migration/app/*` con la misma estructura y UI.
- La data layer usará Supabase (lib/supabase, RLS y schemas incluidos); no se referenciará `http://127.0.0.1:8000` ni appApi.ts del MSI.
- Autenticación con NextAuth/Supabase (como original), manteniendo los providers y callbacks tal cual.
- Cada página tendrá un checklist de verificación (UI coherente, datos cargan, CRUD funciona, navegación intacta).

## Fases

### Fase 0 — Snapshot y línea base (seguro)
1. Congelar el estado actual de `vercel-migration/` (git branch `vercel-restore-start`).
2. Exportar un inventario de rutas actuales: listar `app/**/page.tsx` y `app/**/route.ts`.
3. Confirmar `.env.local` con claves de Supabase (anon, service si aplica) y NextAuth URL/Secret.

Entregables:
- Lista de rutas actuales (archivo `vercel-migration/ROUTES_BEFORE.txt`).
- Verificación de variables en `.env.local` (archivo `ENV_CHECKLIST.md`).

### Fase 1 — Restaurar data layer original (Supabase-only)
1. Revisar `vercel-migration/lib/` y `database/`:
   - Mantener `lib/supabase.ts` (createClient) y helpers; eliminar o aislar cualquier cliente `appApi`/localhost.
   - Restaurar esquemas: `supabase_schema.sql`, `nextauth_schema.sql` (ya existen). No mezclar `*_msi_compatible.sql`.
2. Autenticación:
   - Confirmar NextAuth config en `app/api/auth/[...nextauth]/route.ts` (providers, callbacks, session strategy) igual al original.
   - Confirmar middleware/Edge config si aplica.

Checks:
- `npm run dev` y login/logout funcionando con Supabase (test `test-auth-flow.js`).

### Fase 2 — Clonado “tal cual” de páginas del original
Para cada sección, clonar y ajustar imports solo si es necesario (paths y estilos), sin cambiar UX/flow:

- Dashboard (`/dashboard`)
- Agenda (`/agenda`)
- Pacientes (listado `/patients`, detalle `/patients/[id]`, nuevo `/patients/new`, editar `/patients/[id]/edit`)
- Tratamientos (`/treatments` y bundles `/-/bundles` si existe)
- Inventario (`/inventory`)
- Gastos fijos (`/gastos-fijos`)
- Mensajería (`/messaging`)
- Reportes (`/reports`)

Para cada página:
1. Crear carpeta y `page.tsx` idéntico (copypaste del original cloud), respetando componentes ya existentes en `components/`.
2. Reemplazar cualquier llamada a `appApi(...)` por llamadas a Supabase SDK: `supabase.from(...).select/insert/update/delete`.
3. Mantener tipos y transforms originales; no traducir campos ni renombrar props.

Entregables por página:
- `CHECK_<ruta>.md` con:
  - [ ] UI coincide con original (captura de pantalla)
  - [ ] Lecturas OK (query supabase)
  - [ ] Creación/edición/eliminación OK
  - [ ] Navegación y breadcrumbs OK

### Fase 3 — Rutas API (si las había en el original)
- Mantener únicamente API Routes que el original usaba para orquestación con Supabase (si las había)
- Eliminar/aislar API Routes que apunten a backend MSI.
- Añadir pruebas ligthweight con `test-*.js` ya existentes (ej.: `test-patient-api.js`).

### Fase 4 — Estilos y layout
- Verificar `app/layout.tsx`, `globals.css`, y componentes de UI.
- Asegurar que los providers (Theme/Auth/Supabase) están montados igual al original.

### Fase 5 — QA y smoke completo
- Ejecutar suite de tests `vercel-migration/test-*.js` contra Supabase.
- Validar performance básica (lista de pacientes < 1s en local) y ausencia de 404/500.

## Checklist de regresión (mínimo)
- [ ] No existen imports desde `src/lib/appApi` ni referencias a `127.0.0.1:8000`.
- [ ] Todas las mutaciones usan Supabase JS.
- [ ] Login con Supabase funciona y protege rutas.
- [ ] Navegación y páginas coinciden con original.

## Plan de implementación incremental (commits sugeridos)
1. chore(vm): baseline snapshot + rutas actuales
2. feat(vm): restore supabase client + nextauth config original
3. feat(vm): restore patients pages (list/new/[id]/edit) tal cual + tests
4. feat(vm): restore agenda supabase-first + tests
5. feat(vm): restore treatments + bundles + tests
6. feat(vm): restore inventory + tests
7. feat(vm): restore gastos fijos + tests
8. feat(vm): restore messaging + tests
9. feat(vm): restore reports + tests
10. fix(vm): polish layout, providers, auth guards

## Notas
- Si falta alguna página original, copiar del repo raíz `src/app/*` (versión cloud) y adaptar imports a `vercel-migration`.
- Evitar optimizaciones “creativas” durante esta fase. Objetivo: fidelidad 1:1 con el original.
- Mantener documentación de cada ajuste en el check de su página.
