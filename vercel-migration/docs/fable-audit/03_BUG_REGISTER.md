# 03 — Registro de bugs y hallazgos

Auditoría fable · 2026-06-11/12. Cada hallazgo sigue la plantilla de la sección 11 del prompt maestro. Evidencia = ruta:línea **en el ZIP original** (commit baseline `b26cb87`); el estado refleja la rama `audit/fable-agendamedpro-20260610`.

Convención de estados: **CORREGIDO** (código en la rama, verificado) · **MIGRACIÓN LISTA** (SQL escrito, *pendiente de aplicar* con backup/staging) · **ELIMINADO** · **PARCIAL** · **DOCUMENTADO** (decisión abierta).

---

## P0 — Críticos

### C1 — Endpoint de debug expone datos reales de pacientes sin autenticación
- **Severidad:** P0 · **Capa:** API · **Tipo:** Exposición de datos / falta de auth
- **Evidencia:** `app/api/debug/schema/route.ts` (GET sin auth; usa service role; `select('*').limit(1)` sobre `patients` y `appointments` devolviendo la fila al cliente; `export const runtime = 'edge'`).
- **Estado:** **ELIMINADO** (commit fase 1) + test `tests/debug-endpoints-absent.test.ts` que falla si el path reaparece.
- **Impacto:** Cualquier persona en internet obtenía una ficha real de paciente (nombre, teléfono, email, notas) y de cita. Violación directa de confidencialidad de datos de salud.
- **Reproducir (en baseline):** `curl https://<host>/api/debug/schema` → 200 con datos.
- **Causa raíz:** Herramienta de diagnóstico de desarrollo desplegada a producción; sin gate de entorno ni auth.
- **Cambio:** Eliminación del directorio `app/api/debug/` completo.
- **Pruebas:** Test de ausencia (5 asserts de FS) en verde.
- **Riesgo residual:** Datos ya expuestos históricamente no son recuperables; los logs de acceso del host dirían cuántas veces se consultó (acción doc 09).
- **Rollback:** No aplica (no debe volver). Para diagnóstico futuro: endpoint tras auth de owner + flag de entorno.
- **Siguiente acción:** Revisar logs de Vercel por accesos históricos a `/api/debug/*` (operador).

### C2 — Actualización de citas sin autenticación ni tenant
- **Severidad:** P0 · **Capa:** API · **Tipo:** Falta de auth + cross-tenant write
- **Evidencia:** `app/api/appointments/[id]/route.ts` — PUT usaba `supabaseAdmin` sin verificar sesión y actualizaba `.eq('id', id)` sin filtro de `user_id` (el DELETE del mismo archivo sí filtraba — la asimetría confirma el descuido).
- **Estado:** **CORREGIDO** + tests (`tests/appointments-id-authz.test.ts`).
- **Impacto:** Cualquiera podía mover/cancelar/renombrar citas de cualquier clínica conociendo o enumerando UUIDs.
- **Reproducir (baseline):** `curl -X PUT /api/appointments/<uuid> -d '{"estado":"cancelada"}'` sin cookies → 200.
- **Causa raíz:** Handler escrito contra el cliente admin "para evitar problemas de RLS" sin reponer las garantías que RLS daba.
- **Cambio:** Reescritura del archivo: `requireUser()` en GET/PUT/DELETE, validación de UUID, Zod `.strict()` (campos ES/EN compatibles, enum de estado, notas ≤10k), update admin con **doble filtro** `id+user_id`, 404 no revelador, tipado `JoinedAppointment`.
- **Pruebas:** 401 sin sesión; con sesión, el mock verifica que el update incluya `eq('user_id', user.id)`.
- **Riesgo residual:** Ninguno conocido en este endpoint; el patrón quedó como referencia para el resto (doc 21 lista equivalentes).
- **Rollback:** `git revert` del commit fase 1 (no recomendado).
- **Siguiente acción:** Smoke en staging del flujo editar/cancelar cita desde la UI.

### C3 — RLS abierta (`USING true`) en datos fiscales: lectura/escritura cross-tenant
- **Severidad:** P0 · **Capa:** Base de datos · **Tipo:** Aislamiento multi-tenant roto
- **Evidencia:** `supabase/migrations/20251019_invoices_and_fiscal.sql:175-199` — 8 políticas `USING (true)`/`WITH CHECK (true)` sobre `patient_fiscal_data`, `invoices`, `invoice_records`; ninguna de las tres tenía columna de tenant.
- **Estado:** **MIGRACIÓN LISTA** — `supabase/migrations/20260611110000_fiscal_rls_tenant_isolation.sql` (columna `user_id` + backfill desde `patients.user_id`/`created_by` + drop de políticas abiertas por nombre exacto + políticas por dueño; `invoice_records` vía `EXISTS` sobre `invoices`). **Pendiente de aplicar** (backup + staging con 2 tenants, doc 16).
- **Impacto:** RFC, razón social, dirección fiscal y facturas de TODAS las clínicas legibles y **modificables** por cualquier usuario autenticado de cualquier otra clínica. Riesgo legal (datos personales+fiscales) y de integridad.
- **Reproducir (baseline, en SQL como usuario B):** `select * from patient_fiscal_data` → devuelve filas del tenant A.
- **Causa raíz:** Migración de facturación escrita "para que funcione" con políticas permisivas y sin modelo de tenant.
- **Cambio:** SQL versionado, forward-only, idempotente, con conteos de verificación y manejo de huérfanos documentado en el propio archivo.
- **Pruebas:** Test RLS real requiere base (doc 08 §RLS define el caso con dos usuarios). NO ejecutable en sandbox — **NO VERIFICADO en BD**.
- **Riesgo residual hasta aplicar:** el agujero sigue ABIERTO en producción.
- **Rollback:** bloque comentado en la propia migración (reabre el acceso; solo emergencia).
- **Siguiente acción:** Aplicar en staging → validar matriz de 2 tenants → producción con backup (doc 16 pasos 4-6).

### C4 — Buckets de Storage públicos con documentos fiscales de pacientes
- **Severidad:** P0 · **Capa:** Storage · **Tipo:** Exposición de datos
- **Evidencia:** `supabase/migrations/20251019_invoices_storage_bucket.sql:4` (`public=true` para `invoices`); `supabase/storage/setup-gastos-facturas-bucket.sql:79` (`public=true`); 6 usos de `getPublicUrl` guardando URLs en BD (`app/api/invoices/route.ts`, `app/api/gastos-variables/upload/route.ts`, `app/api/facturama/certificates/route.ts`).
- **Estado:** **CORREGIDO en código** (BD guarda **rutas**; lecturas/email entregan **signed URLs** vía `lib/storage/signed.ts`, compatible con URLs históricas) + **MIGRACIÓN LISTA** `20260611130000_private_storage_buckets.sql` (buckets privados + políticas por carpeta `auth.uid()`).
- **Impacto:** CFDI (XML/PDF con RFC y montos) y facturas de gastos descargables por cualquiera con la URL; URLs adivinables a partir de patrón `userId/uuid.ext` si se filtra un userId.
- **Reproducir (baseline):** abrir cualquier `…/storage/v1/object/public/invoices/<uid>/<uuid>.pdf` sin sesión → 200.
- **Causa raíz:** Bucket público elegido por simplicidad de frontend (`window.open(publicUrl)`).
- **Cambio:** POST guarda rutas y firma para email (7 días) y respuesta (1 h); GET de facturas y de gastos firma cada fila; certificados CSD guardan rutas y la respuesta ya no devuelve URL alguna (ver G1).
- **Pruebas:** Typecheck/lint de los archivos; flujo end-to-end **pendiente en staging** (checklist en la migración).
- **Riesgo residual:** objetos ya difundidos pueden vivir en cachés de terceros → remediación de rotación de rutas en doc 23.
- **Rollback:** `UPDATE storage.buckets SET public=true …` (emergencia; reabre exposición).
- **Siguiente acción:** staging: emitir factura nueva (email con enlaces firmados), abrir factura histórica, subir/abrir gasto.

### C5 — `NEXTAUTH_SECRET` inyectado al bundle del cliente
- **Severidad:** P0 · **Capa:** Configuración/Build · **Tipo:** Fuga de secreto
- **Evidencia:** `next.config.ts` bloque `env: { NEXTAUTH_URL, NEXTAUTH_SECRET }` — las claves de `env` en next.config se serializan al bundle del navegador.
- **Estado:** **CORREGIDO** (bloque retirado; NextAuth lee `process.env` server-side). **Rotación del secreto: PENDIENTE (operador)** — doc 16 paso 2.
- **Impacto:** Quien tenga el secreto puede forjar JWT/cookies de NextAuth (la app mantiene un flujo NextAuth legado activo — ver D1).
- **Causa raíz:** Copia de plantilla antigua de configuración.
- **Pruebas:** `grep NEXTAUTH_SECRET .next/` tras build local → sin coincidencias en chunks de cliente.
- **Riesgo residual:** builds anteriores ya publicados contienen el secreto ⇒ la rotación no es opcional.
- **Rollback:** N/A.
- **Siguiente acción:** Rotar `NEXTAUTH_SECRET` en Vercel; invalidará sesiones NextAuth activas (avisar si aplica).

### C6 — Service worker cacheaba la API de Supabase 24 h (y el SW viejo es inmortal)
- **Severidad:** P0 · **Capa:** Frontend/PWA · **Tipo:** Persistencia indebida de datos sensibles en cliente
- **Evidencia:** `next.config.ts` runtimeCaching: regla `NetworkFirst` con `maxAgeSeconds: 24*60*60` sobre `^https://.*\.supabase\.co/.*` (REST+Auth+Storage). Hallazgo agravante de esta auditoría: el build actual es Turbopack y `next-pwa@5` (webpack-only) **no genera SW**, así que el SW de despliegues antiguos nunca recibe reemplazo y su caché persiste indefinidamente.
- **Estado:** **CORREGIDO** en tres capas: (1) regla cambiada a `NetworkOnly` (efectiva si algún build vuelve a webpack), (2) **kill-switch** `public/sw.js` versionado que borra caches, se desregistra y recarga pestañas, (3) purga + `unregister` en logout (`lib/pwa/clear-caches.ts`, conectado en signout/UserMenu/main-nav).
- **Impacto:** Datos clínicos y fiscales servidos desde caché del navegador hasta 24 h; en equipos compartidos de clínica, el usuario siguiente podía ver respuestas del anterior.
- **Causa raíz:** runtimeCaching genérico de plantilla PWA aplicado a un dominio de datos sensibles + desconocimiento de que Turbopack dejó inerte a next-pwa.
- **Pruebas:** Manual en staging: registrar SW viejo no es reproducible aquí; verificar que `/sw.js` sirve el kill-switch y que tras visita los caches desaparecen (doc 17 checklist).
- **Riesgo residual:** Navegadores que no revisiten la app conservan el SW viejo hasta su comprobación periódica (~24 h tras próxima visita).
- **Siguiente acción:** OD-8 — decidir PWA real (migrar a `@serwist/next`) o retirar `next-pwa` y `manifest` de instalación offline.

### C7 — Cliente admin (service role) exportado desde módulo importado por componentes de cliente
- **Severidad:** P0 (vector) · **Capa:** Arquitectura · **Tipo:** Frontera server/client rota
- **Evidencia:** `lib/supabase.ts` creaba `supabaseAdmin` con `SUPABASE_SERVICE_ROLE_KEY` y era importado por client components; `lib/supabase/server.ts` lo creaba ansiosamente con asserts `!`.
- **Estado:** **CORREGIDO** — admin vive solo en `lib/supabase/admin.ts` (`import 'server-only'`, singleton perezoso `getSupabaseAdmin()`, fail-closed sin secretos en prod); `lib/supabase/server.ts` lo re-exporta; `lib/supabase.ts` quedó solo-anon. Únicamente `appointments/[id]` importaba admin desde la ruta insegura (corregido en C2).
- **Impacto:** El bundler de Next no incluye envs no-NEXT_PUBLIC en cliente (la clave no se filtró), pero el patrón invitaba a fugas y a fallos de build no deterministas; `server-only` ahora lo hace fallar en compilación.
- **Pruebas:** typecheck + build verdes; importar admin desde un client component ahora rompe el build (verificado conceptualmente por `server-only`).
- **Siguiente acción:** ninguna.

---

## P1 — Altos

### C8 — Webhooks de mensajería sin verificación de firma (y el de Twilio nunca funcionó)
- **Sev:** P1 · **Capa:** API/Webhooks · **Evidencia:** `app/api/messaging/webhooks/[provider]/route.ts` — sin verificación alguna; además hacía `request.json()` cuando **Twilio envía `application/x-www-form-urlencoded`** ⇒ todo callback de Twilio explotaba antes de procesarse (los estados de entrega jamás se registraron).
- **Estado:** **CORREGIDO.** Twilio: parse form + `X-Twilio-Signature` (HMAC-SHA1 de URL+params ordenados; reconstrucción de URL pública vía `x-forwarded-proto/host`). Plivo: `X-Plivo-Signature-V2`. MessageBird: **fail-closed en producción** hasta implementar su verificación JWT oficial (OD-5). Estados permitidos en allowlist; `payload` almacenado solo con metadatos de estado (últimos 19), `error_message` ≤500.
- **Pruebas:** `tests/webhook-signatures.test.ts` (vector Twilio autoconsistente + manipulación ⇒ rechazo; Meta válida/ inválida; manifest MP).
- **Siguiente:** staging con webhooks reales de Twilio sandbox.

### C9 — Webhook de Mercado Pago sin firma, sin idempotencia y confiando en el body
- **Sev:** P1 · **Evidencia:** `app/api/mercadopago/webhook/route.ts` — procesaba el body tal cual, sin `x-signature`, sin registro de eventos; un replay o un POST manual podía activar/cancelar suscripciones.
- **Estado:** **CORREGIDO (reescrito).** Firma oficial (`manifest id:{data.id};request-id:{x-request-id};ts:{ts};` HMAC-SHA256, tolerancia 300 s) fail-closed; idempotencia vía tabla `webhook_events` (UNIQUE provider+event_id; 23505 ⇒ `duplicate:true`); **verdad desde la API** (`paymentClient.get(dataId)`), no del body; control de orden (un `cancelled` viejo no pisa una suscripción activa de otro pago); logs sin payload.
- **Migración asociada:** `20260611100000_webhook_events.sql` (pendiente de aplicar; el código degrada con warning si la tabla no existe).
- **Pruebas:** `tests/mercadopago-webhook.test.ts` (fail-closed 401 sin secreto; duplicado no llama a la API de pagos).
- **Siguiente:** configurar `MERCADOPAGO_WEBHOOK_SECRET` (env nueva) y aplicar migración.

### C10 — Webhook de WhatsApp fail-open + logs con PII
- **Sev:** P1 · **Evidencia:** `app/api/webhooks/whatsapp/route.ts` — si faltaba `WHATSAPP_APP_SECRET` procesaba todo; comparación de firma no constante; `console.log(JSON.stringify(body))` con teléfonos y mensajes completos; runtime edge.
- **Estado:** **CORREGIDO:** fail-closed en producción, `verifyMetaSignature` (timing-safe), límite 256 KB, runtime `nodejs`, logs con `maskPhone`/longitudes.
- **Pruebas:** `tests/whatsapp-webhook.test.ts` (sin secreto ⇒ 401; firma inválida ⇒ 401).

### C11 — `check-payment-method` aceptaba `customerId` arbitrario
- **Sev:** P1 · **Evidencia:** `app/api/check-payment-method/route.ts` — sin auth y consultaba en Stripe el `customerId` que enviara el cliente (oráculo de enumeración de clientes Stripe ajenos).
- **Estado:** **CORREGIDO:** auth obligatoria; el `customerId` del body se **ignora**; se deriva de `subscriptions.stripe_customer_id` del usuario; rate limit 10/min; shape de respuesta preservado.
- **Pruebas:** `tests/check-payment-method.test.ts`.

### C12 — DDL ejecutable por GET (`setup-notes-table` con `exec_sql`)
- **Sev:** P1 · **Evidencia:** `app/api/setup-notes-table/route.ts` — GET sin auth ejecutaba `rpc('exec_sql', …)` creando tabla/políticas.
- **Estado:** **ELIMINADO.** El DDL ya existía versionado (`supabase/migrations/create_patient_notes.sql`, equivalente al embebido). Test de ausencia en verde.
- **Nota:** la EXISTENCIA de una función `exec_sql` en la base es en sí un riesgo: acción en doc 07 (revocar/eliminar la RPC).

### C13 — Recursos públicos por UUID primario, con service role y asociaciones sin validar
- **Sev:** P1 · **Evidencia:** `app/api/{documents,intake-forms,nps}/[id]/public/route.ts` — clientes admin a nivel de módulo con asserts `!`; `patient_id`/`appointment_id` del body insertados tal cual (asociación cross-tenant / contaminación de expedientes); sin límites ni rate limit; `error.message` crudo al cliente.
- **Estado:** **CORREGIDO (reescritos los 3)** con helper común `lib/security/public-endpoints.ts`: Zod `.strict()` (firma `data:image/` ≤200 KB; NPS 0–10; answers tipados), body ≤256 KB, rate limit por IP (GET 60/min, POST 8/min), `sanitizeAssociations()` (un ID ajeno al tenant dueño se descarta a null y se registra), lookup por `public_token` con fallback legacy por id (tolerante a migración pendiente). **Migración** `20260611150000_public_access_tokens.sql` añade el token rotable. Duplicidad de esquema detectada: `intake_forms` definida también en `migrations/add-intake-forms.sql` (ver doc 22).
- **Siguiente:** OD-7 — regenerar enlaces compartidos con token y retirar el fallback por id.

### C14 / C15 — Endpoints de debug residuales
- `app/api/debug/whatsapp-config` exponía el **prefijo del token** de WhatsApp y configuración; `app/api/team/debug` volcaba estado interno de equipo. **ELIMINADOS**; cubiertos por el test de ausencia.

### F1 — Rutas de expedientes sin verificación explícita de sesión (hallazgo NUEVO de esta auditoría)
- **Sev:** P1 (defensa en profundidad) · **Evidencia:** `app/api/records/[id]`, `records/with-names`, `records/patient/[id]`, `patients/[id]/multi-treatment` — cero verificación de sesión; dependían al 100 % de RLS (que sí es correcta: `20250122_add_user_isolation.sql:70+`). Además `multi-treatment` insertaba SIN `user_id`.
- **Estado:** **CORREGIDO:** `getAuthUser()` ⇒ 401 + filtro `.eq('user_id', user.id)` en todas las consultas + `user_id` en el insert. Detectado gracias a la matriz del doc 21.
- **Riesgo evitado:** cualquier regresión futura de políticas RLS habría expuesto expedientes médicos completos sin que nadie lo notara.

### D2 — Tokens y sesiones en logs
- **Evidencia:** `lib/auth.ts:64,74` (`console.log` de token JWT y sesión completos), `lib/appApi.ts` (5 logs de token, incl. `substring(0,20)`).
- **Estado:** **CORREGIDO** (logs eliminados/reemplazados; queda `lib/log.ts` con redacción para uso futuro). Cobertura: `tests/log-redaction.test.ts`.

### D3 — Identidades de owner hardcodeadas en middleware + bypass
- **Evidencia:** `middleware.ts:4-5` (2 emails personales + 1 UUID embebidos con bypass total de paywall).
- **Estado:** **CORREGIDO:** listas desde `ADMIN_OWNER_EMAILS`/`ADMIN_OWNER_IDS`; sin envs ⇒ **sin bypass**; comparación normalizada. **DOCUMENTADO (no cambiado):** el paywall hace fail-open a plan `pro` si la consulta de suscripción falla (decisión de producto: disponibilidad vs. cobro; registrado en doc 19).

### D4 — `lib/api-auth.ts` inseguro (decodificaba JWT sin verificar)
- **Estado:** **ELIMINADO** junto con `lib/auth-service.ts` (0 importadores ambos; `jwt-decode`/`js-cookie` quedaron sin uso directo).

### E1 — PII de pacientes enviada al proveedor de IA
- **Evidencia:** `app/api/chat/route.ts:513,547` — listas con `telefono, email` de pacientes inyectadas al contexto de Anthropic.
- **Estado:** **PARCIAL:** teléfonos/emails ahora pasan por `maskPhone`/`maskEmail` antes del contexto. Pendiente: varios `select('*')` (inventario/gastos/notificaciones) sin acotar columnas — inventario completo y plan en doc 24.

### E2 / E3 — Rate limit evadible y zona horaria UTC-6 fija
- **E2:** un anónimo podía mandar `userId` arbitrario y rotarlo para resetear su límite. **CORREGIDO:** identidad solo `user:<id-autenticado>` o `ip:<ip>`; `Retry-After: 3600`. (Limitación Map-en-memoria por instancia: OD-4.)
- **E3:** "hoy/mañana" se calculaban con offset manual −6 (México tiene 4 zonas y Quintana Roo no cambia). **CORREGIDO:** `lib/timezone.ts` (IANA, `DEFAULT_CLINIC_TIMEZONE`). Tests: `tests/timezone.test.ts`.

### G1 — Certificados CSD: `getPublicUrl` sobre bucket privado
- **Evidencia:** `app/api/facturama/certificates/route.ts:117-121` — generaba URLs "públicas" muertas para `.cer/.key` (¡la llave privada del sello fiscal!) y las guardaba/devolvía; incentivo directo a "arreglarlo" volviendo público el bucket.
- **Estado:** **CORREGIDO:** se guardan **rutas**; la respuesta ya no incluye URL alguna (`certificates_stored: true`). Sin consumidores runtime de esas columnas (verificado por grep) ⇒ cambio sin impacto funcional.

### Drift bundles — segunda definición insegura
- **Evidencia:** `database/create_bundles_tables.sql:32-40` (sin `user_id`, políticas `USING true`) coexiste con la canónica segura `supabase/migrations/20250117_create_bundles.sql`.
- **Estado:** **MIGRACIÓN LISTA** `20260611120000_bundles_tenant_convergence.sql` (converge cualquier estado al seguro, idempotente). El script suelto queda marcado para borrado en doc 22.

---

## P2 / Deuda (resueltos o congelados en esta auditoría)

| ID | Hallazgo | Evidencia | Estado |
|----|----------|-----------|--------|
| B1 | 26 errores TS reales (TDZ checkout, `maxTokens` inexistente en AI SDK v6, anys implícitos por dep faltante, mcp-server contaminando) | apéndice B1 verificado 1:1 | **CORREGIDO** → 0 |
| B2 | `ignoreBuildErrors: true` | `next.config.ts:9` | **CORREGIDO** (build falla con TS) |
| B3 | ESLint inoperante (FlatCompat × flat nativo) | `eslint.config.mjs` | **CORREGIDO** + ratchet `.lint-budget`=641 (OD-3) |
| B5 | `npm ci` roto por postinstall de `supabase` | log baseline | **DOCUMENTADO** OD-1 (`--ignore-scripts` en CI/README) |
| H1 | Trial 7 días vs 14 en el resto del producto | `app/api/activate-trial/route.ts` | **CORREGIDO** → `lib/config/trial.ts` (14) + test |
| H2 | Precios dispersos ($499/$1,499/$2,999 en ≥6 sitios) | grep multi-archivo | **CENTRALIZADO** `lib/config/pricing.ts` + flag `PRICING_APPROVED_BY_BUSINESS=false` (OD-2) |
| H3 | TDZ `isSubscription` en checkout (demo roto) | `app/api/stripe/checkout/route.ts:55,93,122` | **CORREGIDO** (hoist único) |
| K3 | Branding legado: `package.json` name `vercel-migration`; 11 archivos con `sgmm` | grep | **PARCIAL:** name → `agendamedpro`; plan de limpieza `sgmm` en doc 28 (incluye `sgmm_token` compat) |
| K4 | Soporte con teléfonos placeholder `(81)/(55) 1234-5678`, `800-123-4567` | `app/soporte/page.tsx:127-129,390` | **CORREGIDO** → `lib/config/contact.ts`; confirmar líneas reales = OD-6 |
| — | TODOs funcionales (Google Calendar sync, SMS reminders, waitlist) | `hooks/use-google-calendar-sync.ts`, `use-sms-reminders.ts`, `use-waitlist.ts` | **DOCUMENTADO** doc 25 (tabla de verdad de features) |
