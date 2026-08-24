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
