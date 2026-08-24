# 00 — Resumen ejecutivo

**Auditoría fable · AgendaMedPro · 2026-06-11/12 · rama `audit/fable-agendamedpro-20260610`**

## Veredicto

> **NO APTO PARA DESPLIEGUE DIRECTO A PRODUCCIÓN.**
> El código está verificado en local (typecheck ✅ 0 errores, 25/25 tests ✅, build ✅), pero los hallazgos P0 de **datos** (C3 RLS fiscal, C4 buckets públicos) requieren aplicar migraciones con backup y validarlas en **staging con dos tenants** antes de tocar producción. Orden exacto: doc 16.

## Qué se encontró (lo esencial)

El producto tiene una base multi-tenant correcta en la mayoría de tablas (`user_id` + RLS por dueño), pero la auditoría confirmó **7 hallazgos P0** y **~18 P1** con evidencia archivo:línea (doc 03). Los tres más graves:

1. **C3 — Datos fiscales de TODOS los tenants legibles/modificables entre clínicas.** `20251019_invoices_and_fiscal.sql:175-199` creó políticas `USING (true)` sobre `patient_fiscal_data`, `invoices` e `invoice_records` (sin columna de tenant). Cualquier usuario autenticado de cualquier clínica podía leer RFC, razones sociales y facturas de las demás. **Corrección: migración `20260611110000` (columna + backfill + políticas por dueño), pendiente de aplicar.**
2. **C4 — Facturas CFDI (XML/PDF) en buckets públicos.** `invoices` y `gastos-facturas` eran públicos; las URLs se guardaban en BD. Cualquiera con la URL descargaba documentos fiscales de pacientes. **Corrección: buckets privados (migración `20260611130000`) + firmado en lectura/email (`lib/storage/signed.ts`), compatible con filas históricas.**
3. **C1 — `/api/debug/schema` sin auth devolvía una fila REAL de pacientes y citas** usando service role, en runtime edge. **Eliminado**, junto con `/api/debug/whatsapp-config`, `/api/team/debug` y `/api/setup-notes-table` (DDL por GET).

Hallazgo transversal: **el repo compilaba con `ignoreBuildErrors: true`, 26 errores de TypeScript reales, ESLint roto y cero tests** — el estado "verde" anterior era ilusorio.

## Qué se corrigió en esta auditoría (verificado en local)

| Área | Resultado |
|---|---|
| TypeScript | 26 → **0 errores** (`npm run typecheck`) |
| ESLint | Config rota → funcional; deuda 641 errores **congelada** con ratchet (`npm run lint:budget`) |
| Tests | 0 → **25 tests de regresión en verde** (`npm run test`) |
| Build producción | **exit 0** (Next 16/Turbopack)¹ |
| Endpoints peligrosos | 4 eliminados (C1, C12, C14, C15) |
| Webhooks | Firmas fail-closed Meta/Twilio/Plivo/Mercado Pago + idempotencia (`webhook_events`) |
| Storage | Rutas en BD + signed URLs (facturas, gastos, certificados CSD) |
| Endpoints públicos | Zod + rate limit + validación de tenant + `public_token` (C13) |
| Defensa en profundidad | Guards de sesión y filtros `user_id` en `records/*` (F1) |
| Secretos/PII | `NEXTAUTH_SECRET` fuera del bundle (⚠️ **rotar**), logs de tokens eliminados, PII enmascarada hacia Anthropic |
| Higiene | Service worker kill-switch (C6/PWA inerte bajo Turbopack), trial unificado a 14 días, precios centralizados, `.env.example`, CI |

¹ Build local con fuentes de Google stubeadas por red restringida del sandbox; CI/Vercel las descargan normalmente (doc 02).

## Top 10 hallazgos (detalle completo en doc 03)

| # | ID | Sev | Hallazgo | Estado |
|---|----|----|----------|--------|
| 1 | C3 | P0 | RLS `USING(true)` en datos fiscales (cross-tenant) | Migración lista — **aplicar en staging** |
| 2 | C4 | P0 | Buckets `invoices`/`gastos-facturas` públicos | Código ✅ · migración lista |
| 3 | C1 | P0 | `/api/debug/schema` expone datos reales sin auth | Eliminado ✅ |
| 4 | C2 | P0 | PUT de citas sin auth ni tenant | Corregido ✅ + test |
| 5 | C5 | P0 | `NEXTAUTH_SECRET` inyectado al bundle | Corregido ✅ · **rotar secreto** |
| 6 | C6 | P0 | SW cacheaba Supabase 24h (+ next-pwa inerte: SW viejo eterno) | Kill-switch + purga ✅ |
| 7 | C9 | P1 | Webhook MP sin firma ni idempotencia | Corregido ✅ + tests |
| 8 | C10 | P1 | Webhook WhatsApp fail-open, logs con PII | Corregido ✅ + tests |
| 9 | C13 | P1 | Públicos por UUID + asociaciones cross-tenant | Corregido ✅ + migración tokens |
| 10 | C8 | P1 | Webhooks mensajería sin firma (y Twilio NUNCA funcionó: leía JSON de un form-urlencoded) | Corregido ✅ |

## Decisiones que requieren al dueño (doc 19)

OD-2 precios (¿$499/$1,499/$2,999 son los vigentes?) · OD-6 teléfonos de soporte reales · rotación de `NEXTAUTH_SECRET` y revisión de `SUPABASE_SERVICE_ROLE_KEY` · OD-7 regenerar enlaces públicos con token · OD-8 futuro de la PWA · D1 dual-auth NextAuth/Supabase (no resuelto en esta auditoría).

## Cómo verificar (copy-paste)

```bash
npm ci --ignore-scripts   # OD-1: postinstall de supabase CLI requiere red abierta
npm run typecheck         # 0 errores
npm run test              # 25/25
npm run lint:budget       # deuda ≤ 641
npm run build             # exit 0
```
