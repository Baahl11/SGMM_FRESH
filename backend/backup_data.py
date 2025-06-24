#!/usr/bin/env python3
"""
Script de backup para la base de datos SGMM
Sistema de Gestión Médica Moderna - UME López & López
"""

import sys
import os
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Patient, Treatment, Record

def create_backup():
    """Crear backup completo de la base de datos"""
    print("💾 Iniciando backup de la base de datos...")
    
    db = SessionLocal()
    backup_data = {
        "backup_info": {
            "created_at": datetime.now().isoformat(),
            "version": "1.0.0",
            "system": "SGMM - UME López & López"
        },
        "users": [],
        "patients": [],
        "treatments": [],
        "records": []
    }
    
    try:
        # Backup Users (sin contraseñas por seguridad)
        print("👥 Respaldando usuarios...")
        for user in db.query(User).all():
            backup_data["users"].append({
                "id": user.id,
                "email": user.email,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None
            })
        print(f"  ✅ {len(backup_data['users'])} usuarios respaldados")
        
        # Backup Patients
        print("🙋 Respaldando pacientes...")
        for patient in db.query(Patient).all():
            backup_data["patients"].append({
                "id": patient.id,
                "nombre": patient.nombre,
                "fecha_nacimiento": patient.fecha_nacimiento.isoformat(),
                "telefono": patient.telefono,
                "email": patient.email,
                "direccion": patient.direccion,
                "requiere_factura": patient.requiere_factura,
                "created_at": patient.created_at.isoformat() if hasattr(patient, 'created_at') and patient.created_at else None,
                "updated_at": patient.updated_at.isoformat() if hasattr(patient, 'updated_at') and patient.updated_at else None
            })
        print(f"  ✅ {len(backup_data['patients'])} pacientes respaldados")
        
        # Backup Treatments
        print("🦷 Respaldando tratamientos...")
        for treatment in db.query(Treatment).all():
            backup_data["treatments"].append({
                "id": treatment.id,
                "nombre": treatment.nombre,
                "descripcion": treatment.descripcion,
                "costo_unitario": float(treatment.costo_unitario),
                "precio": float(treatment.precio),
                "created_at": treatment.created_at.isoformat() if hasattr(treatment, 'created_at') and treatment.created_at else None,
                "updated_at": treatment.updated_at.isoformat() if hasattr(treatment, 'updated_at') and treatment.updated_at else None
            })
        print(f"  ✅ {len(backup_data['treatments'])} tratamientos respaldados")
        
        # Backup Records
        print("📋 Respaldando registros médicos...")
        for record in db.query(Record).all():
            backup_data["records"].append({
                "id": record.id,
                "paciente_id": record.paciente_id,
                "tratamiento_id": record.tratamiento_id,
                "fecha": record.fecha.isoformat(),
                "monto_pagado": float(record.monto_pagado),
                "costo_unitario": float(record.costo_unitario),
                "ganancia": float(record.ganancia) if record.ganancia else 0,
                "metodo_pago": record.metodo_pago,
                "tipo_tarjeta": record.tipo_tarjeta,
                "meses_sin_intereses": record.meses_sin_intereses,
                "tasa_comision": float(record.tasa_comision) if record.tasa_comision else 0,
                "comision_monto": float(record.comision_monto) if record.comision_monto else 0,
                "notas": record.notas,
                "created_at": record.created_at.isoformat() if hasattr(record, 'created_at') and record.created_at else None
            })
        print(f"  ✅ {len(backup_data['records'])} registros respaldados")
        
        # Guardar backup
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"sgmm_backup_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2)
        
        # Mostrar estadísticas del backup
        print("\n" + "="*50)
        print("📊 ESTADÍSTICAS DEL BACKUP")
        print("="*50)
        print(f"📁 Archivo: {filename}")
        print(f"📅 Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print(f"👥 Usuarios: {len(backup_data['users'])}")
        print(f"🙋 Pacientes: {len(backup_data['patients'])}")
        print(f"🦷 Tratamientos: {len(backup_data['treatments'])}")
        print(f"📋 Registros: {len(backup_data['records'])}")
        
        # Calcular estadísticas financieras del backup
        total_records = len(backup_data['records'])
        if total_records > 0:
            total_revenue = sum(record['monto_pagado'] for record in backup_data['records'])
            total_costs = sum(record['costo_unitario'] for record in backup_data['records'])
            total_profit = sum(record['ganancia'] for record in backup_data['records'])
            
            print(f"💰 Ingresos totales: ${total_revenue:,.2f}")
            print(f"💸 Costos totales: ${total_costs:,.2f}")
            print(f"📈 Ganancia total: ${total_profit:,.2f}")
        
        print(f"\n✅ Backup creado exitosamente: {filename}")
        
        # Obtener tamaño del archivo
        file_size = os.path.getsize(filename)
        if file_size < 1024:
            size_str = f"{file_size} bytes"
        elif file_size < 1024 * 1024:
            size_str = f"{file_size / 1024:.1f} KB"
        else:
            size_str = f"{file_size / (1024 * 1024):.1f} MB"
        
        print(f"📦 Tamaño del archivo: {size_str}")
        
        return filename
        
    except Exception as e:
        print(f"❌ Error durante el backup: {e}")
        raise
    finally:
        db.close()

def restore_backup(filename):
    """Restaurar backup desde archivo JSON"""
    print(f"🔄 Restaurando backup desde: {filename}")
    
    if not os.path.exists(filename):
        print(f"❌ Archivo no encontrado: {filename}")
        return False
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)
        
        db = SessionLocal()
        
        # Verificar formato del backup
        required_keys = ['backup_info', 'users', 'patients', 'treatments', 'records']
        if not all(key in backup_data for key in required_keys):
            print("❌ Formato de backup inválido")
            return False
        
        print(f"📅 Backup creado: {backup_data['backup_info']['created_at']}")
        print(f"📋 Registros a restaurar:")
        print(f"  👥 Usuarios: {len(backup_data['users'])}")
        print(f"  🙋 Pacientes: {len(backup_data['patients'])}")
        print(f"  🦷 Tratamientos: {len(backup_data['treatments'])}")
        print(f"  📋 Registros: {len(backup_data['records'])}")
        
        # Confirmar restauración
        confirm = input("\n⚠️  ADVERTENCIA: Esto eliminará todos los datos actuales. ¿Continuar? (sí/no): ")
        if confirm.lower() not in ['sí', 'si', 'yes', 'y']:
            print("❌ Restauración cancelada")
            return False
        
        # Limpiar tablas existentes
        print("🗑️ Limpiando datos existentes...")
        db.query(Record).delete()
        db.query(Patient).delete()
        db.query(Treatment).delete()
        db.query(User).delete()
        db.commit()
        
        # Restaurar datos
        print("📥 Restaurando datos...")
        
        # Usuarios (necesitarás resetear contraseñas manualmente)
        for user_data in backup_data['users']:
            user = User(
                email=user_data['email'],
                hashed_password="$2b$12$temp_hash_needs_reset",  # Temporal
                is_active=user_data['is_active']
            )
            db.add(user)
        
        # Tratamientos
        for treatment_data in backup_data['treatments']:
            treatment = Treatment(
                nombre=treatment_data['nombre'],
                descripcion=treatment_data['descripcion'],
                costo_unitario=treatment_data['costo_unitario'],
                precio=treatment_data['precio']
            )
            db.add(treatment)
        
        # Pacientes
        for patient_data in backup_data['patients']:
            patient = Patient(
                nombre=patient_data['nombre'],
                fecha_nacimiento=datetime.fromisoformat(patient_data['fecha_nacimiento']).date(),
                telefono=patient_data['telefono'],
                email=patient_data['email'],
                direccion=patient_data['direccion'],
                requiere_factura=patient_data['requiere_factura']
            )
            db.add(patient)
        
        db.commit()
        
        # Registros médicos
        for record_data in backup_data['records']:
            record = Record(
                paciente_id=record_data['paciente_id'],
                tratamiento_id=record_data['tratamiento_id'],
                fecha=datetime.fromisoformat(record_data['fecha']).date(),
                monto_pagado=record_data['monto_pagado'],
                costo_unitario=record_data['costo_unitario'],
                ganancia=record_data['ganancia'],
                metodo_pago=record_data['metodo_pago'],
                tipo_tarjeta=record_data['tipo_tarjeta'],
                meses_sin_intereses=record_data['meses_sin_intereses'],
                tasa_comision=record_data['tasa_comision'],
                comision_monto=record_data['comision_monto'],
                notas=record_data['notas']
            )
            db.add(record)
        
        db.commit()
        db.close()
        
        print("✅ Backup restaurado exitosamente")
        print("⚠️  IMPORTANTE: Debes resetear las contraseñas de todos los usuarios")
        
        return True
        
    except Exception as e:
        print(f"❌ Error durante la restauración: {e}")
        return False

def list_backups():
    """Listar archivos de backup disponibles"""
    backup_files = [f for f in os.listdir('.') if f.startswith('sgmm_backup_') and f.endswith('.json')]
    
    if not backup_files:
        print("📂 No se encontraron archivos de backup")
        return []
    
    print("📂 Backups disponibles:")
    for i, filename in enumerate(sorted(backup_files, reverse=True), 1):
        # Extraer fecha del nombre del archivo
        try:
            timestamp = filename.replace('sgmm_backup_', '').replace('.json', '')
            date_obj = datetime.strptime(timestamp, '%Y%m%d_%H%M%S')
            date_str = date_obj.strftime('%d/%m/%Y %H:%M:%S')
            
            # Obtener tamaño del archivo
            file_size = os.path.getsize(filename)
            if file_size < 1024 * 1024:
                size_str = f"{file_size / 1024:.1f} KB"
            else:
                size_str = f"{file_size / (1024 * 1024):.1f} MB"
            
            print(f"  {i}. {filename}")
            print(f"     📅 {date_str} | 📦 {size_str}")
        except:
            print(f"  {i}. {filename}")
    
    return backup_files

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "create" or command == "backup":
            create_backup()
        elif command == "restore":
            if len(sys.argv) > 2:
                restore_backup(sys.argv[2])
            else:
                backups = list_backups()
                if backups:
                    print("\nUso: python backup_data.py restore <archivo_backup>")
        elif command == "list":
            list_backups()
        else:
            print("Comandos disponibles:")
            print("  python backup_data.py create   - Crear nuevo backup")
            print("  python backup_data.py restore <archivo> - Restaurar backup")
            print("  python backup_data.py list     - Listar backups disponibles")
    else:
        # Sin argumentos, crear backup
        create_backup()
