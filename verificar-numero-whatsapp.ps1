# =============================================================================
# VERIFICAR ESTADO DEL NÚMERO DE WHATSAPP
# =============================================================================

Write-Host "`n🔍 VERIFICANDO ESTADO DEL NÚMERO`n" -ForegroundColor Cyan

$PHONE_NUMBER_ID = "1046505321870761"
$ACCESS_TOKEN = "EAA9ZCXO1nXF0BQlPLNSIf9Dxi4B5e5atKIrZAW5BPPA19u8lxamdA7GpWhaj9ZAF8nhwKShML7MMEUz1RXr3hZCHSHn1Cib6fp9weACNpeuzkwXW2sCBOgUJZBcS4ZCiIVAlTKnTXATqhJp1zx2AS0ZB1Q9hYkByS8eAb7UokG7MAs5OhHSZABEdezvGahfqAwZDZD"

$url = "https://graph.facebook.com/v18.0/$PHONE_NUMBER_ID`?access_token=$ACCESS_TOKEN"

Write-Host "📞 Consultando Phone Number ID: $PHONE_NUMBER_ID`n" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method GET
    
    Write-Host "✅ INFORMACIÓN DEL NÚMERO:`n" -ForegroundColor Green
    
    Write-Host "📱 Número: $($response.display_phone_number)" -ForegroundColor White
    Write-Host "🏢 Nombre verificado: $($response.verified_name)" -ForegroundColor White
    Write-Host "📊 Quality rating: $($response.quality_rating)" -ForegroundColor White
    Write-Host "🔐 Code verification status: $($response.code_verification_status)" -ForegroundColor White
    Write-Host "✅ Is official business account: $($response.is_official_business_account)" -ForegroundColor White
    
    Write-Host "`nℹ️ Estado del número:" -ForegroundColor Cyan
    
    if ($response.code_verification_status -eq "VERIFIED") {
        Write-Host "   ✅ Número verificado y listo para usar`n" -ForegroundColor Green
        Write-Host "🎯 SIGUIENTE PASO:" -ForegroundColor Yellow
        Write-Host "   El número YA está verificado. El problema es que tu app está en modo Development.`n" -ForegroundColor White
        
        Write-Host "📋 SOLUCIONES:`n" -ForegroundColor Cyan
        Write-Host "Opción 1 - Cambiar a Live Mode:" -ForegroundColor Yellow
        Write-Host "   1. Ve a tu app en Meta → Settings → Basic" -ForegroundColor Gray
        Write-Host "   2. Busca 'App Mode' y cámbialo a 'Live'" -ForegroundColor Gray
        Write-Host "   3. Esto permitirá recibir webhooks de mensajes reales`n" -ForegroundColor Gray
        
        Write-Host "Opción 2 - Agregar tu número como tester:" -ForegroundColor Yellow
        Write-Host "   1. Ve a tu app en Meta → Roles" -ForegroundColor Gray
        Write-Host "   2. Agrega tu número +522224319347 como Admin/Developer" -ForegroundColor Gray
        Write-Host "   3. Acepta la invitación desde WhatsApp`n" -ForegroundColor Gray
        
    } else {
        Write-Host "   ⚠️ Número NO verificado" -ForegroundColor Yellow
        Write-Host "   Necesitas verificar el número en Meta primero`n" -ForegroundColor Gray
    }
    
    Write-Host "📄 Respuesta completa de Meta:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "❌ ERROR AL CONSULTAR NÚMERO`n" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error: $($errorJson.error.message)" -ForegroundColor Yellow
        Write-Host "Código: $($errorJson.error.code)`n" -ForegroundColor Gray
        
        if ($errorJson.error.code -eq 190) {
            Write-Host "💡 El Access Token es inválido o expiró" -ForegroundColor Yellow
            Write-Host "   Genera uno nuevo en Meta → System Users`n" -ForegroundColor Gray
        }
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Gray
    }
}

Write-Host ""
