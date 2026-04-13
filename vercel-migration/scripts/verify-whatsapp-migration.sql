-- ============================================================================
-- VERIFICAR Y APLICAR MIGRACIÓN DE WHATSAPP
-- ============================================================================
-- Ejecuta esto en Supabase SQL Editor
-- ============================================================================

-- 1. Verificar si las columnas existen
DO $$ 
DECLARE
    col_exists boolean;
BEGIN
    -- Check if whatsapp_phone column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'whatsapp_phone'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE '✅ Las columnas de WhatsApp ya existen';
    ELSE
        RAISE NOTICE '❌ Las columnas de WhatsApp NO existen - aplicando migración...';
        
        -- Add WhatsApp configuration columns if they don't exist
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS whatsapp_default_message TEXT,
        ADD COLUMN IF NOT EXISTS whatsapp_config_level VARCHAR(20) DEFAULT 'basic';
        
        RAISE NOTICE '✅ Columnas creadas exitosamente';
    END IF;
END $$;

-- 2. Mostrar estructura actual de user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name LIKE '%whatsapp%'
ORDER BY ordinal_position;
