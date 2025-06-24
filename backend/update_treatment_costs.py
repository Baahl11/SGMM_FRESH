#!/usr/bin/env python3
"""
Script para actualizar los costos unitarios de los tratamientos
"""

from app.database import get_session
from app.models import Treatment
from sqlmodel import Session, select
from app.database import engine

def update_treatment_costs():
    """Actualizar costos unitarios de tratamientos que están en 0"""
    
    # Costos estimados razonables para cada tipo de tratamiento
    cost_updates = {
        # ALMA Soprano (láser depilación) - costos estimados
        "ALMA Soprano (Axila)": {"precio": 800, "costo": 150},
        "ALMA Soprano (Bigote)": {"precio": 600, "costo": 100},
        "ALMA Soprano (Nariz)": {"precio": 500, "costo": 80},
        "ALMA Soprano (Patilla)": {"precio": 700, "costo": 120},
        "ALMA Soprano (Delineado de Barba)": {"precio": 900, "costo": 160},
        "ALMA Soprano (Barba Completa)": {"precio": 1500, "costo": 280},
        "ALMA Soprano (Cara Completa)": {"precio": 2500, "costo": 450},
        "ALMA Soprano (Cuello)": {"precio": 1000, "costo": 180},
        "ALMA Soprano (Pecho)": {"precio": 2000, "costo": 350},
        "ALMA Soprano (Abdomen Completo)": {"precio": 3000, "costo": 550},
        "ALMA Soprano (Media Espalda)": {"precio": 2500, "costo": 450},
        "ALMA Soprano (Espalda Completa)": {"precio": 4000, "costo": 700},
        "ALMA Soprano (Medio Brazo)": {"precio": 1500, "costo": 280},
        "ALMA Soprano (Brazo Completo)": {"precio": 2500, "costo": 450},
        "ALMA Soprano (Coxis)": {"precio": 800, "costo": 150},
        "ALMA Soprano (Bikini)": {"precio": 1200, "costo": 220},
        "ALMA Soprano (Bikini Brasileño)": {"precio": 1800, "costo": 320},
        "ALMA Soprano (Gluteos)": {"precio": 2000, "costo": 350},
        "ALMA Soprano (Media Pierna)": {"precio": 2500, "costo": 450},
        "ALMA Soprano (Pierna Completa)": {"precio": 4500, "costo": 800},
        "ALMA Soprano (Cuerpo Completo)": {"precio": 12000, "costo": 2200},
        
        # ALMA Hybrid (rejuvenecimiento) - costos estimados
        "ALMA Hybrid (Ojos)": {"precio": 3500, "costo": 600},
        "ALMA Hybrid (Full Face)": {"precio": 8000, "costo": 1400},
        "ALMA Hybrid (Cicatrices)": {"precio": 4000, "costo": 700},
        
        # Otros tratamientos sin costo
        "Botox": {"precio": 4000, "costo": 800},
        "Duraform": {"precio": 12000, "costo": 2500},
        "Sculptra": {"precio": 15000, "costo": 3200},
        "Ellanse": {"precio": 18000, "costo": 4000},
        "Acido Hialuronico (Derm)": {"precio": 8000, "costo": 1600},
        "Acido Hialuronico (Deep)": {"precio": 10000, "costo": 2000},
        "Acido Hialuronico (Face Shape)": {"precio": 12000, "costo": 2400},
        "Enzimas (Promedic)": {"precio": 2500, "costo": 500},
        "PDRN Salmón": {"precio": 6000, "costo": 1200},
        "Toxina Botulínica (Glabela)": {"precio": 3500, "costo": 700},
        "Toxina Botulínica (Patas de Gallo)": {"precio": 3000, "costo": 600},
        "Toxina Botulínica (Frente)": {"precio": 3500, "costo": 700},
        "Ácido Hialurónico Labios": {"precio": 8000, "costo": 1600},
        "Ácido Hialurónico Mentón": {"precio": 9000, "costo": 1800},
        "Ácido Hialurónico Pómulos": {"precio": 10000, "costo": 2000},
        "Bioestimulador Colágeno": {"precio": 12000, "costo": 2500},
        "Peeling Químico Superficial": {"precio": 1500, "costo": 300},
        "Peeling Químico Medio": {"precio": 2500, "costo": 500},
        "Peeling Químico Profundo": {"precio": 4000, "costo": 800},
        "Microagujas con PRP": {"precio": 3500, "costo": 700},
        "Radiofrecuencia Facial": {"precio": 2500, "costo": 500},
        "Ultrasonido Focalizado": {"precio": 8000, "costo": 1600},
        "Threads PDO": {"precio": 15000, "costo": 3000},
        "Láser CO2 Fraccionado": {"precio": 6000, "costo": 1200},
        "IPL Fotorrejuvenecimiento": {"precio": 2000, "costo": 400},
        "Mesoterapia Facial": {"precio": 2000, "costo": 400},
        "Mesoterapia Corporal": {"precio": 2500, "costo": 500},
        "Criolipólisis": {"precio": 8000, "costo": 1600},
        "Cavitación Ultrasónica": {"precio": 1500, "costo": 300}
    }
    
    with Session(engine) as session:
        treatments = session.exec(select(Treatment)).all()
        
        updated_count = 0
        for treatment in treatments:
            if treatment.nombre in cost_updates:
                update_data = cost_updates[treatment.nombre]
                old_precio = treatment.precio
                old_costo = treatment.costo_unitario
                
                treatment.precio = update_data["precio"]
                treatment.costo_unitario = update_data["costo"]
                
                print(f"✓ {treatment.nombre}:")
                print(f"  Precio: ${old_precio} → ${treatment.precio}")
                print(f"  Costo: ${old_costo} → ${treatment.costo_unitario}")
                print()
                
                updated_count += 1
        
        session.commit()
        print(f"✅ {updated_count} tratamientos actualizados exitosamente")
        
        # Verificar que no queden tratamientos con costo 0
        zero_cost_treatments = session.exec(
            select(Treatment).where(Treatment.costo_unitario == 0)
        ).all()
        
        if zero_cost_treatments:
            print(f"\n⚠️  Aún quedan {len(zero_cost_treatments)} tratamientos con costo 0:")
            for treatment in zero_cost_treatments:
                print(f"  - {treatment.nombre}")
        else:
            print("\n✅ Todos los tratamientos ahora tienen costo unitario > 0")

if __name__ == "__main__":
    print("ACTUALIZANDO COSTOS UNITARIOS DE TRATAMIENTOS")
    print("=" * 60)
    update_treatment_costs()
    print("=" * 60)
    print("ACTUALIZACIÓN COMPLETADA")
