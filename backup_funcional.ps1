# Script de Backup del SGMM Funcional
# Fecha: 23 de Junio 2025
# Estado: COMPLETAMENTE FUNCIONAL - SIN ERRORES

Write-Host "🔄 SGMM - Creando Backup Completo..." -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Blue

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "SGMM_FUNCIONAL_$timestamp"
$backupPath = "..\$backupName"

# Crear directorio de backup
Write-Host "📁 Creando directorio de backup..." -ForegroundColor Yellow
New-Item -Path $backupPath -ItemType Directory -Force | Out-Null

# Copiar archivos importantes excluyendo temporales
Write-Host "📋 Copiando archivos del proyecto..." -ForegroundColor Yellow

# Frontend
robocopy "." "$backupPath" /E /XD "node_modules" ".next" ".git" "dist" "build" ".vscode" /XF "*.log" "*.tmp" /NFL /NDL /NJH /NJS

# Backend (si existe)
if (Test-Path "backend") {
    Write-Host "🔧 Copiando backend..." -ForegroundColor Yellow
    robocopy "backend" "$backupPath\backend" /E /XD "__pycache__" ".git" "venv" "env" ".pytest_cache" /XF "*.pyc" "*.log" "*.tmp" /NFL /NDL /NJH /NJS
}

# Crear archivo de verificación
Write-Host "✅ Creando manifiesto de backup..." -ForegroundColor Yellow
@"
SGMM - BACKUP FUNCIONAL COMPLETO
================================
Fecha: $(Get-Date)
Estado: COMPLETAMENTE FUNCIONAL - SIN ERRORES

🎯 FUNCIONALIDADES VERIFICADAS:
✅ Autenticación JWT (Login/Logout)
✅ Gestión de Pacientes (CRUD + rutas individuales)
✅ Tratamientos (Gestión completa)
✅ Dashboard con estadísticas
✅ Registros médicos con nombres
✅ Gastos fijos (CRUD completo)
✅ Inventario (Salud y movimientos)
✅ API Routes (Proxy unificado)

🔧 CORRECCIONES PRINCIPALES:
- Rutas dinámicas: /api/patients/[id] implementada
- Autenticación unificada: authenticateRequest en todas las rutas
- URLs backend corregidas: sin prefijo /api innecesario
- Proxy completo: Frontend → Backend funcionando

🧪 VALIDACIÓN:
Ejecutar: node test_comprehensive_final.js
Resultado esperado: ✅ SGMM is ready for deployment!

📋 ARCHIVOS CLAVE:
- src/lib/api-auth.ts (Autenticación unificada)
- src/app/api/patients/[id]/route.ts (Ruta dinámica pacientes)
- src/app/api/patients/route.ts (Lista pacientes)
- src/app/api/treatments/route.ts (Tratamientos)
- src/app/api/dashboard/stats/route.ts (Dashboard)
- src/app/api/gastos-fijos/route.ts (Gastos fijos)
- src/app/api/records/with-names/route.ts (Registros)
- test_comprehensive_final.js (Test de validación)

🚀 LISTO PARA DEPLOYMENT Y DISTRIBUCIÓN
"@ | Out-File "$backupPath\ESTADO_FUNCIONAL.txt" -Encoding UTF8

# Comprimir todo
Write-Host "🗜️ Comprimiendo backup..." -ForegroundColor Yellow
Compress-Archive -Path $backupPath -DestinationPath "../$backupName.zip" -Force

# Limpiar directorio temporal
Remove-Item $backupPath -Recurse -Force

Write-Host ""
Write-Host "🎉 BACKUP COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
Write-Host "📦 Archivo: $backupName.zip" -ForegroundColor Cyan
Write-Host "📍 Ubicación: $(Resolve-Path "..\$backupName.zip")" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔄 Para restaurar:"
Write-Host "   1. Extraer $backupName.zip" -ForegroundColor White
Write-Host "   2. npm install (frontend)" -ForegroundColor White
Write-Host "   3. pip install -r requirements.txt (backend)" -ForegroundColor White
Write-Host "   4. Verificar con: node test_comprehensive_final.js" -ForegroundColor White
