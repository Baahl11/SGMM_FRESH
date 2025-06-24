#!/usr/bin/env python3
"""
Script para crear datos de prueba robustos para SGMM
Sistema de Gestión Médica Moderna - UME López & López
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import User, Patient, Treatment, Record
from app.auth import get_password_hash
from datetime import datetime, timedelta
import random

def calcular_comision_simple(monto, tipo_tarjeta, meses_sin_intereses):
    """Función simplificada para calcular comisiones"""
    if tipo_tarjeta == 'bbva':
        if meses_sin_intereses == 0:
            tasa = 3.5
        elif meses_sin_intereses == 3:
            tasa = 3.95
        elif meses_sin_intereses == 6:
            tasa = 6.5
        elif meses_sin_intereses == 9:
            tasa = 9.0
        elif meses_sin_intereses == 12:
            tasa = 12.0
        else:
            tasa = 3.5
    elif tipo_tarjeta == 'openpay':
        if meses_sin_intereses == 0:
            tasa = 2.9 * 1.16  # + IVA
        elif meses_sin_intereses == 3:
            tasa = 7.7 * 1.16  # + IVA
        elif meses_sin_intereses == 6:
            tasa = 10.7 * 1.16  # + IVA
        elif meses_sin_intereses == 9:
            tasa = 13.7 * 1.16  # + IVA
        elif meses_sin_intereses == 12:
            tasa = 16.7 * 1.16  # + IVA
        else:
            tasa = 2.9 * 1.16
    else:
        tasa = 0
    
    comision = monto * (tasa / 100)
    return tasa, comision

def create_robust_test_data():
    """Crear datos de prueba robustos para el sistema"""
    print("🚀 Iniciando creación de datos robustos...")
    
    db = SessionLocal()
    
    try:
        # 1. CREAR USUARIOS DEL SISTEMA
        print("👥 Creando usuarios del sistema...")
        users_data = [
            {"email": "admin@consultorio.com", "password": "admin123"},
            {"email": "doctor@lopez.com", "password": "doctor123"},
            {"email": "asistente@lopez.com", "password": "asistente123"},
            {"email": "recepcion@lopez.com", "password": "recepcion123"}
        ]
        
        for user_data in users_data:
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing_user:
                user = User(
                    email=user_data["email"],
                    hashed_password=get_password_hash(user_data["password"]),
                    is_active=True
                )
                db.add(user)
                print(f"  ✅ Usuario creado: {user_data['email']}")
        
        db.commit()
        
        # 2. CREAR TRATAMIENTOS ODONTOLÓGICOS REALISTAS
        print("🦷 Creando catálogo de tratamientos...")
        treatments_data = [
            # Consultas
            {"nombre": "Consulta General", "descripcion": "Consulta odontológica general y diagnóstico", "costo": 150, "precio": 500},
            {"nombre": "Consulta de Urgencia", "descripcion": "Atención de urgencias odontológicas", "costo": 200, "precio": 700},
            {"nombre": "Consulta Especializada", "descripcion": "Consulta con especialista", "costo": 250, "precio": 900},
            
            # Preventivos
            {"nombre": "Limpieza Dental", "descripcion": "Profilaxis y limpieza dental profunda", "costo": 100, "precio": 450},
            {"nombre": "Aplicación de Flúor", "descripcion": "Aplicación tópica de fluoruro", "costo": 50, "precio": 200},
            {"nombre": "Selladores de Fosetas", "descripcion": "Selladores preventivos en molares", "costo": 80, "precio": 300},
            
            # Restaurativos
            {"nombre": "Amalgama (Plata)", "descripcion": "Restauración con amalgama dental", "costo": 120, "precio": 400},
            {"nombre": "Resina (Blanca)", "descripcion": "Restauración estética con resina compuesta", "costo": 150, "precio": 550},
            {"nombre": "Incrustación", "descripcion": "Incrustación de porcelana o oro", "costo": 400, "precio": 1200},
            
            # Endodoncia
            {"nombre": "Endodoncia Unirradicular", "descripcion": "Tratamiento de conducto de 1 raíz", "costo": 300, "precio": 1000},
            {"nombre": "Endodoncia Birradicular", "descripcion": "Tratamiento de conducto de 2 raíces", "costo": 400, "precio": 1300},
            {"nombre": "Endodoncia Multirradicular", "descripcion": "Tratamiento de conducto de 3+ raíces", "costo": 500, "precio": 1600},
            
            # Cirugía
            {"nombre": "Extracción Simple", "descripcion": "Extracción dental simple", "costo": 100, "precio": 400},
            {"nombre": "Extracción Quirúrgica", "descripcion": "Extracción dental compleja", "costo": 200, "precio": 700},
            {"nombre": "Extracción de Cordal", "descripcion": "Extracción de muela del juicio", "costo": 300, "precio": 900},
            
            # Prótesis
            {"nombre": "Corona de Porcelana", "descripcion": "Corona individual de porcelana", "costo": 600, "precio": 1800},
            {"nombre": "Corona de Metal-Porcelana", "descripcion": "Corona de metal con porcelana", "costo": 500, "precio": 1500},
            {"nombre": "Puente Fijo (3 piezas)", "descripcion": "Puente dental fijo de 3 unidades", "costo": 1200, "precio": 3500},
            {"nombre": "Prótesis Parcial Removible", "descripcion": "Prótesis parcial removible", "costo": 800, "precio": 2200},
            {"nombre": "Prótesis Total", "descripcion": "Dentadura completa superior o inferior", "costo": 1000, "precio": 2800},
            
            # Implantología
            {"nombre": "Implante Dental", "descripcion": "Colocación de implante dental", "costo": 1200, "precio": 3500},
            {"nombre": "Corona sobre Implante", "descripcion": "Corona protésica sobre implante", "costo": 800, "precio": 2200},
            
            # Ortodoncia
            {"nombre": "Ortodoncia - Consulta", "descripcion": "Consulta y diagnóstico ortodóncico", "costo": 150, "precio": 600},
            {"nombre": "Brackets Metálicos", "descripcion": "Tratamiento con brackets convencionales", "costo": 800, "precio": 2500},
            {"nombre": "Brackets Estéticos", "descripcion": "Tratamiento con brackets estéticos", "costo": 1000, "precio": 3200},
            {"nombre": "Ortodoncia Invisible", "descripcion": "Tratamiento con alineadores transparentes", "costo": 1500, "precio": 4500},
            
            # Periodoncia
            {"nombre": "Curetaje Dental", "descripcion": "Raspado y alisado radicular", "costo": 200, "precio": 600},
            {"nombre": "Cirugía Periodontal", "descripcion": "Cirugía de encías", "costo": 400, "precio": 1100},
            
            # Estética
            {"nombre": "Blanqueamiento Dental", "descripción": "Blanqueamiento dental profesional", "costo": 300, "precio": 900},
            {"nombre": "Carillas de Porcelana", "descripcion": "Carillas estéticas de porcelana", "costo": 800, "precio": 2200},
            
            # Radiología
            {"nombre": "Radiografía Periapical", "descripcion": "Radiografía individual", "costo": 30, "precio": 120},
            {"nombre": "Radiografía Panorámica", "descripcion": "Radiografía panorámica digital", "costo": 80, "precio": 300},
            {"nombre": "Tomografía Dental", "descripcion": "Tomografía computarizada dental", "costo": 200, "precio": 600}
        ]
        
        treatment_objects = []
        for treatment_data in treatments_data:
            existing = db.query(Treatment).filter(Treatment.nombre == treatment_data["nombre"]).first()
            if not existing:
                treatment = Treatment(
                    nombre=treatment_data["nombre"],
                    descripcion=treatment_data["descripcion"],
                    costo_unitario=treatment_data["costo"],
                    precio=treatment_data["precio"]
                )
                db.add(treatment)
                treatment_objects.append(treatment)
                print(f"  ✅ Tratamiento creado: {treatment_data['nombre']}")
        
        db.commit()
        
        # 3. CREAR PACIENTES DIVERSOS Y REALISTAS
        print("🙋 Creando pacientes...")
        patients_data = [
            {"nombre": "María Elena González Pérez", "fecha": "1985-03-15", "telefono": "55-1234-5678", "email": "maria.gonzalez@email.com"},
            {"nombre": "Juan Carlos Rodríguez López", "fecha": "1990-07-22", "telefono": "55-9876-5432", "email": "juan.rodriguez@email.com"},
            {"nombre": "Ana Sofía Martínez Ruiz", "fecha": "1978-11-08", "telefono": "55-5555-1111", "email": "ana.martinez@email.com"},
            {"nombre": "Roberto López Hernández", "fecha": "1982-05-30", "telefono": "55-7777-2222", "email": "roberto.lopez@email.com"},
            {"nombre": "Carmen Patricia Silva Morales", "fecha": "1992-12-12", "telefono": "55-3333-4444", "email": "carmen.silva@email.com"},
            {"nombre": "Fernando Ramírez Castro", "fecha": "1975-09-03", "telefono": "55-8888-9999", "email": "fernando.ramirez@email.com"},
            {"nombre": "Lucía Fernández Torres", "fecha": "1988-01-25", "telefono": "55-2222-6666", "email": "lucia.fernandez@email.com"},
            {"nombre": "Diego Morales Vega", "fecha": "1995-04-17", "telefono": "55-6666-7777", "email": "diego.morales@email.com"},
            {"nombre": "Valeria Jiménez Ruiz", "fecha": "1987-08-09", "telefono": "55-4444-8888", "email": "valeria.jimenez@email.com"},
            {"nombre": "Andrés Gutiérrez Mendoza", "fecha": "1983-10-14", "telefono": "55-9999-1111", "email": "andres.gutierrez@email.com"},
            {"nombre": "Paola Sánchez Rivera", "fecha": "1991-06-28", "telefono": "55-1111-3333", "email": "paola.sanchez@email.com"},
            {"nombre": "Sergio Vargas Herrera", "fecha": "1980-02-19", "telefono": "55-5555-7777", "email": "sergio.vargas@email.com"},
            {"nombre": "Isabella Cruz Moreno", "fecha": "1989-12-05", "telefono": "55-7777-9999", "email": "isabella.cruz@email.com"},
            {"nombre": "Ricardo Delgado Peña", "fecha": "1976-07-11", "telefono": "55-3333-5555", "email": "ricardo.delgado@email.com"},
            {"nombre": "Daniela Rojas Campos", "fecha": "1993-03-27", "telefono": "55-8888-2222", "email": "daniela.rojas@email.com"},
            {"nombre": "Miguel Ángel Torres Vázquez", "fecha": "1984-06-13", "telefono": "55-2222-4444", "email": "miguel.torres@email.com"},
            {"nombre": "Alejandra Mendoza Aguilar", "fecha": "1986-09-21", "telefono": "55-6666-8888", "email": "alejandra.mendoza@email.com"},
            {"nombre": "Carlos Eduardo Ramos Gil", "fecha": "1979-04-08", "telefono": "55-4444-6666", "email": "carlos.ramos@email.com"},
            {"nombre": "Gabriela Herrera Díaz", "fecha": "1994-11-15", "telefono": "55-8888-0000", "email": "gabriela.herrera@email.com"},
            {"nombre": "José Luis Campos Reyes", "fecha": "1981-01-29", "telefono": "55-0000-2222", "email": "jose.campos@email.com"}
        ]
        
        direcciones = [
            "Av. Insurgentes Sur 1234, Col. Del Valle, CDMX",
            "Calle Revolución 567, Col. San Ángel, CDMX", 
            "Av. Reforma 890, Col. Juárez, CDMX",
            "Calle Madero 345, Centro Histórico, CDMX",
            "Av. Universidad 678, Col. Copilco, CDMX",
            "Calle Amsterdam 123, Col. Condesa, CDMX",
            "Av. Patriotismo 456, Col. San Pedro de los Pinos, CDMX",
            "Calle Orizaba 789, Col. Roma Norte, CDMX"
        ]
        
        patient_objects = []
        for patient_data in patients_data:
            existing = db.query(Patient).filter(Patient.telefono == patient_data["telefono"]).first()
            if not existing:
                patient = Patient(
                    nombre=patient_data["nombre"],
                    fecha_nacimiento=datetime.strptime(patient_data["fecha"], "%Y-%m-%d").date(),
                    telefono=patient_data["telefono"],
                    email=patient_data["email"],
                    direccion=random.choice(direcciones),
                    requiere_factura=random.choice([True, False])
                )
                db.add(patient)
                patient_objects.append(patient)
                print(f"  ✅ Paciente creado: {patient_data['nombre']}")
        
        db.commit()
        
        # 4. CREAR REGISTROS MÉDICOS REALISTAS
        print("📋 Creando registros médicos con datos financieros...")
        all_patients = db.query(Patient).all()
        all_treatments = db.query(Treatment).all()
        
        # Generar registros para los últimos 12 meses
        start_date = datetime.now() - timedelta(days=365)
        
        metodos_pago = ['efectivo', 'tarjeta', 'transferencia']
        tipos_tarjeta = ['bbva', 'openpay']
        msi_options = [0, 3, 6, 9, 12]
        
        # Crear 150 registros distribuidos en el año
        for i in range(150):
            patient = random.choice(all_patients)
            treatment = random.choice(all_treatments)
            
            # Fecha aleatoria en los últimos 12 meses, con más frecuencia reciente
            if i < 50:  # Últimos 2 meses
                random_days = random.randint(0, 60)
            elif i < 100:  # Últimos 6 meses
                random_days = random.randint(60, 180)
            else:  # Resto del año
                random_days = random.randint(180, 365)
                
            fecha = start_date + timedelta(days=random_days)
            
            # Método de pago con distribución realista
            metodo_pago = random.choices(
                metodos_pago, 
                weights=[40, 45, 15]  # 40% efectivo, 45% tarjeta, 15% transferencia
            )[0]
            
            tipo_tarjeta = None
            meses_sin_intereses = 0
            tasa_comision = 0
            comision_monto = 0
            
            # Agregar variación de ±10% al precio
            precio_base = treatment.precio
            variacion = random.uniform(0.9, 1.1)
            monto_pagado = round(precio_base * variacion, 2)
            
            costo_unitario = treatment.costo_unitario
            
            # Calcular comisiones si es tarjeta
            if metodo_pago == 'tarjeta':
                tipo_tarjeta = random.choices(
                    tipos_tarjeta,
                    weights=[70, 30]  # 70% BBVA, 30% OpenPay
                )[0]
                
                # MSI más frecuentes para montos altos
                if monto_pagado > 1000:
                    meses_sin_intereses = random.choices(
                        msi_options,
                        weights=[30, 25, 20, 15, 10]  # Más MSI en montos altos
                    )[0]
                else:
                    meses_sin_intereses = random.choices(
                        msi_options,
                        weights=[70, 15, 10, 3, 2]  # Menos MSI en montos bajos
                    )[0]
                
                try:
                    tasa_comision, comision_monto = calcular_comision_simple(
                        monto_pagado, tipo_tarjeta, meses_sin_intereses
                    )
                except Exception as e:
                    print(f"  ⚠️ Error calculando comisión: {e}")
                    tasa_comision = 0
                    comision_monto = 0
            
            # Calcular ganancia
            ganancia = monto_pagado - costo_unitario - comision_monto
            
            # Generar notas realistas
            notas_opciones = [
                f"Tratamiento exitoso. Paciente satisfecho.",
                f"Control en 15 días.",
                f"Se aplicó anestesia local.",
                f"Paciente tolera bien el procedimiento.",
                f"Cita de seguimiento programada.",
                f"Tratamiento completado sin complicaciones.",
                f"Paciente refiere mejoría.",
                ""  # Algunas sin notas
            ]
            
            record = Record(
                paciente_id=patient.id,
                tratamiento_id=treatment.id,
                fecha=fecha.date(),
                monto_pagado=monto_pagado,
                costo_unitario=costo_unitario,
                ganancia=ganancia,
                metodo_pago=metodo_pago,
                tipo_tarjeta=tipo_tarjeta,
                meses_sin_intereses=meses_sin_intereses,
                tasa_comision=tasa_comision,
                comision_monto=comision_monto,
                notas=random.choice(notas_opciones)
            )
            
            db.add(record)
            
            if (i + 1) % 25 == 0:
                print(f"  📊 {i + 1} registros creados...")
        
        db.commit()
        print("✅ Registros médicos creados exitosamente!")
        
        # 5. MOSTRAR ESTADÍSTICAS FINALES
        print("\n" + "="*50)
        print("📊 ESTADÍSTICAS FINALES")
        print("="*50)
        
        total_users = db.query(User).count()
        total_patients = db.query(Patient).count()
        total_treatments = db.query(Treatment).count()
        total_records = db.query(Record).count()
        
        # Estadísticas financieras
        total_revenue = db.query(db.func.sum(Record.monto_pagado)).scalar() or 0
        total_costs = db.query(db.func.sum(Record.costo_unitario)).scalar() or 0
        total_commissions = db.query(db.func.sum(Record.comision_monto)).scalar() or 0
        total_profit = db.query(db.func.sum(Record.ganancia)).scalar() or 0
        
        # Estadísticas por método de pago
        payment_stats = db.query(
            Record.metodo_pago,
            db.func.count(Record.id).label('cantidad'),
            db.func.sum(Record.monto_pagado).label('total')
        ).group_by(Record.metodo_pago).all()
        
        print(f"👥 Usuarios del sistema: {total_users}")
        print(f"🙋 Pacientes registrados: {total_patients}")
        print(f"🦷 Tratamientos disponibles: {total_treatments}")
        print(f"📋 Registros médicos: {total_records}")
        print()
        print("💰 RESUMEN FINANCIERO:")
        print(f"   💵 Ingresos totales: ${total_revenue:,.2f}")
        print(f"   💸 Costos totales: ${total_costs:,.2f}")
        print(f"   🏦 Comisiones pagadas: ${total_commissions:,.2f}")
        print(f"   📈 Ganancia neta: ${total_profit:,.2f}")
        print(f"   📊 Margen: {(total_profit/total_revenue*100):.1f}%")
        print()
        print("💳 MÉTODOS DE PAGO:")
        for method, count, total in payment_stats:
            percentage = (count / total_records) * 100
            print(f"   {method.title()}: {count} registros ({percentage:.1f}%) - ${total:,.2f}")
        
        print("\n✅ ¡Datos robustos creados exitosamente!")
        print("🚀 El sistema está listo para usar con datos realistas.")
        
    except Exception as e:
        print(f"❌ Error durante la creación: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    try:
        create_robust_test_data()
    except Exception as e:
        print(f"💥 Error fatal: {e}")
        sys.exit(1)
