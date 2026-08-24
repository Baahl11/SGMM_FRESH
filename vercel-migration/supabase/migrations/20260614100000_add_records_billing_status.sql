-- Converge records with the fields required by multi-treatment and invoicing flows.
ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS nombre_promocion VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tiene_multiples_tratamientos BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pendiente_facturar BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_records_tiene_multiples
  ON public.records(tiene_multiples_tratamientos);
CREATE INDEX IF NOT EXISTS idx_records_pendiente_facturar
  ON public.records(pendiente_facturar);

COMMENT ON COLUMN public.records.nombre_promocion
  IS 'Bundle or promotion name for grouped treatments.';
COMMENT ON COLUMN public.records.tiene_multiples_tratamientos
  IS 'Whether the record belongs to a multi-treatment session.';
COMMENT ON COLUMN public.records.pendiente_facturar
  IS 'Whether the treatment record is still pending invoicing.';
