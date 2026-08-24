# 22 — Drift de base de datos y mapa de migraciones

**Definición:** drift = diferencia entre lo que el repo declara y lo que la base de producción realmente tiene. Este repo presenta señales fuertes de aplicación **manual y desordenada** de SQL; este doc inventaría las fuentes de verdad en conflicto. La sección F (diff contra prod) requiere acceso al proyecto Supabase: **NO VERIFICADO en esta auditoría**.

## A. Fuentes de SQL en el repo (4 — deberían ser 1)

| Carpeta | Archivos | Estatus decretado |
|---|---|---|
| `supabase/migrations/` | 40+ con timestamp + **3 sin timestamp** | **Única fuente válida** |
| `migrations/` (raíz) | `add-intake-forms.sql`, `add-nps-surveys.sql`, `add-document-signatures.sql` | Congelar → archivar tras reconciliar |
| `database/` | `create_bundles_tables.sql` (inseguro), otros sueltos | Congelar → borrar tras `20260611120000` |
| `supabase/storage/` | setups de buckets (uno hacía público `gastos-facturas`) | Sustituidos por `20260611130000` |

## B. Conflictos concretos detectados

1. **bundles** — dos esquemas incompatibles (seguro `20250117` vs suelto sin tenant). El código usa el seguro. Convergencia: `20260611120000`. *Acción:* borrar `database/create_bundles_tables.sql` tras aplicar.
2. **intake_forms** — `009_intake_forms.sql` y `migrations/add-intake-forms.sql` declaran la tabla con diferencias. Cuál corrió en prod: desconocido. *Acción §F.*
3. **invoices** — caso de libro: `20250122` la protegía con guard `IF EXISTS`; la tabla nació en `20251019` con políticas abiertas ⇒ en orden cronológico quedó abierta (C3). Detalle y diagnóstico: doc 06 §C.
4. **patient_notes** — la migración versionada existía y *además* un endpoint creaba la tabla por GET con `exec_sql` (C12, eliminado). Señal de que alguien aplicaba DDL por HTTP.
5. **Sin timestamp** — `create_patient_notes.sql`, `add_costo_unitario_to_treatments.sql`, `create_inventory_system.sql`: la CLI los ordena lexicográficamente entre los demás ⇒ orden real de aplicación histórico imposible de reconstruir desde nombres.
6. **20250109_security_fixes.sql** — nombre que sugiere parches manuales previos; tratar su contenido como "quizá aplicado".

## C. Mapa cronológico-funcional (supabase/migrations)

- **001 / 006-009:** núcleo sgmm (patients/records/treatments…), inventario, doctors, email, intake. ← branding viejo
- **20250109–20250122:** WhatsApp, perfiles, seguridad, bundles seguro, settings, calendar, invitaciones, notificaciones, **aislamiento user_id**.
- **20251015–20251104:** doctor exceptions, subscriptions, índices, tags, **facturación (C3)**, mensajería, booking online, NOM-004 historia clínica.
- **2026 (fable):** webhook_events · fiscal RLS · bundles convergencia · buckets privados · public_token.

## D. Procedimiento de reconciliación (operador, ~1-2 h, en staging primero)

1. **Snapshot del esquema real:** `supabase db dump --schema public -f schema_prod.sql` (o pg_dump -s).
2. **Diff contra repo:** generar esquema "esperado" aplicando supabase/migrations en orden sobre una BD limpia local (`supabase db reset`) y comparar con `schema_prod.sql` (apgdiff o diff manual de tablas/policies clave: las del §B).
3. Por cada delta: decidir *adoptar* (escribir migración nueva con timestamp que lo capture) o *corregir* (migración que lo cambie). Nunca editar históricas.
4. Renombrar las 3 sin timestamp (p.ej. `20241015090000_create_patient_notes.sql` si esa fue su época) y `supabase migration repair --status applied <version>` para alinear `supabase_migrations.schema_migrations`.
5. Archivar `migrations/` y `database/` en `docs/legacy-sql/` con README "NO APLICAR".

## E. Estado de verificación

| Ítem | Estado |
|---|---|
| Inventario de fuentes y conflictos (este doc) | ✅ verificado en repo |
| Diff esquema repo vs producción (§D-2) | **NO VERIFICADO** — requiere acceso |
| Registro `schema_migrations` en prod | **NO VERIFICADO** |
