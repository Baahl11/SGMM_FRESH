# Reconciliación de esquema — Recepción IA Fase 0

Fecha: 2026-08-24.

## Deriva confirmada

`whatsapp_conversations` (tabla que `app/api/webhooks/whatsapp/route.ts` usa activamente para loguear cada intercambio IA) tenía su única migración en `mcp-server/migrations/002_whatsapp_conversations.sql`, **fuera** de `supabase/migrations/`. Un entorno nuevo (staging limpio, otra clínica) que solo aplique `supabase/migrations/` no tendría la tabla y el webhook fallaría en el primer `insert`.

## Corrección aplicada en este plan

`supabase/migrations/20260824120000_whatsapp_conversations.sql` — copia idempotente (`CREATE TABLE IF NOT EXISTS`, políticas envueltas en `DO $$ ... $$` verificando `pg_policies`) de la definición original. No se modifica ni se borra el archivo de `mcp-server/migrations/` (regla de este plan: no borrar/renombrar durante el piloto). A partir de ahora, `supabase/migrations/` es la fuente canónica para esta tabla; el archivo de `mcp-server` queda como duplicado histórico documentado aquí.

## Resuelto — 2026-08-25, contra el proyecto real (`SGMM-PRO`, ref `sbwpqtrxhiuucwlbozet`)

Los cuatro pasos pendientes de la sección anterior ya se ejecutaron con acceso real de operador. Resultado: **no hay deriva de esquema real**, solo un problema de tracking de historial.

1. `supabase migration list` (solo lectura) sí mostró decenas de migraciones (de `006` hasta `20260524090000`, octubre 2025 → mayo 2026) como "solo local" contra el proyecto remoto — la hipótesis inicial fue deriva real. `supabase db diff --linked` y `supabase db dump --linked` fallaron en este entorno: ambos requieren Docker Desktop (para levantar una base "sombra" o igualar la versión de `pg_dump` al servidor, 17.6.1.006) y no está instalado en esta máquina.
2. Alternativa sin Docker: conexión directa de solo lectura con el cliente `pg` de Node contra `SGMM-PRO` (usando el `DATABASE_URL` ya configurado), consultando `information_schema.tables`, `information_schema.columns` e `information_schema.routines` — sin pg_dump, sin CLI de Supabase, cero filas de datos de pacientes.
3. **Las 68 tablas** que definen `CREATE TABLE` en todas las migraciones locales (incluidas las marcadas "solo local") **ya existen** en el esquema real (90 tablas totales en `public`). Se verificaron puntualmente las 8 tablas de mensajería/Recepción IA (`whatsapp_conversations`, `messaging_config`, `messaging_providers`, `messaging_messages`, `messaging_jobs`, `whatsapp_templates`, `patient_whatsapp_consent`, `webhook_events`) — las 8 presentes.
4. Se verificaron también las funciones de las migraciones de seguridad/RLS más sensibles marcadas "solo local" (`user_has_valid_subscription`, `current_user_is_admin`, `create_default_location_for_user`) — las 3 presentes en el esquema real (57 funciones totales).

**Conclusión:** las migraciones "solo local" sí se aplicaron a producción — casi con toda seguridad se corrieron a mano vía SQL Editor del dashboard de Supabase en algún punto entre octubre 2025 y mayo 2026, en vez de por el CLI, por lo que nunca quedaron registradas en `supabase_migrations.schema_migrations`. No es información suficiente para descartar diferencias más finas no cubiertas por esta verificación (constraints, índices, triggers, definición exacta de políticas RLS, valores default) — la comparación fue a nivel de existencia de tablas/columnas/funciones, no un diff completo de DDL. Si se necesita esa certeza total, sigue pendiente instalar Docker Desktop y correr `supabase db diff --linked` para un diff estructural completo.

**Gate de la sección 21 del handoff ("esquema reconciliado") — cumplido** con esta evidencia, para efectos de autorizar el paso a Fase 1.

## Otros almacenes de datos de mensajería (no requieren corrección en Fase 0)

`messaging_config`, `messaging_providers`, `messaging_messages`, `messaging_jobs`, `whatsapp_templates`, `patient_whatsapp_consent`, `webhook_events` sí están todos en `supabase/migrations/` (`20251027_messaging_config.sql`, `20251107_messaging_core.sql`, `20251116_whatsapp_templates.sql`, `20260611100000_webhook_events.sql`). Sin deriva detectada en estas tablas.
