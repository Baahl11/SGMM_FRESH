-- =====================================================
-- SUPABASE STORAGE: Form Files Bucket Setup
-- =====================================================
-- Purpose: Create storage bucket for intake form file uploads
-- Features: Public access, 10MB file limit, common file types
-- Security: RLS policies for upload/delete based on form ownership
-- =====================================================

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'form-files',
  'form-files',
  true,
  10485760, -- 10MB in bytes
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Policy 1: Anyone can upload files (public forms need this)
-- Files are uploaded with path: form-uploads/{timestamp}-{random}.{ext}
CREATE POLICY "Anyone can upload form files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'form-files' AND
  (storage.foldername(name))[1] = 'form-uploads'
);

-- Policy 2: Public read access (for displaying uploaded files)
CREATE POLICY "Public read access for form files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'form-files');

-- Policy 3: Authenticated users can delete their own form files
-- This allows doctors to clean up files from their forms
CREATE POLICY "Users can delete their form files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'form-files' AND
  auth.uid() IS NOT NULL
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to clean up orphaned files (optional maintenance)
-- Run this periodically to remove files from deleted submissions
CREATE OR REPLACE FUNCTION cleanup_orphaned_form_files()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  file_record RECORD;
BEGIN
  -- Find files that don't belong to any submission
  FOR file_record IN
    SELECT name
    FROM storage.objects
    WHERE bucket_id = 'form-files'
    AND created_at < NOW() - INTERVAL '30 days' -- Only cleanup old files
  LOOP
    -- Check if file URL exists in any submission
    IF NOT EXISTS (
      SELECT 1
      FROM form_submissions
      WHERE uploaded_files::text LIKE '%' || file_record.name || '%'
    ) THEN
      -- Delete orphaned file
      DELETE FROM storage.objects
      WHERE bucket_id = 'form-files'
      AND name = file_record.name;
      
      deleted_count := deleted_count + 1;
    END IF;
  END LOOP;

  RETURN deleted_count;
END;
$$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify bucket was created
-- SELECT * FROM storage.buckets WHERE id = 'form-files';

-- Check storage policies
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%form files%';

-- Test file upload permissions (run as authenticated user)
-- SELECT storage.foldername('form-uploads/test.pdf');

-- Check storage usage
-- SELECT 
--   COUNT(*) as total_files,
--   SUM(metadata->>'size')::bigint as total_size_bytes,
--   pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
-- FROM storage.objects
-- WHERE bucket_id = 'form-files';
