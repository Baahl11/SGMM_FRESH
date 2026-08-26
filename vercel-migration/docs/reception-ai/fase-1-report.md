## Fase 1 — Reporte

Fecha: 2026-08-25. Ejecutado sobre la rama `worktree-reception-ai-fase0`, siguiendo `docs/superpowers/plans/2026-08-25-recepcion-ia-fase1-mensajeria.md` (Task 5 de 5), spec `docs/superpowers/specs/2026-08-25-recepcion-ia-fase1-mensajeria-design.md`, tras el cierre de Fase 0 (`docs/reception-ai/fase-0-report.md`, commit `b8952697`).

### Resultado
- **Completado** — las 4 tareas de código de este plan (adaptador `MetaWhatsAppAdapter`, servicio canónico de credenciales con fallback, migración de la ruta piloto `whatsapp/send`, claim atómico en el worker) están implementadas, revisadas y con tests automatizados; suite completa (typecheck/test/lint-budget/secret-scan) en verde. `npm run build` no se ejecutó en esta sesión — no forma parte del alcance de esta task (a diferencia del cierre de Fase 0).

### Evidencia

Comandos ejecutados en fresco en esta sesión (Node 22.23.2, binario en `.node22/` — el sistema trae Node 20 y `vitest`/`vite`/`tsc` de este proyecto requieren Node 22):

```
$ tsc --noEmit -p tsconfig.json
exit 0

$ vitest run
Test Files  29 passed (29)
     Tests  93 passed (93)
   Duration  1.45s

$ node scripts/lint-budget.mjs
ESLint: 639 errores (presupuesto: 641)
✓ Dentro del presupuesto.

$ node scripts/secret-scan.mjs
secret-scan: OK (878 archivos revisados, 0 hallazgos).
```

Todos los comandos terminaron en código de salida 0. No se ejecutó `next build` en esta sesión (fuera del alcance del brief de esta task) ni se hizo ninguna llamada real a la Graph API de Meta (no existen credenciales reales de Meta para este proyecto — confirmado con el operador antes de iniciar Task 1).

- **Historial de tasks de este plan (commits, orden cronológico):**
  - `473dcf69` / `7f89aae2` — **Task 1, `MetaWhatsAppAdapter`** (`lib/messaging/adapters/meta-whatsapp.ts`, `lib/messaging/adapters/index.ts`, `tests/meta-whatsapp-adapter.test.ts`). Una ronda de corrección: el literal `extends ProviderCredentials` del brief no compilaba (una propiedad opcional entra en conflicto con la index signature de `ProviderCredentials`); se corrigió usando un tipo intersección (`type MetaWhatsAppCredentials = ProviderCredentials & {...}`), confirmado por el revisor como fiel a la intención del plan. También se corrigieron un import sin uso y un mensaje de commit que había quedado en inglés (ajustado a español, la convención de esta rama, mantenida en el resto de las tasks).
  - `00d87cca` — **Task 2, servicio canónico de credenciales** (`lib/messaging/provider-service.ts`, `tests/messaging-provider-service.test.ts`), `getWhatsAppCredentials()`. Una ronda solo de reporte (sin cambio de código): el reporte inicial del implementador omitió la corrida de `lint:budget`; se re-despachó para agregar esa evidencia. Aprobado por el revisor.
  - `83fc428a` / `0352f80f` — **Task 3, migración de la ruta piloto** `app/api/messaging/whatsapp/send/route.ts` (+ `tests/messaging-whatsapp-send-route.test.ts`) a `MetaWhatsAppAdapter`. Dos hallazgos reales durante la implementación:
    1. El implementador encontró un bug real de Vitest en el código literal de test del propio plan (`vi.doMock()` no se limpia con `vi.resetModules()`, causando flakiness dependiente del orden de ejecución) y lo corrigió ajustando el mecanismo de mocking del archivo de test (no sus aserciones), usando un patrón ya presente en otra parte del mismo archivo — verificado por el revisor como una corrección sólida, mínima y que preserva las aserciones originales.
    2. Ronda de corrección 1: el revisor encontró una regresión de comportamiento real heredada del propio código del Step 3 del plan — para el caso combinado específico "WhatsApp habilitado, credenciales ausentes/inválidas, Y límite diario de mensajes ya alcanzado", la ruta devolvía `429` en vez del `400` original. Se corrigió reordenando las validaciones para restaurar la precedencia original (404 → 400 no-habilitado/sin-credenciales → 429 límite-diario), con un test de regresión nuevo para ese caso combinado exacto. Re-revisión confirmó la corrección.
  - `55416113` — **Task 4, claim atómico en el worker** (`lib/workers/messaging-worker.ts`, `tests/messaging-worker-claim.test.ts`). Corrigió un bug de concurrencia real y preexistente (el worker podía procesar el mismo job dos veces bajo ejecución concurrente) agregando un método `claimJob()` atómico. Revisado limpio en la primera pasada, sin ronda de corrección.

### Archivos modificados (Tasks 1-4, orden cronológico)
- `473dcf69` — `lib/messaging/adapters/meta-whatsapp.ts` (nuevo), `lib/messaging/adapters/index.ts`, `tests/meta-whatsapp-adapter.test.ts` (nuevo).
- `7f89aae2` — `lib/messaging/adapters/meta-whatsapp.ts` (fix de tipo).
- `00d87cca` — `lib/messaging/provider-service.ts` (nuevo), `tests/messaging-provider-service.test.ts` (nuevo).
- `83fc428a` — `app/api/messaging/whatsapp/send/route.ts`, `tests/messaging-whatsapp-send-route.test.ts` (nuevo).
- `0352f80f` — `app/api/messaging/whatsapp/send/route.ts` (fix de precedencia), `tests/messaging-whatsapp-send-route.test.ts` (test de regresión agregado).
- `55416113` — `lib/workers/messaging-worker.ts`, `tests/messaging-worker-claim.test.ts` (nuevo).
- Este commit (Task 5) — `docs/reception-ai/fase-1-report.md` (nuevo).

### Ronda de corrección final (revisión de rama completa, posterior a Task 5)

Una revisión de la rama completa tras cerrar las 5 tasks encontró hallazgos que se corrigieron en una única ronda posterior:

- **Regresión real de contrato:** un fallo de red/transporte hacia la Graph API (sin respuesta HTTP) se estaba traduciendo a `400` con la fila marcada `failed`, cuando antes de Fase 1 producía `500` dejando la fila en `pending`. Se agregó `httpStatus?: number` a `SendMessageResult` (aditivo; Twilio/MessageBird/Plivo simplemente no lo publican): su ausencia en un resultado fallido es ahora la señal de "no hubo respuesta HTTP". `postToGraphApi()` lo publica en la rama de respuesta no-ok y deja `rawResponse` como el body crudo (antes lo pisaba con `{...data, status}`); `classifyError()` clasifica por `httpStatus` y trata su ausencia como `'retryable'`; la ruta piloto responde `500` sin tocar `whatsapp_messages` en ese caso.
- **Degradación del facade:** `getWhatsAppCredentials()` podía lanzar (envelope malformado o indescifrable) y saltarse el fallback legacy. Ahora degrada a `null` con un warning que nombra el modo de falla sin filtrar el payload.
- **Cobertura faltante:** tests nuevos para fallo de red (adaptador y ruta), consentimiento revocado (`403`), demo mode (`demo_mode: true`, sin llamada a Meta), fallback legacy ante credenciales canónicas corruptas, aserción sobre los filtros `.eq()` reales del camino canónico, y contabilidad de `skipped` en `processJobs()`.

Suite tras esta ronda (mismo entorno Node 22.23.2):

```
$ tsc --noEmit -p tsconfig.json
exit 0

$ vitest run
Test Files  29 passed (29)
     Tests  101 passed (101)

$ node scripts/lint-budget.mjs
ESLint: 639 errores (presupuesto: 641)
✓ Dentro del presupuesto.
```

### Riesgos pendientes
- **Sin credenciales reales de Meta para probar contra la Graph API real** — no existe ninguna credencial viva de Meta para este proyecto (confirmado con el operador antes de Task 1); toda la cobertura de `MetaWhatsAppAdapter` es contra mocks/fetch simulado.
- `parseWebhook`/`normalizeStatus` en el adaptador quedan explícitamente para Fase 2 (una vez que se toque el webhook mismo) — no implementados en este plan, por diseño (sección 3 del design spec).
- El guardado de configuración (`/api/messaging/config`) sigue escribiendo solo en `messaging_config`, no en `messaging_providers` — este plan solo agregó el fallback de lectura, nunca la escritura al esquema nuevo.
- La otra ruta de envío de WhatsApp (`app/api/whatsapp/send/route.ts`, la que sigue leyendo de `user_profiles`) no fue migrada — por diseño de esta fase se migró una sola ruta piloto (`app/api/messaging/whatsapp/send/route.ts`).
- No se unificó `whatsapp_messages` con la tabla canónica `messaging_messages`.
- `MetaWhatsAppAdapter.classifyError()` está pensado para resultados **fallidos**: ahora clasifica por `result.httpStatus` y trata su ausencia como `'retryable'` (fallo de transporte). Llamarlo sobre un resultado exitoso (que tampoco lleva `httpStatus`) devolvería `'retryable'`, lo cual no tiene sentido semántico pero es inocuo — ningún consumidor de producción lo llama todavía; documentado con un comentario en el método.
- El texto de fallback del adaptador para errores de la Graph API (`HTTP {status}: {statusText}`) difiere levemente del fallback genérico en español de la ruta original (`'Error desconocido'`) en el caso poco común de que la API de Meta devuelva un error sin campo `message` — mismo código de estado y misma forma de JSON, solo cambia el contenido del string en ese sub-caso.
- La rama `!config.whatsapp_enabled` de la ruta piloto no tiene un test de regresión dedicado (es un subconjunto de la condición combinada original; riesgo bajo según el revisor de la task).
- `getWhatsAppCredentials()` ahora hace dos lecturas secuenciales a la base de datos donde la ruta original hacía una (lectura de `messaging_config` en la ruta + una segunda lectura dentro del fallback legacy de la fachada) — una ventana TOCTOU estrecha que no existía antes, juzgada de riesgo despreciable por el revisor de la task ya que ambas lecturas apuntan a la misma fila dentro de la misma request.
- La llamada a `claimJob()` queda fuera del try/catch propio de `processJob()`, así que un error de base de datos genuino durante el claim mismo (a diferencia de "perdió la carrera contra otro worker") no recibe el mismo tratamiento de retry/backoff que una falla en tiempo de envío — simplemente cae al conteo de fallas genérico del loop externo. Esto coincide literalmente con lo que especificaba el brief del plan; señalado por el revisor de la task como un seguimiento futuro, no un defecto de la ejecución de esta task.
- **El camino canónico es estructuralmente inalcanzable a través de la ruta piloto hoy.** La ruta sigue validando existencia (`404`) y `whatsapp_enabled` (`400`) contra `messaging_config` *antes* de llamar a `getWhatsAppCredentials()`. Un usuario cuyas credenciales vivan solo en la tabla canónica `messaging_providers` (sin fila correspondiente en `messaging_config`) recibe un `404` y nunca llega a la búsqueda canónica-primero del facade. Task por task esto fue individualmente fiel al spec (límites y estado de habilitación permanecen en `messaging_config` por diseño), pero el efecto acumulado es que "canónico primero" es código muerto a través de esta ruta. Quien planifique la migración futura del guardado de `/api/messaging/config` para que escriba en `messaging_providers` tiene que mover al mismo tiempo el gate de existencia/habilitación, o esos usuarios recibirán 404.
- **Un `whatsapp_phone_number_id` faltante produce ahora un error distinto (con el mismo código de estado).** Antes, un usuario con token pero sin phone ID obtenía una fila insertada en `whatsapp_messages` y un 400 originado en el rechazo de la propia Meta; ahora el facade también exige `whatsapp_phone_number_id` y devuelve `null`, dando un 400 `{error:'WhatsApp no está habilitado o configurado'}` sin escribir fila alguna. Mismo código de estado, comportamiento discutiblemente mejor (falla antes, sin fila desperdiciada), pero el texto del body difiere del que un llamador podría haber visto antes.
- **(Diferido, no corregido en esta fase)** `MetaWhatsAppAdapter.validateCredentials()` no es reutilizado por `provider-service.ts`, que hace sus propias verificaciones de presencia en línea sin verificar que los valores descifrados sean efectivamente strings — un envelope canónico malformado con, por ejemplo, un `phone_number_id` numérico se interpolaría directo en la URL de la Graph API. Riesgo bajo hoy (no existen filas canónicas todavía), vale la pena un refactor a un validador compartido antes de que Fase 2 empiece a escribir filas canónicas reales.
- **(Diferido, no corregido en esta fase)** `claimJob()` no escribe las columnas `locked_at`/`locked_by` que el esquema de `messaging_jobs` ya provee (preexistente: tampoco se usaban antes de esta fase). Un job huérfano en estado `'processing'` (por ejemplo, una función serverless terminada a mitad de ejecución) no tiene timestamp por el cual recuperarlo. Vale la pena cablearlas si/cuando se construya un reaper de jobs atascados.

### Feature flags
- Ninguna introducida en Fase 1 (no aplica — las banderas de la sección 13 del handoff, si corresponden, llegan en fases posteriores).

### Rollback probado
- Cada task de este plan es un commit aditivo independiente y reversible (`git revert <sha>`), sin migraciones de base de datos. No se probó un rollback real (`git revert`) en este entorno durante esta sesión.

### Próximo gate
- Según la sección 14 del handoff (`HANDOFF_MAESTRO_V2_RECEPCION_IA_WHATSAPP_AGENDAMEDPRO.md`): Fase 2 requiere las migraciones `reception_*` y no está autorizada por este plan. Este plan (Fase 1 — consolidación de mensajería) queda cerrado con la suite completa en verde; el siguiente gate exige autorización explícita separada para las migraciones `reception_*` antes de iniciar cualquier trabajo de Fase 2.
