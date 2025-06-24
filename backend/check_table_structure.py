#!/usr/bin/env python3
"""
Script para revisar la estructura de las tablas de inventario.
"""

import sqlite3

def check_table_structure():
    """Check the structure of inventory tables."""
    
    # Connect to database
    conn = sqlite3.connect('consultorio.db')
    cursor = conn.cursor()
    
    print("🔍 CHECKING TABLE STRUCTURES")
    print("=" * 50)
    
    # Check what tables exist
    print("\n1. AVAILABLE TABLES:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    
    for table in tables:
        print(f"  - {table[0]}")
      # Check specific table structures
    inventory_tables = ['inventoryitem', 'inventorymovement', 'treatmentinventoryitem']
    
    for table_name in inventory_tables:
        print(f"\n2. STRUCTURE OF {table_name.upper()}:")
        try:
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            if columns:
                for col in columns:
                    print(f"  {col[1]} ({col[2]}) - PK: {col[5]} - NotNull: {col[3]} - Default: {col[4]}")
            else:
                print(f"  Table {table_name} does not exist!")
        except Exception as e:
            print(f"  Error checking {table_name}: {e}")
    
    # Check if there's any data in inventory tables
    for table_name in inventory_tables:
        print(f"\n3. RECORD COUNT IN {table_name.upper()}:")
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"  Records: {count}")
        except Exception as e:
            print(f"  Error counting {table_name}: {e}")
    
    conn.close()

if __name__ == "__main__":
    check_table_structure()
