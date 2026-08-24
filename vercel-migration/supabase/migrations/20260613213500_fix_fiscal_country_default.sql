-- ISO 3166-1 alpha-2 is required by the existing varchar(2) column.
ALTER TABLE public.patient_fiscal_data
  ALTER COLUMN pais SET DEFAULT 'MX';

UPDATE public.patient_fiscal_data
SET pais = 'MX'
WHERE pais IS NULL OR length(pais) <> 2;
