#!/usr/bin/env python3

import sqlite3
import json
from datetime import datetime

def setup_test_inventory_data():
    """Setup test inventory data and link with treatments"""
    
    # Connect to database
    conn = sqlite3.connect('consultorio.db')
    cursor = conn.cursor()
    
    try:
        # Create some test inventory items
        inventory_items = [
            {
                'nombre': 'Gasas Estériles',
                'descripcion': 'Gasas estériles 10x10cm',
                'unidad_medida': 'unidad',
                'stock_actual': 100,
                'stock_minimo': 20,
                'stock_maximo': 200,
                'costo_unitario': 2.50
            },
            {
                'nombre': 'Jeringas Desechables',
                'descripcion': 'Jeringas desechables 5ml',
                'unidad_medida': 'unidad',
                'stock_actual': 50,
                'stock_minimo': 10,
                'stock_maximo': 100,
                'costo_unitario': 1.50
            },
            {
                'nombre': 'Alcohol Isopropílico',
                'descripcion': 'Alcohol isopropílico 70%',
                'unidad_medida': 'ml',
                'stock_actual': 1000,
                'stock_minimo': 200,
                'stock_maximo': 2000,
                'costo_unitario': 0.10
            },
            {
                'nombre': 'Algodón',
                'descripcion': 'Algodón hidrófilo',
                'unidad_medida': 'gramo',
                'stock_actual': 500,
                'stock_minimo': 100,
                'stock_maximo': 1000,
                'costo_unitario': 0.05
            }
        ]
        
        # Insert inventory items
        created_items = []
        for item in inventory_items:
            cursor.execute("""
                INSERT INTO inventoryitem 
                (nombre, descripcion, unidad_medida, stock_actual, stock_minimo, stock_maximo, costo_unitario, activo, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item['nombre'],
                item['descripcion'],
                item['unidad_medida'],
                item['stock_actual'],
                item['stock_minimo'],
                item['stock_maximo'],
                item['costo_unitario'],
                True,
                datetime.now(),
                datetime.now()
            ))
            
            item_id = cursor.lastrowid
            created_items.append({'id': item_id, **item})
            print(f"Created inventory item: {item['nombre']} (ID: {item_id})")
        
        # Get existing treatments
        cursor.execute("SELECT id, nombre FROM treatment LIMIT 3")
        treatments = cursor.fetchall()
        
        if not treatments:
            print("No treatments found. Creating a test treatment...")
            cursor.execute("""
                INSERT INTO treatment (nombre, descripcion, precio, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                "Limpieza Dental",
                "Limpieza dental básica con fluorización",
                300.0,
                datetime.now(),
                datetime.now()
            ))
            treatment_id = cursor.lastrowid
            treatments = [(treatment_id, "Limpieza Dental")]
        
        # Link inventory items with treatments
        treatment_inventory_links = [
            # Treatment 1: Limpieza Dental
            {'treatment_id': treatments[0][0], 'inventory_item_id': created_items[0]['id'], 'quantity': 2},  # Gasas
            {'treatment_id': treatments[0][0], 'inventory_item_id': created_items[2]['id'], 'quantity': 50}, # Alcohol
            {'treatment_id': treatments[0][0], 'inventory_item_id': created_items[3]['id'], 'quantity': 10}, # Algodón
        ]
        
        # Add more links if we have more treatments
        if len(treatments) > 1:
            treatment_inventory_links.extend([
                {'treatment_id': treatments[1][0], 'inventory_item_id': created_items[1]['id'], 'quantity': 1},  # Jeringas
                {'treatment_id': treatments[1][0], 'inventory_item_id': created_items[2]['id'], 'quantity': 25}, # Alcohol
            ])
        
        # Insert treatment-inventory links
        for link in treatment_inventory_links:
            cursor.execute("""
                INSERT OR REPLACE INTO treatmentinventoryitem 
                (treatment_id, inventory_item_id, cantidad_requerida)
                VALUES (?, ?, ?)
            """, (
                link['treatment_id'],
                link['inventory_item_id'],
                link['quantity']
            ))
            
            # Get treatment and item names for logging
            cursor.execute("SELECT nombre FROM treatment WHERE id = ?", (link['treatment_id'],))
            treatment_name = cursor.fetchone()[0]
            
            cursor.execute("SELECT nombre FROM inventoryitem WHERE id = ?", (link['inventory_item_id'],))
            item_name = cursor.fetchone()[0]
            
            print(f"Linked '{item_name}' with '{treatment_name}' (quantity: {link['quantity']})")
        
        # Create some initial inventory movements
        for item in created_items:
            cursor.execute("""
                INSERT INTO inventorymovement 
                (item_id, tipo, cantidad, cantidad_anterior, cantidad_nueva, motivo, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                item['id'],
                'initial_stock',
                item['stock_actual'],
                0,
                item['stock_actual'],
                f"Stock inicial de {item['nombre']}",
                datetime.now()
            ))
            print(f"Created initial stock movement for {item['nombre']}")
        
        # Commit changes
        conn.commit()
        print("\n✅ Test inventory data setup completed successfully!")
        
        # Print summary
        print("\n📊 SUMMARY:")
        print(f"- Created {len(created_items)} inventory items")
        print(f"- Linked items with {len(set(link['treatment_id'] for link in treatment_inventory_links))} treatments")
        print(f"- Created {len(created_items)} initial stock movements")
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting up test data: {e}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    setup_test_inventory_data()
