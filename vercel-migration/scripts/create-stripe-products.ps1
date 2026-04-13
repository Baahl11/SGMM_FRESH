# Script para crear productos y precios en Stripe usando la API
# Requiere: Stripe Secret Key

param(
    [Parameter(Mandatory=$true)]
    [string]$StripeSecretKey
)

$headers = @{
    "Authorization" = "Bearer $StripeSecretKey"
    "Content-Type" = "application/x-www-form-urlencoded"
}

Write-Host "🎯 Creando producto AgendaMedPro en Stripe..." -ForegroundColor Cyan

# Paso 1: Crear el producto
Write-Host "`n📦 Paso 1: Creando producto..." -ForegroundColor Yellow

$productBody = @{
    "name" = "AgendaMedPro"
    "description" = "Plataforma completa de gestión médica - Todo incluido"
    "statement_descriptor" = "AGENDAMEDPRO"
    "tax_code" = "txcd_10000000" # Software as a Service
}

$productResponse = Invoke-RestMethod -Uri "https://api.stripe.com/v1/products" `
    -Method POST `
    -Headers $headers `
    -Body $productBody

$productId = $productResponse.id
Write-Host "✅ Producto creado: $productId" -ForegroundColor Green

# Paso 2: Crear precio mensual
Write-Host "`n💰 Paso 2: Creando precio mensual..." -ForegroundColor Yellow

$monthlyPriceBody = @{
    "product" = $productId
    "unit_amount" = "149900" # $1,499.00 MXN (en centavos)
    "currency" = "mxn"
    "recurring[interval]" = "month"
    "recurring[interval_count]" = "1"
    "nickname" = "Plan Mensual AgendaMedPro"
}

$monthlyPriceResponse = Invoke-RestMethod -Uri "https://api.stripe.com/v1/prices" `
    -Method POST `
    -Headers $headers `
    -Body $monthlyPriceBody

$monthlyPriceId = $monthlyPriceResponse.id
Write-Host "✅ Precio mensual creado: $monthlyPriceId" -ForegroundColor Green

# Paso 3: Crear precio anual
Write-Host "`n💰 Paso 3: Creando precio anual..." -ForegroundColor Yellow

$annualPriceBody = @{
    "product" = $productId
    "unit_amount" = "1499000" # $14,990.00 MXN (en centavos)
    "currency" = "mxn"
    "recurring[interval]" = "year"
    "recurring[interval_count]" = "1"
    "nickname" = "Plan Anual AgendaMedPro (2 meses gratis)"
}

$annualPriceResponse = Invoke-RestMethod -Uri "https://api.stripe.com/v1/prices" `
    -Method POST `
    -Headers $headers `
    -Body $annualPriceBody

$annualPriceId = $annualPriceResponse.id
Write-Host "✅ Precio anual creado: $annualPriceId" -ForegroundColor Green

# Paso 4: Mostrar resumen y variables de entorno
Write-Host "`n" -NoNewline
Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
Write-Host "`n📋 Resumen:" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "Producto ID:      " -NoNewline -ForegroundColor White
Write-Host $productId -ForegroundColor Yellow
Write-Host "Precio Mensual:   " -NoNewline -ForegroundColor White
Write-Host $monthlyPriceId -ForegroundColor Yellow
Write-Host "Precio Anual:     " -NoNewline -ForegroundColor White
Write-Host $annualPriceId -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Paso 5: Generar archivo .env con las variables
Write-Host "`n📝 Generando variables de entorno..." -ForegroundColor Yellow

$envContent = @"
# ============================================================================
# STRIPE NUEVO PLAN ÚNICO - Generado el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================================================

# Producto AgendaMedPro
STRIPE_PRODUCT_ID=$productId

# Plan AgendaMedPro - Mensual ($1,499 MXN/mes)
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=$monthlyPriceId

# Plan AgendaMedPro - Anual ($14,990 MXN/año - Ahorro de $3,398)
NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL=$annualPriceId

# ============================================================================
# INSTRUCCIONES:
# 1. Copia estas variables a tu archivo .env.local
# 2. Actualiza las mismas en Vercel: 
#    https://vercel.com/guillermo-melgarejos-projects/vercel-migration/settings/environment-variables
# 3. Despliega: npx vercel --prod
# ============================================================================
"@

$envFilePath = "stripe-new-prices.env"
$envContent | Out-File -FilePath $envFilePath -Encoding UTF8

Write-Host "✅ Variables guardadas en: $envFilePath" -ForegroundColor Green

Write-Host "`n🔗 Enlaces útiles:" -ForegroundColor Cyan
Write-Host "  • Ver producto: https://dashboard.stripe.com/products/$productId" -ForegroundColor White
Write-Host "  • Dashboard: https://dashboard.stripe.com/products" -ForegroundColor White

Write-Host "`n✨ Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Copia las variables de $envFilePath a .env.local" -ForegroundColor White
Write-Host "  2. Actualiza las variables en Vercel" -ForegroundColor White
Write-Host "  3. Reemplaza la página de pricing:" -ForegroundColor White
Write-Host "     Move-Item app\pricing\page.tsx app\pricing\page-old.tsx" -ForegroundColor DarkGray
Write-Host "     Move-Item app\pricing\page-new.tsx app\pricing\page.tsx" -ForegroundColor DarkGray
Write-Host "  4. Despliega: npx vercel --prod" -ForegroundColor White

Write-Host "`n" -NoNewline
