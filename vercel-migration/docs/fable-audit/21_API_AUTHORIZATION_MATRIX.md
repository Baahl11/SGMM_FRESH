# 21 — Matriz de autorización de la API

**Auditoría fable — 2026-06-11.** Generada por análisis estático de cada `app/api/**/route.ts` (patrones de auth: `auth.getUser`, `getAuthUser`, `getAuthenticatedUser`, `requireAuth/requireUser`, `getServerSession`, `getToken`; firmas de webhook; `CRON_SECRET`). La verificación dinámica endpoint-por-endpoint queda pendiente en staging (doc 08, suite de autorización).

- Rutas analizadas: **175**
- Con autenticación de usuario detectada: **138**
- Protegidas por firma de webhook: **5** · por `CRON_SECRET`: **8**
- Usan cliente admin (service role): **26**
- Con validación Zod: **4** · con rate limit: **5**
- **Sin auth, sin firma y sin cron-secret: 24** (Tabla 2 — clasificadas una a una)

Leyenda: Auth = sesión verificada · Tenant = filtra `user_id` · Admin = service role · Firma = firma de webhook · RL = rate limit.

## Tabla 1 — Todas las rutas

| Ruta | Métodos | Auth | Tenant | Admin | Zod | Firma | RL | Runtime |
|---|---|---|---|---|---|---|---|---|
| `/api/activate-trial` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/addons` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/addons/[id]` | DELETE | ✅ | ✅ | — | — | — | — | - |
| `/api/addons/purchase` | POST | ✅ | ✅ | ✅ | — | — | — | - |
| `/api/admin/invitations` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/admin/invitations/[id]` | DELETE,PATCH | ✅ | ✅ | — | — | — | — | - |
| `/api/agents/reminders` | GET | — | ✅ | — | — | — | — | edge |
| `/api/agents/reminders/cron` | GET | — | — | — | — | — | — | - |
| `/api/agents/reminders/send` | POST | — | ✅ | — | — | — | — | - |
| `/api/agents/reminders/test` | POST | ✅ | ✅ | ✅ | — | — | — | edge |
| `/api/ai/recommendations` | GET | ✅ | ✅ | ✅ | — | — | — | - |
| `/api/allergies` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/allergies/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/analytics/notifications` | GET | ✅ | — | — | — | — | — | - |
| `/api/appointment-types` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/appointment-types/[id]` | GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/appointments` | GET,POST | ✅ | ✅ | ✅ | — | — | — | - |
| `/api/appointments/[id]` | DELETE,GET,PUT | ✅ | ✅ | ✅ | ✅ | — | — | - |
| `/api/appointments/combined` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/appointments/validate` | POST | ✅ | — | — | — | — | — | - |
| `/api/auth/[...nextauth]` | ? | — | — | — | — | — | — | - |
| `/api/auth/resend-verification` | POST | — | — | — | — | — | — | - |
| `/api/booking-settings` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/bookings` | GET | ✅ | — | — | — | — | — | - |
| `/api/bookings/[id]` | DELETE,PATCH | ✅ | — | — | — | — | — | - |
| `/api/bookings/deposits/calculate` |POST | — | ✅ | — | — | — | — | - |
| `/api/bookings/deposits/create` |POST | — | ✅ | — | — | — | — | - |
| `/api/bookings/deposits/webhook` | POST | — | — | — | — | ✅ | — | - |
| `/api/bundles` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/bundles/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/chat` | POST | ✅ | ✅ | — | — | — | ✅ | edge |
| `/api/check-payment-method` | POST | ✅ | ✅ | — | — | — | ✅ | - |
| `/api/consultorios` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/consultorios/[id]` | GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/create-checkout-session` | POST | — | ✅ | ✅ | — | — | — | - |
| `/api/create-trial-session` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/cron/messaging-worker` | GET | — | — | — | — | — | — | - |
| `/api/cron/onboarding-drip` | GET | — | — | ✅ | — | — | — | - |
| `/api/cron/reminders` | GET | — | ✅ | ✅ | — | — | — | - |
| `/api/cron/trial-reminders` | GET,POST | — | — | ✅ | — | — | — | - |
| `/api/cron/whatsapp-reminders` | GET | — | — | — | — | — | — | - |
| `/api/doctor-exceptions` | GET,POST | ✅ | — | — | — | — | — | - |
| `/api/doctor-exceptions/[id]` | DELETE,PATCH | ✅ | ✅ | — | — | — | — | - |
| `/api/doctor-schedules` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/doctor-schedules/check-availability` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/doctors` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/doctors/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/documents` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/documents/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/documents/[id]/public` | GET,POST | — | — | ✅ | ✅ | — | ✅ | - |
| `/api/email-config` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/email-config/test` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/email/welcome` | POST | ✅ | — | — | — | — | — | - |
| `/api/facturama/certificates` | DELETE,GET,POST | ✅ | ✅ | ✅ | — | — | — | - |
| `/api/facturama/config` | GET,POST,PUT | ✅ | ✅ | ✅ | — | — | — | - |
| `/api/forms` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/forms/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/forms/[id]/send` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/forms/[id]/submissions` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/gastos-fijos` | GET,POST | ✅ | — | — | — | — | — | - |
| `/api/gastos-fijos/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/gastos-variables` | GET,POST | ✅ | ✅ | ✅ | — | — | — | - |
| `/api/gastos-variables/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/gastos-variables/stats` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/gastos-variables/upload` | DELETE,POST | ✅ | ✅ | ✅ | — | — | — | - |
| `/api/google-calendar/auth` | GET | ✅ | — | — | — | — | — | - |
| `/api/google-calendar/callback` | GET | ✅ | — | — | — | — | — | - |
| `/api/google-calendar/events` | DELETE,GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/google-calendar/sync` | DELETE,GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/import/data` |POST | — | ✅ | — | — | — | — | - |
| `/api/import/template` |GET | — | — | — | — | — | — | - |
| `/api/intake-forms` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/intake-forms/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/intake-forms/[id]/public` | GET,POST | — | — | ✅ | ✅ | — | ✅ | - |
| `/api/intake-forms/[id]/responses` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/inventory` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/inventory/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/inventory/low-stock` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/inventory/movements` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/inventory/reports` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/invitations/accept` | POST | — | — | ✅ | — | — | — | - |
| `/api/invitations/validate/[token]` | GET | — | — | — | — | — | — | - |
| `/api/invoices` | GET,POST | ✅ | ✅ | ✅ | — | — | — | - |
| `/api/invoices/[id]/cancel` | DELETE | ✅ | ✅ | ✅ | — | — | — | - |
| `/api/invoices/send-email` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/leads` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/leads/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/leads/[id]/notes` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/leads/public` | POST | — | — | ✅ | — | — | — | - |
| `/api/locations` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/locations/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/medical-history` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/medical-history/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/medical-records` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/medical-records/[id]` | DELETE,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/medications` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/medications/[id]` | DELETE,GET,PATCH,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/mercadopago/checkout` | POST | ✅ | — | — | — | — | — | - |
| `/api/mercadopago/webhook` | POST | — | ✅ | ✅ | — | ✅ | — | - |
| `/api/messaging/config` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/messaging/recent` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/messaging/send` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/messaging/stats` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/messaging/webhooks/[provider]` | POST | — | — | ✅ | — | ✅ | — | - |
| `/api/messaging/whatssend` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/messaging/whatstest` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/notification-logs` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/notification-logs/export` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/notifications` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/notifications/[id]` | DELETE,PATCH | ✅ | ✅ | — | — | — | — | - |
| `/api/notifications/mark-all-read` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/notifications/preferences` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/notifications/send` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/nps` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/nps/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/nps/[id]/public` | GET,POST | — | — | ✅ | ✅ | — | ✅ | - |
| `/api/patient-notes` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/patient-notes/[id]` | DELETE,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/patient-photos` | DELETE,GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/patients` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/patients/[id]` | DELETE,GET,PUT | ✅ | — | — | — | — | — | - |
| `/api/patients/[id]/fiscal-data` | GET,POST | ✅ | — | — | — | — | — | - |
| `/api/patients/[id]/multi-treatment` |POST | — | — | — | — | — | — | - |
| `/api/patients/[id]/tags` | DELETE,GET,POST | ✅ | — | — | — | — | — | - |
| `/api/promotions` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/promotions/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/public/availability/[slug]` |GET | — | ✅ | — | — | — | — | - |
| `/api/public/book/[slug]` |DELETE,POST | — | ✅ | — | — | — | — | - |
| `/api/public/clinic/[slug]` |GET | — | ✅ | — | — | — | — | - |
| `/api/public/forms/[token]` |GET,POST | — | — | — | — | — | — | - |
| `/api/public/next-available` |GET | — | — | — | — | — | — | - |
| `/api/public/validate-slot` |POST | — | — | — | — | — | — | - |
| `/api/quick-phrases` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/quick-phrases/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/quick-phrases/[id]/use` | PATCH | ✅ | ✅ | — | — | — | — | - |
| `/api/quota/usage` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/records` | GET,POST | ✅ | — | — | — | — | — | - |
| `/api/records/[id]` |DELETE,GET,PUT | — | — | — | — | — | — | - |
| `/api/records/patient/[id]` |GET | — | — | — | — | — | — | - |
| `/api/records/with-names` |GET | — | — | — | — | — | — | - |
| `/api/reports/billing-stats` | GET | ✅ | — | — | — | — | — | - |
| `/api/settings/branding` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/settings/upload-logo` | DELETE,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/stripe/checkout` | POST | ✅ | ✅ | ✅ | — | — | — | - |
| `/api/stripe/connect/dashboard` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/stripe/connect/onboard` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/stripe/connect/onboarding` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/stripe/connect/status` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/stripe/portal` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/stripe/subscription/cancel` | POST | ✅ | ✅ | ✅ | — | — | — | - |
| `/api/stripe/sync-session` | POST | ✅ | ✅ | ✅ | — | — | — | - |
| `/api/stripe/webhook` | POST | — | ✅ | ✅ | — | ✅ | — | - |
| `/api/submissions/[id]` | GET,PUT | ✅ | — | — | — | — | — | - |
| `/api/tags` | GET,POST | ✅ | — | — | — | — | — | - |
| `/api/tags/[id]` | DELETE,GET,PATCH | ✅ | — | — | — | — | — | - |
| `/api/team/members` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/team/members/[id]` | DELETE,GET,PATCH | ✅ | — | — | — | — | — | - |
| `/api/treatments` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/treatments/[id]` | DELETE,GET,PATCH,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/treatments/[id]/inventory` | GET,POST | ✅ | — | — | — | — | — | - |
| `/api/treatments/[id]/inventory/[itemId]` | DELETE,PUT | ✅ | — | — | — | — | — | - |
| `/api/user/profile` | GET,PATCH | ✅ | ✅ | — | — | — | — | - |
| `/api/user/sms-credentials` | DELETE,GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/user/subscription` | GET | ✅ | ✅ | — | — | — | — | - |
| `/api/user/whatsapp-settings` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/webhooks/whatsroute.ts` | GET,POST | — | ✅ | — | — | ✅ | — | nodejs |
| `/api/whatsconsent` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/whatsconsent/opt-out` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/whatssend` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/whatstemplates` | GET,POST | ✅ | ✅ | — | — | — | — | - |
| `/api/whatstemplates/[id]` | DELETE,GET,PUT | ✅ | ✅ | — | — | — | — | - |
| `/api/whatstemplates/[id]/approve` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/whatstemplates/[id]/reject` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/whatstemplates/[id]/submit` | POST | ✅ | ✅ | — | — | — | — | - |
| `/api/whatsvalidate-config` | POST | — | — | — | — | — | — | - |

## Tabla 2 — Rutas sin auth/firma/cron detectados

| Ruta | Métodos | Clasificación de la auditoría |
|---|---|---|
| `/api/auth/[...nextauth]` | ? | Framework NextAuth (legado D1) — gestiona su propia sesión |
| `/api/auth/resend-verification` | POST | Pre-auth por diseño — ⚠️ requiere rate limit por IP/email (29) |
| `/api/bookings/deposits/calculate` | POST | Flujo de reserva pública (cálculo) — sin datos sensibles |
| `/api/bookings/deposits/create` | POST | Checkout de depósito en reserva pública — por diseño; validar inputs (29) |
| `/api/create-checkout-session` | POST | ⚠️ REVISAR: crear sesión de pago sin auth; validar contra abuso/enumeración |
| `/api/documents/[id]/public` | GET,POST | Pública por diseño — endurecida (C13: Zod, RL, tenant-check, public_token) |
| `/api/import/data` | POST | Falso negativo del detector: usa auth.getUser(token) — autenticada |
| `/api/import/template` | GET | Plantilla estática de importación — pública inocua |
| `/api/intake-forms/[id]/public` | GET,POST | Pública por diseño — endurecida (C13) |
| `/api/invitations/accept` | POST | Token de invitación en body hace de credencial — revisar caducidad (29) |
| `/api/invitations/validate/[token]` | GET | Token en URL hace de credencial — OK si token aleatorio y caduco |
| `/api/leads/public` | POST | Pública por diseño (captación) — ⚠️ añadir rate limit + honeypot (pendiente, ver 29) |
| `/api/nps/[id]/public` | GET,POST | Pública por diseño — endurecida (C13) |
| `/api/patients/[id]/multi-treatment` | POST | Endurecida (F1): guard + user_id en insert |
| `/api/public/availability/[slug]` | GET | Reservas online: pública por diseño (slug de clínica) |
| `/api/public/book/[slug]` | DELETE,POST | Reservas online: pública por diseño — ⚠️ requiere rate limit (29) |
| `/api/public/clinic/[slug]` | GET | Perfil público de clínica por diseño |
| `/api/public/forms/[token]` | GET,POST | Token en URL como credencial — por diseño |
| `/api/public/next-available` | GET | Reservas online: pública por diseño |
| `/api/public/validate-slot` | POST | Reservas online: pública por diseño |
| `/api/records/[id]` | DELETE,GET,PUT | Endurecida en esta auditoría (F1): guard de sesión + filtro user_id añadidos |
| `/api/records/patient/[id]` | GET | Endurecida (F1) |
| `/api/records/with-names` | GET | Endurecida (F1) |
| `/api/whatsvalidate-config` | POST | ⚠️ REVISAR EN STAGING: sin patrón de auth detectado — confirmar diseño o falso negativo |

---
Falsos negativos posibles si una ruta autentica con un helper no listado; toda fila ⚠️ de la Tabla 2 entra al checklist de staging del doc 17. Regenerable con el mismo script (docs/fable-audit/tools/gen_auth_matrix.py).
