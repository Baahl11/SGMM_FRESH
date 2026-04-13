#!/usr/bin/env pwsh

# Load environment variables
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}

$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SERVICE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

Write-Host "`n🔍 Consultando subscriptions en Supabase...`n" -ForegroundColor Cyan

$headers = @{
    "apikey" = $SERVICE_KEY
    "Authorization" = "Bearer $SERVICE_KEY"
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/subscriptions?select=*" -Headers $headers -Method Get

if ($response.Count -eq 0) {
    Write-Host "❌ No hay subscriptions en la base de datos" -ForegroundColor Red
} else {
    Write-Host "✅ Subscriptions encontradas: $($response.Count)`n" -ForegroundColor Green
    $response | ForEach-Object {
        Write-Host "───────────────────────────────────────────" -ForegroundColor Gray
        Write-Host "User ID: $($_.user_id)" -ForegroundColor Yellow
        Write-Host "Customer ID: $($_.stripe_customer_id)" -ForegroundColor Cyan
        Write-Host "Subscription ID: $($_.stripe_subscription_id)" -ForegroundColor Cyan
        Write-Host "Price ID: $($_.stripe_price_id)" -ForegroundColor Magenta
        Write-Host "Status: $($_.status)" -ForegroundColor Green
        Write-Host "Current Period End: $($_.current_period_end)" -ForegroundColor White
        Write-Host ""
    }
}
