#!/usr/bin/env python3
"""Script para crear datos de prueba"""

from datetime import datetime, date
from app.database import engine
from app.models import Patient, Treatment, User, GastoFijo
from sqlmodel import SQLModel, Session, select
from app.auth import get_password_hash

def create_test_data():
    """Create test data for the application"""
    
    # Create all tables
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:        # Check if we already have data
        existing_patients = session.exec(select(Patient)).all()
        existing_treatments = session.exec(select(Treatment)).all()
        existing_users = session.exec(select(User)).all()
        existing_gastos_fijos = session.exec(select(GastoFijo)).all()
        
        # Create admin user if doesn't exist
        if not existing_users:
            admin_user = User(
                email="admin@test.com",
                nombre="Administrador",
                hashed_password=get_password_hash("admin123"),
                is_active=True
            )
            session.add(admin_user)
            print("✓ Usuario administrador creado (admin@test.com / admin123)")
        
        # Create test patients if don't exist
        if not existing_patients:
            patients = [
                Patient(
                    nombre="Juan Pérez",
                    fecha_nacimiento="1990-01-01",
                    telefono="5551234567", 
                    email="juan@test.com",
                    direccion="Calle Test 123",
                    requiere_factura=False
                ),
                Patient(
                    nombre="María García",
                    fecha_nacimiento="1985-05-15",
                    telefono="5557654321",
                    email="maria@test.com", 
                    direccion="Avenida Prueba 456",
                    requiere_factura=True
                ),
                Patient(
                    nombre="Carlos López",
                    fecha_nacimiento="1975-12-20",
                    telefono="5559876543",
                    email="carlos@test.com",
                    direccion="Boulevard Ejemplo 789", 
                    requiere_factura=False
                )
            ]
            
            for patient in patients:
                session.add(patient)
            print(f"✓ {len(patients)} pacientes de prueba creados")
        
        # Create test treatments if don't exist
        if not existing_treatments:
            treatments = [
                Treatment(
                    nombre="Consulta General",
                    descripcion="Consulta médica general",
                    precio=500.0,
                    costo_unitario=200.0
                ),
                Treatment(
                    nombre="Consulta Especializada",
                    descripcion="Consulta con especialista",
                    precio=800.0,
                    costo_unitario=300.0
                ),
                Treatment(
                    nombre="Procedimiento Menor",
                    descripcion="Procedimiento médico menor",
                    precio=1200.0,
                    costo_unitario=500.0
                ),
                Treatment(
                    nombre="Examen de Laboratorio",
                    descripcion="Exámenes de sangre y orina",
                    precio=350.0,
                    costo_unitario=150.0
                ),
                Treatment(
                    nombre="Radiografía",
                    descripcion="Estudio radiológico",
                    precio=600.0,
                    costo_unitario=250.0                )
            ]
            
            for treatment in treatments:
                session.add(treatment)
            print(f"✓ {len(treatments)} tratamientos de prueba creados")
        
        # Create test gastos fijos if don't exist
        if not existing_gastos_fijos:
            gastos_fijos = [
                GastoFijo(
                    nombre="Renta Local",
                    descripcion="Renta mensual del consultorio",
                    monto=15000.0,
                    frecuencia="mensual",
                    fecha_inicio=date(2024, 1, 1),
                    activo=True
                ),
                GastoFijo(
                    nombre="Servicios (Luz, Agua, Internet)",
                    descripcion="Servicios básicos del consultorio",
                    monto=3500.0,
                    frecuencia="mensual",
                    fecha_inicio=date(2024, 1, 1),
                    activo=True
                ),
                GastoFijo(
                    nombre="Seguro Médico",
                    descripcion="Seguro de responsabilidad civil médica",
                    monto=6000.0,
                    frecuencia="anual",
                    fecha_inicio=date(2024, 1, 1),
                    activo=True
                ),
                GastoFijo(
                    nombre="Mantenimiento Equipos",
                    descripcion="Mantenimiento preventivo de equipos médicos",
                    monto=2500.0,
                    frecuencia="trimestral",
                    fecha_inicio=date(2024, 1, 1),
                    activo=True
                ),
                GastoFijo(
                    nombre="Materiales de Limpieza",
                    descripcion="Productos de limpieza y desinfección",
                    monto=800.0,
                    frecuencia="mensual",
                    fecha_inicio=date(2024, 1, 1),
                    activo=True
                )
            ]
            
            for gasto_fijo in gastos_fijos:
                session.add(gasto_fijo)
            print(f"✓ {len(gastos_fijos)} gastos fijos de prueba creados")
        
        # Commit all changes
        session.commit()
        print("✓ Datos de prueba guardados correctamente")

if __name__ == "__main__":
    create_test_data()
