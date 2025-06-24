@echo off
REM Sistema de Mantenimiento SGMM - Windows Batch Script
REM UME López & López - Consultorio Médico

echo ===============================================================================
echo                    SISTEMA DE MANTENIMIENTO - SGMM
echo                   UME López ^& López - Consultorio Médico
echo ===============================================================================
echo.

REM Cambiar al directorio del backend
cd /d "%~dp0backend"

REM Verificar que existe el entorno virtual
if not exist "python\Scripts\activate.bat" (
    echo ❌ Error: No se encontró el entorno virtual de Python
    echo    Ejecute primero la instalación del proyecto
    pause
    exit /b 1
)

REM Activar entorno virtual
echo 🔄 Activando entorno virtual...
call python\Scripts\activate.bat

REM Mostrar menú de opciones
:menu
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                              MENÚ DE MANTENIMIENTO                          ║
echo ╠══════════════════════════════════════════════════════════════════════════════╣
echo ║ 1. 🔍 Verificación rápida del sistema                                       ║
echo ║ 2. 🔧 Mantenimiento completo                                                ║
echo ║ 3. 📊 Verificar calidad de datos                                           ║
echo ║ 4. 💾 Crear backup manual                                                   ║
echo ║ 5. 🗂️  Crear datos de prueba                                                ║
echo ║ 6. 📈 Ver reportes de monitoreo                                             ║
echo ║ 7. 🚀 Iniciar servidor backend                                              ║
echo ║ 8. 📋 Ver logs del sistema                                                  ║
echo ║ 9. ❌ Salir                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

set /p choice="Seleccione una opción (1-9): "

if "%choice%"=="1" goto quick_check
if "%choice%"=="2" goto full_maintenance
if "%choice%"=="3" goto data_quality
if "%choice%"=="4" goto manual_backup
if "%choice%"=="5" goto create_test_data
if "%choice%"=="6" goto view_reports
if "%choice%"=="7" goto start_server
if "%choice%"=="8" goto view_logs
if "%choice%"=="9" goto exit
echo ❌ Opción inválida. Intente de nuevo.
goto menu

:quick_check
echo.
echo 🔍 Ejecutando verificación rápida...
python maintenance.py --quick
echo.
echo ✅ Verificación completada. Presione cualquier tecla para continuar...
pause >nul
goto menu

:full_maintenance
echo.
echo 🔧 Ejecutando mantenimiento completo...
echo ⚠️  Esto puede tomar varios minutos...
python maintenance.py
echo.
echo ✅ Mantenimiento completado. Presione cualquier tecla para continuar...
pause >nul
goto menu

:data_quality
echo.
echo 📊 Verificando calidad de datos...
python verify_data.py
echo.
echo ✅ Verificación completada. Presione cualquier tecla para continuar...
pause >nul
goto menu

:manual_backup
echo.
echo 💾 Creando backup manual...
python backup_data.py backup
echo.
echo ✅ Backup completado. Presione cualquier tecla para continuar...
pause >nul
goto menu

:create_test_data
echo.
echo 🗂️ Creando datos de prueba robustos...
echo ⚠️  Esto agregará datos de ejemplo al sistema...
set /p confirm="¿Está seguro? (s/N): "
if /i "%confirm%"=="s" (
    python create_robust_data.py
    echo ✅ Datos de prueba creados.
) else (
    echo ❌ Operación cancelada.
)
echo.
echo Presione cualquier tecla para continuar...
pause >nul
goto menu

:view_reports
echo.
echo 📈 Reportes de monitoreo disponibles:
echo.
if exist "reports" (
    dir /b reports\*.txt 2>nul
    if errorlevel 1 (
        echo No hay reportes disponibles.
    ) else (
        echo.
        set /p report_name="Ingrese el nombre del reporte a ver (o ENTER para volver): "
        if not "!report_name!"=="" (
            if exist "reports\!report_name!" (
                type "reports\!report_name!"
            ) else (
                echo ❌ Reporte no encontrado.
            )
        )
    )
) else (
    echo No hay directorio de reportes.
)
echo.
echo Presione cualquier tecla para continuar...
pause >nul
goto menu

:start_server
echo.
echo 🚀 Iniciando servidor backend...
echo 🌐 El servidor estará disponible en: http://localhost:8000
echo 📋 Para detener el servidor, presione Ctrl+C
echo.
python run.py
echo.
echo Presione cualquier tecla para continuar...
pause >nul
goto menu

:view_logs
echo.
echo 📋 Logs del sistema:
echo.
if exist "logs" (
    dir /b logs\*.log 2>nul
    if errorlevel 1 (
        echo No hay logs disponibles.
    ) else (
        echo.
        echo Mostrando últimas 20 líneas del log más reciente:
        for /f %%i in ('dir /b /o-d logs\*.log 2^>nul ^| findstr /n "^" ^| findstr "^1:"') do (
            set latest_log=%%i
            set latest_log=!latest_log:~2!
        )
        if exist "logs\!latest_log!" (
            echo.
            echo === !latest_log! ===
            powershell "Get-Content 'logs\!latest_log!' | Select-Object -Last 20"
        )
    )
) else (
    echo No hay directorio de logs.
)
echo.
echo Presione cualquier tecla para continuar...
pause >nul
goto menu

:exit
echo.
echo 👋 Saliendo del sistema de mantenimiento...
echo 📞 Soporte técnico: gmelgarejom@gmail.com
echo.
exit /b 0

REM Manejo de errores
:error
echo.
echo ❌ Error: %1
echo 📞 Contacte soporte técnico: gmelgarejom@gmail.com
pause
exit /b 1
