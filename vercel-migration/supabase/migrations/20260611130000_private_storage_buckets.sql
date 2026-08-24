-- ============================================================================
-- Migración: buckets de Storage privados + políticas por tenant
-- Auditoría fable 2026-06-11 — hallazgo C4 (P0)
-- ----------------------------------------------------------------------------
-- PROBLEMA: los buckets `invoices` (facturas CFDI: XML/PDF con RFC y datos
-- fiscales de pacientes) y `gastos-facturas` eran PÚBLICOS: cualquier persona
-- con la URL podía descargar los archivos sin autenticación, y las URLs se
-- guardaban en texto plano en la base.
--
-- PREREQUISITO DE CÓDIGO: aplicar junto con el deploy que incluye
-- lib/storage/signed.ts (las lecturas pasan a signed URLs). Si se aplica esta
-- migración con el código viejo, los enlaces públicos guardados dejarán de
-- abrir (los nuevos endpoints firman tanto rutas nuevas como URLs históricas).
--
-- ANTES DE APLICAR: backup + staging; verificar en staging que:
--   1. POST /api/invoices genera y el email llega con enlaces firmados.
--   2. GET /api/invoices abre XML/PDF de filas HISTÓRICAS (URL pública vieja).
--   3. Subida y apertura de facturas de gastos funciona.
--
-- REMEDIACIÓN HISTÓRICA (doc 23): los objetos descargados mientras el bucket
-- fue público pueden existir en cachés de terceros. Para casos sensibles,
-- mover/renombrar el objeto (rota la URL) — el helper extractStoragePath
-- soporta rutas nuevas sin cambiar la fila si se actualiza a la nueva ruta.
--
-- ROLLBACK (reabre la exposición; solo emergencia):
--   UPDATE storage.buckets SET public = true WHERE id IN ('invoices','gastos-facturas');
-- ============================================================================

-- 1) Volver privados los buckets sensibles (idempotente)
UPDATE storage.buckets SET public = false WHERE id = 'invoices';
UPDATE storage.buckets SET public = false WHERE id = 'gastos-facturas';

-- Salvaguarda: las llaves CSD jamás deben quedar públicas.
UPDATE storage.buckets SET public = false WHERE id = 'facturama-certificates';

-- 2) Políticas por tenant en storage.objects (carpeta raíz = auth.uid())
--    El service role (server) las omite; esto cubre acceso directo del cliente.

-- ---- bucket: invoices ----
DROP POLICY IF EXISTS "fable invoices select own" ON storage.objects;
DROP POLICY IF EXISTS "fable invoices insert own" ON storage.objects;
DROP POLICY IF EXISTS "fable invoices update own" ON storage.objects;
DROP POLICY IF EXISTS "fable invoices delete own" ON storage.objects;

CREATE POLICY "fable invoices select own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "fable invoices insert own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "fable invoices update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "fable invoices delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---- bucket: gastos-facturas ----
-- (setup-gastos-facturas-bucket.sql ya creaba políticas por carpeta con
--  nombres "Users can ... own invoices"; se conservan si existen y se añaden
--  las equivalentes con prefijo fable para garantizar cobertura.)
DROP POLICY IF EXISTS "fable gastos select own" ON storage.objects;
DROP POLICY IF EXISTS "fable gastos insert own" ON storage.objects;
DROP POLICY IF EXISTS "fable gastos update own" ON storage.objects;
DROP POLICY IF EXISTS "fable gastos delete own" ON storage.objects;

CREATE POLICY "fable gastos select own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'gastos-facturas' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "fable gastos insert own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gastos-facturas' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "fable gastos update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'gastos-facturas' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "fable gastos delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gastos-facturas' AND (storage.foldername(name))[1] = auth.uid()::text);
