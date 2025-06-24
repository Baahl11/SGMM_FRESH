#!/usr/bin/env python3
"""
Script para agregar la configuración faltante de inventario para Botox.
"""

import sqlite3
from datetime import datetime

def add_botox_consumption():
    """Add missing Botox consumption configuration."""
    
    # Connect to database
    conn = sqlite3.connect('consultorio.db')
    cursor = conn.cursor()
    
    print("🔍 ADDING BOTOX CONSUMPTION CONFIGURATION")
    print("=" * 50)
    
    # First, check if Botox treatment and Botox item exist
    cursor.execute("SELECT id, nombre FROM treatment WHERE nombre = 'Botox'")
    treatment = cursor.fetchone()
    
    cursor.execute("SELECT id, nombre FROM inventoryitem WHERE nombre = 'Botox'")
    item = cursor.fetchone()
    
    if not treatment:
        print("❌ Botox treatment not found!")
        return
        
    if not item:
        print("❌ Botox inventory item not found!")
        return
        
    print(f"✅ Found Botox treatment: ID {treatment[0]}")
    print(f"✅ Found Botox inventory item: ID {item[0]}")
    
    # Check if the configuration already exists
    cursor.execute("""
        SELECT id FROM treatmentinventoryitem 
        WHERE treatment_id = ? AND inventory_item_id = ?
    """, (treatment[0], item[0]))
    
    existing = cursor.fetchone()
    
    if existing:
        print(f"⚠️ Configuration already exists with ID {existing[0]}")
        return
    
    # Add the missing configuration
    # Typically, Botox treatments use 1 unit per application
    cursor.execute("""
        INSERT INTO treatmentinventoryitem (treatment_id, inventory_item_id, cantidad_requerida)
        VALUES (?, ?, ?)
    """, (treatment[0], item[0], 1))
    
    conn.commit()
    print(f"✅ Added Botox consumption configuration: 1 unit per treatment")
    
    # Verify the configuration was added
    cursor.execute("""
        SELECT ti.id, t.nombre as treatment_name, ii.nombre as item_name, 
               ti.cantidad_requerida
        FROM treatmentinventoryitem ti
        JOIN treatment t ON ti.treatment_id = t.id
        JOIN inventoryitem ii ON ti.inventory_item_id = ii.id
        WHERE t.nombre = 'Botox'
        ORDER BY ii.nombre
    """)
    configs = cursor.fetchall()
    
    print(f"\n📋 Current Botox treatment configurations:")
    for config in configs:
        print(f"  - {config[2]}: {config[3]} units")
    
    conn.close()

if __name__ == "__main__":
    add_botox_consumption()
