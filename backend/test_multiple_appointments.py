#!/usr/bin/env python3
"""Script para crear múltiples citas a la misma hora"""

from datetime import datetime, timedelta
from app.database import engine
from app.models import Patient, Treatment, Record
from sqlmodel import SQLModel, Session, select

def create_multiple_appointments_same_time():
    """Create multiple appointments at the same time"""
    
    with Session(engine) as session:
        # Get existing patients and treatments
        patients = session.exec(select(Patient)).all()
        treatments = session.exec(select(Treatment)).all()
        
        if len(patients) < 2 or len(treatments) < 2:
            print("❌ Need at least 2 patients and 2 treatments.")
            return
        
        # Create 3 appointments for tomorrow at 10:00
        tomorrow = datetime.now() + timedelta(days=1)
        appointment_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
        
        appointments = []
        
        # Appointment 1: Patient 1, Treatment 1
        apt1 = Record(
            patient_id=patients[0].id,
            treatment_id=treatments[0].id,
            fecha=appointment_time,
            monto_pagado=0,
            monto_neto=0,
            costo_unitario=0,
            ganancia=0,
            metodo_pago="efectivo",
            tasa_comision=0,
            comision_monto=0,
            notas="Cita múltiple 1 - 10:00"
        )
        
        # Appointment 2: Patient 2, Treatment 2 (same time)
        apt2 = Record(
            patient_id=patients[1].id,
            treatment_id=treatments[1].id,
            fecha=appointment_time,
            monto_pagado=0,
            monto_neto=0,
            costo_unitario=0,
            ganancia=0,
            metodo_pago="efectivo",
            tasa_comision=0,
            comision_monto=0,
            notas="Cita múltiple 2 - 10:00"
        )
        
        # Appointment 3: Patient 1, Treatment 2 (same time)
        apt3 = Record(
            patient_id=patients[0].id,
            treatment_id=treatments[1].id,
            fecha=appointment_time,
            monto_pagado=0,
            monto_neto=0,
            costo_unitario=0,
            ganancia=0,
            metodo_pago="efectivo",
            tasa_comision=0,
            comision_monto=0,
            notas="Cita múltiple 3 - 10:00"
        )
        
        session.add_all([apt1, apt2, apt3])
        session.commit()
        
        print(f"✓ 3 citas creadas para mañana a las 10:00")
        print(f"  Paciente: {patients[0].nombre} - {treatments[0].nombre}")
        print(f"  Paciente: {patients[1].nombre} - {treatments[1].nombre}")
        print(f"  Paciente: {patients[0].nombre} - {treatments[1].nombre}")
        print(f"  📅 Fecha: {appointment_time.strftime('%Y-%m-%d %H:%M')}")

if __name__ == "__main__":
    create_multiple_appointments_same_time()
