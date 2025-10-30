-- Add costo_unitario column to treatments table
ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(10,2) DEFAULT 0;

-- Add duracion_minutos column if it doesn't exist
ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER DEFAULT 30;

-- Add activo column if it doesn't exist
ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN treatments.costo_unitario IS 'Costo unitario del tratamiento (materiales y recursos)';
COMMENT ON COLUMN treatments.duracion_minutos IS 'Duración estimada del tratamiento en minutos';
COMMENT ON COLUMN treatments.activo IS 'Indica si el tratamiento está activo';
