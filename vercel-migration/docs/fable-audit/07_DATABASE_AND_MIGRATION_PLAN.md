# 07 — Plan de base de datos y migraciones

## A. Migraciones NUEVAS de esta auditoría (orden de aplicación)

Aplicar **en este orden**, primero en staging, con backup previo en producción (doc 16):

| Orden | Archivo | Hallazgo | Reversible |
|---|---|---|---|
| 1 | `20260611100000_webhook_events.sql` | C9 idempotencia | DROP TABLE (si vacía) |
| 2 | `20260611110000_fiscal_rls_tenant_isolation.sql` | **C3 (P0)** | bloque comentado (reabre acceso) |
| 3 | `20260611120000_bundles_tenant_convergence.sql` | drift bundles | comentado |
| 4 | `20260611130000_private_storage_buckets.sql` | **C4 (P0)** | `public=true` (emergencia) |
| 5 | `20260611150000_public_access_tokens.sql` | C13 | DROP COLUMN |

Todas son **forward-only, idempotentes** (re-ejecutables sin error) y llevan en el encabezado: prerequisitos, verificaciones y rollback.

### Verificaciones pre/post (copy-paste, en staging y prod)

```sql
-- ANTES (anotar):
select 'pfd' t, count(*) from patient_fiscal_data
union all select 'inv', count(*) from invoices
union all select 'inv_rec', count(*) from invoice_records;

-- DESPUÉS (mismos totales + tenant poblado):
select 'pfd' t, count(*) total, count(*) filter (where user_id is null) huerfanas from patient_fiscal_data
union all select 'inv', count(*), count(*) filter (where user_id is null) from invoices;
-- huérfanas>0 ⇒ listarlas y asignar dueño antes del NOT NULL opcional.

select id, public from storage.buckets
 where id in ('invoices','gastos-facturas','facturama-certificates');  -- todo false

select provider, count(*) from webhook_events group by 1;  -- existe y vacía al inicio

select polname from pg_policy where polrelid='public.patient_fiscal_data'::regclass;
-- solo *_own; NINGUNA "Allow authenticated ..."
```

## B. Cómo aplicar

**Opción recomendada (CLI):** `supabase link --project-ref <ref>` → `supabase db push` (aplica pendientes en orden de nombre). ⚠️ OD-1: instalar la CLI fuera de `npm ci` del proyecto o usar binario standalone.
**Alternativa (SQL Editor):** pegar los 5 archivos **en el orden de la tabla**; al ser idempotentes, un re-pegado accidental no daña.

⚠️ `supabase db push` también intentará aplicar cualquier migración histórica que el proyecto remoto no tenga registrada; dado el drift (§C/doc 22), si es la primera vez que se usa la CLI contra prod, **preferir el SQL Editor solo con las 5 nuevas** y regularizar el historial después con `supabase migration repair` (tarea del doc 22).

## C. Higiene del directorio de migraciones (resumen; detalle en doc 22)

- **Sin timestamp** (orden indefinido para la CLI): `create_patient_notes.sql`, `add_costo_unitario_to_treatments.sql`, `create_inventory_system.sql` → renombrar con timestamp retroactivo y `migration repair`.
- **Duplicados/paralelos:** `intake_forms` definida en `009_intake_forms.sql` **y** `migrations/add-intake-forms.sql` (raíz `migrations/`, fuera de supabase/); bundles duplicada en `database/`. Directorios `migrations/` y `database/` quedan **prohibidos** como destino: todo SQL nuevo vive en `supabase/migrations/` con timestamp.
- `001_create_sgmm_tables.sql` crea el corazón del esquema con nombre del producto anterior (branding: doc 28; **no** renombrar tablas en esta fase).

## D. Acciones de seguridad en la BD (no son migraciones de esquema)

1. **Revocar/eliminar la RPC `exec_sql`** (vector de C12). Diagnóstico y limpieza:
```sql
select proname, prosecdef, pg_get_function_identity_arguments(oid)
from pg_proc where proname='exec_sql';
-- si existe:
drop function if exists public.exec_sql(text);
```
2. Revisar **API → Exposed schemas** en Supabase: solo `public` (y `storage` gestionado).
3. Confirmar que `anon` no tiene GRANTs directos fuera de lo gestionado por PostgREST.

## E. Política de migraciones hacia adelante

Una migración nueva por cambio; nombre `YYYYMMDDHHMMSS_descripcion.sql`; siempre idempotente; nunca editar una ya aplicada; rollback documentado en el propio archivo; las políticas RLS de una tabla nueva van en la MISMA migración que su `CREATE TABLE` (regla doc 06 §E).
