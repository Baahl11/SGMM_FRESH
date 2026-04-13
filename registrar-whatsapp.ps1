# =============================================================================
# REGISTRAR NÚMERO DE WHATSAPP CON META API
# =============================================================================

Write-Host "`n🔐 REGISTRANDO NÚMERO DE WHATSAPP CON META`n" -ForegroundColor Cyan

# Configuración - REEMPLAZA CON TUS DATOS
$PHONE_NUMBER_ID = "1046505321870761"  # Tu Phone Number ID
$ACCESS_TOKEN = "EAA9ZCXO1nXF0BQlPLNSIf9Dxi4B5e5atKIrZAW5BPPA19u8lxamdA7GpWhaj9ZAF8nhwKShML7MMEUz1RXr3hZCHSHn1Cib6fp9weACNpeuzkwXW2sCBOgUJZBcS4ZCiIVAlTKnTXATqhJp1zx2AS0ZB1Q9hYkByS8eAb7UokG7MAs5OhHSZABEdezvGahfqAwZDZD"  # Tu Access Token
$PIN = "123456"  # PIN de 6 dígitos (elige uno)

Write-Host "📱 Phone Number ID: $PHONE_NUMBER_ID" -ForegroundColor Gray
Write-Host "🔑 Access Token: $($ACCESS_TOKEN.Substring(0, 20))..." -ForegroundColor Gray
Write-Host "📌 PIN: $PIN`n" -ForegroundColor Gray

# Construir URL
$url = "https://graph.facebook.com/v18.0/$PHONE_NUMBER_ID/register"

Write-Host "🌐 Registrando número..." -ForegroundColor Yellow

try {
    # Hacer la llamada POST
    $headers = @{
        "Authorization" = "Bearer $ACCESS_TOKEN"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        messaging_product = "whatsapp"
        pin = $PIN
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    
    Write-Host "`n✅ NÚMERO REGISTRADO EXITOSAMENTE`n" -ForegroundColor Green
    Write-Host "Respuesta de Meta:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3
    
    Write-Host "`n🎉 Ahora puedes:`n" -ForegroundColor Cyan
    Write-Host "   1. Enviar mensajes a tu número +52 222 431 9347" -ForegroundColor White
    Write-Host "   2. El webhook debería recibir los mensajes" -ForegroundColor White
    Write-Host "   3. El bot IA responderá automáticamente`n" -ForegroundColor White
    
} catch {
    $errorDetails = $_.Exception.Message
    
    Write-Host "`n❌ ERROR AL REGISTRAR NÚMERO`n" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error de Meta:" -ForegroundColor Yellow
        Write-Host "  Código: $($errorJson.error.code)" -ForegroundColor Gray
        Write-Host "  Mensaje: $($errorJson.error.message)" -ForegroundColor Gray
        Write-Host "  Tipo: $($errorJson.error.type)" -ForegroundColor Gray
        
        # Ayuda según el error
        switch ($errorJson.error.code) {
            190 {
                Write-Host "`n💡 Solución: Token inválido o expirado" -ForegroundColor Yellow
                Write-Host "   - Genera un nuevo token PERMANENTE en Meta" -ForegroundColor Gray
                Write-Host "   - System Users → Generate Token → Never expires`n" -ForegroundColor Gray
            }
            100 {
                Write-Host "`n💡 Solución: Parámetro inválido" -ForegroundColor Yellow
                Write-Host "   - Verifica que el Phone Number ID sea correcto" -ForegroundColor Gray
                Write-Host "   - El número debe estar verificado en Meta`n" -ForegroundColor Gray
            }
            368 {
                Write-Host "`n💡 Ya está registrado (esto es BUENO)" -ForegroundColor Green
                Write-Host "   - Tu número ya está listo para usar" -ForegroundColor Gray
                Write-Host "   - Intenta enviar un mensaje de WhatsApp`n" -ForegroundColor Gray
            }
            default {
                Write-Host "`n💡 Error desconocido. Verifica:" -ForegroundColor Yellow
                Write-Host "   - Access Token tiene permisos correctos" -ForegroundColor Gray
                Write-Host "   - Phone Number ID es el correcto" -ForegroundColor Gray
                Write-Host "   - Número está verificado en Meta`n" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host $errorDetails -ForegroundColor Gray
    }
}

Write-Host "`n📖 Documentación:" -ForegroundColor Cyan
Write-Host "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started`n" -ForegroundColor Blue
