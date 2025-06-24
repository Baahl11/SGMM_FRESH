#!/usr/bin/env python3
"""Script para crear registros de prueba"""

from datetime import datetime, date, timedelta
from app.database import engine
from app.models import Patient, Treatment, Record
from sqlmodel import SQLModel, Session, select
import random

def create_test_records():
    """Create test records for the application"""
    
    with Session(engine) as session:
        # Get existing patients and treatments
        patients = session.exec(select(Patient)).all()
        treatments = session.exec(select(Treatment)).all()
        
        if not patients or not treatments:
            print("❌ No patients or treatments found. Run create_test_data.py first.")
            return
        
        # Check if we already have records
        existing_records = session.exec(select(Record)).all()
        
        if existing_records:
            print("⚠️  Records already exist. Skipping creation.")
            return
        
        # Create test records for the last 30 days
        records = []
        
        for i in range(30):
            # Generate 1-3 records per day
            num_records = random.randint(1, 3)
            
            for j in range(num_records):
                # Pick random patient and treatment
                patient = random.choice(patients)
                treatment = random.choice(treatments)
                
                # Date for this record (i days ago)
                record_date = datetime.now() - timedelta(days=i)
                
                # Calculate amounts
                base_amount = treatment.precio
                commission_rate = random.choice([0, 3.5, 4.5])  # 0% (cash), 3.5% (BBVA), 4.5% (OpenPay)
                commission_amount = base_amount * (commission_rate / 100)
                net_amount = base_amount - commission_amount
                profit = net_amount - treatment.costo_unitario
                
                # Determine payment method
                if commission_rate == 0:
                    payment_method = "efectivo"
                    card_type = None
                    months = 0
                elif commission_rate == 3.5:
                    payment_method = "tarjeta_credito"
                    card_type = "bbva"
                    months = random.choice([0, 3, 6, 12])
                else:
                    payment_method = "tarjeta_credito"
                    card_type = "openpay"
                    months = random.choice([0, 3, 6, 12])
                
                record = Record(
                    patient_id=patient.id,
                    treatment_id=treatment.id,
                    fecha=record_date,
                    monto_pagado=base_amount,
                    monto_neto=net_amount,
                    costo_unitario=treatment.costo_unitario,
                    ganancia=profit,
                    metodo_pago=payment_method,
                    tipo_tarjeta=card_type,
                    meses_sin_intereses=months,
                    tasa_comision=commission_rate,
                    comision_monto=commission_amount,
                    notas=f"Registro de prueba - {treatment.nombre}"
                )
                
                records.append(record)
        
        # Add all records to session
        for record in records:
            session.add(record)
        
        session.commit()
        print(f"✓ {len(records)} registros de prueba creados para los últimos 30 días")

if __name__ == "__main__":
    create_test_records()
