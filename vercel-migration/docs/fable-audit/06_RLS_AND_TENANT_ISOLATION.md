# 06 — RLS y aislamiento multi-tenant

Auditoría fable · análisis estático de `supabase/migrations/` + `database/` + código. **La verificación dinámica en BD real está pendiente** (matriz §D, a ejecutar en staging).

## A. Modelo de tenant

Un tenant = **una clínica = un `auth.users.id`** (el dueño). No hay tabla `organizations`: el `user_id` del dueño es la clave de partición en todas las tablas de negocio, y los miembros de equipo (`team_members`, invitaciones) operan *sobre los datos del dueño*. Las políticas canónicas son `USING (auth.uid() = user_id)` por operación, rol `authenticated`.

Implicación importante: las rutas API que usan el cliente **cookie/anon** heredan RLS; las que usan `getSupabaseAdmin()` (service role) **omiten RLS** y deben imponer el filtro `user_id` a mano — por eso C2/F1 eran graves y por eso la matriz del doc 21 marca la columna *Admin*.

## B. Estado por tabla (estático)

**Aisladas correctamente** (columna `user_id` + políticas por dueño; fuente principal `20250122_add_user_isolation.sql`, `006_add_user_id_to_inventory.sql`, `20250122_add_user_id_to_promotions.sql`, creaciones posteriores ya nacen aisladas):
`patients, appointments, records, treatments, gastos_fijos, inventory_items, inventory_movements, certificates, patient_records*, patient_notes, patient_tags, patient_tag_assignments, subscriptions, clinic_settings, doctors, doctor_schedules, doctor_exceptions, locations, consultorios, intake_forms, nps_surveys**, document_templates**, messaging_*, notifications, variable_expenses, bundles (canónica 20250117), user_profiles, …`
\* guardada por `IF EXISTS` · \** vía dueño + endpoints públicos endurecidos (C13).

**ROTAS hasta aplicar migraciones (P0):**

| Tabla | Problema (evidencia) | Migración correctiva |
|---|---|---|
| `patient_fiscal_data` | `USING(true)` ×3, sin `user_id` (`20251019:175+`) | `20260611110000` |
| `invoices` | `USING(true)` ×3; `user_id` probablemente ausente (ver §C) | `20260611110000` |
| `invoice_records` | `USING(true)` read+insert, sin tenant | `20260611110000` (vía `EXISTS` invoices) |
| `bundles`/`bundle_treatments` | **si** corrió el script suelto `database/create_bundles_tables.sql` (sin user_id, abierto) | `20260611120000` (convergencia) |

**Solo service role** (RLS habilitado sin políticas — correcto): `webhook_events` (nueva), `demo_audit_log`, `error_logs`, `cleanup_logs` y similares de operación.

**Sin RLS por diseño público:** ninguna tabla de negocio; el acceso público pasa por endpoints con service role + validaciones (booking, C13).

## C. El matiz histórico de `invoices` (importante para el operador)

`20250122` quiso asegurar `invoices` pero con guard `IF EXISTS`… y la tabla nació en `20251019`. En orden cronológico, el guard se saltó la protección y octubre instaló políticas abiertas. **Estado real de producción: desconocido desde el repo** (alguien pudo re-correr enero a mano). La migración `20260611110000` es idempotente frente a ambos estados y converge a los nombres canónicos `"Users can … own invoices"`. Diagnóstico previo recomendado en prod (solo lectura):

```sql
select polname, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy where polrelid = 'public.invoices'::regclass;
select count(*) filter (where user_id is null) as sin_tenant, count(*) as total
from public.invoices;  -- fallará si la columna no existe ⇒ estado octubre puro
```

## D. Matriz de verificación con 2 tenants (EJECUTAR EN STAGING — checklist)

Preparación: usuarios A y B; con A crear 1 paciente, 1 cita, 1 expediente, 1 dato fiscal, 1 factura (+1 línea), 1 bundle, 1 gasto con archivo.

| # | Acción como B | Esperado |
|---|---|---|
| 1 | `GET /api/patients` | Solo pacientes de B (no los de A) |
| 2 | `GET /api/appointments/<id_de_A>` | 404 |
| 3 | `PUT /api/appointments/<id_de_A>` | 404/forbidden (regresión C2) |
| 4 | `GET /api/records/<id_de_A>` | 404 (regresión F1) |
| 5 | SQL como B: `select * from patient_fiscal_data` | 0 filas de A (C3) |
| 6 | SQL como B: `select * from invoices` / `invoice_records` | 0 filas de A |
| 7 | SQL como B: `update invoices set total=0 where id=<de A>` | 0 filas afectadas |
| 8 | `GET /api/bundles` | Solo bundles de B |
| 9 | Abrir URL **firmada** de factura de A (obtenida como A) caducada/ajena | Sin acceso tras expiración; objeto no listable |
| 10 | `GET storage …/object/public/invoices/...` (URL pública vieja) | 400/404 (bucket privado) |
| 11 | POST público de firma con `patient_id` de A usando token de doc de B | Asociación descartada (C13 `sanitizeAssociations`) |
| 12 | Repetir webhook MP (mismo `data.id`) | 2.º intento ⇒ `duplicate:true`, sin efectos |

Registrar resultados en doc 17. Cualquier fila en rojo **bloquea producción**.

## E. Reglas para nuevas tablas (adoptar como estándar)

1. Toda tabla de negocio nace con `user_id uuid not null references auth.users(id) on delete cascade` + índice.
2. RLS habilitado en la misma migración con las 4 políticas por dueño (o `EXISTS` al padre).
3. Prohibido `USING (true)` salvo tablas service-role-only **sin** políticas.
4. Los endpoints con service role replican el filtro de tenant a mano y lo cubren con test (patrón `tests/appointments-id-authz.test.ts`).
