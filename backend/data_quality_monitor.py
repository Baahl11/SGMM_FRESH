#!/usr/bin/env python3
"""
Monitor de Calidad de Datos en Tiempo Real - SGMM
Sistema de Gestión Médica Moderna - UME López & López
"""

import sys
import os
import json
import time
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from app.database import SessionLocal
from app.models import User, Patient, Treatment, Record

class DataQualityMonitor:
    def __init__(self):
        self.db = SessionLocal()
        self.alerts = []
        self.metrics = {}
        self.thresholds = {
            "data_completeness_min": 95.0,
            "financial_consistency_min": 99.0,
            "referential_integrity_min": 100.0,
            "duplicate_rate_max": 2.0,
            "error_rate_max": 1.0
        }
        self.config = self.load_config()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()
    
    def load_config(self):
        """Cargar configuración del monitor"""
        config_file = Path("monitoring_config.json")
        default_config = {
            "email": {
                "enabled": False,
                "smtp_server": "smtp.gmail.com",
                "smtp_port": 587,
                "username": "",
                "password": "",
                "recipients": ["admin@consultorio.com"]
            },
            "thresholds": self.thresholds,
            "monitoring_interval": 3600,  # 1 hora
            "alert_cooldown": 7200  # 2 horas
        }
        
        if config_file.exists():
            with open(config_file, 'r') as f:
                return {**default_config, **json.load(f)}
        else:
            with open(config_file, 'w') as f:
                json.dump(default_config, f, indent=2)
            return default_config
    
    def calculate_data_completeness(self):
        """Calcular porcentaje de completitud de datos"""
        try:
            # Campos obligatorios por tabla
            patient_required = ['nombre', 'fecha_nacimiento', 'telefono']
            treatment_required = ['nombre', 'descripcion', 'costo_unitario', 'precio']
            record_required = ['paciente_id', 'tratamiento_id', 'fecha', 'monto_pagado']
            
            total_fields = 0
            completed_fields = 0
            
            # Verificar pacientes
            patients = self.db.query(Patient).all()
            for patient in patients:
                for field in patient_required:
                    total_fields += 1
                    value = getattr(patient, field)
                    if value is not None and str(value).strip():
                        completed_fields += 1
            
            # Verificar tratamientos
            treatments = self.db.query(Treatment).all()
            for treatment in treatments:
                for field in treatment_required:
                    total_fields += 1
                    value = getattr(treatment, field)
                    if value is not None and str(value).strip():
                        completed_fields += 1
            
            # Verificar registros
            records = self.db.query(Record).all()
            for record in records:
                for field in record_required:
                    total_fields += 1
                    value = getattr(record, field)
                    if value is not None:
                        completed_fields += 1
            
            completeness = (completed_fields / total_fields * 100) if total_fields > 0 else 100
            self.metrics['data_completeness'] = completeness
            
            if completeness < self.thresholds['data_completeness_min']:
                self.add_alert(
                    "WARNING",
                    "Data Completeness",
                    f"Completitud de datos: {completeness:.1f}% (mínimo: {self.thresholds['data_completeness_min']}%)"
                )
            
            return completeness
            
        except Exception as e:
            self.add_alert("ERROR", "Data Completeness", f"Error calculando completitud: {e}")
            return 0
    
    def calculate_financial_consistency(self):
        """Verificar consistencia de cálculos financieros"""
        try:
            records = self.db.query(Record).filter(
                Record.monto_pagado.isnot(None),
                Record.costo_unitario.isnot(None),
                Record.ganancia.isnot(None)
            ).all()
            
            total_records = len(records)
            consistent_records = 0
            
            for record in records:
                expected_profit = (
                    record.monto_pagado - 
                    record.costo_unitario - 
                    (record.comision_monto or 0)
                )
                
                # Tolerancia de 0.01 para errores de redondeo
                if abs(record.ganancia - expected_profit) < 0.01:
                    consistent_records += 1
            
            consistency = (consistent_records / total_records * 100) if total_records > 0 else 100
            self.metrics['financial_consistency'] = consistency
            
            if consistency < self.thresholds['financial_consistency_min']:
                inconsistent_count = total_records - consistent_records
                self.add_alert(
                    "ERROR",
                    "Financial Consistency",
                    f"Inconsistencia financiera: {inconsistent_count} registros de {total_records} ({consistency:.1f}%)"
                )
            
            return consistency
            
        except Exception as e:
            self.add_alert("ERROR", "Financial Consistency", f"Error verificando consistencia: {e}")
            return 0
    
    def check_referential_integrity(self):
        """Verificar integridad referencial"""
        try:
            issues = 0
            
            # Registros huérfanos - sin paciente
            orphan_patients = self.db.query(Record).filter(
                ~Record.paciente_id.in_(self.db.query(Patient.id))
            ).count()
            
            if orphan_patients > 0:
                issues += orphan_patients
                self.add_alert(
                    "ERROR",
                    "Referential Integrity",
                    f"{orphan_patients} registros sin paciente válido"
                )
            
            # Registros huérfanos - sin tratamiento
            orphan_treatments = self.db.query(Record).filter(
                ~Record.tratamiento_id.in_(self.db.query(Treatment.id))
            ).count()
            
            if orphan_treatments > 0:
                issues += orphan_treatments
                self.add_alert(
                    "ERROR",
                    "Referential Integrity",
                    f"{orphan_treatments} registros sin tratamiento válido"
                )
            
            total_records = self.db.query(Record).count()
            integrity = ((total_records - issues) / total_records * 100) if total_records > 0 else 100
            self.metrics['referential_integrity'] = integrity
            
            return integrity
            
        except Exception as e:
            self.add_alert("ERROR", "Referential Integrity", f"Error verificando integridad: {e}")
            return 0
    
    def detect_duplicates(self):
        """Detectar registros duplicados"""
        try:
            # Duplicados por teléfono
            duplicate_phones = self.db.query(
                Patient.telefono, func.count(Patient.id).label('count')
            ).group_by(Patient.telefono).having(func.count(Patient.id) > 1).all()
            
            total_patients = self.db.query(Patient).count()
            duplicate_count = sum(count - 1 for _, count in duplicate_phones)
            duplicate_rate = (duplicate_count / total_patients * 100) if total_patients > 0 else 0
            
            self.metrics['duplicate_rate'] = duplicate_rate
            
            if duplicate_rate > self.thresholds['duplicate_rate_max']:
                self.add_alert(
                    "WARNING",
                    "Data Duplicates",
                    f"Tasa de duplicados: {duplicate_rate:.1f}% ({duplicate_count} duplicados encontrados)"
                )
            
            return duplicate_rate
            
        except Exception as e:
            self.add_alert("ERROR", "Duplicate Detection", f"Error detectando duplicados: {e}")
            return 0
    
    def validate_data_types_and_ranges(self):
        """Validar tipos de datos y rangos válidos"""
        try:
            issues = 0
            
            # Validar fechas futuras
            future_records = self.db.query(Record).filter(
                Record.fecha > datetime.now().date()
            ).count()
            
            if future_records > 0:
                issues += future_records
                self.add_alert(
                    "WARNING",
                    "Data Validation",
                    f"{future_records} registros con fechas futuras"
                )
            
            # Validar montos negativos
            negative_amounts = self.db.query(Record).filter(
                or_(Record.monto_pagado < 0, Record.costo_unitario < 0)
            ).count()
            
            if negative_amounts > 0:
                issues += negative_amounts
                self.add_alert(
                    "ERROR",
                    "Data Validation",
                    f"{negative_amounts} registros con montos negativos"
                )
            
            # Validar métodos de pago
            valid_methods = ['efectivo', 'tarjeta', 'transferencia']
            invalid_methods = self.db.query(Record).filter(
                ~Record.metodo_pago.in_(valid_methods)
            ).count()
            
            if invalid_methods > 0:
                issues += invalid_methods
                self.add_alert(
                    "ERROR",
                    "Data Validation",
                    f"{invalid_methods} registros con métodos de pago inválidos"
                )
            
            # Validar pacientes con más de 120 años
            old_threshold = datetime.now().date() - timedelta(days=43800)
            very_old_patients = self.db.query(Patient).filter(
                Patient.fecha_nacimiento < old_threshold
            ).count()
            
            if very_old_patients > 0:
                self.add_alert(
                    "WARNING",
                    "Data Validation",
                    f"{very_old_patients} pacientes con más de 120 años"
                )
            
            total_records = self.db.query(Record).count()
            error_rate = (issues / total_records * 100) if total_records > 0 else 0
            self.metrics['error_rate'] = error_rate
            
            return error_rate
            
        except Exception as e:
            self.add_alert("ERROR", "Data Validation", f"Error en validación: {e}")
            return 100
    
    def add_alert(self, level, category, message):
        """Agregar alerta al sistema"""
        alert = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "category": category,
            "message": message
        }
        self.alerts.append(alert)
        
        # Log inmediato para alertas críticas
        if level == "ERROR":
            print(f"🚨 {level} [{category}]: {message}")
        elif level == "WARNING":
            print(f"⚠️ {level} [{category}]: {message}")
    
    def run_full_monitoring(self):
        """Ejecutar monitoreo completo"""
        print(f"🔍 Iniciando monitoreo de calidad - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Ejecutar todas las verificaciones
        self.calculate_data_completeness()
        self.calculate_financial_consistency()
        self.check_referential_integrity()
        self.detect_duplicates()
        self.validate_data_types_and_ranges()
        
        # Generar reporte de estado
        self.generate_status_report()
        
        # Enviar alertas si es necesario
        if self.alerts:
            self.send_alerts()
        
        # Guardar métricas históricas
        self.save_metrics_history()
        
        return self.metrics, self.alerts
    
    def generate_status_report(self):
        """Generar reporte de estado actual"""
        print("\n" + "="*60)
        print("📊 REPORTE DE CALIDAD DE DATOS")
        print("="*60)
        
        # Métricas principales
        for metric, value in self.metrics.items():
            status = "✅" if self.is_metric_healthy(metric, value) else "❌"
            print(f"{status} {metric.replace('_', ' ').title()}: {value:.1f}%")
        
        # Alertas por categoría
        if self.alerts:
            print(f"\n🚨 ALERTAS DETECTADAS ({len(self.alerts)}):")
            by_category = {}
            for alert in self.alerts:
                category = alert['category']
                if category not in by_category:
                    by_category[category] = []
                by_category[category].append(alert)
            
            for category, alerts in by_category.items():
                print(f"\n  📋 {category}:")
                for alert in alerts:
                    level_icon = "🚨" if alert['level'] == "ERROR" else "⚠️"
                    print(f"    {level_icon} {alert['message']}")
        else:
            print("\n✅ No se detectaron problemas")
        
        print("="*60)
    
    def is_metric_healthy(self, metric, value):
        """Determinar si una métrica está en rango saludable"""
        if metric in ['data_completeness', 'financial_consistency', 'referential_integrity']:
            threshold = self.thresholds.get(f"{metric}_min", 95)
            return value >= threshold
        elif metric in ['duplicate_rate', 'error_rate']:
            threshold = self.thresholds.get(f"{metric}_max", 5)
            return value <= threshold
        return True
    
    def send_alerts(self):
        """Enviar alertas por email"""
        if not self.config['email']['enabled']:
            return
        
        try:
            # Filtrar solo alertas críticas
            critical_alerts = [a for a in self.alerts if a['level'] == 'ERROR']
            
            if not critical_alerts:
                return
            
            # Preparar email
            msg = MIMEMultipart()
            msg['From'] = self.config['email']['username']
            msg['To'] = ', '.join(self.config['email']['recipients'])
            msg['Subject'] = f"🚨 SGMM - Alertas Críticas de Calidad de Datos"
            
            # Contenido del email
            body = f"""
Sistema de Gestión Médica Moderna (SGMM)
UME López & López - Consultorio Médico

ALERTAS CRÍTICAS DETECTADAS
Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

MÉTRICAS ACTUALES:
"""
            
            for metric, value in self.metrics.items():
                status = "✅" if self.is_metric_healthy(metric, value) else "❌"
                body += f"{status} {metric.replace('_', ' ').title()}: {value:.1f}%\n"
            
            body += f"\nALERTAS CRÍTICAS ({len(critical_alerts)}):\n"
            for alert in critical_alerts:
                body += f"🚨 [{alert['category']}] {alert['message']}\n"
            
            body += "\nACCIONES RECOMENDADAS:\n"
            body += "1. Revisar inmediatamente los problemas identificados\n"
            body += "2. Ejecutar script de verificación: python verify_data.py\n"
            body += "3. Contactar al equipo de desarrollo si persisten los problemas\n"
            body += "\nContacto de Soporte: gmelgarejom@gmail.com"
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Enviar email
            server = smtplib.SMTP(self.config['email']['smtp_server'], self.config['email']['smtp_port'])
            server.starttls()
            server.login(self.config['email']['username'], self.config['email']['password'])
            server.send_message(msg)
            server.quit()
            
            print(f"📧 Alertas enviadas a {len(self.config['email']['recipients'])} destinatarios")
            
        except Exception as e:
            print(f"❌ Error enviando alertas: {e}")
    
    def save_metrics_history(self):
        """Guardar historial de métricas"""
        try:
            history_file = Path("metrics_history.json")
            
            # Cargar historial existente
            history = []
            if history_file.exists():
                with open(history_file, 'r') as f:
                    history = json.load(f)
            
            # Agregar métricas actuales
            entry = {
                "timestamp": datetime.now().isoformat(),
                "metrics": self.metrics,
                "alerts_count": len(self.alerts),
                "critical_alerts": len([a for a in self.alerts if a['level'] == 'ERROR'])
            }
            
            history.append(entry)
            
            # Mantener solo los últimos 30 días
            cutoff_date = datetime.now() - timedelta(days=30)
            history = [
                h for h in history 
                if datetime.fromisoformat(h['timestamp']) > cutoff_date
            ]
            
            # Guardar historial actualizado
            with open(history_file, 'w') as f:
                json.dump(history, f, indent=2)
            
        except Exception as e:
            print(f"❌ Error guardando historial: {e}")

def run_continuous_monitoring():
    """Ejecutar monitoreo continuo"""
    print("🔄 Iniciando monitoreo continuo de calidad de datos...")
    
    while True:
        try:
            with DataQualityMonitor() as monitor:
                metrics, alerts = monitor.run_full_monitoring()
                
                # Mostrar resumen
                critical_count = len([a for a in alerts if a['level'] == 'ERROR'])
                warning_count = len([a for a in alerts if a['level'] == 'WARNING'])
                
                if critical_count > 0:
                    print(f"🚨 {critical_count} alertas críticas detectadas")
                elif warning_count > 0:
                    print(f"⚠️ {warning_count} advertencias detectadas")
                else:
                    print("✅ Sistema funcionando correctamente")
            
            # Esperar intervalo configurado
            interval = monitor.config.get('monitoring_interval', 3600)
            print(f"⏰ Próxima verificación en {interval//60} minutos...")
            time.sleep(interval)
            
        except KeyboardInterrupt:
            print("\n👋 Deteniendo monitoreo...")
            break
        except Exception as e:
            print(f"❌ Error en monitoreo: {e}")
            time.sleep(60)  # Esperar 1 minuto antes de reintentar

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Monitor de Calidad de Datos SGMM")
    parser.add_argument("--continuous", "-c", action="store_true", 
                       help="Ejecutar monitoreo continuo")
    parser.add_argument("--config", help="Archivo de configuración personalizado")
    
    args = parser.parse_args()
    
    if args.continuous:
        run_continuous_monitoring()
    else:
        with DataQualityMonitor() as monitor:
            metrics, alerts = monitor.run_full_monitoring()
            
            # Código de salida basado en alertas críticas
            critical_alerts = [a for a in alerts if a['level'] == 'ERROR']
            exit(1 if critical_alerts else 0)
