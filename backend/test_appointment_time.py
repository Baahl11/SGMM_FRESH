#!/usr/bin/env python3
"""Script para probar citas con diferentes horas"""

from datetime import datetime, timedelta
from app.database import engine
from app.models import Patient, Treatment, Record
from sqlmodel import SQLModel, Session, select

def create_appointment_with_custom_time():
    """Create an appointment with a specific time to test"""
    
    with Session(engine) as session:
        # Get existing patients and treatments
        patients = session.exec(select(Patient)).all()
        treatments = session.exec(select(Treatment)).all()
        
        if not patients or not treatments:
            print("❌ No patients or treatments found.")
            return
        
        # Create appointment for today at 16:30
        today = datetime.now()
        appointment_time = today.replace(hour=16, minute=30, second=0, microsecond=0)
        
        appointment = Record(
            patient_id=patients[0].id,
            treatment_id=treatments[0].id,
            fecha=appointment_time,
            monto_pagado=0,  # Scheduled appointment
            monto_neto=0,
            costo_unitario=0,
            ganancia=0,
            metodo_pago="efectivo",
            tasa_comision=0,
            comision_monto=0,
            notas="Cita de prueba - 16:30"
        )
        
        session.add(appointment)
        session.commit()
        
        print(f"✓ Cita creada para hoy a las {appointment_time.strftime('%H:%M')}")
        print(f"  Paciente: {patients[0].nombre}")
        print(f"  Tratamiento: {treatments[0].nombre}")
        print(f"  Fecha/Hora: {appointment_time.strftime('%Y-%m-%d %H:%M')}")

def list_today_appointments():
    """List all appointments for today"""
    with Session(engine) as session:
        today = datetime.now().date()
        appointments = session.exec(
            select(Record).where(
                Record.monto_pagado == 0,
                Record.fecha >= today,
                Record.fecha < today + timedelta(days=1)
            )
        ).all()
        
        print("\n📅 Citas de hoy:")
        for apt in appointments:
            patient = session.get(Patient, apt.patient_id)
            treatment = session.get(Treatment, apt.treatment_id)
            print(f"  {apt.fecha.strftime('%H:%M')} - {patient.nombre if patient else 'N/A'} - {treatment.nombre if treatment else 'N/A'}")

if __name__ == "__main__":
    create_appointment_with_custom_time()
    list_today_appointments()
