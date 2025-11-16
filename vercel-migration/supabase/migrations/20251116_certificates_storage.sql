-- Migration: Supabase Storage for CSD Certificates
-- Created: 2025-11-16
-- Purpose: Secure storage for .cer and .key files from SAT

-- ===== STEP 1: Create Storage Bucket =====

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'facturama-certificates',
  'facturama-certificates',
  false, -- Private bucket (requires authentication)
  5242880, -- 5MB max file size
  ARRAY['application/x-x509-ca-cert', 'application/pkix-cert', 'application/octet-stream', 'application/x-pem-file']
)
ON CONFLICT (id) DO NOTHING;

-- ===== STEP 2: RLS Policies for Storage =====

-- Policy: Users can upload certificates to their own folder
CREATE POLICY "Users can upload their own certificates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'facturama-certificates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own certificates
CREATE POLICY "Users can view their own certificates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'facturama-certificates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own certificates
CREATE POLICY "Users can update their own certificates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'facturama-certificates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own certificates
CREATE POLICY "Users can delete their own certificates"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'facturama-certificates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ===== NOTES =====
-- File naming convention: {user_id}/{certificate_type}.{ext}
-- Example: 550e8400-e29b-41d4-a716-446655440000/certificate.cer
--          550e8400-e29b-41d4-a716-446655440000/certificate.key
-- 
-- Allowed MIME types:
-- - application/x-x509-ca-cert (.cer)
-- - application/pkix-cert (.cer alternative)
-- - application/octet-stream (generic binary)
-- - application/x-pem-file (.pem if needed)
