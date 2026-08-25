# Recepción IA — Fase 1: Consolidación compatible de mensajería (diseño)

**Fecha:** 2026-08-25
**Spec fuente:** `HANDOFF_MAESTRO_V2_RECEPCION_IA_WHATSAPP_AGENDAMEDPRO.md`, sección 14 ("Fase 1 — Consolidación compatible de mensajería") y sección 7.2 (Adaptador).
**Precondición verificada:** los tres requisitos de la sección 21 del handoff para autorizar esta fase ya están cerrados — P0 de seguridad (Fase 0, commit `b8952697`), esquema reconciliado (`docs/reception-ai/schema-reconciliation.md`, commit `800dc3d4`), rotación de credenciales confirmada (`docs/reception-ai/secret-rotation-plan.md`, commit `b911a5f8`).

---

## 1. Objetivo

Crear una sola capa de proveedor para WhatsApp vía Meta Cloud API **sin cambiar comportamiento visible** para los usuarios actuales. Esta fase es estructural: adaptador + servicio de credenciales + una ruta piloto migrada + un fix de concurrencia en el worker. No conecta ningún número real de Meta, no toca el webhook de entrada, y no cambia UI.

## 2. Estado actual verificado (no asumido)

- `lib/messaging/adapters/index.ts` define `SupportedProvider = 'twilio' | 'messagebird' | 'plivo'` y `createAdapter()`. La interfaz `MessagingAdapter` (`lib/messaging/types.ts`) tiene tres métodos: `send()`, `validateCredentials()`, `getProviderName()`.
- `lib/workers/messaging-worker.ts` (`MessagingWorker.processJob`) ya está completamente desacoplado del proveedor: lee `messaging_providers`, descifra con `lib/crypto/messaging.ts` + `MESSAGING_CIPHER_KEY`, y llama `createAdapter(prov.provider, credentials).send(...)`. **No requiere cambios** para reconocer un proveedor nuevo — solo que `createAdapter()` sepa construirlo.
- `messaging_providers` (migración `20251107_messaging_core.sql`) ya tiene `channel CHECK (... 'whatsapp' ...)` y `provider CHECK (... 'meta_whatsapp' ...)`, `credentials_encrypted TEXT`, `config JSONB`, `UNIQUE (user_id, channel)`. **No se necesita ninguna migración nueva** para esta fase.
- `app/api/messaging/whatsapp/send/route.ts` (la ruta piloto elegida) es **síncrona** — no pasa por `messaging_jobs`/el worker. Lee credenciales de `messaging_config.whatsapp_*` (no de `messaging_providers`), hace `fetch()` directo a `https://graph.facebook.com/v18.0/...` en dos puntos del archivo (versión hardcodeada), y escribe registros en la tabla `whatsapp_messages` (**no** en `messaging_messages`, la tabla canónica que sí usa el worker). Ya contempla: consentimiento (`patient_whatsapp_consent`), modo demo (`resolveDemoModeConfig`), límite diario, y `WHATSAPP_DRY_RUN`.
- **Bug de concurrencia real en el worker** (no hipotético): `MessagingWorker.processJobs()` hace `SELECT ... WHERE status='pending'` y luego, en `processJob()`, un `UPDATE` separado a `status='processing'`. Dos invocaciones concurrentes del worker (crons solapados, dos instancias serverless) pueden tomar el mismo job antes de que cualquiera lo marque `processing`, produciendo un envío duplicado al paciente.
- No hay credenciales reales de Meta/WhatsApp Cloud API disponibles (confirmado por el operador: la consola de Twilio no tiene ninguna API key, y no hay ninguna app de Meta creada todavía). Esta fase se construye y prueba **solo con mocks**.

## 3. Alcance

**Dentro de esta fase:**
- Adaptador `MetaWhatsAppAdapter` (envío de texto y plantilla, validación de configuración, clasificación de error).
- Servicio de credenciales canónico con fallback de compatibilidad (lectura únicamente).
- Migración de `app/api/messaging/whatsapp/send/route.ts` al adaptador nuevo (sin cambiar su contrato externo ni su tabla de almacenamiento).
- Fix de claim atómico en `lib/workers/messaging-worker.ts` (aplica a todos los proveedores, no solo Meta).
- Pruebas unitarias de las cuatro piezas anteriores.

**Fuera de alcance (decisión explícita, no un olvido):**
- `parseWebhook` / `normalizeStatus` del adaptador — requieren tocar `app/api/webhooks/whatsapp/route.ts`, que es Fase 2 ("Ingestión idempotente y modo sombra").
- Migrar el **guardado** de configuración (`app/api/messaging/config/route.ts`) para que escriba en `messaging_providers` en vez de `messaging_config` — es un cambio de superficie visible más grande; queda para una tarea propia.
- Migrar `app/api/whatsapp/send/route.ts` (la variante que lee `user_profiles.whatsapp_access_token`) — solo se migra una ruta piloto por fase, según el handoff.
- Unificar `whatsapp_messages` con `messaging_messages` — no está en la lista de tareas de Fase 1 del handoff.
- Cualquier tráfico real a la Graph API de Meta — no hay credenciales para probarlo.
- Feature flags nuevas — ninguna de las flags de la sección 13 del handoff aplica a un cambio puramente estructural sin superficie de usuario nueva.

## 4. Diseño

### 4.1 `lib/messaging/adapters/meta-whatsapp.ts` — `MetaWhatsAppAdapter`

Implementa la interfaz `MessagingAdapter` existente (`send()`, `validateCredentials()`, `getProviderName()`) para que `createAdapter('meta_whatsapp', credentials)` y, por extensión, `MessagingWorker` lo reconozcan sin cambios adicionales. `send()` internamente hace un envío de texto simple (`type: 'text'`).

Además de la interfaz base, expone métodos propios que la interfaz compartida no tiene y que Twilio/MessageBird/Plivo no necesitan:
- `sendTemplate(request: { to: string; templateName: string; languageCode?: string }): Promise<SendMessageResult>` — payload `type: 'template'`.
- `validateConfiguration(): Promise<{ valid: boolean; error?: string; verifiedName?: string; phoneNumber?: string }>` — GET server-side a `https://graph.facebook.com/{GRAPH_VERSION}/{phone_number_id}`, mismo patrón ya usado (y ya autenticado/rate-limited desde Fase 0) en `app/api/whatsapp/validate-config/route.ts`.
- `classifyError(rawError: unknown): 'retryable' | 'non_retryable'` — errores de red/5xx/rate-limit de Meta son reintentables; errores de credencial inválida/permiso/parámetro son no-reintentables (evita reintentar infinitamente un token muerto).

Credenciales tipadas:
```ts
export interface MetaWhatsAppCredentials extends ProviderCredentials {
  phone_number_id: string;
  business_account_id: string;
  access_token: string;
}
```

La versión de Graph API (`v18.0` hoy repetida y hardcodeada en `app/api/whatsapp/send/route.ts`, `app/api/messaging/whatsapp/send/route.ts`, `app/api/webhooks/whatsapp/route.ts`) se centraliza como una única constante `GRAPH_API_VERSION` exportada desde este archivo — nada más la consume todavía; la migración de las otras rutas a esta constante es trabajo de una fase posterior, no de esta.

`createAdapter()` en `lib/messaging/adapters/index.ts` agrega el caso `'meta_whatsapp'`, y `SupportedProvider` se amplía con ese literal.

### 4.2 `lib/messaging/provider-service.ts` — servicio canónico de credenciales

Una función server-only:

```ts
export async function getWhatsAppCredentials(
  supabase: SupabaseClient,
  userId: string
): Promise<MetaWhatsAppCredentials | LegacyMessagingConfigCredentials | null>
```

Orden de resolución (facade de compatibilidad, solo lectura en esta fase):
1. Busca en `messaging_providers` una fila `user_id = userId, channel = 'whatsapp', provider = 'meta_whatsapp', status = 'active'`. Si existe, descifra `credentials_encrypted` con `decryptMessagingSecret` (`lib/crypto/messaging.ts` + `MESSAGING_CIPHER_KEY`) y la retorna — este es el camino canónico, hoy vacío en la práctica porque nadie ha guardado ahí todavía.
2. Si no hay fila, cae a leer `messaging_config.whatsapp_*` para ese `user_id` — el comportamiento exacto de hoy, sin cambios.
3. Si ninguna de las dos fuentes tiene configuración utilizable (`whatsapp_enabled`/`status='active'` falso, o campos requeridos ausentes), retorna `null`.

No hay escritura nueva en esta función ni en esta fase. `messaging_config` no se modifica, no se marca para borrar, no se le quita ningún lector existente.

### 4.3 Migración de `app/api/messaging/whatsapp/send/route.ts`

Reemplaza los dos bloques de `fetch()` directo a Graph API por:
```ts
const credentials = await getWhatsAppCredentials(supabase, user.id);
// ... mismos checks de whatsapp_enabled/consentimiento/límite diario que hoy, sin cambios ...
const adapter = new MetaWhatsAppAdapter(credentials);
const result = template_name
  ? await adapter.sendTemplate({ to: formattedPhone, templateName: template_name })
  : await adapter.sendText({ to: formattedPhone, message: message_body });
```
`WHATSAPP_DRY_RUN` se preserva igual: la ruta sigue interceptando **antes** de instanciar el adaptador (mismo punto donde hoy genera `dryrun_${Date.now()}` y hace `console.log`), exactamente como ya lo hace — el adaptador ni se construye ni se llama en ese caso. Todo lo demás del archivo (consentimiento, modo demo, tabla `whatsapp_messages`, límite diario, shape de la respuesta JSON) permanece idéntico.

### 4.4 Fix de claim atómico — `lib/workers/messaging-worker.ts`

`processJob()` reemplaza el `UPDATE` de "marcar processing" (hoy incondicional, después del `SELECT`) por un `UPDATE ... WHERE id = job.id AND status = 'pending'` que además hace `.select()` del resultado. Si el update afecta 0 filas (`data` vacío), otro worker ya reclamó ese job — se hace `return` inmediatamente sin procesarlo ni contarlo como error. Si afecta 1 fila, este worker es dueño exclusivo del job y continúa exactamente como hoy. No cambia la forma en que `processJobs()` selecciona el batch inicial (ese `SELECT` puede seguir devolviendo el mismo job a dos workers; lo que cambia es que solo uno gana el claim atómico siguiente).

## 5. Manejo de errores

- Errores de Graph API en `MetaWhatsAppAdapter`: se capturan, se clasifican (`classifyError`), y se devuelven en el mismo `SendMessageResult` shape que ya usan Twilio/MessageBird/Plivo (`{ success: false, error, provider, rawResponse }`) — el worker y la ruta piloto no necesitan saber qué proveedor falló.
- El worker, al recibir un `send()` fallido, sigue su lógica de reintento existente (`job.attempts < 3`, backoff exponencial) sin cambios — no se liga la clasificación retryable/non_retryable del adaptador a esa lógica en esta fase (mejora futura, no bloqueante).
- El claim atómico fallido (0 filas) no es un error — es un resultado esperado de concurrencia normal, se registra como job saltado, no como fallo.

## 6. Plan de pruebas

Todas con Vitest, `environment: 'node'`, mocks de `fetch`/Supabase — mismo patrón que las suites de Fase 0 (`vi.mock('@/lib/supabase/server', ...)`).

- **`tests/meta-whatsapp-adapter.test.ts`**: `send()`/`sendTemplate()` éxito y error de Graph (401/429/400), `validateConfiguration()` éxito/error, `classifyError()` para cada categoría, `validateCredentials()` con credenciales incompletas.
- **`tests/messaging-provider-service.test.ts`**: resuelve desde `messaging_providers` cuando existe fila activa; cae a `messaging_config` cuando no existe; retorna `null` cuando ninguna fuente tiene configuración usable; nunca incluye el token en ningún log (mismo contrato de Fase 0).
- **`tests/messaging-whatsapp-send-route.test.ts`**: regresión de comportamiento actual (consentimiento, límite diario, modo demo, `WHATSAPP_DRY_RUN`) más el caso feliz ahora pasando por el adaptador — mismo shape de respuesta JSON que antes.
- **`tests/messaging-worker-claim.test.ts`**: dos invocaciones de `processJobs()`/`processJob()` concurrentes (`Promise.all`) contra el mismo job pendiente mockeado — exactamente una lo procesa, la otra lo salta sin error.

Verificación final de la fase: `npm run typecheck && npm test -- --run && npm run lint:budget && npm run secret-scan` en verde, igual que el cierre de Fase 0.

## 7. Rollback

Cada pieza es aditiva o un fix acotado — no hay migraciones destructivas ni cambios de esquema que revertir:
- Adaptador y servicio de credenciales: archivos nuevos, revertir es borrarlos / `git revert`.
- Ruta piloto: un `git revert` del commit puntual regresa al `fetch()` directo.
- Fix del worker: un `git revert` regresa al `UPDATE` no-atómico (reintroduce el bug, no rompe nada nuevo).
- Nada de esto depende de credenciales reales de Meta ni de tráfico real — no hay riesgo de afectar producción por su ausencia.

## 8. Criterios de aceptación (mapeados 1:1 a la sección 14 del handoff)

| Criterio del handoff | Cómo se verifica |
|---|---|
| Ninguna llamada Meta nueva fuera del adaptador | Único punto de `fetch()` a `graph.facebook.com` en el código tocado es dentro de `meta-whatsapp.ts` |
| Proveedores actuales siguen pasando pruebas | Suite completa (Twilio/MessageBird/Plivo) en verde, sin modificar esos archivos |
| No cambia UI/flujo de usuarios sin flag | Test de regresión de la ruta piloto (sección 6) — mismo shape de respuesta, mismas tablas |
| Duplicados concurrentes cubiertos por prueba | `tests/messaging-worker-claim.test.ts` |
| Rollback desactiva Meta sin afectar recordatorios existentes | Rollback es reversión de commits aditivos (sección 7); no toca Twilio/MessageBird/Plivo |
