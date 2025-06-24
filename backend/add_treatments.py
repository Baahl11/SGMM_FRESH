#!/usr/bin/env python3
"""Script para agregar más tratamientos y probar el scroll"""

from app.database import engine
from app.models import Treatment
from sqlmodel import SQLModel, Session

def add_more_treatments():
    """Add more treatments to test dropdown scroll"""
    
    with Session(engine) as session:
        new_treatments = [
            {"nombre": "Toxina Botulínica (Glabela)", "precio": 4500, "costo_unitario": 1800, "descripcion": "Tratamiento para arrugas de entrecejo"},
            {"nombre": "Toxina Botulínica (Patas de Gallo)", "precio": 3500, "costo_unitario": 1400, "descripcion": "Tratamiento para arrugas periorbitales"},
            {"nombre": "Toxina Botulínica (Frente)", "precio": 4000, "costo_unitario": 1600, "descripcion": "Tratamiento para arrugas frontales"},
            {"nombre": "Ácido Hialurónico Labios", "precio": 6000, "costo_unitario": 2400, "descripcion": "Aumento y definición labial"},
            {"nombre": "Ácido Hialurónico Mentón", "precio": 7500, "costo_unitario": 3000, "descripcion": "Proyección y definición del mentón"},
            {"nombre": "Ácido Hialurónico Pómulos", "precio": 8500, "costo_unitario": 3400, "descripcion": "Aumento y definición de pómulos"},
            {"nombre": "Bioestimulador Colágeno", "precio": 12000, "costo_unitario": 4800, "descripcion": "Estimulación natural de colágeno"},
            {"nombre": "Peeling Químico Superficial", "precio": 2500, "costo_unitario": 1000, "descripcion": "Exfoliación química suave"},
            {"nombre": "Peeling Químico Medio", "precio": 4000, "costo_unitario": 1600, "descripcion": "Exfoliación química moderada"},
            {"nombre": "Peeling Químico Profundo", "precio": 8000, "costo_unitario": 3200, "descripcion": "Exfoliación química intensa"},
            {"nombre": "Microagujas con PRP", "precio": 5500, "costo_unitario": 2200, "descripcion": "Micropunción con plasma rico en plaquetas"},
            {"nombre": "Radiofrecuencia Facial", "precio": 3500, "costo_unitario": 1400, "descripcion": "Tratamiento tensor por radiofrecuencia"},
            {"nombre": "Ultrasonido Focalizado", "precio": 15000, "costo_unitario": 6000, "descripcion": "Lifting no invasivo con ultrasonido"},
            {"nombre": "Threads PDO", "precio": 12000, "costo_unitario": 4800, "descripcion": "Hilos tensores biodegradables"},
            {"nombre": "Láser CO2 Fraccionado", "precio": 10000, "costo_unitario": 4000, "descripcion": "Resurfacing láser fraccionado"},
            {"nombre": "IPL Fotorrejuvenecimiento", "precio": 3000, "costo_unitario": 1200, "descripcion": "Luz pulsada intensa"},
            {"nombre": "Mesoterapia Facial", "precio": 2800, "costo_unitario": 1120, "descripcion": "Microinyecciones vitamínicas"},
            {"nombre": "Mesoterapia Corporal", "precio": 3500, "costo_unitario": 1400, "descripcion": "Tratamiento corporal con microinyecciones"},
            {"nombre": "Criolipólisis", "precio": 8000, "costo_unitario": 3200, "descripcion": "Reducción de grasa por frío"},
            {"nombre": "Cavitación Ultrasónica", "precio": 2500, "costo_unitario": 1000, "descripcion": "Reducción de grasa por ultrasonido"},
        ]
        
        # Check existing treatments to avoid duplicates
        existing_names = set()
        existing_treatments = session.query(Treatment).all()
        for treatment in existing_treatments:
            existing_names.add(treatment.nombre)
        
        # Add only new treatments
        added_count = 0
        for treatment_data in new_treatments:
            if treatment_data["nombre"] not in existing_names:
                treatment = Treatment(**treatment_data)
                session.add(treatment)
                added_count += 1
        
        session.commit()
        print(f"✓ {added_count} nuevos tratamientos agregados")
        
        # Show total count
        total_treatments = session.query(Treatment).count()
        print(f"📋 Total de tratamientos en el sistema: {total_treatments}")

if __name__ == "__main__":
    add_more_treatments()
