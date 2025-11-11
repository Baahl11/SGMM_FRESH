# Test Messaging - Versión Simple PowerShell
# Para usar con producción: https://agendamedpro.com

Write-Host "`n🧪 SGMM Messaging System - Test Simple`n" -ForegroundColor Cyan
Write-Host "=" * 60

# ====================================
# PASO 1: Obtener Session Token
# ====================================
Write-Host "`n📋 PASO 1: Obtener Session Token`n" -ForegroundColor Yellow
Write-Host "1. Abre: https://agendamedpro.com"
Write-Host "2. Inicia sesión"
Write-Host "3. F12 > Application > Cookies > agendamedpro.com"
Write-Host "4. Copia el valor de: sb-sbwpqtrxhiucwlbozet-auth-token.0"
Write-Host "`n"

$SESSION_TOKEN = Read-Host "Pega el token aquí"

if ([string]::IsNullOrWhiteSpace($SESSION_TOKEN)) {
    Write-Host "❌ Token requerido" -ForegroundColor Red
    exit
}

Write-Host "✅ Token recibido (${SESSION_TOKEN.Length} caracteres)" -ForegroundColor Green

# ====================================
# PASO 2: Elegir Acción
# ====================================
Write-Host "`n📋 PASO 2: ¿Qué quieres hacer?`n" -ForegroundColor Yellow
Write-Host "1. Configurar credenciales SMS (Twilio)"
Write-Host "2. Enviar mensaje de prueba"
Write-Host "3. Ver mensajes recientes"
Write-Host ""

$opcion = Read-Host "Selecciona (1-3)"

$BASE_URL = "https://agendamedpro.com"

switch ($opcion) {
    "1" {
        # CONFIGURAR CREDENCIALES
        Write-Host "`n📝 Configurar Credenciales Twilio`n" -ForegroundColor Cyan
        
        $accountSid = Read-Host "Account SID (empieza con AC...)"
        $authToken = Read-Host "Auth Token"
        $phoneNumber = Read-Host "Phone Number (+15551234567)"
        
        $body = @{
            provider = "twilio"
            credentials = @{
                account_sid = $accountSid
                auth_token = $authToken
                phone_number = $phoneNumber
            }
        } | ConvertTo-Json
        
        try {
            $response = Invoke-WebRequest -Uri "$BASE_URL/api/user/sms-credentials" `
                -Method POST `
                -Headers @{
                    "Content-Type" = "application/json"
                    "Cookie" = "sb-sbwpqtrxhiucwlbozet-auth-token.0=$SESSION_TOKEN"
                } `
                -Body $body `
                -ErrorAction Stop
            
            Write-Host "`n✅ Credenciales guardadas!" -ForegroundColor Green
            $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
        } catch {
            Write-Host "`n❌ Error:" -ForegroundColor Red
            $_.Exception.Message
            if ($_.Exception.Response) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $reader.BaseStream.Position = 0
                $responseBody = $reader.ReadToEnd()
                Write-Host $responseBody
            }
        }
    }
    
    "2" {
        # ENVIAR MENSAJE
        Write-Host "`n📨 Enviar Mensaje de Prueba`n" -ForegroundColor Cyan
        
        $phone = Read-Host "Teléfono destino (+521234567890)"
        $name = Read-Host "Nombre del contacto"
        $mensaje = Read-Host "Mensaje a enviar"
        
        $body = @{
            channel = "sms"
            to_contact = @{
                phone = $phone
                name = $name
            }
            body = $mensaje
        } | ConvertTo-Json
        
        try {
            $response = Invoke-WebRequest -Uri "$BASE_URL/api/messaging/send" `
                -Method POST `
                -Headers @{
                    "Content-Type" = "application/json"
                    "Cookie" = "sb-sbwpqtrxhiucwlbozet-auth-token.0=$SESSION_TOKEN"
                } `
                -Body $body `
                -ErrorAction Stop
            
            Write-Host "`n✅ Mensaje encolado!" -ForegroundColor Green
            $data = $response.Content | ConvertFrom-Json
            Write-Host "Message ID: $($data.message.id)"
            Write-Host "Job ID: $($data.job.id)"
            Write-Host "Status: $($data.message.status)"
            Write-Host "`n💡 El worker lo procesará en < 60 segundos"
        } catch {
            Write-Host "`n❌ Error:" -ForegroundColor Red
            $_.Exception.Message
            if ($_.Exception.Response) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $reader.BaseStream.Position = 0
                $responseBody = $reader.ReadToEnd()
                Write-Host $responseBody
            }
        }
    }
    
    "3" {
        # VER MENSAJES
        Write-Host "`n📋 Mensajes Recientes`n" -ForegroundColor Cyan
        
        try {
            $response = Invoke-WebRequest -Uri "$BASE_URL/api/messaging/recent" `
                -Headers @{
                    "Cookie" = "sb-sbwpqtrxhiucwlbozet-auth-token.0=$SESSION_TOKEN"
                } `
                -ErrorAction Stop
            
            $data = $response.Content | ConvertFrom-Json
            
            if ($data.messages.Count -eq 0) {
                Write-Host "No hay mensajes" -ForegroundColor Yellow
            } else {
                $data.messages | ForEach-Object {
                    Write-Host "---"
                    Write-Host "📞 $($_.patient_name) - $($_.to_phone)"
                    Write-Host "📝 $($_.message_body.Substring(0, [Math]::Min(50, $_.message_body.Length)))..."
                    Write-Host "Status: $($_.status)"
                    Write-Host "Created: $($_.created_at)"
                }
            }
        } catch {
            Write-Host "`n❌ Error:" -ForegroundColor Red
            $_.Exception.Message
        }
    }
    
    default {
        Write-Host "❌ Opción inválida" -ForegroundColor Red
    }
}

Write-Host "`n✅ Completado`n" -ForegroundColor Green
