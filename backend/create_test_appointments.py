#!/usr/bin/env python3
"""Script para crear citas programadas de prueba"""

from datetime import datetime, timedelta
from app.database import engine
from app.models import Patient, Treatment, Record
from sqlmodel import SQLModel, Session, select

def create_test_appointments():
    """Create test appointments for the current week"""
    
    with Session(engine) as session:
        # Get existing patients and treatments
        patients = session.exec(select(Patient)).all()
        treatments = session.exec(select(Treatment)).all()
        
        if not patients or not treatments:
            print("❌ No patients or treatments found. Run create_test_data.py first.")
            return
        
        # Check if we already have appointments
        existing_appointments = session.exec(select(Record).where(Record.monto_pagado == 0)).all()
        
        if existing_appointments:
            print("⚠️  Appointments already exist. Deleting old ones...")
            for apt in existing_appointments:
                session.delete(apt)
            session.commit()
        
        # Create appointments for this week
        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())  # Monday
        
        appointments = []
        
        # Schedule appointments throughout the week
        appointment_times = [
            (0, 9, 0),   # Monday 9:00 AM
            (0, 14, 30), # Monday 2:30 PM
            (1, 10, 0),  # Tuesday 10:00 AM
            (2, 11, 30), # Wednesday 11:30 AM
            (2, 16, 0),  # Wednesday 4:00 PM
            (3, 9, 30),  # Thursday 9:30 AM
            (4, 15, 0),  # Friday 3:00 PM
            (4, 17, 30), # Friday 5:30 PM
        ]
        
        for i, (day_offset, hour, minute) in enumerate(appointment_times):
            if i >= len(patients):
                patient = patients[i % len(patients)]
            else:
                patient = patients[i]
            
            treatment = treatments[i % len(treatments)]
            
            appointment_date = week_start + timedelta(days=day_offset)
            appointment_date = appointment_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            # Create appointment record (monto_pagado = 0 indicates it's scheduled, not completed)
            appointment = Record(
                patient_id=patient.id,
                treatment_id=treatment.id,
                fecha=appointment_date,
                monto_pagado=0,  # Key: 0 means it's a scheduled appointment
                monto_neto=0,
                costo_unitario=0,
                ganancia=0,
                metodo_pago="efectivo",
                tasa_comision=0,
                comision_monto=0,
                notas=f"Cita programada - {treatment.nombre}"
            )
            
            appointments.append(appointment)
        
        # Add all appointments to session
        for appointment in appointments:
            session.add(appointment)
        
        session.commit()
        print(f"✓ {len(appointments)} citas programadas creadas para esta semana")
        
        # Show created appointments
        print("\nCitas creadas:")
        for apt in appointments:
            print(f"- {apt.fecha.strftime('%A %d/%m/%Y %H:%M')} - Paciente ID: {apt.patient_id} - {apt.notas}")

if __name__ == "__main__":
    create_test_appointments()
