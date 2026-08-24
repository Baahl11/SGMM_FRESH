-- ============================================================================
-- Migración: convergencia de seguridad en bundles
-- Auditoría fable 2026-06-11 — hallazgo derivado de C3 (drift de esquema)
-- ----------------------------------------------------------------------------
-- CONTEXTO: existen DOS definiciones de bundles en el repo:
--   * supabase/migrations/20250117_create_bundles.sql  → user_id NOT NULL y
--     políticas por dueño (SEGURA; el código de app/api/bundles asume esta).
--   * database/create_bundles_tables.sql               → SIN user_id y con
--     políticas USING (true) (INSEGURA; script suelto ejecutable a mano).
-- No es posible saber desde el repo cuál corrió en producción. Esta migración
-- es IDEMPOTENTE y converge cualquier estado al esquema seguro.
--
-- ANTES DE APLICAR: backup + staging. Tras aplicar, verificar:
--   SELECT count(*) FROM bundles WHERE user_id IS NULL;
-- Las filas NULL (creadas bajo el esquema inseguro) quedan invisibles para
-- usuarios; asignarles dueño manualmente o archivarlas.
-- ROLLBACK: ver bloque comentado al final.
-- ============================================================================

-- 1) Asegurar columna de tenant (no-op si ya existe)
ALTER TABLE public.bundles
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_bundles_user_id ON public.bundles (user_id);

-- 2) Retirar políticas ABIERTAS si el script inseguro llegó a ejecutarse
DROP POLICY IF EXISTS "Users can view bundles"   ON public.bundles;
DROP POLICY IF EXISTS "Users can insert bundles" ON public.bundles;
DROP POLICY IF EXISTS "Users can update bundles" ON public.bundles;
DROP POLICY IF EXISTS "Users can delete bundles" ON public.bundles;

DROP POLICY IF EXISTS "Users can view bundle_treatments"   ON public.bundle_treatments;
DROP POLICY IF EXISTS "Users can insert bundle_treatments" ON public.bundle_treatments;
DROP POLICY IF EXISTS "Users can update bundle_treatments" ON public.bundle_treatments;
DROP POLICY IF EXISTS "Users can delete bundle_treatments" ON public.bundle_treatments;

-- 3) Garantizar políticas por dueño (recrear de forma idempotente)
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_treatments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bundles"   ON public.bundles;
DROP POLICY IF EXISTS "Users can insert own bundles" ON public.bundles;
DROP POLICY IF EXISTS "Users can update own bundles" ON public.bundles;
DROP POLICY IF EXISTS "Users can delete own bundles" ON public.bundles;

CREATE POLICY "Users can view own bundles" ON public.bundles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bundles" ON public.bundles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bundles" ON public.bundles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bundles" ON public.bundles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view bundle treatments through bundle ownership" ON public.bundle_treatments;
DROP POLICY IF EXISTS "Users can insert bundle treatments for own bundles"        ON public.bundle_treatments;
DROP POLICY IF EXISTS "Users can update bundle treatments for own bundles"        ON public.bundle_treatments;
DROP POLICY IF EXISTS "Users can delete bundle treatments for own bundles"        ON public.bundle_treatments;

CREATE POLICY "Users can view bundle treatments through bundle ownership" ON public.bundle_treatments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.bundles b WHERE b.id = bundle_treatments.bundle_id AND b.user_id = auth.uid())
  );
CREATE POLICY "Users can insert bundle treatments for own bundles" ON public.bundle_treatments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.bundles b WHERE b.id = bundle_treatments.bundle_id AND b.user_id = auth.uid())
  );
CREATE POLICY "Users can update bundle treatments for own bundles" ON public.bundle_treatments
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.bundles b WHERE b.id = bundle_treatments.bundle_id AND b.user_id = auth.uid())
  );
CREATE POLICY "Users can delete bundle treatments for own bundles" ON public.bundle_treatments
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.bundles b WHERE b.id = bundle_treatments.bundle_id AND b.user_id = auth.uid())
  );

-- ============================================================================
-- ROLLBACK: esta migración solo retira políticas inseguras y garantiza las
-- seguras; revertirla equivaldría a reabrir el acceso global (no recomendado).
-- Si fuera imprescindible: recrear las políticas USING (true) de
-- database/create_bundles_tables.sql líneas 32-40.
-- ============================================================================
