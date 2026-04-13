#!/usr/bin/env pwsh

# =============================================================================
# DIAGNÓSTICO WHATSAPP WEBHOOK - AgendaMedPro
# =============================================================================

Write-Host "`n🔍 DIAGNÓSTICO DE WHATSAPP AI ASSISTANT`n" -ForegroundColor Cyan

# 1. Verificar que el webhook esté accesible
Write-Host "1️⃣ Verificando endpoint del webhook..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://agendamedpro.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=agendamedpro_verify_2026&hub.challenge=test123" -Method GET
    if ($response.StatusCode -eq 200 -and $response.Content -eq "test123") {
        Write-Host "   ✅ Webhook respondiendo correctamente`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Webhook respondió pero con contenido inesperado: $($response.Content)`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error al verificar webhook: $_`n" -ForegroundColor Red
}

# 2. Verificar variables de entorno en Vercel
Write-Host "2️⃣ Variables requeridas en Vercel:" -ForegroundColor Yellow
Write-Host "   Verifica que tengas configuradas:" -ForegroundColor Gray
Write-Host "   ✓ NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   ✓ SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
Write-Host "   ✓ ANTHROPIC_API_KEY" -ForegroundColor Gray
Write-Host "   ✓ WHATSAPP_VERIFY_TOKEN (opcional, default: agendamedpro_verify_2026)`n" -ForegroundColor Gray

# 3. Instrucciones para ver logs
Write-Host "3️⃣ Ver logs en tiempo real:" -ForegroundColor Yellow
Write-Host "   1. Ve a: https://vercel.com/guillermo-melgarejos-projects/vercel-migration" -ForegroundColor Gray
Write-Host "   2. Clic en 'Functions' en el menú lateral" -ForegroundColor Gray
Write-Host "   3. Busca: /api/webhooks/whatsapp" -ForegroundColor Gray
Write-Host "   4. Clic en 'View Invocations'" -ForegroundColor Gray
Write-Host "   5. Envía un mensaje de WhatsApp" -ForegroundColor Gray
Write-Host "   6. Actualiza la página para ver el log`n" -ForegroundColor Gray

# 4. Verificar configuración en Meta
Write-Host "4️⃣ Verificar configuración en Meta:" -ForegroundColor Yellow
Write-Host "   1. Ve a: https://developers.facebook.com/apps" -ForegroundColor Gray
Write-Host "   2. Selecciona tu app" -ForegroundColor Gray
Write-Host "   3. WhatsApp → Configuration" -ForegroundColor Gray
Write-Host "   4. Verifica Webhook:" -ForegroundColor Gray
Write-Host "      • Callback URL: https://agendamedpro.com/api/webhooks/whatsapp" -ForegroundColor Gray
Write-Host "      • Verify Token: agendamedpro_verify_2026" -ForegroundColor Gray
Write-Host "      • Subscribed fields: ✅ messages" -ForegroundColor Gray
Write-Host "   5. Haz clic en 'Test' al lado del webhook" -ForegroundColor Gray
Write-Host "   6. Debe decir 'Success'`n" -ForegroundColor Gray

# 5. Query para verificar configuración en DB
Write-Host "5️⃣ Verificar configuración en Supabase:" -ForegroundColor Yellow
Write-Host "   Ejecuta este query en Supabase SQL Editor:`n" -ForegroundColor Gray

$sqlQuery = @"
-- Verificar perfil de WhatsApp
SELECT 
  user_id,
  whatsapp_enabled,
  whatsapp_phone_number_id,
  CASE 
    WHEN whatsapp_access_token IS NOT NULL THEN '✅ Configurado'
    ELSE '❌ Faltante'
  END as token_status,
  LENGTH(whatsapp_access_token) as token_length
FROM user_profiles
WHERE user_id = (SELECT auth.uid()); -- Tu usuario actual
"@

Write-Host $sqlQuery -ForegroundColor DarkGray
Write-Host ""

# 6. Problemas comunes
Write-Host "6️⃣ Problemas comunes y soluciones:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ❌ Webhook no responde:" -ForegroundColor Red
Write-Host "      → Verificar que el webhook esté guardado en Meta" -ForegroundColor Gray
Write-Host "      → Hacer 'Test' del webhook en Meta Configuration" -ForegroundColor Gray
Write-Host "      → Revisar logs en Vercel Functions`n" -ForegroundColor Gray

Write-Host "   ❌ Bot no envía respuesta:" -ForegroundColor Red
Write-Host "      → Verificar ANTHROPIC_API_KEY en Vercel" -ForegroundColor Gray
Write-Host "      → Verificar whatsapp_access_token en DB" -ForegroundColor Gray
Write-Host "      → Revisar logs para ver error específico`n" -ForegroundColor Gray

Write-Host "   ❌ Error 'profile_not_found':" -ForegroundColor Red
Write-Host "      → El Phone Number ID en Meta no coincide con el de la DB" -ForegroundColor Gray
Write-Host "      → Verificar Phone Number ID en /dashboard/settings/whatsapp" -ForegroundColor Gray
Write-Host "      → Ejecutar query de arriba para ver qué tienes guardado`n" -ForegroundColor Gray

Write-Host "   ❌ Error 'Invalid access token':" -ForegroundColor Red
Write-Host "      → Token temporal expiró (dura 24 horas)" -ForegroundColor Gray
Write-Host "      → Generar token PERMANENTE en Meta → System Users" -ForegroundColor Gray
Write-Host "      → Actualizar en /dashboard/settings/whatsapp`n" -ForegroundColor Gray

# 7. Prueba de envío manual
Write-Host "7️⃣ Probar envío manual de WhatsApp:" -ForegroundColor Yellow
Write-Host "   Ejecuta esto en PowerShell (reemplaza los valores):`n" -ForegroundColor Gray

$curlExample = @"
`$body = @{
  phone_number_id = "TU_PHONE_NUMBER_ID"
  access_token = "TU_ACCESS_TOKEN"
  to = "521234567890"  # Número destino con código país
  message = "Hola, este es un mensaje de prueba"
} | ConvertTo-Json

Invoke-RestMethod -Method POST ``
  -Uri "https://graph.facebook.com/v18.0/`$(`$body.phone_number_id)/messages" ``
  -Headers @{ "Authorization" = "Bearer `$(`$body.access_token)" } ``
  -ContentType "application/json" ``
  -Body (@{
    messaging_product = "whatsapp"
    to = "`$(`$body.to)"
    type = "text"
    text = @{ body = "`$(`$body.message)" }
  } | ConvertTo-Json)
"@

Write-Host $curlExample -ForegroundColor DarkGray
Write-Host ""

# Resumen final
Write-Host "`n📋 CHECKLIST DE VERIFICACIÓN:" -ForegroundColor Cyan
Write-Host "   [ ] Webhook configurado en Meta" -ForegroundColor Gray
Write-Host "   [ ] Webhook responde OK al test de Meta" -ForegroundColor Gray
Write-Host "   [ ] whatsapp_enabled = true en DB" -ForegroundColor Gray
Write-Host "   [ ] Phone Number ID correcto en DB" -ForegroundColor Gray
Write-Host "   [ ] Access Token permanente configurado" -ForegroundColor Gray
Write-Host "   [ ] ANTHROPIC_API_KEY en Vercel" -ForegroundColor Gray
Write-Host "   [ ] Webhook fields 'messages' suscrito en Meta`n" -ForegroundColor Gray

Write-Host "🔗 Links útiles:" -ForegroundColor Cyan
Write-Host "   • Vercel Dashboard: https://vercel.com/guillermo-melgarejos-projects/vercel-migration" -ForegroundColor Blue
Write-Host "   • Meta Developer: https://developers.facebook.com/apps" -ForegroundColor Blue
Write-Host "   • Supabase: https://supabase.com/dashboard/project/_/editor" -ForegroundColor Blue
Write-Host ""
