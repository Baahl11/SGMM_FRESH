-- ============================================================================
-- Migración: aislamiento por tenant en datos fiscales
-- Auditoría fable 2026-06-11 — hallazgo C3 (P0)
-- ----------------------------------------------------------------------------
-- PROBLEMA: 20251019_invoices_and_fiscal.sql creó políticas USING (true) sobre
-- patient_fiscal_data, invoices e invoice_records. CUALQUIER usuario
-- autenticado de CUALQUIER clínica podía leer y modificar RFC, razones
-- sociales y facturas de todas las demás clínicas.
--
-- NOTA DE HISTORIA: 20250122_add_user_isolation.sql intentó asegurar
-- `invoices`, pero con guard `IF EXISTS` — y la tabla se creó DESPUÉS
-- (20251019). En orden cronológico el guard se saltó todo. Si alguien re-corrió
-- 20250122 a mano tras octubre, `invoices` podría tener ya user_id y políticas
-- "Users can ... own invoices": esta migración es idempotente frente a AMBOS
-- estados y converge a esos nombres canónicos.
--
-- ANTES DE APLICAR EN PRODUCCIÓN (OBLIGATORIO):
--   1. Backup completo de la base.
--   2. Ejecutar en staging y validar con DOS tenants distintos:
--        - tenant A no ve filas de tenant B en las tres tablas;
--        - el flujo de facturación (POST /api/invoices) sigue funcionando.
--   3. Registrar conteos previos:
--        SELECT count(*) FROM patient_fiscal_data;
--        SELECT count(*) FROM invoices;
--        SELECT count(*) FROM invoice_records;
--      y comparar tras el backfill (deben ser idénticos).
--
-- FILAS HUÉRFANAS: si tras el backfill quedan user_id NULL (paciente borrado,
-- datos inconsistentes), esas filas quedan INVISIBLES para los usuarios (solo
-- service role). Listarlas con:
--   SELECT id FROM patient_fiscal_data WHERE user_id IS NULL;
--   SELECT id FROM invoices WHERE user_id IS NULL;
-- y decidir su dueño manualmente antes de (opcionalmente) fijar NOT NULL.
--
-- ROLLBACK (restaura el estado anterior INSEGURO; usar solo en emergencia):
--   ver bloque comentado al final.
-- ============================================================================

-- 1) Columna de tenant ------------------------------------------------------
ALTER TABLE public.patient_fiscal_data
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2) Backfill ----------------------------------------------------------------
-- patient_fiscal_data: el dueño es el dueño del paciente.
UPDATE public.patient_fiscal_data pfd
SET user_id = p.user_id
FROM public.patients p
WHERE pfd.patient_id = p.id
  AND pfd.user_id IS NULL;

-- invoices: preferir created_by (quien emitió); si falta, dueño del paciente.
UPDATE public.invoices i
SET user_id = COALESCE(i.created_by, p.user_id)
FROM public.patients p
WHERE i.patient_id = p.id
  AND i.user_id IS NULL;

-- invoices sin paciente vinculable pero con created_by:
UPDATE public.invoices
SET user_id = created_by
WHERE user_id IS NULL
  AND created_by IS NOT NULL;

-- 3) Índices -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patient_fiscal_data_user_id
  ON public.patient_fiscal_data (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id
  ON public.invoices (user_id);

-- 4) Retirar políticas abiertas (nombres EXACTOS de 20251019) ----------------
DROP POLICY IF EXISTS "Allow authenticated read fiscal_data"   ON public.patient_fiscal_data;
DROP POLICY IF EXISTS "Allow authenticated insert fiscal_data" ON public.patient_fiscal_data;
DROP POLICY IF EXISTS "Allow authenticated update fiscal_data" ON public.patient_fiscal_data;

DROP POLICY IF EXISTS "Allow authenticated read invoices"   ON public.invoices;
DROP POLICY IF EXISTS "Allow authenticated insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow authenticated update invoices" ON public.invoices;

DROP POLICY IF EXISTS "Allow authenticated read invoice_records"   ON public.invoice_records;
DROP POLICY IF EXISTS "Allow authenticated insert invoice_records" ON public.invoice_records;

-- 5) Políticas por tenant -----------------------------------------------------
DROP POLICY IF EXISTS "fiscal_data_select_own" ON public.patient_fiscal_data;
CREATE POLICY "fiscal_data_select_own" ON public.patient_fiscal_data
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "fiscal_data_insert_own" ON public.patient_fiscal_data;
CREATE POLICY "fiscal_data_insert_own" ON public.patient_fiscal_data
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "fiscal_data_update_own" ON public.patient_fiscal_data;
CREATE POLICY "fiscal_data_update_own" ON public.patient_fiscal_data
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "fiscal_data_delete_own" ON public.patient_fiscal_data;
CREATE POLICY "fiscal_data_delete_own" ON public.patient_fiscal_data
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- (nombres canónicos de 20250122; DROP previo ⇒ idempotente)
DROP POLICY IF EXISTS "Users can view own invoices"   ON public.invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.invoices
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.invoices
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- invoice_records hereda el tenant de la factura (sin duplicar columna).
DROP POLICY IF EXISTS "invoice_records_select_via_invoice" ON public.invoice_records;
CREATE POLICY "invoice_records_select_via_invoice" ON public.invoice_records
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_records.invoice_id AND i.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "invoice_records_insert_via_invoice" ON public.invoice_records;
CREATE POLICY "invoice_records_insert_via_invoice" ON public.invoice_records
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_records.invoice_id AND i.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "invoice_records_delete_via_invoice" ON public.invoice_records;
CREATE POLICY "invoice_records_delete_via_invoice" ON public.invoice_records
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_records.invoice_id AND i.user_id = auth.uid()
    )
  );

-- 6) OPCIONAL tras verificar que no quedan NULL (ver encabezado):
-- ALTER TABLE public.patient_fiscal_data ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.invoices            ALTER COLUMN user_id SET NOT NULL;

-- ============================================================================
-- ROLLBACK DE EMERGENCIA (re-abre el acceso global; NO recomendado):
-- DROP POLICY IF EXISTS "fiscal_data_select_own" ON public.patient_fiscal_data;
-- DROP POLICY IF EXISTS "fiscal_data_insert_own" ON public.patient_fiscal_data;
-- DROP POLICY IF EXISTS "fiscal_data_update_own" ON public.patient_fiscal_data;
-- DROP POLICY IF EXISTS "fiscal_data_delete_own" ON public.patient_fiscal_data;
-- DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;
-- DROP POLICY IF EXISTS "invoices_insert_own" ON public.invoices;
-- DROP POLICY IF EXISTS "invoices_update_own" ON public.invoices;
-- DROP POLICY IF EXISTS "invoices_delete_own" ON public.invoices;
-- DROP POLICY IF EXISTS "invoice_records_select_via_invoice" ON public.invoice_records;
-- DROP POLICY IF EXISTS "invoice_records_insert_via_invoice" ON public.invoice_records;
-- DROP POLICY IF EXISTS "invoice_records_delete_via_invoice" ON public.invoice_records;
-- CREATE POLICY "Allow authenticated read fiscal_data" ON public.patient_fiscal_data FOR SELECT TO authenticated USING (true);
-- (… y así con el resto de políticas originales de 20251019; las columnas
--  user_id pueden permanecer sin efecto.)
-- ============================================================================
