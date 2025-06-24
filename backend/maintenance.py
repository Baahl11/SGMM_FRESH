#!/usr/bin/env python3
"""
Script de Mantenimiento Automatizado - SGMM
Sistema de Gestión Médica Moderna - UME López & López
"""

import sys
import os
import json
import shutil
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_quality_monitor import DataQualityMonitor
from backup_data import create_backup
from verify_data import verify_data_integrity

class MaintenanceManager:
    def __init__(self):
        self.maintenance_log = []
        self.start_time = datetime.now()
        
    def log_action(self, action, status, details=""):
        """Registrar acción de mantenimiento"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "status": status,  # SUCCESS, WARNING, ERROR
            "details": details
        }
        self.maintenance_log.append(entry)
        
        status_icon = "✅" if status == "SUCCESS" else "⚠️" if status == "WARNING" else "❌"
        print(f"{status_icon} {action}: {details}")
    
    def cleanup_old_files(self):
        """Limpiar archivos temporales y antiguos"""
        try:
            cleaned_files = 0
            
            # Limpiar logs antiguos (más de 30 días)
            logs_dir = Path("logs")
            if logs_dir.exists():
                cutoff_date = datetime.now() - timedelta(days=30)
                for log_file in logs_dir.glob("*.log"):
                    if log_file.stat().st_mtime < cutoff_date.timestamp():
                        log_file.unlink()
                        cleaned_files += 1
            
            # Limpiar backups antiguos (más de 90 días)
            backups_dir = Path("backups")
            if backups_dir.exists():
                cutoff_date = datetime.now() - timedelta(days=90)
                for backup_file in backups_dir.glob("*.zip"):
                    if backup_file.stat().st_mtime < cutoff_date.timestamp():
                        backup_file.unlink()
                        cleaned_files += 1
            
            # Limpiar archivos __pycache__
            for pycache_dir in Path(".").rglob("__pycache__"):
                if pycache_dir.is_dir():
                    shutil.rmtree(pycache_dir)
                    cleaned_files += 1
            
            # Limpiar archivos .pyc
            for pyc_file in Path(".").rglob("*.pyc"):
                pyc_file.unlink()
                cleaned_files += 1
            
            self.log_action(
                "Cleanup", 
                "SUCCESS", 
                f"Se limpiaron {cleaned_files} archivos temporales"
            )
            
        except Exception as e:
            self.log_action("Cleanup", "ERROR", f"Error en limpieza: {e}")
    
    def optimize_database(self):
        """Optimizar base de datos SQLite"""
        try:
            db_file = Path("consultorio.db")
            if not db_file.exists():
                self.log_action("DB Optimization", "WARNING", "Base de datos no encontrada")
                return
            
            # Obtener tamaño antes
            size_before = db_file.stat().st_size
            
            # Ejecutar VACUUM y ANALYZE
            import sqlite3
            conn = sqlite3.connect(str(db_file))
            conn.execute("VACUUM")
            conn.execute("ANALYZE")
            conn.close()
            
            # Obtener tamaño después
            size_after = db_file.stat().st_size
            saved_bytes = size_before - size_after
            
            self.log_action(
                "DB Optimization", 
                "SUCCESS", 
                f"DB optimizada. Espacio ahorrado: {saved_bytes} bytes"
            )
            
        except Exception as e:
            self.log_action("DB Optimization", "ERROR", f"Error optimizando DB: {e}")
    
    def run_data_quality_check(self):
        """Ejecutar verificación de calidad de datos"""
        try:
            with DataQualityMonitor() as monitor:
                metrics, alerts = monitor.run_full_monitoring()
                
                critical_alerts = [a for a in alerts if a['level'] == 'ERROR']
                warning_alerts = [a for a in alerts if a['level'] == 'WARNING']
                
                if critical_alerts:
                    self.log_action(
                        "Data Quality Check", 
                        "ERROR", 
                        f"{len(critical_alerts)} alertas críticas detectadas"
                    )
                elif warning_alerts:
                    self.log_action(
                        "Data Quality Check", 
                        "WARNING", 
                        f"{len(warning_alerts)} advertencias detectadas"
                    )
                else:
                    self.log_action(
                        "Data Quality Check", 
                        "SUCCESS", 
                        "Calidad de datos óptima"
                    )
                
                return metrics, alerts
                
        except Exception as e:
            self.log_action("Data Quality Check", "ERROR", f"Error en verificación: {e}")
            return {}, []
    
    def create_maintenance_backup(self):
        """Crear backup de mantenimiento"""
        try:
            backup_file = create_backup()
            if backup_file:
                self.log_action(
                    "Maintenance Backup", 
                    "SUCCESS", 
                    f"Backup creado: {backup_file}"
                )
                return backup_file
            else:
                self.log_action("Maintenance Backup", "ERROR", "Error creando backup")
                return None
                
        except Exception as e:
            self.log_action("Maintenance Backup", "ERROR", f"Error en backup: {e}")
            return None
    
    def check_system_health(self):
        """Verificar salud general del sistema"""
        try:
            health_issues = []
            
            # Verificar espacio en disco
            disk_usage = shutil.disk_usage(".")
            free_space_gb = disk_usage.free / (1024**3)
            if free_space_gb < 1:  # Menos de 1GB libre
                health_issues.append(f"Poco espacio libre: {free_space_gb:.1f}GB")
            
            # Verificar archivos críticos
            critical_files = [
                "consultorio.db",
                "app/main.py",
                "app/models.py",
                "app/database.py"
            ]
            
            for file_path in critical_files:
                if not Path(file_path).exists():
                    health_issues.append(f"Archivo crítico faltante: {file_path}")
            
            # Verificar directorio de backups
            backups_dir = Path("backups")
            if not backups_dir.exists():
                backups_dir.mkdir(exist_ok=True)
                health_issues.append("Directorio de backups creado")
            
            # Verificar directorio de logs
            logs_dir = Path("logs")
            if not logs_dir.exists():
                logs_dir.mkdir(exist_ok=True)
                health_issues.append("Directorio de logs creado")
            
            if health_issues:
                self.log_action(
                    "System Health", 
                    "WARNING", 
                    f"{len(health_issues)} problemas menores detectados"
                )
            else:
                self.log_action("System Health", "SUCCESS", "Sistema saludable")
            
            return health_issues
            
        except Exception as e:
            self.log_action("System Health", "ERROR", f"Error verificando salud: {e}")
            return [f"Error en verificación: {e}"]
    
    def update_dependencies(self):
        """Verificar y actualizar dependencias de Python"""
        try:
            # Solo verificar, no actualizar automáticamente en producción
            result = subprocess.run(
                [sys.executable, "-m", "pip", "list", "--outdated"],
                capture_output=True,
                text=True
            )
            
            if result.stdout.strip():
                outdated_packages = len(result.stdout.strip().split('\n')) - 2  # Quitar header
                self.log_action(
                    "Dependencies Check", 
                    "WARNING", 
                    f"{outdated_packages} paquetes desactualizados encontrados"
                )
            else:
                self.log_action("Dependencies Check", "SUCCESS", "Dependencias actualizadas")
                
        except Exception as e:
            self.log_action("Dependencies Check", "WARNING", f"No se pudo verificar: {e}")
    
    def generate_maintenance_report(self):
        """Generar reporte de mantenimiento"""
        duration = datetime.now() - self.start_time
        
        # Contar resultados por estado
        success_count = len([log for log in self.maintenance_log if log['status'] == 'SUCCESS'])
        warning_count = len([log for log in self.maintenance_log if log['status'] == 'WARNING'])
        error_count = len([log for log in self.maintenance_log if log['status'] == 'ERROR'])
        
        report = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                      REPORTE DE MANTENIMIENTO - SGMM                        ║
║                    UME López & López - Consultorio Médico                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                                                  ║
║ Duración: {str(duration).split('.')[0]}                                                     ║
║ Total de acciones: {len(self.maintenance_log)}                                                        ║
║                                                                              ║
║ Resultados:                                                                  ║
║   ✅ Exitosas: {success_count:2d}                                                              ║
║   ⚠️  Advertencias: {warning_count:2d}                                                         ║
║   ❌ Errores: {error_count:2d}                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

DETALLE DE ACCIONES:
"""
        
        for log_entry in self.maintenance_log:
            status_icon = "✅" if log_entry['status'] == "SUCCESS" else "⚠️" if log_entry['status'] == "WARNING" else "❌"
            timestamp = datetime.fromisoformat(log_entry['timestamp']).strftime('%H:%M:%S')
            report += f"{status_icon} [{timestamp}] {log_entry['action']}: {log_entry['details']}\n"
        
        # Recomendaciones
        report += f"\nRECOMENDACIONES:\n"
        
        if error_count > 0:
            report += "🚨 ACCIÓN REQUERIDA: Resolver errores críticos antes de continuar\n"
        
        if warning_count > 0:
            report += "⚠️  Revisar advertencias para optimizar el sistema\n"
        
        if success_count == len(self.maintenance_log):
            report += "✅ Sistema en óptimas condiciones\n"
        
        report += "\nPRÓXIMO MANTENIMIENTO: Recomendado en 7 días\n"
        report += "CONTACTO SOPORTE: gmelgarejom@gmail.com\n"
        
        return report
    
    def run_full_maintenance(self):
        """Ejecutar rutina completa de mantenimiento"""
        print("🔧 Iniciando mantenimiento automático del sistema...")
        print("="*80)
        
        # 1. Verificar salud del sistema
        self.check_system_health()
        
        # 2. Crear backup de mantenimiento
        self.create_maintenance_backup()
        
        # 3. Ejecutar verificación de calidad
        self.run_data_quality_check()
        
        # 4. Optimizar base de datos
        self.optimize_database()
        
        # 5. Limpiar archivos temporales
        self.cleanup_old_files()
        
        # 6. Verificar dependencias
        self.update_dependencies()
        
        # 7. Generar reporte
        report = self.generate_maintenance_report()
        
        # Guardar reporte
        try:
            reports_dir = Path("reports")
            reports_dir.mkdir(exist_ok=True)
            
            report_file = reports_dir / f"maintenance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            with open(report_file, 'w', encoding='utf-8') as f:
                f.write(report)
            
            print(f"\n📄 Reporte guardado en: {report_file}")
            
        except Exception as e:
            print(f"❌ Error guardando reporte: {e}")
        
        # Mostrar reporte en consola
        print(report)
        
        # Retornar código de salida
        error_count = len([log for log in self.maintenance_log if log['status'] == 'ERROR'])
        return 0 if error_count == 0 else 1

def run_quick_maintenance():
    """Ejecutar mantenimiento rápido (solo verificaciones básicas)"""
    print("⚡ Ejecutando mantenimiento rápido...")
    
    manager = MaintenanceManager()
    
    # Solo verificaciones esenciales
    manager.check_system_health()
    manager.run_data_quality_check()
    
    # Reporte resumido
    error_count = len([log for log in manager.maintenance_log if log['status'] == 'ERROR'])
    warning_count = len([log for log in manager.maintenance_log if log['status'] == 'WARNING'])
    
    if error_count > 0:
        print(f"🚨 {error_count} errores críticos encontrados")
        return 1
    elif warning_count > 0:
        print(f"⚠️ {warning_count} advertencias encontradas")
        return 0
    else:
        print("✅ Sistema funcionando correctamente")
        return 0

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Sistema de Mantenimiento Automático SGMM")
    parser.add_argument("--quick", "-q", action="store_true", 
                       help="Ejecutar mantenimiento rápido")
    parser.add_argument("--report-only", "-r", action="store_true",
                       help="Solo generar reporte sin cambios")
    
    args = parser.parse_args()
    
    try:
        if args.quick:
            exit_code = run_quick_maintenance()
        else:
            manager = MaintenanceManager()
            exit_code = manager.run_full_maintenance()
        
        exit(exit_code)
        
    except KeyboardInterrupt:
        print("\n👋 Mantenimiento cancelado por el usuario")
        exit(130)
    except Exception as e:
        print(f"❌ Error crítico en mantenimiento: {e}")
        exit(1)
