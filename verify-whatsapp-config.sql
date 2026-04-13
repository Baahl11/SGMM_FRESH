-- =============================================================================
-- VERIFICACIÓN RÁPIDA DE CONFIGURACIÓN WHATSAPP
-- =============================================================================
-- Ejecuta esto en Supabase SQL Editor para ver tu configuración actual

SELECT 
  user_id,
  whatsapp_enabled,
  whatsapp_phone_number_id,
  whatsapp_business_account_id,
  CASE 
    WHEN whatsapp_access_token IS NOT NULL THEN 'Token configurado ✅'
    ELSE 'Token FALTANTE ❌'
  END as token_status,
  LENGTH(whatsapp_access_token) as token_length,
  SUBSTRING(whatsapp_access_token, 1, 10) || '...' as token_preview
FROM user_profiles
WHERE user_id = auth.uid();

-- =============================================================================
-- Si no ves resultados, verifica que hayas guardado la configuración
-- en: https://agendamedpro.com/dashboard/settings/whatsapp
-- =============================================================================
