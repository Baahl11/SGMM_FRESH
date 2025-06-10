from app.database import create_db_and_tables, engine
from app.models import User, Patient, Treatment, Record
from app.auth import get_password_hash
from datetime import date, datetime
from sqlmodel import Session

def test_database_setup():
    print("Creating database and tables...")
    create_db_and_tables()
    
    print("\nCreating test data...")
    with Session(engine) as session:
        # Create test user
        test_user = User(
            email="test@example.com",
            hashed_password=get_password_hash("test123"),
            is_active=True
        )
        session.add(test_user)
        
        # Create test patient
        test_patient = Patient(
            nombre="Juan Pérez",
            fecha_nacimiento=date(1990, 1, 1),
            telefono="1234567890",
            email="juan@example.com",
            direccion="Calle Principal 123",
            requiere_factura=True
        )
        session.add(test_patient)
        
        # Create test treatment
        test_treatment = Treatment(
            nombre="Limpieza Dental",
            costo_unitario=800.0,
            precio=1500.0,
            descripcion="Limpieza dental profunda"
        )
        session.add(test_treatment)
        
        # Create test record
        test_record = Record(
            patient_id=1,
            treatment_id=1,
            fecha=datetime.now(),
            monto_pagado=1500.0,
            monto_neto=1200.0,
            notas="Primera consulta"
        )
        session.add(test_record)
        
        try:
            session.commit()
            print("Test data created successfully!")
        except Exception as e:
            print(f"Error creating test data: {e}")
            session.rollback()

if __name__ == "__main__":
    test_database_setup()
