#!/usr/bin/env python3
"""Script para convertir algunas citas en pagos realizados"""

from datetime import datetime, timedelta
from app.database import engine
from app.models import Patient, Treatment, Record
from sqlmodel import SQLModel, Session, select

def create_paid_records():
    """Convert some appointments to paid records for dashboard testing"""
    
    with Session(engine) as session:
        # Get some appointments (records with monto_pagado = 0)
        appointments = session.exec(
            select(Record).where(Record.monto_pagado == 0)
        ).all()
        
        if len(appointments) < 3:
            print("❌ Need at least 3 appointments to convert")
            return
        
        # Get treatments for pricing
        treatments = session.exec(select(Treatment)).all()
        treatment_dict = {t.id: t for t in treatments}
        
        # Convert first 3 appointments to paid records
        converted = []
        for i, appointment in enumerate(appointments[:3]):
            if appointment.treatment_id and appointment.treatment_id in treatment_dict:
                treatment = treatment_dict[appointment.treatment_id]
                
                # Make it a paid record with realistic data
                appointment.monto_pagado = treatment.precio
                appointment.monto_neto = treatment.precio - (treatment.precio * 0.03)  # 3% commission
                appointment.costo_unitario = treatment.costo_unitario
                appointment.ganancia = treatment.precio - treatment.costo_unitario - (treatment.precio * 0.03)
                appointment.metodo_pago = ["efectivo", "tarjeta", "transferencia"][i % 3]
                appointment.tasa_comision = 0.03 if appointment.metodo_pago == "tarjeta" else 0
                appointment.comision_monto = treatment.precio * 0.03 if appointment.metodo_pago == "tarjeta" else 0
                appointment.notas = f"Tratamiento realizado - {treatment.nombre}"
                
                # Set to a recent date (last few days)
                recent_date = datetime.now() - timedelta(days=i+1)
                appointment.fecha = recent_date
                
                converted.append({
                    'patient_id': appointment.patient_id,
                    'treatment': treatment.nombre,
                    'amount': treatment.precio,
                    'method': appointment.metodo_pago,
                    'date': recent_date.strftime('%Y-%m-%d %H:%M')
                })
        
        session.commit()
        
        print(f"✓ {len(converted)} citas convertidas a registros de pago:")
        for record in converted:
            print(f"  - Paciente {record['patient_id']}: {record['treatment']} - ${record['amount']:,.2f} ({record['method']}) - {record['date']}")
        
        # Show summary
        total_paid = session.exec(select(Record).where(Record.monto_pagado > 0)).all()
        total_scheduled = session.exec(select(Record).where(Record.monto_pagado == 0)).all()
        
        print(f"\n📊 Resumen:")
        print(f"  💰 Registros con pago: {len(total_paid)}")
        print(f"  📅 Citas programadas: {len(total_scheduled)}")

if __name__ == "__main__":
    create_paid_records()
