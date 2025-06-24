#!/usr/bin/env python3
"""Script para crear un paciente nuevo sin tratamiento realizado"""

from datetime import datetime, date
from app.database import engine
from app.models import Patient
from sqlmodel import SQLModel, Session

def create_new_patient():
    """Create a new patient to test appointment-only functionality"""
    
    with Session(engine) as session:
        new_patient = Patient(
            nombre="Ana Martínez",
            fecha_nacimiento=date(1985, 3, 15),
            telefono="55-1234-5678",
            email="ana.martinez@email.com",
            direccion="Calle de las Flores 123, CDMX",
            requiere_factura=False,
            fotos=[],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        session.add(new_patient)
        session.commit()
        session.refresh(new_patient)
        
        print(f"✓ Paciente creado: {new_patient.nombre} (ID: {new_patient.id})")
        print(f"  📞 Teléfono: {new_patient.telefono}")
        print(f"  📧 Email: {new_patient.email}")
        print(f"  📅 Creado: {new_patient.created_at}")
        print(f"\n🔗 Editar en: http://localhost:3000/patients/{new_patient.id}/edit")

if __name__ == "__main__":
    create_new_patient()
