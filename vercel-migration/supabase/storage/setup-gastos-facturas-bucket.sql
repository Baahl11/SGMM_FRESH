-- ============================================
-- SUPABASE STORAGE: Bucket para Facturas de Gastos Variables
-- Date: 2025-11-10
-- Description: Configuración del bucket para almacenar facturas (PDF/imágenes)
-- ============================================

-- ============================================
-- 1. CREAR BUCKET: gastos-facturas
-- ============================================

-- Insertar bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gastos-facturas',
  'gastos-facturas',
  true,  -- Bucket público para que las facturas sean accesibles
  10485760,  -- 10MB máximo por archivo
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. RLS POLICIES para el bucket
-- ============================================

-- Policy: Los usuarios pueden subir archivos a su propia carpeta
CREATE POLICY "Users can upload invoices to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gastos-facturas' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Los usuarios pueden ver sus propios archivos
CREATE POLICY "Users can view own invoices"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'gastos-facturas' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Los usuarios pueden actualizar sus propios archivos
CREATE POLICY "Users can update own invoices"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gastos-facturas' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Los usuarios pueden eliminar sus propios archivos
CREATE POLICY "Users can delete own invoices"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'gastos-facturas' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 3. CONFIGURACIÓN ADICIONAL
-- ============================================

-- Actualizar configuración del bucket (opcional)
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 10485760,  -- 10MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]::text[]
WHERE id = 'gastos-facturas';

-- ============================================
-- 4. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Storage bucket "gastos-facturas" configurado exitosamente';
  RAISE NOTICE '📦 Configuración:';
  RAISE NOTICE '   - Bucket público: SÍ (para acceso directo a facturas)';
  RAISE NOTICE '   - Tamaño máximo: 10MB por archivo';
  RAISE NOTICE '   - Tipos permitidos: PDF, JPG, PNG, WEBP';
  RAISE NOTICE '   - RLS habilitado: Cada usuario solo ve sus facturas';
  RAISE NOTICE '   - Estructura: user_id/timestamp_random.ext';
  RAISE NOTICE '';
  RAISE NOTICE '📝 INSTRUCCIONES ALTERNATIVAS (si el script falla):';
  RAISE NOTICE '   1. Ve a Supabase Dashboard → Storage';
  RAISE NOTICE '   2. Click en "New bucket"';
  RAISE NOTICE '   3. Nombre: gastos-facturas';
  RAISE NOTICE '   4. Public: ✓ Habilitado';
  RAISE NOTICE '   5. File size limit: 10MB';
  RAISE NOTICE '   6. Allowed MIME types: application/pdf, image/jpeg, image/png, image/webp';
  RAISE NOTICE '   7. Guardar';
END $$;
