#!/usr/bin/env pwsh
# Script para crear productos Stripe en Live Mode
# Asegúrate de tener STRIPE_SECRET_KEY en .env.local

Write-Host "🚀 Creando productos Stripe en Live Mode..." -ForegroundColor Cyan

# Cargar la secret key desde .env.local
$envFile = Get-Content ".env.local" | Where-Object { $_ -match "STRIPE_SECRET_KEY=" }
if (!$envFile) {
    Write-Host "❌ Error: STRIPE_SECRET_KEY no encontrada en .env.local" -ForegroundColor Red
    exit 1
}

$secretKey = ($envFile -split "=")[1].Trim()
Write-Host "✅ Secret key cargada" -ForegroundColor Green

# Crear Plan Básico
Write-Host "`n📦 Creando Plan Básico..." -ForegroundColor Yellow
$basicProduct = curl -X POST "https://api.stripe.com/v1/products" `
    -u "${secretKey}:" `
    -d "name=Plan Básico" `
    -d "description=Hasta 2 doctores, 1 ubicación" `
    -d "metadata[plan_tier]=basico" `
    -d "metadata[max_doctors]=2" `
    -d "metadata[max_locations]=1" | ConvertFrom-Json

$basicProductId = $basicProduct.id
Write-Host "✅ Producto creado: $basicProductId" -ForegroundColor Green

# Crear precio para Plan Básico
Write-Host "💰 Creando precio para Plan Básico (499 MXN/mes)..." -ForegroundColor Yellow
$basicPrice = curl -X POST "https://api.stripe.com/v1/prices" `
    -u "${secretKey}:" `
    -d "product=$basicProductId" `
    -d "currency=mxn" `
    -d "unit_amount=49900" `
    -d "recurring[interval]=month" `
    -d "recurring[trial_period_days]=15" | ConvertFrom-Json

Write-Host "✅ Price ID Básico: $($basicPrice.id)" -ForegroundColor Green

# Crear Plan Pro
Write-Host "`n📦 Creando Plan Pro..." -ForegroundColor Yellow
$proProduct = curl -X POST "https://api.stripe.com/v1/products" `
    -u "${secretKey}:" `
    -d "name=Plan Pro" `
    -d "description=Hasta 10 doctores, 5 ubicaciones, features avanzadas" `
    -d "metadata[plan_tier]=pro" `
    -d "metadata[max_doctors]=10" `
    -d "metadata[max_locations]=5" | ConvertFrom-Json

$proProductId = $proProduct.id
Write-Host "✅ Producto creado: $proProductId" -ForegroundColor Green

# Crear precio para Plan Pro
Write-Host "💰 Creando precio para Plan Pro (999 MXN/mes)..." -ForegroundColor Yellow
$proPrice = curl -X POST "https://api.stripe.com/v1/prices" `
    -u "${secretKey}:" `
    -d "product=$proProductId" `
    -d "currency=mxn" `
    -d "unit_amount=99900" `
    -d "recurring[interval]=month" `
    -d "recurring[trial_period_days]=15" | ConvertFrom-Json

Write-Host "✅ Price ID Pro: $($proPrice.id)" -ForegroundColor Green

# Crear Plan Enterprise
Write-Host "`n📦 Creando Plan Enterprise..." -ForegroundColor Yellow
$enterpriseProduct = curl -X POST "https://api.stripe.com/v1/products" `
    -u "${secretKey}:" `
    -d "name=Plan Enterprise" `
    -d "description=Doctores ilimitados, 10 ubicaciones, todas las features" `
    -d "metadata[plan_tier]=enterprise" `
    -d "metadata[max_doctors]=999" `
    -d "metadata[max_locations]=10" | ConvertFrom-Json

$enterpriseProductId = $enterpriseProduct.id
Write-Host "✅ Producto creado: $enterpriseProductId" -ForegroundColor Green

# Crear precio para Plan Enterprise
Write-Host "💰 Creando precio para Plan Enterprise (2,999 MXN/mes)..." -ForegroundColor Yellow
$enterprisePrice = curl -X POST "https://api.stripe.com/v1/prices" `
    -u "${secretKey}:" `
    -d "product=$enterpriseProductId" `
    -d "currency=mxn" `
    -d "unit_amount=299900" `
    -d "recurring[interval]=month" `
    -d "recurring[trial_period_days]=15" | ConvertFrom-Json

Write-Host "✅ Price ID Enterprise: $($enterprisePrice.id)" -ForegroundColor Green

# Resumen
Write-Host "`n" -NoNewline
Write-Host "🎉 ¡Productos creados exitosamente!" -ForegroundColor Green
Write-Host "`n📋 COPIAR ESTOS PRICE IDs PARA VERCEL:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "NEXT_PUBLIC_STRIPE_PRICE_BASICO=" -NoNewline -ForegroundColor Yellow
Write-Host $basicPrice.id -ForegroundColor White
Write-Host "NEXT_PUBLIC_STRIPE_PRICE_PRO=" -NoNewline -ForegroundColor Yellow
Write-Host $proPrice.id -ForegroundColor White
Write-Host "NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=" -NoNewline -ForegroundColor Yellow
Write-Host $enterprisePrice.id -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "`n✅ Siguiente paso: Configurar webhook en Stripe Dashboard" -ForegroundColor Cyan
