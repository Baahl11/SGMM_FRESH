## Fase 0 — Reporte

Fecha: 2026-08-25. Ejecutado sobre la rama `worktree-reception-ai-fase0` (baseline `cfd6968a`), siguiendo `docs/superpowers/plans/2026-08-24-recepcion-ia-fase0-seguridad-esquema.md`, spec `HANDOFF_MAESTRO_V2_RECEPCION_IA_WHATSAPP_AGENDAMEDPRO.md`.

### Resultado
- **Completado** — los 5 hallazgos P0 de seguridad (sección 3 del handoff) y la deriva de esquema de `whatsapp_conversations` quedan corregidos y protegidos con tests automatizados; suite completa (typecheck/test/lint-budget/secret-scan/build) en verde.

### Evidencia

Comandos ejecutados en fresco en esta sesión (Node 22.23.2, `.node22/` local — el sistema trae Node 20.15.1 y `vitest`/`vite` requieren ESM):

```
$ tsc --noEmit -p tsconfig.json
exit 0

$ vitest run
Test Files  25 passed (25)
     Tests  69 passed (69)

$ node scripts/lint-budget.mjs
ESLint: 631 errores (presupuesto: 641)
✓ Dentro del presupuesto.

$ node scripts/secret-scan.mjs
secret-scan: OK (867 archivos revisados, 0 hallazgos).

$ next build            # sin env vars — reproduce fielmente el entorno local
Error: STRIPE_SECRET_KEY is not defined in environment variables
  at .../api/addons/[id]/route.js
Error: Failed to collect page data for /api/addons/[id]

$ next build            # con las mismas env vars dummy que .github/workflows/ci.yml usa para el paso "Build (requerido)"
✓ Compiled successfully in 102s
... (rutas estáticas y dinámicas generadas, incluida /dashboard/settings/whatsapp y /dashboard/settings/whatsapp/setup)
exited with code 0
```

El primer intento de build documenta una falla real (no inventada): sin las variables de entorno dummy que CI inyecta para este paso (comentario en `.github/workflows/ci.yml`, líneas 51-55: "Dummies SOLO para que el build evalúe los módulos route con clientes a nivel de módulo"), Next.js falla al recolectar datos de página porque un route module instancia el cliente de Stripe a nivel de módulo. No es un error de TypeScript ni de la aplicación — es el mismo patrón ya documentado por CI, reproducido aquí con las mismas variables para confirmar que el build en sí compila limpio. No corresponde a la falla de TLS de Google Fonts que anticipaba la sección 16 del handoff; esta vez el bloqueo fue por env vars, y se resolvió reproduciendo exactamente el env de CI (no se tocó ningún archivo de la app para lograrlo).

- **Pruebas agregadas en este cierre de Fase 0 (Task 9):**
  - `tests/messaging-crypto.test.ts` — round-trip real de `encryptMessagingSecret`/`decryptMessagingSecret` (`lib/crypto/messaging.ts`, chacha20-poly1305) con una key de 32 bytes generada en el test; `isEncryptedSecretEnvelope` con valores válidos/inválidos; rechazo con key equivocada (auth tag inválida); rechazo del algoritmo legacy `xchacha20poly1305` con el mensaje de re-guardado. **Solo confirma que el primitivo de cifrado funciona** — no migra ni cifra ningún dato existente de WhatsApp; eso sigue siendo Fase 1 (ver "Fuera de alcance" en `docs/reception-ai/current-messaging-map.md`).
  - No existía ninguna prueba previa para `lib/crypto/messaging.ts` en el repo (confirmado con `grep -r "encryptMessagingSecret\|decryptMessagingSecret" tests/` antes de escribir el test).

- **Pruebas agregadas en tareas anteriores de este mismo plan (Tasks 3-8, ya committeadas):** `tests/whatsapp-conversations-migration.test.ts`, `tests/secret-scan.test.ts`, `tests/whatsapp-validate-config-auth.test.ts`, `tests/messaging-config-secrets.test.ts`, `tests/whatsapp-settings-secrets.test.ts`.

- **Divergencia respecto al plan en Task 8:** el plan proponía un test estático (`tests/whatsapp-page-no-client-token-read.test.ts`, lectura de código fuente por regex) y mantener `hasStoredAccessToken` como estado inline en el componente. La implementación real usa en su lugar `app/dashboard/settings/whatsapp/settings-mapper.ts` — un mapper puro (`mapWhatsAppSettingsFromApi`) probado con `tests/whatsapp-settings-page-no-token-on-load.test.ts`, que además verifica en defensa de profundidad que `accessToken` queda vacío aunque el backend regresara el token por error. También se preservó el comportamiento exacto de cuándo se auto-abre el wizard (`!enabled || !phoneNumberId`, igual que el código original) en vez de agregar el gatillo adicional `!has_access_token` que proponía el plan — esa adición no estaba en el comportamiento original y el propio plan fija como meta "sin cambiar comportamiento visible para los usuarios actuales".

- **Smoke manual en navegador (Task 8, Step 5 del plan):** **no ejecutado en esta sesión** — este entorno no tiene una herramienta de navegador disponible para verificar visualmente `/dashboard/settings/whatsapp` con sesión real. La garantía de que el token nunca llega al cliente descansa en: (a) `tests/whatsapp-settings-secrets.test.ts` (GET del endpoint nunca incluye el campo), (b) `tests/whatsapp-settings-page-no-token-on-load.test.ts` (el mapper del cliente nunca lo copia a su estado), y (c) el build de producción exitoso de la ruta. Queda pendiente como verificación manual antes de dar por buena la UI en un entorno con navegador.

### Archivos modificados (Tasks 1-9, orden cronológico)
- `9a1829b4` — `package.json` (nombre del paquete), baseline confirmado.
- `2f881560` — `docs/reception-ai/current-messaging-map.md` (nuevo).
- `13d5de4a` — `supabase/migrations/20260824120000_whatsapp_conversations.sql` (nuevo), `tests/whatsapp-conversations-migration.test.ts` (nuevo), `docs/reception-ai/schema-reconciliation.md` (nuevo).
- `0f7a7c34` — `.env.whatsapp.example`, `scripts/secret-scan.mjs` (nuevo), `tests/secret-scan.test.ts` (nuevo), `package.json`, `.github/workflows/ci.yml`, `docs/reception-ai/secret-rotation-plan.md` (nuevo).
- `03a7b126` — `app/api/whatsapp/validate-config/route.ts`, `tests/whatsapp-validate-config-auth.test.ts` (nuevo), `docs/fable-audit/21_API_AUTHORIZATION_MATRIX.md`.
- `6a37320d` — `app/api/messaging/config/route.ts`, `tests/messaging-config-secrets.test.ts` (nuevo).
- `4bbe94d6` — `app/api/user/whatsapp-settings/route.ts`, `tests/whatsapp-settings-secrets.test.ts` (nuevo).
- `af2c1913` — `app/dashboard/settings/whatsapp/page.tsx`, `app/dashboard/settings/whatsapp/settings-mapper.ts` (nuevo), `tests/whatsapp-settings-page-no-token-on-load.test.ts` (nuevo).
- Este commit (Task 9) — `tests/messaging-crypto.test.ts` (nuevo), `docs/reception-ai/fase-0-report.md` (nuevo), y `docs/superpowers/plans/2026-08-24-recepcion-ia-fase0-seguridad-esquema.md` (el plan en sí, nunca committeado hasta ahora pese a ser la spec citada por todos los commits anteriores).

### Migraciones
- `supabase/migrations/20260824120000_whatsapp_conversations.sql`: reconcilia `whatsapp_conversations` (idempotente, `CREATE TABLE IF NOT EXISTS` + políticas envueltas en `DO $$`); compatible con producción exista o no la tabla ya. Rollback: `DROP TABLE IF EXISTS public.whatsapp_conversations;` **solo si nada ha escrito aún** en ese entorno.

### Riesgos pendientes
- Rotación real de credenciales Twilio (`docs/reception-ai/secret-rotation-plan.md`) — requiere operador humano con acceso a Twilio/Vercel; no ejecutada en este plan.
- Purga del historial de Git de las credenciales expuestas — requiere aprobación explícita separada (acción destructiva/compartida), documentada pero no ejecutada.
- `supabase migration list` / `supabase db dump` contra staging real (sección 16 del handoff) — requiere credenciales de un proyecto Supabase real que este entorno no tiene; documentado como paso manual en `docs/reception-ai/schema-reconciliation.md`.
- Smoke manual en navegador de `/dashboard/settings/whatsapp` (ver arriba) — no ejecutado, cubierto solo por tests automatizados + build.
- **Fuera de alcance de Fase 0 (confirmado, no es un P0 pendiente):** consolidar los tres almacenes paralelos de credenciales en `messaging_providers` + `MetaWhatsAppAdapter`, y cifrar en reposo `user_profiles.whatsapp_access_token` / `messaging_config.whatsapp_access_token` con `lib/crypto/messaging.ts` (el primitivo ya está probado — Task 9 de este plan — pero integrarlo a las rutas de escritura es Fase 1). Ver `docs/reception-ai/current-messaging-map.md`, sección 4.

### Feature flags
- Ninguna introducida en Fase 0 (no aplica — las banderas de la sección 13 del handoff llegan en Fase 1/2).

### Rollback probado
- Cada task de este plan es un commit independiente y reversible (`git revert <sha>`); la migración de Task 3 tiene rollback documentado arriba. No se probó un rollback real (`git revert`) en este entorno durante esta sesión.

### Próximo gate
- Go para Fase 1 (Consolidación de mensajería) requiere, según la sección 21 del handoff: P0 cerrado (este plan, completo), esquema reconciliado (Task 3 — con el `supabase migration list`/`dump` real pendiente de operador), y que la rotación de credenciales Twilio esté confirmada por el operador (`docs/reception-ai/secret-rotation-plan.md`). Ninguno de estos dos últimos pasos operativos se ejecutó en esta sesión porque requieren credenciales reales de Twilio/Supabase que este entorno de desarrollo no tiene.
