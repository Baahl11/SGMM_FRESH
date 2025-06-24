#!/usr/bin/env python3
"""
Script para actualizar el esquema de la base de datos con soporte para múltiples tratamientos
y mejores campos de tarjeta de crédito
"""

import sqlite3
import os
from datetime import datetime

# Obtener la ruta de la base de datos
db_path = os.path.join(os.path.dirname(__file__), 'consultorio.db')

def update_database_schema():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print(f"📊 Actualizando esquema de base de datos: {db_path}")
        
        # 1. Verificar si la tabla recordtreatment ya existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='recordtreatment'
        """)
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("🔨 Creando tabla recordtreatment...")
            cursor.execute("""
                CREATE TABLE recordtreatment (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    record_id INTEGER NOT NULL,
                    treatment_id INTEGER,
                    nombre_tratamiento VARCHAR(255) NOT NULL,
                    precio_normal REAL NOT NULL,
                    precio_promocional REAL NOT NULL,
                    costo_unitario REAL NOT NULL,
                    ganancia_individual REAL NOT NULL,
                    orden INTEGER NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(record_id) REFERENCES record(id),
                    FOREIGN KEY(treatment_id) REFERENCES treatment(id)
                )
            """)
            print("✅ Tabla recordtreatment creada")
        else:
            print("ℹ️  Tabla recordtreatment ya existe")
        
        # 2. Verificar y agregar nuevas columnas a la tabla record
        cursor.execute("PRAGMA table_info(record)")
        columns = [column[1] for column in cursor.fetchall()]
        
        new_columns = [
            ('nombre_promocion', 'VARCHAR(255)'),
            ('precio_normal_total', 'REAL'),
            ('ahorro_total', 'REAL'),
            ('tiene_multiples_tratamientos', 'INTEGER DEFAULT 0'),
            ('numero_autorizacion', 'VARCHAR(100)'),
            ('ultimos_4_digitos', 'VARCHAR(4)')
        ]
        
        for column_name, column_type in new_columns:
            if column_name not in columns:
                print(f"🔨 Agregando columna {column_name}...")
                cursor.execute(f"ALTER TABLE record ADD COLUMN {column_name} {column_type}")
                print(f"✅ Columna {column_name} agregada")
            else:
                print(f"ℹ️  Columna {column_name} ya existe")
        
        # 3. Verificar que treatment_id sea nullable (SQLite no permite modificar restricciones directamente)
        print("ℹ️  Nota: treatment_id ahora puede ser NULL para registros con múltiples tratamientos")
        
        # 4. Crear índices para mejor rendimiento
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_recordtreatment_record_id ON recordtreatment(record_id)",
            "CREATE INDEX IF NOT EXISTS idx_recordtreatment_treatment_id ON recordtreatment(treatment_id)",
            "CREATE INDEX IF NOT EXISTS idx_record_multiples ON record(tiene_multiples_tratamientos)",
            "CREATE INDEX IF NOT EXISTS idx_record_metodo_pago ON record(metodo_pago)"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
        
        print("✅ Índices creados")
        
        # Confirmar cambios
        conn.commit()
        print("🎉 ¡Esquema de base de datos actualizado exitosamente!")
        
        # Mostrar estadísticas
        cursor.execute("SELECT COUNT(*) FROM record")
        record_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM recordtreatment")
        recordtreatment_count = cursor.fetchone()[0]
        
        print(f"📊 Estadísticas:")
        print(f"   - Registros existentes: {record_count}")
        print(f"   - Tratamientos múltiples: {recordtreatment_count}")
        
    except Exception as e:
        print(f"❌ Error actualizando esquema: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    update_database_schema()
