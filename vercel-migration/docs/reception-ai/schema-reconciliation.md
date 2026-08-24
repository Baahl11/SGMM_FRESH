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
