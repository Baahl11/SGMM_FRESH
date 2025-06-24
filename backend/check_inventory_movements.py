#!/usr/bin/env python3
"""
Script para verificar los movimientos de inventario y el estado actual.
"""

import sqlite3
from datetime import datetime

def check_inventory_status():
    """Check current inventory status and recent movements."""
    
    # Connect to database
    conn = sqlite3.connect('consultorio.db')
    cursor = conn.cursor()
    
    print("🔍 CHECKING INVENTORY STATUS")
    print("=" * 50)    # 1. Check current inventory items
    print("\n1. CURRENT INVENTORY ITEMS:")
    cursor.execute("""
        SELECT id, nombre, stock_actual, stock_minimo, unidad_medida, proveedor
        FROM inventoryitem 
        ORDER BY nombre
    """)
    items = cursor.fetchall()
    
    for item in items:
        print(f"  ID: {item[0]} | {item[1]} | Stock: {item[2]} | Min: {item[3]} | Unit: {item[4]} | Provider: {item[5]}")    # 2. Check recent inventory movements
    print("\n2. RECENT INVENTORY MOVEMENTS (Last 10):")
    cursor.execute("""
        SELECT im.id, im.item_id, ii.nombre, im.tipo, 
               im.cantidad, im.motivo, im.created_at, im.referencia_id
        FROM inventorymovement im
        JOIN inventoryitem ii ON im.item_id = ii.id
        ORDER BY im.created_at DESC
        LIMIT 10
    """)
    movements = cursor.fetchall()
    
    if movements:
        for movement in movements:
            print(f"  ID: {movement[0]} | Item: {movement[2]} | Type: {movement[3]} | Qty: {movement[4]} | Reason: {movement[5]} | Date: {movement[6]} | Ref: {movement[7]}")
    else:
        print("  No movements found!")    # 3. Check treatment-inventory configuration
    print("\n3. TREATMENT-INVENTORY CONFIGURATION:")
    cursor.execute("""
        SELECT ti.id, t.nombre as treatment_name, ii.nombre as item_name, 
               ti.cantidad_requerida
        FROM treatmentinventoryitem ti
        JOIN treatment t ON ti.treatment_id = t.id
        JOIN inventoryitem ii ON ti.inventory_item_id = ii.id
        ORDER BY t.nombre
    """)
    configs = cursor.fetchall()
    
    if configs:
        for config in configs:
            print(f"  ID: {config[0]} | Treatment: {config[1]} | Item: {config[2]} | Required: {config[3]}")
    else:
        print("  No treatment-inventory configurations found!")
    
    # 4. Check recent records
    print("\n4. RECENT RECORDS (Last 5):")
    cursor.execute("""
        SELECT r.id, r.patient_id, r.treatment_id, t.nombre as treatment_name, 
               r.fecha, r.monto_pagado
        FROM record r
        LEFT JOIN treatment t ON r.treatment_id = t.id
        ORDER BY r.created_at DESC
        LIMIT 5
    """)
    records = cursor.fetchall()
    
    if records:
        for record in records:
            print(f"  Record ID: {record[0]} | Patient: {record[1]} | Treatment: {record[3]} | Date: {record[4]} | Amount: ${record[5]}")
    else:
        print("  No records found!")
    
    conn.close()

if __name__ == "__main__":
    check_inventory_status()
