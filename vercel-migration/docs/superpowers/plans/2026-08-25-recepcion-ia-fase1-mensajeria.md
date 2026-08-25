# Recepción IA — Fase 1: Consolidación de mensajería Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear una sola capa de proveedor para WhatsApp vía Meta Cloud API (`MetaWhatsAppAdapter` + servicio canónico de credenciales), migrar una ruta piloto a esa capa, y corregir un bug real de concurrencia en el worker de mensajería — todo sin cambiar comportamiento visible ni requerir credenciales reales de Meta.

**Architecture:** Adaptador nuevo que implementa la interfaz `MessagingAdapter` ya existente (compatible sin cambios con `createAdapter()`/`MessagingWorker`), más métodos propios (`sendTemplate`, `validateConfiguration`, `classifyError`) que la interfaz compartida no tiene. Un servicio de credenciales resuelve primero desde `messaging_providers` (canónico, cifrado) y cae a `messaging_config` (legacy, comportamiento actual) solo en lectura — sin escribir en ningún almacén nuevo todavía. La ruta piloto (`app/api/messaging/whatsapp/send/route.ts`) reemplaza sus `fetch()` directos a Graph API por llamadas al adaptador, preservando exactamente su contrato externo. El worker gana un método `claimJob()` que hace el `UPDATE ... WHERE status='pending' ... RETURNING` atómico que hoy falta.

**Tech Stack:** Next.js 16 (App Router) / TypeScript / Supabase (Postgres) / Vitest 4 (`environment: 'node'`, sin jsdom/testing-library instalados) / Node 22 (usar el binario en `.node22/node-v22.23.2-win-x64/node.exe` si el Node del sistema es v20 — `vitest`/`vite` requieren ESM que v20 no resuelve bien en este entorno).

**Spec:** `docs/superpowers/specs/2026-08-25-recepcion-ia-fase1-mensajeria-design.md`

## Global Constraints

- No se necesita ninguna migración de Supabase nueva — `messaging_providers` ya soporta `channel='whatsapp', provider='meta_whatsapp'` (verificado en el spec, sección 2).
- No hay credenciales reales de Meta disponibles — todo el trabajo se prueba con mocks de `fetch`/Supabase, nunca contra la Graph API real.
- No cambiar el contrato externo (shape de respuesta JSON, códigos de estado, tablas usadas) de `app/api/messaging/whatsapp/send/route.ts`.
- No tocar `parseWebhook`/`app/api/webhooks/whatsapp/route.ts`, `app/api/messaging/config/route.ts` (el guardado), ni `app/api/whatsapp/send/route.ts` (la variante `user_profiles`) — fuera de alcance de esta fase (ver spec, sección 3).
- Ninguna feature flag nueva — este cambio no tiene superficie de usuario nueva.
- `npm run lint:budget` no puede superar el presupuesto vigente en `.lint-budget`.
- Todo el código nuevo sigue los patrones ya establecidos en el repo: tests planos en `tests/*.test.ts` con `vi.mock(...)`/`vi.doMock(...)` + `vi.resetModules()` para overrides por test (ver `tests/whatsapp-validate-config-auth.test.ts` como referencia de ese patrón).
- Commits pequeños por task, mensajes en el estilo ya usado en esta rama (`feat(...)`/`fix(...)`/`test(...)` en minúsculas, cuerpo en español).

---

## File Structure

**Crear:**
- `lib/messaging/adapters/meta-whatsapp.ts` — `MetaWhatsAppAdapter`, `MetaWhatsAppCredentials`, `GRAPH_API_VERSION`.
- `tests/meta-whatsapp-adapter.test.ts`
- `lib/messaging/provider-service.ts` — `getWhatsAppCredentials()`.
- `tests/messaging-provider-service.test.ts`
- `tests/messaging-whatsapp-send-route.test.ts`
- `tests/messaging-worker-claim.test.ts`
- `docs/reception-ai/fase-1-report.md`

**Modificar:**
- `lib/messaging/adapters/index.ts` — agregar `'meta_whatsapp'` a `SupportedProvider` y el caso en `createAdapter()`.
- `app/api/messaging/whatsapp/send/route.ts` — usar el adaptador + el servicio de credenciales en vez de `fetch()` directo.
- `lib/workers/messaging-worker.ts` — extraer `claimJob()` con `UPDATE ... WHERE status='pending'` atómico.

---

### Task 1: `MetaWhatsAppAdapter`

**Files:**
- Create: `lib/messaging/adapters/meta-whatsapp.ts`
- Modify: `lib/messaging/adapters/index.ts`
- Test: `tests/meta-whatsapp-adapter.test.ts`

**Interfaces:**
- Consumes: `MessagingAdapter`, `SendMessageRequest`, `SendMessageResult`, `ProviderCredentials` de `lib/messaging/types.ts` (ya existen, sin cambios).
- Produces: `MetaWhatsAppAdapter` (implementa `MessagingAdapter`), `MetaWhatsAppCredentials { phone_number_id: string; access_token: string; business_account_id?: string }`, `GRAPH_API_VERSION: string`. Los métodos propios `sendText({to, message})`, `sendTemplate({to, templateName, languageCode?})`, `validateConfiguration()`, `classifyError(result: SendMessageResult)` los consume Task 3 (la ruta piloto) directamente por nombre — no forman parte de `MessagingAdapter`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/meta-whatsapp-adapter.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAdapter } from '@/lib/messaging/adapters'
import { MetaWhatsAppAdapter, GRAPH_API_VERSION } from '@/lib/messaging/adapters/meta-whatsapp'

// Fase 1 (consolidacion de mensajeria): adaptador nuevo para WhatsApp via
// Meta Cloud API. Implementa MessagingAdapter (send/validateCredentials/
// getProviderName) para que createAdapter()/MessagingWorker lo reconozcan
// sin cambios, mas metodos propios (sendTemplate, validateConfiguration,
// classifyError) que la ruta piloto (Task 3) llama directamente. Sin
// credenciales reales de Meta -- todo con fetch mockeado.

function mockFetchOnce(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'status text',
    json: async () => body,
  } as Response)
}

const credentials = { phone_number_id: 'phone-1', access_token: 'token-1' }

describe('MetaWhatsAppAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getProviderName retorna meta_whatsapp', () => {
    const adapter = new MetaWhatsAppAdapter(credentials)
    expect(adapter.getProviderName()).toBe('meta_whatsapp')
  })

  it('validateCredentials exige phone_number_id y access_token', () => {
    const adapter = new MetaWhatsAppAdapter(credentials)
    expect(adapter.validateCredentials({ phone_number_id: 'x', access_token: 'y' })).toBe(true)
    expect(adapter.validateCredentials({ phone_number_id: 'x' })).toBe(false)
    expect(adapter.validateCredentials({})).toBe(false)
  })

  it('send() (interfaz MessagingAdapter) envia texto exitosamente', async () => {
    const fetchSpy = mockFetchOnce(200, { messages: [{ id: 'wamid.123' }] })
    const adapter = new MetaWhatsAppAdapter(credentials)

    const result = await adapter.send({ to: '5215500000000', message: 'hola' })

    expect(result).toEqual({
      success: true,
      messageId: 'wamid.123',
      provider: 'meta_whatsapp',
      rawResponse: { messages: [{ id: 'wamid.123' }] },
    })
    expect(fetchSpy).toHaveBeenCalledWith(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/phone-1/messages`,
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('sendTemplate() envia una plantilla con el nombre e idioma correctos', async () => {
    const fetchSpy = mockFetchOnce(200, { messages: [{ id: 'wamid.456' }] })
    const adapter = new MetaWhatsAppAdapter(credentials)

    const result = await adapter.sendTemplate({ to: '5215500000000', templateName: 'recordatorio_cita' })

    expect(result.success).toBe(true)
    expect(result.messageId).toBe('wamid.456')
    const [, options] = fetchSpy.mock.calls[0]
    const sentPayload = JSON.parse((options as RequestInit).body as string)
    expect(sentPayload.type).toBe('template')
    expect(sentPayload.template).toEqual({ name: 'recordatorio_cita', language: { code: 'es_MX' } })
  })

  it('send() reporta un error de Graph API como fallo con detalle', async () => {
    mockFetchOnce(401, { error: { message: 'Invalid OAuth access token' } })
    const adapter = new MetaWhatsAppAdapter(credentials)

    const result = await adapter.send({ to: '5215500000000', message: 'hola' })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid OAuth access token')
    expect(result.provider).toBe('meta_whatsapp')
  })

  it('classifyError marca 429/5xx como retryable', async () => {
    mockFetchOnce(429, { error: { message: 'Rate limited' } })
    const adapter = new MetaWhatsAppAdapter(credentials)
    const result = await adapter.send({ to: '5215500000000', message: 'hola' })

    expect(adapter.classifyError(result)).toBe('retryable')
  })

  it('classifyError marca 401/400 como non_retryable', async () => {
    mockFetchOnce(401, { error: { message: 'Invalid OAuth access token' } })
    const adapter = new MetaWhatsAppAdapter(credentials)
    const result = await adapter.send({ to: '5215500000000', message: 'hola' })

    expect(adapter.classifyError(result)).toBe('non_retryable')
  })

  it('validateConfiguration() exitoso retorna nombre verificado y numero', async () => {
    mockFetchOnce(200, { verified_name: 'Harmonizarte', display_phone_number: '+52 55 0000 0000' })
    const adapter = new MetaWhatsAppAdapter(credentials)

    const result = await adapter.validateConfiguration()

    expect(result).toEqual({ valid: true, verifiedName: 'Harmonizarte', phoneNumber: '+52 55 0000 0000' })
  })

  it('validateConfiguration() con error retorna valid:false y el mensaje', async () => {
    mockFetchOnce(400, { error: { message: 'Invalid parameter' } })
    const adapter = new MetaWhatsAppAdapter(credentials)

    const result = await adapter.validateConfiguration()

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid parameter')
  })

  it('createAdapter("meta_whatsapp", ...) construye un MetaWhatsAppAdapter', () => {
    const adapter = createAdapter('meta_whatsapp' as never, credentials)
    expect(adapter).toBeInstanceOf(MetaWhatsAppAdapter)
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run (usar Node 22 si el del sistema es v20, ver Global Constraints):
```
node_modules/vitest/vitest.mjs run tests/meta-whatsapp-adapter.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/messaging/adapters/meta-whatsapp'`.

- [ ] **Step 3: Implementar `lib/messaging/adapters/meta-whatsapp.ts`**

```ts
import type { MessagingAdapter, SendMessageRequest, SendMessageResult, ProviderCredentials } from '../types';

export const GRAPH_API_VERSION = 'v18.0';

export interface MetaWhatsAppCredentials extends ProviderCredentials {
  phone_number_id: string;
  access_token: string;
  business_account_id?: string;
}

export interface SendTemplateRequest {
  to: string;
  templateName: string;
  languageCode?: string;
}

export interface ValidateConfigurationResult {
  valid: boolean;
  error?: string;
  verifiedName?: string;
  phoneNumber?: string;
}

export type MetaErrorClass = 'retryable' | 'non_retryable';

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export class MetaWhatsAppAdapter implements MessagingAdapter {
  private credentials: MetaWhatsAppCredentials;

  constructor(credentials: MetaWhatsAppCredentials) {
    this.credentials = credentials;
  }

  getProviderName(): string {
    return 'meta_whatsapp';
  }

  validateCredentials(credentials: any): boolean {
    return !!(
      credentials?.phone_number_id &&
      credentials?.access_token &&
      typeof credentials.phone_number_id === 'string' &&
      typeof credentials.access_token === 'string'
    );
  }

  async send(request: SendMessageRequest): Promise<SendMessageResult> {
    return this.sendText({ to: request.to, message: request.message });
  }

  async sendText(request: { to: string; message: string }): Promise<SendMessageResult> {
    return this.postToGraphApi({
      messaging_product: 'whatsapp',
      to: request.to,
      type: 'text',
      text: { body: request.message },
    });
  }

  async sendTemplate(request: SendTemplateRequest): Promise<SendMessageResult> {
    return this.postToGraphApi({
      messaging_product: 'whatsapp',
      to: request.to,
      type: 'template',
      template: {
        name: request.templateName,
        language: { code: request.languageCode || 'es_MX' },
      },
    });
  }

  async validateConfiguration(): Promise<ValidateConfigurationResult> {
    try {
      const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.credentials.phone_number_id}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.credentials.access_token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        return { valid: false, error: data.error?.message || `HTTP ${response.status}` };
      }

      return {
        valid: true,
        verifiedName: data.verified_name,
        phoneNumber: data.display_phone_number,
      };
    } catch (error: any) {
      return { valid: false, error: error.message || 'Unknown error' };
    }
  }

  classifyError(result: SendMessageResult): MetaErrorClass {
    const status = (result.rawResponse as { status?: number } | undefined)?.status;
    if (typeof status === 'number' && RETRYABLE_STATUS_CODES.has(status)) {
      return 'retryable';
    }
    return 'non_retryable';
  }

  private async postToGraphApi(payload: Record<string, unknown>): Promise<SendMessageResult> {
    try {
      const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.credentials.phone_number_id}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          provider: this.getProviderName(),
          rawResponse: { ...data, status: response.status },
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        provider: this.getProviderName(),
        rawResponse: data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        provider: this.getProviderName(),
      };
    }
  }
}
```

- [ ] **Step 4: Registrar el proveedor en `lib/messaging/adapters/index.ts`**

Reemplazar todo el archivo:

```ts
/**
 * Messaging Adapters Factory
 */

import type { MessagingAdapter } from '../types';
import { TwilioAdapter, type TwilioCredentials } from './twilio';
import { MessageBirdAdapter, type MessageBirdCredentials } from './messagebird';
import { PlivoAdapter, type PlivoCredentials } from './plivo';
import { MetaWhatsAppAdapter, type MetaWhatsAppCredentials } from './meta-whatsapp';

export type SupportedProvider = 'twilio' | 'messagebird' | 'plivo' | 'meta_whatsapp';

export function createAdapter(
  provider: SupportedProvider,
  credentials: any
): MessagingAdapter {
  switch (provider) {
    case 'twilio':
      return new TwilioAdapter(credentials as TwilioCredentials);
    case 'messagebird':
      return new MessageBirdAdapter(credentials as MessageBirdCredentials);
    case 'plivo':
      return new PlivoAdapter(credentials as PlivoCredentials);
    case 'meta_whatsapp':
      return new MetaWhatsAppAdapter(credentials as MetaWhatsAppCredentials);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export { TwilioAdapter, MessageBirdAdapter, PlivoAdapter, MetaWhatsAppAdapter };
export type { TwilioCredentials, MessageBirdCredentials, PlivoCredentials, MetaWhatsAppCredentials };
```

- [ ] **Step 5: Ejecutar el test y confirmar que pasa**

Run: `node_modules/vitest/vitest.mjs run tests/meta-whatsapp-adapter.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 6: Typecheck**

Run: `node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add lib/messaging/adapters/meta-whatsapp.ts lib/messaging/adapters/index.ts tests/meta-whatsapp-adapter.test.ts
git commit -m "feat(messaging): agregar MetaWhatsAppAdapter"
```

---

### Task 2: Servicio canónico de credenciales (`lib/messaging/provider-service.ts`)

**Files:**
- Create: `lib/messaging/provider-service.ts`
- Test: `tests/messaging-provider-service.test.ts`

**Interfaces:**
- Consumes: `MetaWhatsAppCredentials` de `lib/messaging/adapters/meta-whatsapp.ts` (Task 1); `decryptMessagingSecret`, `isEncryptedSecretEnvelope` de `lib/crypto/messaging.ts` (ya existen, sin cambios); un cliente de Supabase pasado como parámetro (no crea su propio cliente — inyección de dependencia para que sea testeable sin `vi.mock`).
- Produces: `getWhatsAppCredentials(supabase: SupabaseClient, userId: string): Promise<MetaWhatsAppCredentials | null>`. Task 3 lo consume directamente.

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/messaging-provider-service.test.ts
import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { getWhatsAppCredentials } from '@/lib/messaging/provider-service'
import { encryptMessagingSecret } from '@/lib/crypto/messaging'

// Fase 1 (consolidacion de mensajeria): facade de solo lectura -- primero
// intenta el almacen canonico (messaging_providers, cifrado), y si no hay
// fila cae al legacy (messaging_config), igual que el comportamiento actual
// de la ruta piloto (Task 3). No escribe nada en ningun almacen.

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => result,
  }
  return builder
}

function makeSupabase(byTable: Record<string, { data: unknown; error: unknown }>) {
  return {
    from: (table: string) => makeQueryBuilder(byTable[table] ?? { data: null, error: null }),
  } as any
}

const CIPHER_KEY = randomBytes(32).toString('base64')

describe('getWhatsAppCredentials', () => {
  it('usa messaging_providers cuando hay una fila activa (canonico)', async () => {
    process.env.MESSAGING_CIPHER_KEY = CIPHER_KEY
    const envelope = await encryptMessagingSecret(
      { phone_number_id: 'phone-canonico', access_token: 'token-canonico' },
      CIPHER_KEY
    )

    const supabase = makeSupabase({
      messaging_providers: {
        data: { credentials_encrypted: JSON.stringify(envelope), status: 'active' },
        error: null,
      },
    })

    const result = await getWhatsAppCredentials(supabase, 'user-1')

    expect(result).toEqual({ phone_number_id: 'phone-canonico', access_token: 'token-canonico' })
    delete process.env.MESSAGING_CIPHER_KEY
  })

  it('cae a messaging_config cuando no hay fila en messaging_providers', async () => {
    const supabase = makeSupabase({
      messaging_providers: { data: null, error: null },
      messaging_config: {
        data: {
          whatsapp_enabled: true,
          whatsapp_phone_number_id: 'phone-legacy',
          whatsapp_business_id: 'biz-legacy',
          whatsapp_access_token: 'token-legacy',
        },
        error: null,
      },
    })

    const result = await getWhatsAppCredentials(supabase, 'user-1')

    expect(result).toEqual({
      phone_number_id: 'phone-legacy',
      access_token: 'token-legacy',
      business_account_id: 'biz-legacy',
    })
  })

  it('retorna null cuando ninguna fuente tiene configuracion usable', async () => {
    const supabase = makeSupabase({
      messaging_providers: { data: null, error: null },
      messaging_config: { data: { whatsapp_enabled: false }, error: null },
    })

    const result = await getWhatsAppCredentials(supabase, 'user-1')

    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `node_modules/vitest/vitest.mjs run tests/messaging-provider-service.test.ts`
Expected: FAIL — `Cannot find module '@/lib/messaging/provider-service'`.

- [ ] **Step 3: Implementar `lib/messaging/provider-service.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { decryptMessagingSecret, isEncryptedSecretEnvelope } from '@/lib/crypto/messaging';
import type { MetaWhatsAppCredentials } from './adapters/meta-whatsapp';

export async function getWhatsAppCredentials(
  supabase: SupabaseClient,
  userId: string
): Promise<MetaWhatsAppCredentials | null> {
  const canonical = await getFromMessagingProviders(supabase, userId);
  if (canonical) return canonical;

  return getFromMessagingConfig(supabase, userId);
}

async function getFromMessagingProviders(
  supabase: SupabaseClient,
  userId: string
): Promise<MetaWhatsAppCredentials | null> {
  const { data } = await supabase
    .from('messaging_providers')
    .select('credentials_encrypted, status')
    .eq('user_id', userId)
    .eq('channel', 'whatsapp')
    .eq('provider', 'meta_whatsapp')
    .eq('status', 'active')
    .maybeSingle();

  if (!data?.credentials_encrypted) return null;

  const cipherKey = process.env.MESSAGING_CIPHER_KEY;
  if (!cipherKey) return null;

  const envelope =
    typeof data.credentials_encrypted === 'string'
      ? JSON.parse(data.credentials_encrypted)
      : data.credentials_encrypted;

  if (!isEncryptedSecretEnvelope(envelope)) return null;

  const decrypted = await decryptMessagingSecret<MetaWhatsAppCredentials>(envelope, cipherKey);
  if (!decrypted?.phone_number_id || !decrypted?.access_token) return null;

  return decrypted;
}

async function getFromMessagingConfig(
  supabase: SupabaseClient,
  userId: string
): Promise<MetaWhatsAppCredentials | null> {
  const { data } = await supabase
    .from('messaging_config')
    .select('whatsapp_enabled, whatsapp_phone_number_id, whatsapp_business_id, whatsapp_access_token')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data?.whatsapp_enabled || !data.whatsapp_phone_number_id || !data.whatsapp_access_token) {
    return null;
  }

  return {
    phone_number_id: data.whatsapp_phone_number_id,
    access_token: data.whatsapp_access_token,
    business_account_id: data.whatsapp_business_id || undefined,
  };
}
```

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `node_modules/vitest/vitest.mjs run tests/messaging-provider-service.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck**

Run: `node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/messaging/provider-service.ts tests/messaging-provider-service.test.ts
git commit -m "feat(messaging): servicio canonico de credenciales con fallback a messaging_config"
```

---

### Task 3: Migrar `app/api/messaging/whatsapp/send/route.ts` al adaptador

**Files:**
- Modify: `app/api/messaging/whatsapp/send/route.ts`
- Test: `tests/messaging-whatsapp-send-route.test.ts`

**Interfaces:**
- Consumes: `MetaWhatsAppAdapter` (Task 1), `getWhatsAppCredentials` (Task 2).
- Produces: ninguna otra ruta depende de este archivo.

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/messaging-whatsapp-send-route.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Fase 1 (consolidacion de mensajeria): app/api/messaging/whatsapp/send/route.ts
// deja de hacer fetch() directo a Graph API y usa MetaWhatsAppAdapter +
// getWhatsAppCredentials(). Esta suite fija que el comportamiento externo
// (shape de respuesta, codigos de estado, limite diario, WHATSAPP_DRY_RUN)
// no cambio -- es una prueba de regresion, no de la implementacion nueva.

const getAuthUserMock = vi.fn()

function makeChain(result: { data: unknown; error: unknown }) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    insert: () => chain,
    update: () => chain,
    maybeSingle: async () => result,
    single: async () => result,
  }
  return chain
}

const MESSAGING_CONFIG_ROW = {
  whatsapp_enabled: true,
  current_daily_usage: 0,
  daily_message_limit: 1000,
  whatsapp_phone_number_id: 'phone-1',
  whatsapp_business_id: 'biz-1',
  whatsapp_access_token: 'token-1',
}

function makeSupabase(overrides: Record<string, { data: unknown; error: unknown }> = {}) {
  const tables: Record<string, { data: unknown; error: unknown }> = {
    messaging_config: { data: MESSAGING_CONFIG_ROW, error: null },
    messaging_providers: { data: null, error: null },
    whatsapp_messages: { data: { id: 'msg-1' }, error: null },
    ...overrides,
  }
  return {
    from: (table: string) => makeChain(tables[table] ?? { data: null, error: null }),
    rpc: async () => ({ data: null, error: null }),
  }
}

vi.mock('@/lib/auth-server', () => ({
  getAuthUser: () => getAuthUserMock(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => makeSupabase(),
}))

function postRequest(body: unknown) {
  return new Request('http://localhost/api/messaging/whatsapp/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/messaging/whatsapp/send (Fase 1: usa MetaWhatsAppAdapter)', () => {
  beforeEach(() => {
    getAuthUserMock.mockReset()
    getAuthUserMock.mockResolvedValue({ id: 'user-1', email: 'doc@example.com' })
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.WHATSAPP_DRY_RUN
  })

  it('rechaza con 401 sin sesion', async () => {
    getAuthUserMock.mockResolvedValue(null)
    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)
    expect(res.status).toBe(401)
  })

  it('envia exitosamente via el adaptador y conserva el shape de respuesta', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ messages: [{ id: 'wamid.789' }] }),
    } as Response)

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({
      success: true,
      message_id: 'msg-1',
      meta_message_id: 'wamid.789',
      dry_run: false,
      demo_mode: false,
      message: 'Mensaje enviado exitosamente',
    })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('usa sendTemplate cuando el body incluye template_name', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ messages: [{ id: 'wamid.tpl' }] }),
    } as Response)

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(
      postRequest({ to_phone: '5215500000000', message_body: 'hola', template_name: 'recordatorio_cita' }) as never
    )
    const body = await res.json()
    const [, options] = fetchSpy.mock.calls[0]
    const sentPayload = JSON.parse((options as RequestInit).body as string)

    expect(res.status).toBe(200)
    expect(body.meta_message_id).toBe('wamid.tpl')
    expect(sentPayload.type).toBe('template')
    expect(sentPayload.template.name).toBe('recordatorio_cita')
  })

  it('respeta WHATSAPP_DRY_RUN sin llamar a Meta', async () => {
    process.env.WHATSAPP_DRY_RUN = 'true'
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.dry_run).toBe(true)
    expect(body.meta_message_id).toMatch(/^dryrun_/)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('bloquea con 429 al alcanzar el limite diario, sin llamar a Meta', async () => {
    vi.doMock('@/lib/supabase/server', () => ({
      createClient: async () =>
        makeSupabase({
          messaging_config: {
            data: { ...MESSAGING_CONFIG_ROW, current_daily_usage: 1000 },
            error: null,
          },
        }),
    }))
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)

    expect(res.status).toBe(429)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('responde 404 si no hay configuracion de WhatsApp', async () => {
    vi.doMock('@/lib/supabase/server', () => ({
      createClient: async () => makeSupabase({ messaging_config: { data: null, error: null } }),
    }))

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)

    expect(res.status).toBe(404)
  })

  it('responde 400 si faltan credenciales aunque whatsapp_enabled sea true', async () => {
    vi.doMock('@/lib/supabase/server', () => ({
      createClient: async () =>
        makeSupabase({
          messaging_config: {
            data: { ...MESSAGING_CONFIG_ROW, whatsapp_access_token: null },
            error: null,
          },
        }),
    }))

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)

    expect(res.status).toBe(400)
  })

  it('propaga un error de Graph API como fallo 400 con el mensaje sanitizado', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: { message: 'Invalid OAuth access token' } }),
    } as Response)

    const { POST } = await import('@/app/api/messaging/whatsapp/send/route')
    const res = await POST(postRequest({ to_phone: '5215500000000', message_body: 'hola' }) as never)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.details).toBe('Invalid OAuth access token')
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `node_modules/vitest/vitest.mjs run tests/messaging-whatsapp-send-route.test.ts`
Expected: FAIL — el archivo actual sigue haciendo `fetch()` directo con la URL vieja (`v18.0/${config.whatsapp_phone_number_id}/messages` armada inline) y lee `config.whatsapp_access_token`/`current_daily_usage`/`daily_message_limit` de un único `select('*')`; varios asserts de shape/llamadas fallan.

- [ ] **Step 3: Implementar el cambio**

En `app/api/messaging/whatsapp/send/route.ts`, agregar el import (junto a los existentes):

```ts
import { MetaWhatsAppAdapter } from '@/lib/messaging/adapters/meta-whatsapp';
import { getWhatsAppCredentials } from '@/lib/messaging/provider-service';
```

Reemplazar el bloque `// Get user's WhatsApp configuration` hasta el fin del chequeo de límite diario (las líneas que hacen `select('*')` y verifican `whatsapp_enabled`/`whatsapp_access_token`/`current_daily_usage`) por:

```ts
    // Get user's WhatsApp configuration (limites y estado siguen viniendo
    // de messaging_config sin cambios; las credenciales de envio ahora
    // pasan por el facade de Fase 1)
    const { data: config, error: configError } = await supabase
      .from('messaging_config')
      .select('whatsapp_enabled, current_daily_usage, daily_message_limit')
      .eq('user_id', user.id)
      .maybeSingle();

    if (configError || !config) {
      return NextResponse.json(
        { error: 'No se encontró configuración de WhatsApp' },
        { status: 404 }
      );
    }

    if (!config.whatsapp_enabled) {
      return NextResponse.json(
        { error: 'WhatsApp no está habilitado o configurado' },
        { status: 400 }
      );
    }

    if (config.current_daily_usage >= config.daily_message_limit) {
      return NextResponse.json(
        { error: `Has alcanzado el límite diario de ${config.daily_message_limit} mensajes` },
        { status: 429 }
      );
    }

    const credentials = await getWhatsAppCredentials(supabase, user.id);
    if (!credentials) {
      return NextResponse.json(
        { error: 'WhatsApp no está habilitado o configurado' },
        { status: 400 }
      );
    }
```

Reemplazar el bloque que arma `whatsappApiUrl`/`messagePayload` y hace `fetch()` (desde `// Send message via WhatsApp Business API` hasta justo antes de `// Update message status to sent`) por:

```ts
    // Send message via the messaging adapter (Fase 1: consolidacion de mensajeria)
    let metaMessageId: string | undefined;
    let dryRun = false;

    if (process.env.WHATSAPP_DRY_RUN === 'true') {
      dryRun = true;
      metaMessageId = `dryrun_${Date.now()}`;
      console.log('[WhatsApp Send] 🧪 WHATSAPP_DRY_RUN activo, no se envía a Meta:', {
        userId: user.id,
        to: formattedPhone,
        template: template_name || null,
        messagePreview: String(message_body).slice(0, 120),
        metaMessageId,
      });
    } else {
      const adapter = new MetaWhatsAppAdapter(credentials);
      const sendResult = template_name
        ? await adapter.sendTemplate({ to: formattedPhone, templateName: template_name })
        : await adapter.sendText({ to: formattedPhone, message: message_body });

      if (!sendResult.success) {
        console.error('WhatsApp API error:', sendResult.rawResponse);

        await supabase
          .from('whatsapp_messages')
          .update({
            status: 'failed',
            error_code: (sendResult.rawResponse as any)?.error?.code || 'unknown',
            error_message: sendResult.error || 'Error desconocido',
            failed_at: new Date().toISOString(),
          })
          .eq('id', messageRecord.id);

        return NextResponse.json(
          {
            error: 'Error al enviar mensaje',
            details: sendResult.error || 'Error de WhatsApp API',
            success: false,
          },
          { status: 400 }
        );
      }

      metaMessageId = sendResult.messageId;
    }
```

Reemplazar el `return NextResponse.json({...})` final (el que tiene `dry_run: process.env.WHATSAPP_DRY_RUN === 'true'`) por:

```ts
    return NextResponse.json({
      success: true,
      message_id: messageRecord.id,
      meta_message_id: metaMessageId,
      dry_run: dryRun,
      demo_mode: false,
      message: 'Mensaje enviado exitosamente',
    });
```

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `node_modules/vitest/vitest.mjs run tests/messaging-whatsapp-send-route.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Typecheck y suite completa**

Run: `node_modules/typescript/bin/tsc --noEmit -p tsconfig.json && node_modules/vitest/vitest.mjs run`
Expected: typecheck exit 0; todos los tests (los nuevos más los ya existentes de Fase 0) en verde.

- [ ] **Step 6: Commit**

```bash
git add app/api/messaging/whatsapp/send/route.ts tests/messaging-whatsapp-send-route.test.ts
git commit -m "feat(messaging): migrar ruta piloto whatsapp/send a MetaWhatsAppAdapter"
```

---

### Task 4: Claim atómico en `lib/workers/messaging-worker.ts`

**Files:**
- Modify: `lib/workers/messaging-worker.ts`
- Test: `tests/messaging-worker-claim.test.ts`

**Interfaces:**
- Consumes: nada nuevo (el worker ya existe).
- Produces: `MessagingWorker.claimJob(jobId: string): Promise<boolean>` (método privado, se prueba con cast `as any` — patrón intencional para no exponer una API pública nueva solo para tests). `processJob()` cambia su tipo de retorno a `Promise<'processed' | 'skipped'>` y `ProcessingResult` gana el campo `skipped: number`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/messaging-worker-claim.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fase 1 (consolidacion de mensajeria): MessagingWorker.processJob hacia un
// SELECT status='pending' (en processJobs) y luego, por separado, un UPDATE
// incondicional a 'processing'. Dos invocaciones concurrentes del worker
// podian tomar el mismo job y enviarlo dos veces -- bug real, no
// hipotetico. Este test fija que claimJob() hace el UPDATE atomico
// (WHERE status='pending' ... RETURNING) y que dos llamadas concurrentes
// sobre el mismo job solo dejan ganar a una.

let jobStatus = 'pending'

function makeSupabase() {
  return {
    from: (table: string) => {
      if (table !== 'messaging_jobs') {
        throw new Error(`Tabla inesperada en este test: ${table}`)
      }
      return {
        update: (patch: { status?: string }) => ({
          eq: (_col1: string, _id: string) => ({
            eq: (_col2: string, expectedStatus: string) => ({
              select: async () => {
                if (jobStatus !== expectedStatus) {
                  return { data: [], error: null }
                }
                jobStatus = patch.status ?? jobStatus
                return { data: [{ id: 'job-1' }], error: null }
              },
            }),
          }),
        }),
      }
    },
  }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => makeSupabase(),
}))

describe('MessagingWorker.claimJob (claim atomico)', () => {
  beforeEach(() => {
    jobStatus = 'pending'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
  })

  it('dos claims concurrentes sobre el mismo job: solo uno gana', async () => {
    const { MessagingWorker } = await import('@/lib/workers/messaging-worker')
    const worker = new MessagingWorker() as any

    const [first, second] = await Promise.all([
      worker.claimJob('job-1'),
      worker.claimJob('job-1'),
    ])

    expect([first, second].filter(Boolean)).toHaveLength(1)
    expect([first, second].filter((v) => v === false)).toHaveLength(1)
  })

  it('un claim sobre un job que ya no esta pending retorna false', async () => {
    jobStatus = 'processing'
    const { MessagingWorker } = await import('@/lib/workers/messaging-worker')
    const worker = new MessagingWorker() as any

    const claimed = await worker.claimJob('job-1')

    expect(claimed).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `node_modules/vitest/vitest.mjs run tests/messaging-worker-claim.test.ts`
Expected: FAIL — `worker.claimJob is not a function` (el método todavía no existe).

- [ ] **Step 3: Implementar el fix en `lib/workers/messaging-worker.ts`**

Agregar el campo `skipped` a la interfaz `ProcessingResult`:

```ts
interface ProcessingResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: string[];
}
```

En `processJobs()`, inicializar el campo y ajustar el conteo del loop:

```ts
  async processJobs(): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Fetch pending jobs ordered by run_at
      const { data: jobs, error: jobsError } = await supabase
        .from('messaging_jobs')
        .select('*')
        .eq('status', 'pending')
        .lte('run_at', new Date().toISOString())
        .order('run_at', { ascending: true })
        .limit(this.maxBatchSize);

      if (jobsError) {
        result.errors.push(`Failed to fetch jobs: ${jobsError.message}`);
        return result;
      }

      if (!jobs || jobs.length === 0) {
        return result; // No jobs to process
      }

      // Process each job
      for (const job of jobs) {
        try {
          const outcome = await this.processJob(job as MessagingJob);
          if (outcome === 'skipped') {
            result.skipped++;
          } else {
            result.processed++;
            result.succeeded++;
          }
        } catch (error: any) {
          result.processed++;
          result.failed++;
          result.errors.push(`Job ${job.id}: ${error.message}`);
          console.error(`Error processing job ${job.id}:`, error);
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Worker error: ${error.message}`);
      return result;
    }
  }
```

Agregar el nuevo método `claimJob()` justo antes de `processJob()`, y cambiar la primera línea de `processJob()` (el `await supabase.from('messaging_jobs').update({status:'processing',...}).eq('id', job.id);` incondicional) por la llamada al claim:

```ts
  /**
   * Reclama un job de forma atomica: solo pasa a 'processing' si sigue
   * 'pending'. Devuelve false si otro worker ya lo tomo primero.
   */
  private async claimJob(jobId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('messaging_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('status', 'pending')
      .select();

    if (error) {
      throw new Error(`Failed to claim job ${jobId}: ${error.message}`);
    }

    return Boolean(data && data.length > 0);
  }

  /**
   * Process a single messaging job
   */
  private async processJob(job: MessagingJob): Promise<'processed' | 'skipped'> {
    const claimed = await this.claimJob(job.id);
    if (!claimed) {
      return 'skipped';
    }

    try {
      // Get the message
      const { data: message, error: messageError } = await supabase
        .from('messaging_messages')
        .select('*')
        .eq('id', job.message_id)
        .single();

      if (messageError || !message) {
        throw new Error(`Message not found: ${job.message_id}`);
      }

      const msg = message as MessagingMessage;

      // Get the provider credentials
      const { data: provider, error: providerError } = await supabase
        .from('messaging_providers')
        .select('*')
        .eq('user_id', msg.user_id)
        .eq('channel', msg.channel)
        .eq('status', 'active')
        .single();

      if (providerError || !provider) {
        throw new Error(`No active provider found for channel: ${msg.channel}`);
      }

      const prov = provider as MessagingProvider;

      // Decrypt credentials
      const credentials = await this.decryptCredentials(
        prov.credentials_encrypted
      );

      // Create adapter and send message
      const adapter = createAdapter(
        prov.provider as SupportedProvider,
        credentials
      );

      const destination = msg.to_contact?.phone || msg.to_contact?.email;
      if (!destination) {
        throw new Error('Mensaje sin destino (phone o email)');
      }

      const sendResult = await adapter.send({
        to: destination,
        message: msg.body || '',
      });

      if (sendResult.success) {
        // Update message as sent
        await supabase
          .from('messaging_messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            provider_message_id: sendResult.messageId,
            payload: {
              ...(message.payload || {}),
              provider_response: sendResult.rawResponse,
            },
          })
          .eq('id', job.message_id);

        // Mark job as completed
        await supabase
          .from('messaging_jobs')
          .update({
            status: 'done',
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        return 'processed';
      } else {
        throw new Error(sendResult.error || 'Unknown send error');
      }
    } catch (error: any) {
      // Update message as failed
      await supabase
        .from('messaging_messages')
        .update({
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
        })
        .eq('id', job.message_id);

      // Check if we should retry
      const shouldRetry = job.attempts < 3;

      if (shouldRetry) {
        // Schedule retry with exponential backoff
        const retryDelay = Math.min(300, 60 * Math.pow(2, job.attempts)); // Max 5 minutes
        const nextAttempt = new Date(Date.now() + retryDelay * 1000);

        await supabase
          .from('messaging_jobs')
          .update({
            status: 'pending',
            attempts: job.attempts + 1,
            run_at: nextAttempt.toISOString(),
            last_error: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      } else {
        // Max retries reached
        await supabase
          .from('messaging_jobs')
          .update({
            status: 'failed',
            last_error: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      }

      throw error;
    }
  }
```

El resto de la clase (`decryptCredentials`, `runMessagingWorker`, los imports del archivo) queda exactamente igual — solo se agregó `skipped` a `ProcessingResult`, el método `claimJob`, y se cambió el arranque + tipo de retorno de `processJob`.

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `node_modules/vitest/vitest.mjs run tests/messaging-worker-claim.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck y suite completa**

Run: `node_modules/typescript/bin/tsc --noEmit -p tsconfig.json && node_modules/vitest/vitest.mjs run`
Expected: typecheck exit 0; todos los tests en verde (incluidos los de Fase 0 y los Tasks 1-3 de esta fase).

- [ ] **Step 6: Commit**

```bash
git add lib/workers/messaging-worker.ts tests/messaging-worker-claim.test.ts
git commit -m "fix(messaging): claim atomico de messaging_jobs para evitar duplicados concurrentes"
```

---

### Task 5: Verificación final y reporte de Fase 1

**Files:**
- Create: `docs/reception-ai/fase-1-report.md`

**Interfaces:**
- Consumes: resultados reales de `typecheck`, `test`, `lint:budget`, `secret-scan` de esta sesión, y el historial de commits de Tasks 1-4.
- Produces: documento de cierre, mismo formato que `docs/reception-ai/fase-0-report.md`.

- [ ] **Step 1: Ejecutar la suite completa de verificación**

Run:
```
node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
node_modules/vitest/vitest.mjs run
node scripts/lint-budget.mjs
node scripts/secret-scan.mjs
```
Expected: los cuatro comandos en 0. Registrar el conteo exacto de test files/tests y el conteo de errores de lint que reportan — no reutilizar cifras de sesiones anteriores.

- [ ] **Step 2: Escribir `docs/reception-ai/fase-1-report.md`**

Usar el mismo formato que `docs/reception-ai/fase-0-report.md` (secciones: Resultado, Evidencia, Archivos modificados, Riesgos pendientes, Feature flags, Rollback probado, Próximo gate), con evidencia real del Step 1 y del historial de commits de Tasks 1-4 de este plan. En "Riesgos pendientes" incluir explícitamente: sin credenciales reales de Meta para probar contra la Graph API real; `parseWebhook`/`normalizeStatus` quedan para Fase 2; el guardado de configuración (`/api/messaging/config`) sigue escribiendo solo en `messaging_config`, no en `messaging_providers`. En "Próximo gate" citar la sección 14 del handoff: Fase 2 requiere las migraciones `reception_*` y no está autorizada por este plan.

- [ ] **Step 3: Commit**

```bash
git add docs/reception-ai/fase-1-report.md
git commit -m "docs(reception-ai): reporte de cierre de Fase 1 (consolidacion de mensajeria)"
```

---

## Self-Review (completado al escribir este plan)

**Cobertura de spec:** sección 4.1 (adaptador) → Task 1. Sección 4.2 (servicio de credenciales) → Task 2. Sección 4.3 (ruta piloto) → Task 3. Sección 4.4 (claim atómico) → Task 4. Sección 6 (pruebas) → una suite por task. Sección 7 (rollback) → cada task es un commit aditivo independiente, sin migraciones. Sección 8 (criterios de aceptación) → cubiertos por las pruebas de cada task; el reporte final (Task 5) los deja documentados con evidencia.

**Placeholders:** ninguno — cada task trae código completo (adaptador, servicio, diffs exactos de la ruta, worker) y tests completos, no descripciones de qué probar.

**Consistencia de tipos/nombres:** `MetaWhatsAppCredentials` (Task 1) es el mismo tipo que consume `getWhatsAppCredentials` (Task 2) y que instancia `new MetaWhatsAppAdapter(credentials)` en la ruta (Task 3). `sendText`/`sendTemplate` (Task 1) son los nombres exactos que llama la ruta (Task 3) — no `sendMessage` ni otra variante. `claimJob`/`processJob` (Task 4) devuelven los literales `'processed' | 'skipped'` consistentemente entre la firma del método y su uso en `processJobs()`.
