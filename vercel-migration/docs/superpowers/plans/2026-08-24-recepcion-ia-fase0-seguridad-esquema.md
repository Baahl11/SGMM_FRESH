# Recepción IA — Fase 0 (Seguridad, secretos y verdad del esquema) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar los hallazgos P0 de seguridad (fuga de tokens de WhatsApp, ruta pública sin auth) y la deriva de esquema (`whatsapp_conversations` fuera de `supabase/migrations`) que bloquean cualquier conexión real de Meta para el piloto Harmonizarte, sin cambiar comportamiento visible para los usuarios actuales.

**Architecture:** Correcciones puntuales y reversibles sobre rutas API y un componente cliente existentes (nunca se introduce backend nuevo ni se reescribe la agenda). Los DTOs de configuración de WhatsApp pasan de `select('*')`/lectura client-side a listas explícitas de columnas que excluyen los campos de credenciales, calculando en su lugar booleanos `has_*`. La tabla `whatsapp_conversations` (ya usada en producción por el webhook) se declara también en `supabase/migrations` con `CREATE TABLE IF NOT EXISTS`, de modo que un deploy nuevo desde cero no falle. Un script homegrown (`scripts/secret-scan.mjs`, sin dependencias binarias externas, siguiendo el mismo criterio que evitó el postinstall de `supabase` en CI) escanea `git ls-files` en busca de patrones de credenciales reales.

**Tech Stack:** Next.js 16 (App Router) / TypeScript / Supabase (Postgres + RLS) / Vitest 4 (`environment: 'node'`, sin jsdom/testing-library instalados).

**Spec:** `C:\Users\gm_me\SGMM_FRESH\HANDOFF_MAESTRO_V2_RECEPCION_IA_WHATSAPP_AGENDAMEDPRO.md` — secciones 0 (mandato), 3 (hallazgos P0), 6.7 (migración legacy), 14 (Fase 0), 15 (Primer sprint, Entregables 1 y 2), 22 (formato de reporte).

## Global Constraints

- No crear otro backend ni reescribir la agenda; solo tocar rutas/componentes de mensajería y el esquema de `whatsapp_conversations`.
- No `reset --hard`, no borrar ni sobreescribir trabajo del usuario; commits pequeños por hito.
- No desplegar a producción ni ejecutar `supabase db reset`/`db dump` contra staging o producción reales (requiere credenciales y autorización explícita del operador humano — queda documentado como paso manual, no como tarea de este plan).
- Migraciones expansivas únicamente: `CREATE TABLE IF NOT EXISTS`, nunca `DROP`/`RENAME` sobre tablas o columnas existentes.
- No pedir ni imprimir valores de credenciales reales en ningún archivo, log, test o commit.
- No purgar el historial de Git (`git filter-repo`/BFG) de forma automática: es una acción destructiva y compartida que requiere aprobación explícita y separada del usuario. Este plan solo prepara el plan de rotación documentado (sección 14 del handoff, tarea "plan de rotación sin valores").
- Ningún flag nuevo se introduce en este plan (Fase 0 no requiere feature flags — esos llegan en Fase 1/2); no inventar banderas fuera de spec.
- `npm run lint:budget` no puede superar el presupuesto vigente en `.lint-budget` (641 al momento de escribir este plan).
- Todo el código nuevo sigue los patrones ya establecidos en el repo: `getAuthUser()` de `lib/auth-server.ts` para auth server-side, `checkRateLimit()` de `lib/security/rate-limit.ts` para límites, `createLogger()`/`redactValue()` de `lib/log.ts` para logs seguros, tests planos en `tests/*.test.ts` con `vi.mock('@/lib/supabase/server', ...)`.

---

## File Structure

**Crear:**
- `docs/reception-ai/current-messaging-map.md` — inventario de todas las llamadas Meta/Twilio y almacenes de credenciales (Entregable 1 del handoff).
- `docs/reception-ai/schema-reconciliation.md` — estado real de migraciones vs. lo que usa el código en producción (Entregable 1).
- `docs/reception-ai/secret-rotation-plan.md` — plan de rotación sin valores (Entregable 2, tarea "plan de rotación").
- `docs/reception-ai/fase-0-report.md` — reporte final de la fase en el formato de la sección 22 del handoff.
- `supabase/migrations/20260824120000_whatsapp_conversations.sql` — declara `whatsapp_conversations` en el set canónico de migraciones (idempotente).
- `scripts/secret-scan.mjs` — escáner homegrown de secretos sobre archivos trackeados por git.
- `tests/whatsapp-conversations-migration.test.ts`
- `tests/secret-scan.test.ts`
- `tests/whatsapp-validate-config-auth.test.ts`
- `tests/messaging-config-secrets.test.ts`
- `tests/whatsapp-settings-secrets.test.ts`
- `tests/whatsapp-page-no-client-token-read.test.ts`

**Modificar:**
- `.env.whatsapp.example` — reemplazar credenciales Twilio con forma real por placeholders explícitos.
- `package.json` — agregar script `secret-scan`.
- `.github/workflows/ci.yml` — agregar paso de secret scan requerido.
- `app/api/whatsapp/validate-config/route.ts` — exigir sesión + rate limit.
- `app/api/messaging/config/route.ts` — DTO seguro en GET y POST (nunca devolver tokens).
- `app/api/user/whatsapp-settings/route.ts` — eliminar log de credenciales; GET seguro con booleanos `has_*` en vez de tokens.
- `app/dashboard/settings/whatsapp/page.tsx` — dejar de leer `whatsapp_access_token` vía Supabase client; usar el endpoint server-side.
- `docs/fable-audit/21_API_AUTHORIZATION_MATRIX.md` — actualizar la fila de `validate-config` (ya no "sin patrón de auth detectado").

---

### Task 1: Rama de trabajo y baseline verificado

**Files:**
- No se crean/modifican archivos de producto; solo se registra el estado en `docs/reception-ai/current-messaging-map.md` en el Task 2 (este task solo prepara la rama y confirma el baseline).

**Interfaces:**
- Consumes: nada.
- Produces: rama `feature/reception-ai-fase0` y confirmación de que `npm run typecheck`, `npm test`, `npm run lint:budget` pasan en verde antes de tocar nada (baseline auditado: 18 suites / 47 tests / 0 errores TS / 631 lint dentro de presupuesto 641, según sección 16 del handoff — hay que reconfirmar localmente porque el número de tests puede haber cambiado desde la auditoría).

- [ ] **Step 1: Confirmar que no hay cambios sin commitear que se puedan perder**

Run: `git status --short`
Si hay cambios ajenos sin commitear, detente y pregunta al usuario antes de continuar (no se debe crear la rama sobre trabajo no guardado de otra tarea).

- [ ] **Step 2: Crear la rama de trabajo**

```bash
git checkout -b feature/reception-ai-fase0
```

- [ ] **Step 3: Ejecutar el baseline y registrar el resultado exacto**

Run: `npm run typecheck && npm test -- --run && npm run lint:budget`
Expected: los tres comandos terminan en 0 (exit code). Anota el conteo real de test suites/tests que reporta Vitest y el conteo de errores de lint que reporta `lint:budget` — se usarán tal cual (sin inventar cifras) en `docs/reception-ai/fase-0-report.md` (Task 9).

- [ ] **Step 4: Commit vacío de punto de partida**

```bash
git commit --allow-empty -m "chore(reception-ai): baseline fase 0 antes de cambios de seguridad"
```

---

### Task 2: Mapa real de mensajería (`docs/reception-ai/current-messaging-map.md`)

**Files:**
- Create: `docs/reception-ai/current-messaging-map.md`

**Interfaces:**
- Consumes: hallazgos ya verificados contra el código (rutas, almacenes, adaptadores) — ver contenido exacto abajo, no requiere volver a auditar.
- Produces: documento de referencia que los Tasks 4-8 citan por sección al describir cada corrección.

- [ ] **Step 1: Escribir el documento completo**

```markdown
# Mapa real de mensajería WhatsApp — AgendaMedPro

Fecha: 2026-08-24. Verificado contra código en `vercel-migration/` (rama `feature/reception-ai-fase0`), no contra documentación previa.

## 1. Tres almacenes de credenciales paralelos

| Almacén | Tabla/columnas | Lectores | Escritores |
|---|---|---|---|
| Legacy por-usuario | `user_profiles.whatsapp_access_token`, `.whatsapp_phone_number_id`, `.whatsapp_business_account_id`, `.whatsapp_twilio_*` | `app/dashboard/settings/whatsapp/page.tsx` (cliente, **antes de este plan**), `app/api/whatsapp/send/route.ts` | `app/api/user/whatsapp-settings/route.ts` |
| "Canónico" BYOK | `messaging_config.whatsapp_access_token`, `.whatsapp_webhook_verify_token`, `.whatsapp_phone_number_id`, `.whatsapp_business_id` (migración `supabase/migrations/20251027_messaging_config.sql`) | `app/api/messaging/config/route.ts`, `app/api/messaging/whatsapp/send/route.ts`, `app/api/webhooks/whatsapp/route.ts` (fuente primaria) | `app/api/messaging/config/route.ts`, `app/api/user/whatsapp-settings/route.ts` (sync) |
| Multi-canal cifrado | `messaging_providers.credentials_encrypted` (migración `supabase/migrations/20251107_messaging_core.sql`, CHECK ya incluye `meta_whatsapp`) | Ninguno (sin adaptador Meta en `lib/messaging/adapters/`) | Ninguno |

Los tres se leen/escriben con lógica de sincronización manual y parcial. Fase 1 (fuera de este plan) debe consolidarlos en `messaging_providers`.

## 2. Llamadas directas a la Graph API de Meta (sin adaptador común)

| Ruta | Fuente del token | Nota |
|---|---|---|
| `app/api/whatsapp/send/route.ts` | `user_profiles.whatsapp_access_token` | `fetch` directo a `https://graph.facebook.com/v18.0/...` |
| `app/api/messaging/whatsapp/send/route.ts` | `messaging_config.whatsapp_access_token` | `fetch` directo, versión de Graph API repetida en el archivo |
| `app/api/webhooks/whatsapp/route.ts` (función interna `sendWhatsAppMessage`) | `messaging_config` con fallback a `user_profiles` | `fetch` directo, soporta `WHATSAPP_DRY_RUN=true` |

`lib/whatsapp-service.ts` (clase `WhatsAppService`, usa `process.env.WHATSAPP_API_KEY` global) no tiene ningún consumidor en código de aplicación — es código muerto, no se toca en este plan (retiro formal queda para cuando exista inventario de consumidores, sección 4.3 del handoff).

`lib/messaging/adapters/` (`index.ts`, `twilio.ts`, `messagebird.ts`, `plivo.ts`) define `SupportedProvider = 'twilio' | 'messagebird' | 'plivo'` — no incluye `meta_whatsapp` pese a que el esquema de BD ya lo anticipa. Crear `MetaWhatsAppAdapter` es trabajo de Fase 1, no de este plan.

## 3. Hallazgos P0 corregidos por este plan (Fase 0)

| # | Archivo | Problema | Tarea que lo cierra |
|---|---|---|---|
| 1 | `app/api/messaging/config/route.ts` | `GET`/`POST` usaban `select('*')`/devolvían la fila completa (incluye `whatsapp_access_token` y `whatsapp_webhook_verify_token`) | Task 6 |
| 2 | `app/dashboard/settings/whatsapp/page.tsx` | `loadSettings()` leía `whatsapp_access_token` completo desde `user_profiles` vía Supabase client (navegador) | Task 8 |
| 3 | `app/api/user/whatsapp-settings/route.ts` | `console.log('Updating user_profiles with data:', ...)` incluía `whatsapp_access_token`/`whatsapp_twilio_auth_token`/`whatsapp_twilio_account_sid` en texto plano en logs de servidor; `GET` no exponía tokens pero tampoco daba estado "configurado" sin ellos | Task 7 |
| 4 | `app/api/whatsapp/validate-config/route.ts` | Sin auth ni rate limit; actúa como proxy/oráculo no autenticado hacia la Graph API de Meta | Task 5 |
| 5 | `.env.whatsapp.example` | `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_MESSAGING_SERVICE_SID` con forma de credencial real committeados al repo | Task 4 |

## 4. Fuera de alcance de este plan (Fase 1+)

- Consolidar los tres almacenes en `messaging_providers` + `MetaWhatsAppAdapter`.
- Cifrar en reposo `user_profiles.whatsapp_access_token` / `messaging_config.whatsapp_access_token` con `lib/crypto/messaging.ts` (hoy no se usa en ninguna ruta de WhatsApp; solo confirmamos en Task 9 que el cifrado en sí funciona).
- Retirar `lib/whatsapp-service.ts` y las rutas de envío duplicadas.
- Purgar el historial de Git de las credenciales Twilio expuestas (requiere aprobación explícita separada — ver `docs/reception-ai/secret-rotation-plan.md`).
```

- [ ] **Step 2: Commit**

```bash
git add docs/reception-ai/current-messaging-map.md
git commit -m "docs(reception-ai): mapa real de mensajería WhatsApp (entregable 1)"
```

---

### Task 3: Reconciliación de esquema — `whatsapp_conversations` fuera de `supabase/migrations`

**Files:**
- Create: `docs/reception-ai/schema-reconciliation.md`
- Create: `supabase/migrations/20260824120000_whatsapp_conversations.sql`
- Test: `tests/whatsapp-conversations-migration.test.ts`

**Interfaces:**
- Consumes: contenido exacto de `mcp-server/migrations/002_whatsapp_conversations.sql` (ya usa `CREATE TABLE IF NOT EXISTS`, por lo que copiarlo a `supabase/migrations` es seguro aunque la tabla ya exista en producción).
- Produces: migración canónica que cualquier `supabase db push`/reset desde cero puede aplicar sin que `app/api/webhooks/whatsapp/route.ts` falle al hacer `insert` en `whatsapp_conversations`.

- [ ] **Step 1: Escribir el test que falla (la migración canónica todavía no existe)**

```ts
// tests/whatsapp-conversations-migration.test.ts
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// HANDOFF_MAESTRO_V2 sección 3 (P0 — Deriva de esquema): whatsapp_conversations
// vive solo en mcp-server/migrations, fuera del set "oficial" de
// supabase/migrations. Un deploy nuevo que solo aplique supabase/migrations
// rompería el insert del webhook. Este test fija que exista una migración
// canónica idempotente para esa tabla.
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'supabase', 'migrations')

function findCanonicalWhatsappConversationsMigration(): string | null {
  const fs = require('node:fs') as typeof import('node:fs')
  const files = fs.readdirSync(MIGRATIONS_DIR)
  const match = files.find((f) => f.includes('whatsapp_conversations'))
  return match ? path.join(MIGRATIONS_DIR, match) : null
}

describe('reconciliación de esquema: whatsapp_conversations (fase 0)', () => {
  it('existe una migración canónica en supabase/migrations', () => {
    const file = findCanonicalWhatsappConversationsMigration()
    expect(file).not.toBeNull()
    expect(existsSync(file as string)).toBe(true)
  })

  it('la migración es idempotente (CREATE TABLE IF NOT EXISTS) y define las columnas usadas por el webhook', () => {
    const file = findCanonicalWhatsappConversationsMigration()
    const sql = readFileSync(file as string, 'utf8')
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS whatsapp_conversations/)
    for (const column of ['user_id', 'patient_id', 'phone_number', 'message_in', 'message_out', 'message_id', 'responded_by', 'action_taken']) {
      expect(sql).toContain(column)
    }
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/)
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `npx vitest run tests/whatsapp-conversations-migration.test.ts`
Expected: FAIL — no existe ningún archivo `*whatsapp_conversations*` en `supabase/migrations`.

- [ ] **Step 3: Crear la migración canónica (copia idempotente de `mcp-server/migrations/002_whatsapp_conversations.sql`)**

```sql
-- supabase/migrations/20260824120000_whatsapp_conversations.sql
-- ============================================================================
-- Reconciliación de esquema — Recepción IA Fase 0 (2026-08-24)
-- ----------------------------------------------------------------------------
-- whatsapp_conversations ya se usa en producción por
-- app/api/webhooks/whatsapp/route.ts, pero su única migración vivía en
-- mcp-server/migrations/002_whatsapp_conversations.sql, fuera del set
-- "oficial" de supabase/migrations (HANDOFF_MAESTRO_V2, sección 3, P0 —
-- Deriva de esquema). Esta migración es una copia idempotente (CREATE TABLE
-- IF NOT EXISTS) para que un deploy que solo aplique supabase/migrations no
-- rompa el insert del webhook. No reemplaza ni borra el archivo original de
-- mcp-server/migrations — ver docs/reception-ai/schema-reconciliation.md.
-- ROLLBACK (solo si nada ha escrito aún en la tabla en este entorno):
--   DROP TABLE IF EXISTS public.whatsapp_conversations;
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message_in TEXT NOT NULL,
  message_out TEXT NOT NULL,
  message_id TEXT,
  responded_by TEXT DEFAULT 'ai', -- 'ai' o 'manual'
  action_taken TEXT, -- 'confirmed_appointment', 'cancelled_appointment', 'created_appointment', NULL
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user_id ON whatsapp_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_patient_id ON whatsapp_conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_created_at ON whatsapp_conversations(created_at DESC);

ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_conversations' AND policyname = 'Users can view their own conversations'
  ) THEN
    CREATE POLICY "Users can view their own conversations"
      ON whatsapp_conversations FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_conversations' AND policyname = 'Users can insert their own conversations'
  ) THEN
    CREATE POLICY "Users can insert their own conversations"
      ON whatsapp_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION get_whatsapp_stats(user_uuid UUID)
RETURNS TABLE (
  total_conversations BIGINT,
  conversations_today BIGINT,
  conversations_this_week BIGINT,
  unique_patients BIGINT,
  ai_responses BIGINT,
  manual_responses BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE))::BIGINT,
    COUNT(DISTINCT patient_id)::BIGINT,
    COUNT(*) FILTER (WHERE responded_by = 'ai')::BIGINT,
    COUNT(*) FILTER (WHERE responded_by = 'manual')::BIGINT
  FROM whatsapp_conversations
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE whatsapp_conversations IS
  'Reconciliada en supabase/migrations el 2026-08-24 (Recepción IA Fase 0). Fuente original: mcp-server/migrations/002_whatsapp_conversations.sql.';
```

Nota: `CREATE POLICY` no soporta `IF NOT EXISTS` en Postgres, por eso se envuelve en `DO $$ ... END $$` con `pg_policies` — así la migración es re-ejecutable sin error si las políticas ya existen (idempotencia real, no solo de la tabla).

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `npx vitest run tests/whatsapp-conversations-migration.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Escribir `docs/reception-ai/schema-reconciliation.md`**

```markdown
# Reconciliación de esquema — Recepción IA Fase 0

Fecha: 2026-08-24.

## Deriva confirmada

`whatsapp_conversations` (tabla que `app/api/webhooks/whatsapp/route.ts` usa activamente para loguear cada intercambio IA) tenía su única migración en `mcp-server/migrations/002_whatsapp_conversations.sql`, **fuera** de `supabase/migrations/`. Un entorno nuevo (staging limpio, otra clínica) que solo aplique `supabase/migrations/` no tendría la tabla y el webhook fallaría en el primer `insert`.

## Corrección aplicada en este plan

`supabase/migrations/20260824120000_whatsapp_conversations.sql` — copia idempotente (`CREATE TABLE IF NOT EXISTS`, políticas envueltas en `DO $$ ... $$` verificando `pg_policies`) de la definición original. No se modifica ni se borra el archivo de `mcp-server/migrations/` (regla de este plan: no borrar/renombrar durante el piloto). A partir de ahora, `supabase/migrations/` es la fuente canónica para esta tabla; el archivo de `mcp-server` queda como duplicado histórico documentado aquí.

## Pendiente — requiere acceso del operador humano a Supabase (fuera de este plan)

Estos pasos **no se ejecutan automáticamente** en este plan porque requieren credenciales de un proyecto Supabase real (local/staging/producción) que este entorno de desarrollo no tiene, y porque `supabase db reset` es destructivo sobre el entorno donde se ejecute:

1. `supabase migration list` — confirmar qué migraciones están realmente aplicadas en staging/producción vs. lo que hay en `supabase/migrations/` en este repo.
2. `supabase db dump --schema public -f schema-before-reception.sql` — dump de solo esquema (sin datos de pacientes) para diff.
3. Confirmar en el dump si `whatsapp_conversations` ya existe en producción (lo más probable, dado que el webhook la usa) — si existe, esta migración es un no-op seguro (`IF NOT EXISTS`); si no existe, esta migración la crea por primera vez.
4. Comparar el dump contra `supabase/migrations/` completo (no solo esta tabla) para detectar más deriva no relacionada con Recepción IA — **fuera del alcance de este plan**, documentar como hallazgo separado si aparece.

Guardar cualquier dump con tratamiento seguro (nunca commitear datos de pacientes ni secretos — ver `.gitignore`).

## Otros almacenes de datos de mensajería (no requieren corrección en Fase 0)

`messaging_config`, `messaging_providers`, `messaging_messages`, `messaging_jobs`, `whatsapp_templates`, `patient_whatsapp_consent`, `webhook_events` sí están todos en `supabase/migrations/` (`20251027_messaging_config.sql`, `20251107_messaging_core.sql`, `20251116_whatsapp_templates.sql`, `20260611100000_webhook_events.sql`). Sin deriva detectada en estas tablas.
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260824120000_whatsapp_conversations.sql tests/whatsapp-conversations-migration.test.ts docs/reception-ai/schema-reconciliation.md
git commit -m "fix(schema): reconciliar whatsapp_conversations en supabase/migrations (idempotente)"
```

---

### Task 4: Secretos en `.env.whatsapp.example` + secret scanning en CI

**Files:**
- Modify: `.env.whatsapp.example`
- Create: `scripts/secret-scan.mjs`
- Test: `tests/secret-scan.test.ts`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Create: `docs/reception-ai/secret-rotation-plan.md`

**Interfaces:**
- Consumes: convención ya establecida en `scripts/lint-budget.mjs` (script Node plano, sin dependencias nuevas — mismo criterio que evitó el postinstall del CLI de `supabase` en CI, ver comentario OD-1 en `.github/workflows/ci.yml`).
- Produces: `scanContent(content: string): Array<{ name: string; match: string }>` — exportado desde `scripts/secret-scan.mjs`, usado por el test y por el propio script en modo CLI.

- [ ] **Step 1: Escribir el test que falla (el script todavía no existe)**

```ts
// tests/secret-scan.test.ts
import { describe, expect, it } from 'vitest'
import { scanContent } from '../scripts/secret-scan.mjs'

describe('secret-scan (Recepción IA Fase 0)', () => {
  it('detecta un Twilio Account SID con forma real', () => {
    const hits = scanContent(`TWILIO_ACCOUNT_SID=AC${'a'.repeat(32)}`)
    expect(hits.some((h) => h.name === 'Twilio Account SID')).toBe(true)
  })

  it('detecta un Twilio Messaging Service SID con forma real', () => {
    const hits = scanContent(`TWILIO_MESSAGING_SERVICE_SID=MG${'b'.repeat(32)}`)
    expect(hits.some((h) => h.name.includes('Twilio Messaging Service'))).toBe(true)
  })

  it('detecta una Stripe live secret key', () => {
    const hits = scanContent(`STRIPE_SECRET_KEY=sk_live_${'1'.repeat(24)}`)
    expect(hits.some((h) => h.name.includes('Stripe'))).toBe(true)
  })

  it('no marca los dummies conocidos que usa el job de build en CI', () => {
    const hits = scanContent('STRIPE_SECRET_KEY=sk_test_dummy\nWHATSAPP_APP_SECRET=dummy')
    expect(hits).toHaveLength(0)
  })

  it('no marca texto sin forma de secreto', () => {
    const hits = scanContent('const clinicName = "Harmonizarte"')
    expect(hits).toHaveLength(0)
  })

  it('el .env.whatsapp.example del repo ya no contiene secretos con forma real', () => {
    const fs = require('node:fs') as typeof import('node:fs')
    const path = require('node:path') as typeof import('node:path')
    const content = fs.readFileSync(path.resolve(__dirname, '..', '.env.whatsapp.example'), 'utf8')
    expect(scanContent(content)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `npx vitest run tests/secret-scan.test.ts`
Expected: FAIL — `Cannot find module '../scripts/secret-scan.mjs'`.

- [ ] **Step 3: Implementar `scripts/secret-scan.mjs`**

```js
#!/usr/bin/env node
// Escaneo homegrown de secretos (Recepción IA Fase 0, 2026-08-24).
// No usa un binario externo (gitleaks/truffleHog) a propósito: instalar un
// binario en npm ci ya rompió CI en redes restringidas (ver OD-1 en
// .github/workflows/ci.yml para el CLI de supabase). Este script cubre los
// patrones de alta confianza relevantes para este repo; no reemplaza una
// auditoría de secretos completa.

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

export const SECRET_PATTERNS = [
  { name: 'Twilio Account SID', regex: /\bAC[0-9a-fA-F]{32}\b/g },
  { name: 'Twilio Messaging Service SID', regex: /\bMG[0-9a-fA-F]{32}\b/g },
  { name: 'Stripe live secret key', regex: /\bsk_live_[0-9a-zA-Z]{16,}\b/g },
  { name: 'AWS Access Key ID', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Google API key', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { name: 'PEM private key', regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g },
]

const ALLOWLIST_SUBSTRINGS = [
  'sk_test_dummy',
  'whsec_dummy',
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
]

export function scanContent(content) {
  const hits = []
  for (const { name, regex } of SECRET_PATTERNS) {
    const matches = content.match(regex) || []
    for (const match of matches) {
      if (ALLOWLIST_SUBSTRINGS.some((safe) => match.includes(safe))) continue
      hits.push({ name, match })
    }
  }
  return hits
}

const SKIP_EXTENSIONS = /\.(png|jpe?g|gif|ico|svg|woff2?|ttf|eot|pdf|zip|lock)$/i

function listTrackedFiles() {
  const out = execSync('git ls-files', { encoding: 'utf8' })
  return out.split('\n').filter(Boolean)
}

function main() {
  const files = listTrackedFiles()
  const findings = []
  for (const file of files) {
    if (SKIP_EXTENSIONS.test(file)) continue
    let content
    try {
      content = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const hit of scanContent(content)) {
      findings.push({ file, ...hit })
    }
  }

  if (findings.length > 0) {
    console.error('secret-scan: posibles credenciales encontradas:')
    for (const f of findings) {
      console.error(`  ${f.file}: ${f.name} (${f.match.slice(0, 6)}...)`)
    }
    process.exitCode = 1
    return
  }

  console.log(`secret-scan: OK (${files.length} archivos revisados, 0 hallazgos).`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
```

- [ ] **Step 4: Ejecutar el test — debe seguir fallando por el contenido real de `.env.whatsapp.example`**

Run: `npx vitest run tests/secret-scan.test.ts`
Expected: FAIL solo en el test `'el .env.whatsapp.example del repo ya no contiene secretos con forma real'` (los otros 5 pasan).

- [ ] **Step 5: Reemplazar las credenciales con forma real por placeholders explícitos**

```bash
# .env.whatsapp.example
# ============================================================================
# CONFIGURACIÓN DE TWILIO CENTRALIZADO PARA WHATSAPP
# ============================================================================
# Agrega estas variables en Vercel Dashboard → Settings → Environment Variables
# NUNCA pegues valores reales en este archivo (es *.example y se commitea).
# ============================================================================

# Twilio credentials (cuenta maestra de AgendaMedPro)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Opción 1: Usa Messaging Service SID (recomendado)
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Opción 2: O usa número directo (comentar si usas MessagingServiceSid)
# TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# ============================================================================
# INSTRUCCIONES:
# 1. Ve a https://vercel.com/tu-proyecto/settings/environment-variables
# 2. Agrega cada variable de arriba con el valor REAL (nunca en este archivo)
# 3. Selecciona: Production, Preview, Development
# 4. Redeploy el proyecto
# ============================================================================
```

- [ ] **Step 6: Ejecutar el test y confirmar que pasa completo**

Run: `npx vitest run tests/secret-scan.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 7: Agregar el script a `package.json`**

Modificar el bloque `"scripts"` de `vercel-migration/package.json` agregando, junto a `"lint:budget": "node scripts/lint-budget.mjs"`:

```json
    "secret-scan": "node scripts/secret-scan.mjs"
```

- [ ] **Step 8: Ejecutar el script en modo CLI real sobre el repo completo**

Run: `npm run secret-scan`
Expected: exit 0, línea final `secret-scan: OK (<N> archivos revisados, 0 hallazgos).` Si aparece algún hallazgo nuevo no relacionado con este plan, detente y repórtalo — no lo "arregles" silenciosamente fuera de alcance.

- [ ] **Step 9: Agregar el paso a CI**

En `.github/workflows/ci.yml`, agregar después del paso `"Presupuesto de lint (requerido — la deuda no puede crecer)"`:

```yaml
      - name: Secret scan (requerido — Recepción IA Fase 0)
        run: npm run secret-scan
```

- [ ] **Step 10: Escribir el plan de rotación sin valores**

```markdown
# Plan de rotación de secretos — Recepción IA Fase 0

Fecha: 2026-08-24. Este documento **no contiene ningún valor de credencial**, solo qué rotar, dónde y en qué orden. Ejecución: operador humano con acceso a las consolas de Twilio/Vercel — no automatizable desde este repo.

## 1. Credenciales Twilio expuestas en `.env.whatsapp.example` (working tree, antes de este plan)

Variables afectadas: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID` (cuenta maestra de AgendaMedPro, no BYOK de un doctor).

1. En la consola de Twilio: regenerar (`Auth Token` → "Create new primary Auth Token") — esto invalida el token viejo de inmediato. Confirmar con el equipo antes de rotar si algún flujo en producción depende del token actual (recordatorios activos, etc.), para coordinar la ventana de corte.
2. Actualizar `TWILIO_AUTH_TOKEN` (y `TWILIO_ACCOUNT_SID`/`TWILIO_MESSAGING_SERVICE_SID` si también se regeneran) en Vercel → Settings → Environment Variables, en los tres entornos (Production/Preview/Development).
3. Redeploy.
4. Verificar: `npm run secret-scan` en verde (ya lo está tras el Task 4 de este plan — esto confirma que no queden restos en el working tree) y una prueba real de envío WhatsApp con el token nuevo.

## 2. Historial de Git

El valor viejo de `.env.whatsapp.example` puede seguir en commits anteriores aunque el working tree ya esté limpio (Task 4 de este plan). Purgar historial (`git filter-repo`, BFG Repo-Cleaner) reescribe hashes y requiere force-push coordinado con todo el equipo — **no se ejecuta en este plan**. Antes de purgar:
- Confirmar con el usuario que autoriza una reescritura de historial en este repositorio.
- Completar primero el paso 1 (rotar en Twilio) — el historial de Git deja de ser explotable en cuanto el token viejo es inválido, aunque el string siga visible.
- Si se decide purgar, coordinar el force-push con cualquier clon/fork existente.

## 3. Relacionado — ya trackeado en auditoría previa (no duplicar aquí)

`NEXTAUTH_SECRET` (hallazgo C5, `docs/fable-audit/03_BUG_REGISTER.md`): código ya corregido, **rotación del secreto sigue pendiente** por el operador. Este plan no la ejecuta; solo se referencia para que quede en la misma checklist operativa antes de conectar Harmonizarte.

## 4. Gate

No conectar el número de WhatsApp de Harmonizarte hasta que el paso 1 esté confirmado como completado por el operador (rotación real en Twilio + Vercel + redeploy + verificación).
```

- [ ] **Step 11: Commit**

```bash
git add .env.whatsapp.example scripts/secret-scan.mjs tests/secret-scan.test.ts package.json .github/workflows/ci.yml docs/reception-ai/secret-rotation-plan.md
git commit -m "fix(security): retirar secretos con forma real de .env.whatsapp.example y agregar secret-scan a CI"
```

---

### Task 5: `app/api/whatsapp/validate-config/route.ts` — exigir sesión y rate limit

**Files:**
- Modify: `app/api/whatsapp/validate-config/route.ts`
- Test: `tests/whatsapp-validate-config-auth.test.ts`
- Modify: `docs/fable-audit/21_API_AUTHORIZATION_MATRIX.md`

**Interfaces:**
- Consumes: `getAuthUser()` de `@/lib/auth-server` (retorna `AuthUser | null`, patrón usado en `app/api/messaging/config/route.ts`), `checkRateLimit()`/`rateLimitHeaders()` de `@/lib/security/rate-limit`.
- Produces: la ruta sigue devolviendo el mismo shape de respuesta (`{ success, phone_number, verified_name, quality_rating, dry_run? }` / `{ success: false, error, details? }`), solo agrega 401 sin sesión y 429 por exceso de intentos.

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/whatsapp-validate-config-auth.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

// HANDOFF_MAESTRO_V2 sección 3 (P0 — validate-config sin auth ni rate limit):
// cualquiera podía usar esta ruta como oráculo/proxy no autenticado hacia la
// Graph API de Meta. Fija el contrato: 401 sin sesión, 429 tras exceder el
// límite por usuario, y que el bypass WHATSAPP_DRY_RUN siga funcionando una
// vez autenticado.

const getAuthUserMock = vi.fn()

vi.mock('@/lib/auth-server', () => ({
  getAuthUser: () => getAuthUserMock(),
}))

function postRequest(body: unknown) {
  return new Request('http://localhost/api/whatsapp/validate-config', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/whatsapp/validate-config', () => {
  beforeEach(() => {
    getAuthUserMock.mockReset()
    vi.resetModules()
  })

  it('rechaza con 401 sin usuario autenticado', async () => {
    getAuthUserMock.mockResolvedValue(null)
    const { POST } = await import('@/app/api/whatsapp/validate-config/route')
    const res = await POST(postRequest({ phone_number_id: 'x', access_token: 'y' }) as never)
    expect(res.status).toBe(401)
  })

  it('con sesión y WHATSAPP_DRY_RUN=true responde dry_run sin llamar a Meta', async () => {
    process.env.WHATSAPP_DRY_RUN = 'true'
    getAuthUserMock.mockResolvedValue({ id: `user-${Math.random()}`, email: 'doc@example.com' })
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { POST } = await import('@/app/api/whatsapp/validate-config/route')
    const res = await POST(postRequest({ phone_number_id: 'x', access_token: 'y' }) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.dry_run).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
    delete process.env.WHATSAPP_DRY_RUN
  })

  it('bloquea con 429 tras exceder el límite de intentos del mismo usuario', async () => {
    process.env.WHATSAPP_DRY_RUN = 'true'
    const userId = `user-rate-${Math.random()}`
    getAuthUserMock.mockResolvedValue({ id: userId, email: 'doc@example.com' })
    const { POST } = await import('@/app/api/whatsapp/validate-config/route')
    let lastStatus = 0
    for (let i = 0; i < 6; i++) {
      const res = await POST(postRequest({ phone_number_id: 'x', access_token: 'y' }) as never)
      lastStatus = res.status
    }
    expect(lastStatus).toBe(429)
    delete process.env.WHATSAPP_DRY_RUN
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `npx vitest run tests/whatsapp-validate-config-auth.test.ts`
Expected: FAIL — hoy la ruta responde 200/400 sin sesión (primer test falla) y nunca 429 (tercer test falla).

- [ ] **Step 3: Implementar la corrección**

```ts
// app/api/whatsapp/validate-config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit';

/**
 * POST /api/whatsapp/validate-config
 * Valida credenciales de WhatsApp API haciendo una petición de prueba a la Graph API de Meta.
 * Requiere sesión (fable/reception-ai fase 0, P0): antes era pública y servía como
 * proxy/oráculo no autenticado hacia la Graph API de Meta.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const rate = checkRateLimit(`whatsapp-validate-config:user:${user.id}`, {
      limit: 5,
      windowMs: 60_000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Espera un momento e intenta de nuevo.' },
        { status: 429, headers: rateLimitHeaders(rate) }
      );
    }

    const body = await request.json();
    const { phone_number_id, access_token } = body;

    if (process.env.WHATSAPP_DRY_RUN === 'true') {
      return NextResponse.json({
        success: true,
        phone_number: phone_number_id || 'dry-run-number',
        verified_name: 'Dry Run Mode',
        quality_rating: 'N/A',
        dry_run: true,
      });
    }

    if (!phone_number_id || !access_token) {
      return NextResponse.json({
        success: false,
        error: 'Faltan credenciales'
      }, { status: 400 });
    }

    // Test connection to Meta Graph API
    const url = `https://graph.facebook.com/v18.0/${phone_number_id}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();

      let errorMessage = 'Error desconocido';
      if (error.error?.message) {
        errorMessage = error.error.message;

        if (errorMessage.includes('Invalid OAuth access token')) {
          errorMessage = 'Token de acceso inválido. Verifica que sea un token permanente.';
        } else if (errorMessage.includes('Invalid parameter')) {
          errorMessage = 'Phone Number ID inválido. Verifica que sea correcto.';
        } else if (errorMessage.includes('token has expired')) {
          errorMessage = 'Token expirado. Genera un token permanente (System User).';
        } else if (errorMessage.includes('Application does not have permission')) {
          errorMessage = 'Tu app no tiene permisos de WhatsApp. Agrega el producto WhatsApp en Meta.';
        }
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: error
      }, { status: 400 });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      phone_number: data.display_phone_number,
      verified_name: data.verified_name,
      quality_rating: data.quality_rating
    });

  } catch (error) {
    console.error('Error validating WhatsApp config:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al validar configuración. Verifica tus credenciales.'
    }, { status: 500 });
  }
}
```

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `npx vitest run tests/whatsapp-validate-config-auth.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Actualizar la matriz de autorización de API existente**

En `docs/fable-audit/21_API_AUTHORIZATION_MATRIX.md`, reemplazar la fila de la Tabla 2 (`Rutas sin auth/firma/cron detectados`):

```
| `/api/whatsapp/validate-config` | POST | ⚠️ REVISAR EN STAGING: sin patrón de auth detectado — confirmar diseño o falso negativo |
```

por:

```
| `/api/whatsapp/validate-config` | POST | CORREGIDO 2026-08-24 (Recepción IA fase 0): ahora exige `getAuthUser()` + rate limit por usuario — ver `tests/whatsapp-validate-config-auth.test.ts` |
```

Y en la Tabla 1, en la fila de `/api/whatsapp/validate-config` (o el nombre exacto que tenga en esa tabla), marcar la columna de auth como `✅`.

- [ ] **Step 6: Commit**

```bash
git add app/api/whatsapp/validate-config/route.ts tests/whatsapp-validate-config-auth.test.ts docs/fable-audit/21_API_AUTHORIZATION_MATRIX.md
git commit -m "fix(security): exigir sesion y rate limit en /api/whatsapp/validate-config"
```

---

### Task 6: `app/api/messaging/config/route.ts` — DTO seguro (nunca devolver tokens)

**Files:**
- Modify: `app/api/messaging/config/route.ts`
- Test: `tests/messaging-config-secrets.test.ts`

**Interfaces:**
- Consumes: patrón de mock ya usado en `tests/appointments-id-authz.test.ts` (`vi.mock('@/lib/supabase/server', ...)`, `vi.mock('@/lib/auth-server', ...)`).
- Produces: `GET`/`POST` devuelven `config` con las mismas columnas no-secretas que antes más `has_whatsapp_access_token: boolean` y `has_whatsapp_webhook_verify_token: boolean`, **sin** `whatsapp_access_token` ni `whatsapp_webhook_verify_token`. Único consumidor conocido (`app/dashboard/settings/whatsapp-templates/page.tsx`) solo lee `config?.whatsapp_enabled` y `config?.whatsapp_business_id`, que se conservan igual — no se rompe.

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/messaging-config-secrets.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

// HANDOFF_MAESTRO_V2 sección 3 (P0 — messaging/config con select('*')): GET y
// POST devolvían la fila completa de messaging_config, incluidos
// whatsapp_access_token y whatsapp_webhook_verify_token. Fija el contrato:
// la respuesta JSON nunca contiene esas dos claves, sin importar qué
// devuelva la base de datos.

const getAuthUserMock = vi.fn()
const getSessionMock = vi.fn()

const ROW_WITH_SECRETS = {
  id: 'cfg-1',
  user_id: 'tenant-A',
  whatsapp_business_id: 'biz-1',
  whatsapp_phone_number_id: 'phone-1',
  whatsapp_access_token: 'EAAG_super_secreto_no_debe_salir',
  whatsapp_webhook_verify_token: 'verify_secreto_no_debe_salir',
  whatsapp_phone_number: '+5215500000000',
  whatsapp_verified: true,
  whatsapp_enabled: true,
  auto_reminders_enabled: false,
  reminder_24h_enabled: true,
  reminder_1h_enabled: false,
  daily_message_limit: 1000,
  current_daily_usage: 3,
  usage_reset_date: '2026-08-24',
  connection_status: 'connected',
  last_connection_test: '2026-08-20T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-08-20T00:00:00.000Z',
}

function makeChain(result: { data?: unknown; error?: unknown }) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_t, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(result)
      }
      return () => new Proxy({}, handler)
    },
  }
  return new Proxy({}, handler)
}

vi.mock('@/lib/auth-server', () => ({
  getAuthUser: () => getAuthUserMock(),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getSession: () => getSessionMock() },
    from: () => makeChain({ data: ROW_WITH_SECRETS, error: null }),
  }),
}))

describe('GET/POST /api/messaging/config nunca exponen tokens', () => {
  beforeEach(() => {
    getAuthUserMock.mockReset()
    getSessionMock.mockReset()
    getAuthUserMock.mockResolvedValue({ id: 'tenant-A', email: 'doc@example.com' })
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'tenant-A' } } } })
  })

  it('GET nunca incluye whatsapp_access_token ni whatsapp_webhook_verify_token', async () => {
    const { GET } = await import('@/app/api/messaging/config/route')
    const res = await GET()
    const body = await res.json()
    const raw = JSON.stringify(body)
    expect(raw).not.toContain('whatsapp_access_token')
    expect(raw).not.toContain('whatsapp_webhook_verify_token')
    expect(raw).not.toContain('super_secreto')
    expect(body.config.has_whatsapp_access_token).toBe(true)
    expect(body.config.whatsapp_business_id).toBe('biz-1')
  })

  it('POST nunca incluye whatsapp_access_token en la respuesta aunque la BD lo devuelva', async () => {
    const { POST } = await import('@/app/api/messaging/config/route')
    const req = new Request('http://localhost/api/messaging/config', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        whatsapp_business_id: 'biz-1',
        whatsapp_phone_number_id: 'phone-1',
        whatsapp_access_token: 'nuevo_token_del_usuario',
        whatsapp_enabled: true,
      }),
    })
    const res = await POST(req as never)
    const body = await res.json()
    const raw = JSON.stringify(body)
    expect(raw).not.toContain('whatsapp_access_token')
    expect(raw).not.toContain('super_secreto')
    expect(raw).not.toContain('nuevo_token_del_usuario')
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `npx vitest run tests/messaging-config-secrets.test.ts`
Expected: FAIL — hoy `select('*')` y el `result` de insert/update incluyen el token completo.

- [ ] **Step 3: Implementar el DTO seguro**

```ts
// app/api/messaging/config/route.ts
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

const SAFE_COLUMNS =
  'id, user_id, whatsapp_business_id, whatsapp_phone_number_id, whatsapp_phone_number, whatsapp_verified, whatsapp_enabled, auto_reminders_enabled, reminder_24h_enabled, reminder_1h_enabled, daily_message_limit, current_daily_usage, usage_reset_date, connection_status, last_connection_test, created_at, updated_at, whatsapp_access_token, whatsapp_webhook_verify_token';

function toSafeConfig(row: Record<string, unknown> | null) {
  if (!row) return null;
  const { whatsapp_access_token, whatsapp_webhook_verify_token, ...safe } = row;
  return {
    ...safe,
    has_whatsapp_access_token: Boolean(whatsapp_access_token),
    has_whatsapp_webhook_verify_token: Boolean(whatsapp_webhook_verify_token),
  };
}

/**
 * GET /api/messaging/config
 * Retrieve WhatsApp configuration for current user (DTO seguro: nunca
 * devuelve whatsapp_access_token ni whatsapp_webhook_verify_token — fable/
 * reception-ai fase 0, P0).
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      console.error('[Messaging Config API] No authenticated user found');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      console.error('[Messaging Config API] No active session found');
      return NextResponse.json({ error: 'No autorizado - sesión inválida' }, { status: 401 });
    }

    const { data: config, error } = await supabase
      .from('messaging_config')
      .select(SAFE_COLUMNS)
      .eq('user_id', session.user.id)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('[Messaging Config API] Database error:', error);
      return NextResponse.json({
        error: 'Error al obtener configuración',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ config: toSafeConfig(config as Record<string, unknown> | null) });
  } catch (error) {
    console.error('[Messaging Config API] Unexpected error:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/messaging/config
 * Save/update WhatsApp configuration for current user
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      whatsapp_business_id,
      whatsapp_phone_number_id,
      whatsapp_access_token,
      whatsapp_phone_number,
      whatsapp_enabled,
      auto_reminders_enabled,
      reminder_24h_enabled,
      reminder_1h_enabled,
      daily_message_limit,
      doctor_name,
      clinic_name,
      clinic_address,
      clinic_phone,
      custom_message_signature,
    } = body;

    if (whatsapp_enabled) {
      if (!whatsapp_business_id || !whatsapp_phone_number_id || !whatsapp_access_token) {
        return NextResponse.json(
          { error: 'Business ID, Phone Number ID y Access Token son requeridos' },
          { status: 400 }
        );
      }
    }

    const { data: existingConfig } = await supabase
      .from('messaging_config')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    const configData = {
      user_id: session.user.id,
      whatsapp_business_id,
      whatsapp_phone_number_id,
      whatsapp_access_token,
      whatsapp_phone_number,
      whatsapp_enabled,
      auto_reminders_enabled,
      reminder_24h_enabled,
      reminder_1h_enabled,
      daily_message_limit: daily_message_limit || 1000,
      doctor_name: doctor_name || null,
      clinic_name: clinic_name || null,
      clinic_address: clinic_address || null,
      clinic_phone: clinic_phone || null,
      custom_message_signature: custom_message_signature || null,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existingConfig) {
      const { data, error } = await supabase
        .from('messaging_config')
        .update(configData)
        .eq('user_id', session.user.id)
        .select(SAFE_COLUMNS)
        .single();

      if (error) {
        console.error('Error updating messaging config:', error);
        return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
      }

      result = data;
    } else {
      const { data, error } = await supabase
        .from('messaging_config')
        .insert([configData])
        .select(SAFE_COLUMNS)
        .single();

      if (error) {
        console.error('Error inserting messaging config:', error);
        return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({ config: toSafeConfig(result as Record<string, unknown> | null), success: true });
  } catch (error) {
    console.error('Unexpected error in POST /api/messaging/config:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `npx vitest run tests/messaging-config-secrets.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/messaging/config/route.ts tests/messaging-config-secrets.test.ts
git commit -m "fix(security): DTO seguro en /api/messaging/config (nunca devolver tokens)"
```

---

### Task 7: `app/api/user/whatsapp-settings/route.ts` — eliminar log de credenciales y exponer solo estado seguro

**Files:**
- Modify: `app/api/user/whatsapp-settings/route.ts`
- Test: `tests/whatsapp-settings-secrets.test.ts`

**Interfaces:**
- Consumes: nada nuevo (mismo patrón `supabase.auth.getUser()` ya usado en el archivo).
- Produces: `GET` agrega `whatsapp_provider`, `whatsapp_phone_number_id`, `whatsapp_business_account_id`, `whatsapp_has_access_token: boolean` a la respuesta (sin el token); Task 8 depende de este shape para dejar de leer `user_profiles` directo desde el cliente. `POST` deja de loguear `updateData`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/whatsapp-settings-secrets.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

// HANDOFF_MAESTRO_V2 sección 3 (P0 — whatsapp-settings loguea credenciales):
// POST hacía console.log del objeto updateData completo, que podía incluir
// whatsapp_access_token / whatsapp_twilio_auth_token / whatsapp_twilio_account_sid
// en texto plano en logs de servidor. Fija el contrato: ningún console.log
// de POST contiene esos valores, y GET expone un booleano en vez del token.

const getUserMock = vi.fn()

function makeChain(result: { data?: unknown; error?: unknown }) {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_t, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(result)
      }
      return () => new Proxy({}, handler)
    },
  }
  return new Proxy({}, handler)
}

const PROFILE_ROW = {
  whatsapp_phone: '+5215500000000',
  whatsapp_enabled: true,
  whatsapp_default_message: 'hola',
  whatsapp_config_level: 'meta',
  whatsapp_provider: 'meta',
  whatsapp_phone_number_id: 'phone-1',
  whatsapp_business_account_id: 'biz-1',
  whatsapp_access_token: 'EAAG_super_secreto_no_debe_salir',
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: () => getUserMock() },
    from: (table: string) => {
      if (table === 'user_profiles') {
        return makeChain({ data: PROFILE_ROW, error: null })
      }
      return makeChain({ data: null, error: null })
    },
  }),
}))

describe('GET/POST /api/user/whatsapp-settings no exponen ni loguean tokens', () => {
  beforeEach(() => {
    getUserMock.mockReset()
    getUserMock.mockResolvedValue({ data: { user: { id: 'tenant-A' } }, error: null })
  })

  it('GET nunca incluye whatsapp_access_token; expone whatsapp_has_access_token', async () => {
    const { GET } = await import('@/app/api/user/whatsapp-settings/route')
    const res = await GET()
    const body = await res.json()
    expect(JSON.stringify(body)).not.toContain('super_secreto')
    expect(JSON.stringify(body)).not.toContain('whatsapp_access_token')
    expect(body.whatsapp_has_access_token).toBe(true)
    expect(body.whatsapp_phone_number_id).toBe('phone-1')
  })

  it('POST no loguea el token en consola', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const req = new Request('http://localhost/api/user/whatsapp-settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        whatsapp_provider: 'meta',
        whatsapp_phone_number_id: 'phone-1',
        whatsapp_business_account_id: 'biz-1',
        whatsapp_access_token: 'nuevo_token_secreto_no_debe_loguearse',
      }),
    })
    const { POST } = await import('@/app/api/user/whatsapp-settings/route')
    await POST(req as never)
    const loggedText = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n')
    expect(loggedText).not.toContain('nuevo_token_secreto_no_debe_loguearse')
    consoleSpy.mockRestore()
  })
})
```

Nota: como `user_profiles` no tiene fila existente (`makeChain({ data: null, ... })` para cualquier tabla que no sea el `select` de perfil), el `POST` de este test llega hasta el chequeo `if (!existingProfile)` y responde 404 **antes** de intentar el `update` real — es intencional y suficiente para el objetivo del test (probar que el log no ocurre), porque el `console.log` que se está corrigiendo vive **antes** de esa rama en el código actual. Si al implementar el fix el orden cambia, ajustar el mock de `from('user_profiles')` para devolver `{ data: { user_id: 'tenant-A' }, error: null }` en la primera llamada (`select('user_id')`) y `PROFILE_ROW` en la segunda — usar un contador de llamadas si hace falta distinguirlas.

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `npx vitest run tests/whatsapp-settings-secrets.test.ts`
Expected: FAIL — `GET` no incluye `whatsapp_has_access_token` hoy, y `POST` sí loguea `updateData` con el token.

- [ ] **Step 3: Ajustar el mock si el `POST` real no llega a la línea del log (ver nota del Step 1) y luego implementar el fix**

```ts
// app/api/user/whatsapp-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user/whatsapp-settings
 * Get user's WhatsApp configuration (incluye estado Meta enmascarado —
 * fable/reception-ai fase 0: nunca devolver whatsapp_access_token).
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('whatsapp_phone, whatsapp_enabled, whatsapp_default_message, whatsapp_config_level, whatsapp_provider, whatsapp_phone_number_id, whatsapp_business_account_id, whatsapp_access_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching WhatsApp settings:', error);
      return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 });
    }

    return NextResponse.json({
      whatsapp_phone: profile?.whatsapp_phone || '',
      whatsapp_enabled: profile?.whatsapp_enabled || false,
      whatsapp_default_message: profile?.whatsapp_default_message || '¡Hola! Me contacto desde AgendaMedPro',
      whatsapp_config_level: profile?.whatsapp_config_level || 'basic',
      whatsapp_provider: profile?.whatsapp_provider || null,
      whatsapp_phone_number_id: profile?.whatsapp_phone_number_id || '',
      whatsapp_business_account_id: profile?.whatsapp_business_account_id || '',
      whatsapp_has_access_token: Boolean(profile?.whatsapp_access_token),
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/user/whatsapp-settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/user/whatsapp-settings
 * Update user's WhatsApp configuration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      whatsapp_phone,
      whatsapp_enabled,
      whatsapp_default_message,
      whatsapp_config_level,
      whatsapp_provider,
      whatsapp_twilio_account_sid,
      whatsapp_twilio_auth_token,
      whatsapp_twilio_phone_number,
      whatsapp_twilio_messaging_service_sid,
      whatsapp_phone_number_id,
      whatsapp_business_account_id,
      whatsapp_access_token
    } = body;

    if (whatsapp_phone) {
      const cleanPhone = whatsapp_phone.replace(/\s+/g, '');
      if (!/^\+\d{10,15}$/.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Formato de teléfono inválido. Debe incluir código de país (ej: +52 55 1234 5678)' },
          { status: 400 }
        );
      }
    }

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado. Por favor contacta soporte.' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (whatsapp_phone !== undefined) updateData.whatsapp_phone = whatsapp_phone || null;
    if (whatsapp_enabled !== undefined) updateData.whatsapp_enabled = whatsapp_enabled;
    if (whatsapp_default_message !== undefined) updateData.whatsapp_default_message = whatsapp_default_message;
    if (whatsapp_config_level !== undefined) updateData.whatsapp_config_level = whatsapp_config_level;
    if (whatsapp_provider !== undefined) updateData.whatsapp_provider = whatsapp_provider;

    if (whatsapp_twilio_account_sid !== undefined) updateData.whatsapp_twilio_account_sid = whatsapp_twilio_account_sid || null;
    if (whatsapp_twilio_auth_token !== undefined) updateData.whatsapp_twilio_auth_token = whatsapp_twilio_auth_token || null;
    if (whatsapp_twilio_phone_number !== undefined) updateData.whatsapp_twilio_phone_number = whatsapp_twilio_phone_number || null;
    if (whatsapp_twilio_messaging_service_sid !== undefined) updateData.whatsapp_twilio_messaging_service_sid = whatsapp_twilio_messaging_service_sid || null;

    if (whatsapp_phone_number_id !== undefined) updateData.whatsapp_phone_number_id = whatsapp_phone_number_id || null;
    if (whatsapp_business_account_id !== undefined) updateData.whatsapp_business_account_id = whatsapp_business_account_id || null;
    if (whatsapp_access_token !== undefined) updateData.whatsapp_access_token = whatsapp_access_token || null;

    // fable/reception-ai fase 0 (P0): se eliminó el console.log de updateData
    // completo — incluía whatsapp_access_token / whatsapp_twilio_auth_token /
    // whatsapp_twilio_account_sid en texto plano en logs de servidor.

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating WhatsApp settings:', JSON.stringify(error, null, 2));
      return NextResponse.json({
        error: 'Error updating settings',
        details: error.message,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    const shouldSyncMetaToMessagingConfig =
      whatsapp_provider === 'meta'
      || whatsapp_phone_number_id !== undefined
      || whatsapp_business_account_id !== undefined
      || whatsapp_access_token !== undefined
      || whatsapp_enabled !== undefined;

    if (shouldSyncMetaToMessagingConfig) {
      const messagingConfigUpdate: any = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (whatsapp_phone_number_id !== undefined) {
        messagingConfigUpdate.whatsapp_phone_number_id = whatsapp_phone_number_id || null;
      }
      if (whatsapp_business_account_id !== undefined) {
        messagingConfigUpdate.whatsapp_business_id = whatsapp_business_account_id || null;
      }
      if (whatsapp_access_token !== undefined) {
        messagingConfigUpdate.whatsapp_access_token = whatsapp_access_token || null;
      }
      if (whatsapp_enabled !== undefined) {
        messagingConfigUpdate.whatsapp_enabled = Boolean(whatsapp_enabled);
      }

      const { error: syncError } = await supabase
        .from('messaging_config')
        .upsert(messagingConfigUpdate, { onConflict: 'user_id' });

      if (syncError) {
        console.error('Error syncing WhatsApp settings to messaging_config:', JSON.stringify(syncError, null, 2));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in POST /api/user/whatsapp-settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `npx vitest run tests/whatsapp-settings-secrets.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/user/whatsapp-settings/route.ts tests/whatsapp-settings-secrets.test.ts
git commit -m "fix(security): eliminar log de credenciales y exponer estado seguro en /api/user/whatsapp-settings"
```

---

### Task 8: `app/dashboard/settings/whatsapp/page.tsx` — dejar de leer el token desde el navegador

**Files:**
- Modify: `app/dashboard/settings/whatsapp/page.tsx`
- Test: `tests/whatsapp-page-no-client-token-read.test.ts`

**Interfaces:**
- Consumes: `GET /api/user/whatsapp-settings` (Task 7) — shape `{ whatsapp_enabled, whatsapp_phone_number_id, whatsapp_business_account_id, whatsapp_has_access_token, ... }`.
- Produces: ninguna otra pantalla depende de este componente.

Nota sobre TDD en este task: el repo no tiene `jsdom`/`@testing-library/react` instalado (`vitest.config.ts` usa `environment: 'node'`); no existe convención de tests de componentes React en `tests/`. Siguiendo el patrón ya usado en `tests/debug-endpoints-absent.test.ts` (test de ausencia de patrón por lectura de código fuente), este task usa un test estático sobre el código fuente del archivo en vez de renderizar el componente — es una alternativa honesta dentro de lo que la infraestructura actual soporta, no una prueba funcional de UI. Verificación funcional real: Step 5 (smoke manual con `npm run dev`).

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/whatsapp-page-no-client-token-read.test.ts
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// HANDOFF_MAESTRO_V2 sección 3 (P0 — page.tsx lee whatsapp_access_token
// desde el navegador): loadSettings() consultaba user_profiles vía Supabase
// client incluyendo whatsapp_access_token completo. Test estático (no hay
// jsdom/testing-library en este repo) que fija que el código fuente ya no
// contiene ese patrón y que sí llama al endpoint server-side seguro.
const FILE = path.resolve(__dirname, '..', 'app', 'dashboard', 'settings', 'whatsapp', 'page.tsx')

describe('app/dashboard/settings/whatsapp/page.tsx no lee el token desde el cliente', () => {
  it('no hace select(...) de whatsapp_access_token contra user_profiles', () => {
    const src = readFileSync(FILE, 'utf8')
    expect(src).not.toMatch(/\.select\(\s*['"`][^'"`]*whatsapp_access_token[^'"`]*['"`]\s*\)/)
  })

  it('usa el endpoint server-side /api/user/whatsapp-settings para cargar el estado', () => {
    const src = readFileSync(FILE, 'utf8')
    expect(src).toContain("fetch('/api/user/whatsapp-settings'")
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `npx vitest run tests/whatsapp-page-no-client-token-read.test.ts`
Expected: FAIL — el primer assert falla porque hoy sí existe ese `.select(...)`.

- [ ] **Step 3: Implementar el fix — reemplazar `loadSettings()` y el estado del componente**

En `app/dashboard/settings/whatsapp/page.tsx`, reemplazar el estado inicial (líneas 18-23) para separar el token que el usuario está escribiendo (nuevo, siempre vacío al cargar) del estado ya guardado (enmascarado):

```tsx
  const [settings, setSettings] = useState({
    enabled: false,
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: ''
  });
  const [hasStoredAccessToken, setHasStoredAccessToken] = useState(false);
```

Reemplazar `loadSettings` (líneas 31-65) por:

```tsx
  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // fable/reception-ai fase 0 (P0): antes se leía whatsapp_access_token
      // completo desde user_profiles vía Supabase client (navegador). Ahora
      // se usa el endpoint server-side, que nunca devuelve el token.
      const response = await fetch('/api/user/whatsapp-settings');
      if (!response.ok) throw new Error('Error al cargar configuración');
      const data = await response.json();

      setSettings({
        enabled: data.whatsapp_enabled || false,
        phoneNumberId: data.whatsapp_phone_number_id || '',
        businessAccountId: data.whatsapp_business_account_id || '',
        accessToken: ''
      });
      setHasStoredAccessToken(Boolean(data.whatsapp_has_access_token));

      if (!data.whatsapp_enabled || !data.whatsapp_phone_number_id) {
        setShowWizard(true);
      } else if (!data.whatsapp_has_access_token) {
        setShowWizard(true);
      } else {
        setShowWizard(false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };
```

En la sección "Configuración Actual" (antes líneas 585-609), reemplazar el bloque del Access Token para usar `hasStoredAccessToken` en vez del valor real:

```tsx
            <div>
              <p className="text-xs text-white/60 mb-1">Access Token</p>
              <code className="block rounded bg-black/30 px-3 py-2 text-sm text-purple-300 truncate">
                {hasStoredAccessToken ? '••••••••••••••••••••' : 'No configurado'}
              </code>
            </div>
```

El paso 4 del wizard (líneas ~449-462, "Probar Conexión") no se modifica: ahí `settings.accessToken` es el valor que el usuario **acaba de escribir** en el formulario para guardarlo (nunca vino de una lectura de base de datos), por lo que no es el hallazgo P0 — mostrar los primeros caracteres de lo que la persona misma tecleó en su propio navegador, en su propio flujo de guardado, no es una fuga de un secreto almacenado.

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `npx vitest run tests/whatsapp-page-no-client-token-read.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Smoke manual (no automatizable sin jsdom)**

Run: `npm run dev`, navegar a `/dashboard/settings/whatsapp` con una sesión de prueba. Confirmar:
- Si ya hay configuración guardada, la sección "Configuración Actual" muestra el Phone Number ID real y el Access Token como `••••••••••••••••••••` (nunca el valor real).
- El wizard de reconfiguración sigue permitiendo pegar un token nuevo y guardarlo (POST a `/api/user/whatsapp-settings` sin cambios, Task 7).
- Abrir DevTools → Network mientras carga la página: la respuesta de `/api/user/whatsapp-settings` no contiene `whatsapp_access_token` en ningún lugar del JSON.

Documentar el resultado de este smoke (con qué build/entorno se probó) en `docs/reception-ai/fase-0-report.md` (Task 9) — no marcar el task como terminado solo porque compila.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/settings/whatsapp/page.tsx tests/whatsapp-page-no-client-token-read.test.ts
git commit -m "fix(security): dejar de leer whatsapp_access_token desde el navegador en settings/whatsapp"
```

---

### Task 9: Verificación de cifrado existente, suite completa y reporte de Fase 0

**Files:**
- Modify: `docs/reception-ai/fase-0-report.md` (crear con contenido final)
- No se crean tests nuevos si `lib/crypto/messaging.ts` ya tiene cobertura — verificar primero (Step 1).

**Interfaces:**
- Consumes: resultados reales de `npm run typecheck`, `npm test -- --run`, `npm run lint:budget`, `npm run secret-scan`, `npm run build` (Step 2), y el inventario de archivos tocados en Tasks 1-8.
- Produces: `docs/reception-ai/fase-0-report.md` en el formato exacto de la sección 22 del handoff — el entregable que cierra el Primer Sprint (Entregables 1 y 2) y determina si se puede pasar al siguiente gate (Fase 1, fuera de este plan).

- [ ] **Step 1: Confirmar (o agregar) cobertura de test para `lib/crypto/messaging.ts`**

Run: `grep -r "encryptMessagingSecret\|decryptMessagingSecret" tests/ 2>/dev/null` (o `Grep` con patrón `encryptMessagingSecret|decryptMessagingSecret` sobre `tests/`).
Si NO hay ningún test: crear `tests/messaging-crypto.test.ts` con un round-trip real (cifrar con una key de 32 bytes generada en el test, descifrar, comparar) y un caso que confirme que `decryptMessagingSecret` rechaza `algorithm: 'xchacha20poly1305'` con el mensaje de re-guardado (ver `lib/crypto/messaging.ts` líneas 59-62). Esto es lo que la Aceptación de Fase 0 del handoff llama "confirmar cifrado canónico" — **no** implica migrar datos existentes a este cifrado (eso es Fase 1).
Si SÍ hay cobertura existente: anotar en el reporte (Step 4) qué archivo la contiene, sin duplicar tests.

- [ ] **Step 2: Ejecutar la suite completa de verificación**

Run: `npm run typecheck && npm test -- --run && npm run lint:budget && npm run secret-scan`
Expected: los cuatro comandos en 0. Registrar el conteo exacto de test suites/tests y el conteo de errores de lint que reportan (no reutilizar los números del Task 1 sin volver a correrlos — pudieron cambiar).

- [ ] **Step 3: Intentar el build y documentar el resultado tal cual, sin inventar causa si falla**

Run: `npm run build`
Si falla por descarga TLS de Google Fonts (`next/font/google` en `app/layout.tsx`, confirmado en la Fase 0 del handoff, sección 16): registrar el error exacto obtenido y clasificarlo como falla de red del entorno, no de la aplicación — igual que documenta la sección 16 del handoff. No "arreglar" las fuentes en este plan (está fuera de alcance de Fase 0; si se decide resolverlo, es un task aparte con su propio plan). Si el build pasa en este entorno, registrar el resultado igual.

- [ ] **Step 4: Escribir `docs/reception-ai/fase-0-report.md` con el formato de la sección 22 del handoff**

Usar la plantilla exacta de la sección 22 de `HANDOFF_MAESTRO_V2_RECEPCION_IA_WHATSAPP_AGENDAMEDPRO.md`, con evidencia real (no inventada) de los Steps 1-3 de este task y del historial de commits de Tasks 1-8:

```markdown
## Fase 0 — Reporte

### Resultado
- [Completar tras Step 2/3: Completado / Bloqueado / Parcial — con justificación de una línea]

### Evidencia
- Comandos y resultados: [pegar aquí la salida real de typecheck/test/lint:budget/secret-scan/build del Step 2 y 3 de este task]
- Pruebas agregadas: tests/whatsapp-conversations-migration.test.ts, tests/secret-scan.test.ts, tests/whatsapp-validate-config-auth.test.ts, tests/messaging-config-secrets.test.ts, tests/whatsapp-settings-secrets.test.ts, tests/whatsapp-page-no-client-token-read.test.ts[, tests/messaging-crypto.test.ts si se agregó en Step 1]
- Capturas o logs sanitizados: [adjuntar resultado del smoke manual del Task 8 Step 5, sin tokens reales]

### Archivos modificados
- `.env.whatsapp.example`: reemplazar credenciales Twilio con forma real por placeholders
- `app/api/whatsapp/validate-config/route.ts`: exigir sesión + rate limit
- `app/api/messaging/config/route.ts`: DTO seguro (GET/POST nunca devuelven tokens)
- `app/api/user/whatsapp-settings/route.ts`: eliminar log de credenciales; GET expone booleanos en vez de tokens
- `app/dashboard/settings/whatsapp/page.tsx`: dejar de leer el token desde el navegador
- `package.json`, `.github/workflows/ci.yml`: agregar `secret-scan`
- `docs/fable-audit/21_API_AUTHORIZATION_MATRIX.md`: actualizar fila de `validate-config`

### Migraciones
- `supabase/migrations/20260824120000_whatsapp_conversations.sql`: reconcilia `whatsapp_conversations` (idempotente, `CREATE TABLE IF NOT EXISTS` + políticas envueltas en `DO $$`); compatible con producción exista o no la tabla ya. Rollback: `DROP TABLE IF EXISTS public.whatsapp_conversations;` **solo si nada ha escrito aún** en ese entorno.

### Riesgos pendientes
- Rotación real de credenciales Twilio (`docs/reception-ai/secret-rotation-plan.md`) — requiere operador humano con acceso a Twilio/Vercel; no ejecutada en este plan.
- Purga del historial de Git de las credenciales expuestas — requiere aprobación explícita separada (acción destructiva/compartida), documentada pero no ejecutada.
- `supabase migration list` / `supabase db dump` contra staging real (sección 16 del handoff) — requiere credenciales de un proyecto Supabase real que este entorno no tiene; documentado como paso manual en `docs/reception-ai/schema-reconciliation.md`.
- Build bloqueado por TLS a Google Fonts (si reprodujo en Step 3) — no corregido en este plan, es un problema de entorno de build, no de la aplicación.

### Feature flags
- Ninguna introducida en Fase 0 (no aplica — las banderas de la sección 13 del handoff llegan en Fase 1/2).

### Rollback probado
- Cada task de este plan es un commit independiente y reversible (`git revert <sha>`); la migración de Task 3 tiene rollback documentado arriba. No se probó un rollback real en este entorno — [confirmar si se hizo].

### Próximo gate
- Go para Fase 1 (Consolidación de mensajería) requiere, según la sección 21 del handoff: P0 cerrado (este plan), esquema reconciliado (Task 3 — con el `supabase migration list`/`dump` real pendiente de operador), y que la rotación de credenciales Twilio esté confirmada por el operador (`docs/reception-ai/secret-rotation-plan.md`).
```

- [ ] **Step 5: Commit final de Fase 0**

```bash
git add docs/reception-ai/fase-0-report.md
git commit -m "docs(reception-ai): reporte de cierre de Fase 0 (P0 seguridad + esquema)"
```

---

## Self-Review (completado al escribir este plan)

**Cobertura de spec:** Entregable 1 (baseline + `current-messaging-map.md` + `schema-reconciliation.md`) → Tasks 1-3. Entregable 2 (plan de rotación sin valores, retirar secretos de ejemplos, secret scanning, corregir GET/POST de configuración y página WhatsApp, autenticar/rate-limit validate-config, prueba automatizada de no exposición, confirmar cifrado canónico) → Tasks 4-9. Los hallazgos P0 de la sección 3 del handoff (5 items) tienen cada uno una tarea que lo cierra (ver tabla en Task 2). Entregables 3 y 4 del "Primer sprint" (esqueleto de adaptador Meta, feature flags, ingestión mínima en modo sombra) **no** están en este plan — dependen de que la rotación real de credenciales y la reconciliación de esquema contra staging (ambas requieren al operador humano) estén confirmadas primero, tal como exige el No-Go de la sección 14 del handoff ("Si no se puede demostrar rotación o esquema real, no continuar a conexión Meta"); deben ser un plan separado una vez cerrado ese gate.

**Placeholders:** ninguno — cada task trae código/SQL/markdown completo, sin "TBD" ni "agregar validación" genérico. Las únicas secciones con corchetes `[...]` son las del reporte final (Task 9 Step 4), que por diseño se llenan con evidencia real obtenida en Steps 1-3 del mismo task, no con contenido inventado por adelantado.

**Consistencia de tipos/nombres:** `getAuthUser()` (Task 5, 6) siempre desde `@/lib/auth-server`; `checkRateLimit`/`rateLimitHeaders` (Task 5) desde `@/lib/security/rate-limit` con la firma real de `lib/security/rate-limit.ts` (`{ limit, windowMs }` → `{ allowed, remaining, resetAt, retryAfterSeconds }`). `has_whatsapp_access_token` (Task 7, consumido por Task 8 vía `data.whatsapp_has_access_token`) y `has_whatsapp_access_token`/`has_whatsapp_webhook_verify_token` (Task 6, namespace distinto porque son DTOs de rutas y tablas distintas — `messaging_config` vs `user_profiles` — no deben confundirse ni unificarse en este plan).
