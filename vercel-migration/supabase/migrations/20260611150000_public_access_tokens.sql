-- ============================================================================
-- Migración: tokens de acceso público no enumerables
-- Auditoría fable 2026-06-11 — hallazgo C13
-- ----------------------------------------------------------------------------
-- PROBLEMA: documentos para firma, intake forms y encuestas NPS se exponían
-- públicamente usando el UUID PRIMARIO de la fila. Ese UUID aparece en URLs
-- internas, logs y exports, y no puede rotarse sin romper integridad.
--
-- SOLUCIÓN: columna public_token (uuid aleatorio, único, rotable) usada por
-- los endpoints públicos. El código ya hace lookup por public_token con
-- fallback legacy por id (lib/security/public-endpoints.ts). DECISIÓN OD-7:
-- cuando los enlaces compartidos se hayan regenerado con token, retirar el
-- fallback por id.
--
-- ROLLBACK: ALTER TABLE ... DROP COLUMN public_token; (los enlaces con token
-- dejarían de resolver; el fallback por id seguiría funcionando).
-- ============================================================================

ALTER TABLE public.document_templates
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid();

ALTER TABLE public.intake_forms
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid();

ALTER TABLE public.nps_surveys
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid();

COMMENT ON COLUMN public.document_templates.public_token IS
  'Token público rotable para enlaces de firma (fable C13). No usar el id primario en URLs.';
COMMENT ON COLUMN public.intake_forms.public_token IS
  'Token público rotable para enlaces de intake (fable C13).';
COMMENT ON COLUMN public.nps_surveys.public_token IS
  'Token público rotable para enlaces NPS (fable C13).';
