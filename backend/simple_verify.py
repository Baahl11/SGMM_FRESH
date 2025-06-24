#!/usr/bin/env python3
"""
Script simple de verificación de datos - SGMM
"""

import sqlite3
import os
from datetime import datetime

def verify_database():
    """Verificar estado de la base de datos"""
    db_path = "consultorio.db"
    
    if not os.path.exists(db_path):
        print("❌ Base de datos no encontrada")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Verificando base de datos SGMM...")
        print("="*60)
        
        # Verificar tablas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"📋 Tablas encontradas: {', '.join(tables)}")
        
        # Verificar datos
        stats = {}
        for table in ['user', 'patient', 'treatment', 'record']:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                stats[table] = count
                print(f"📊 {table.capitalize()}s: {count}")
            except sqlite3.OperationalError:
                print(f"⚠️ Tabla '{table}' no encontrada")
        
        # Verificar datos financieros si hay registros
        if stats.get('record', 0) > 0:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(monto_pagado) as ingresos,
                    SUM(ganancia) as ganancias,
                    AVG(monto_pagado) as promedio
                FROM record 
                WHERE monto_pagado IS NOT NULL
            """)
            
            result = cursor.fetchone()
            if result:
                total, ingresos, ganancias, promedio = result
                print(f"\n💰 DATOS FINANCIEROS:")
                print(f"   📈 Total registros: {total}")
                print(f"   💵 Ingresos totales: ${ingresos or 0:,.2f}")
                print(f"   📊 Ganancias totales: ${ganancias or 0:,.2f}")
                print(f"   📉 Ingreso promedio: ${promedio or 0:,.2f}")
        
        # Verificar métodos de pago
        if stats.get('record', 0) > 0:
            cursor.execute("""
                SELECT metodo_pago, COUNT(*), SUM(monto_pagado)
                FROM record 
                WHERE metodo_pago IS NOT NULL
                GROUP BY metodo_pago
            """)
            
            payment_methods = cursor.fetchall()
            if payment_methods:
                print(f"\n💳 MÉTODOS DE PAGO:")
                for method, count, total in payment_methods:
                    print(f"   {method.capitalize()}: {count} registros (${total or 0:,.2f})")
        
        conn.close()
        
        print("\n✅ Verificación completada exitosamente")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
        return False

if __name__ == "__main__":
    verify_database()
