#!/usr/bin/env python3
"""
Test completo del sistema de inventario.
"""

import sqlite3
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_complete_inventory_system():
    """Test completo del sistema de inventario."""
    
    print("🧪 TESTING COMPLETE INVENTORY SYSTEM")
    print("=" * 60)
    
    # 1. Agregar un nuevo item de inventario
    print("\n1. ADDING NEW INVENTORY ITEM: 'Ácido Hialurónico'")
    add_new_inventory_item()
    
    # 2. Configurar el tratamiento Duraform para usar el nuevo item
    print("\n2. CONFIGURING DURAFORM TO USE NEW ITEM")
    configure_duraform_with_new_item()
    
    # 3. Agregar el propio Duraform como consumible
    print("\n3. ADDING DURAFORM SELF-CONSUMPTION")
    add_duraform_self_consumption()
    
    # 4. Crear un record de Duraform y verificar consumo
    print("\n4. CREATING DURAFORM RECORD AND CHECKING CONSUMPTION")
    test_duraform_consumption()
    
    # 5. Verificar estado final
    print("\n5. FINAL INVENTORY STATUS")
    check_final_status()

def add_new_inventory_item():
    """Agregar un nuevo item de inventario."""
    conn = sqlite3.connect('consultorio.db')
    cursor = conn.cursor()
    
    # Verificar si ya existe
    cursor.execute("SELECT id FROM inventoryitem WHERE nombre = 'Ácido Hialurónico'")
    existing = cursor.fetchone()
    
    if existing:
        print(f"  ⚠️ Item already exists with ID {existing[0]}")
        conn.close()
        return existing[0]
    
    # Agregar nuevo item
    cursor.execute("""
        INSERT INTO inventoryitem 
        (nombre, descripcion, unidad_medida, stock_actual, stock_minimo, stock_maximo, 
         costo_unitario, proveedor, activo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        'Ácido Hialurónico',
        'Ácido hialurónico para rellenos faciales',
        'jeringa',
        20,  # Stock inicial
        5,   # Stock mínimo
        50,  # Stock máximo
        1500.0,  # Costo unitario
        'Proveedor Especializado',
        True,
        datetime.utcnow(),
        datetime.utcnow()
    ))
    
    item_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    print(f"  ✅ Added 'Ácido Hialurónico' with ID {item_id}, stock: 20")
    return item_id

def configure_duraform_with_new_item():
    """Configurar Duraform para usar el nuevo item."""
    conn = sqlite3.connect('consultorio.db')
    cursor = conn.cursor()
    
    # Obtener IDs
    cursor.execute("SELECT id FROM treatment WHERE nombre = 'Duraform'")
    treatment = cursor.fetchone()
    
    cursor.execute("SELECT id FROM inventoryitem WHERE nombre = 'Ácido Hialurónico'")
    item = cursor.fetchone()
    
    if not treatment or not item:
        print("  ❌ Treatment or item not found!")
        conn.close()
        return
    
    # Verificar si ya existe la configuración
    cursor.execute("""
        SELECT id FROM treatmentinventoryitem 
        WHERE treatment_id = ? AND inventory_item_id = ?
    """, (treatment[0], item[0]))
    
    existing = cursor.fetchone()
    
    if existing:
        print(f"  ⚠️ Configuration already exists with ID {existing[0]}")
        conn.close()
        return
    
    # Agregar configuración
    cursor.execute("""
        INSERT INTO treatmentinventoryitem (treatment_id, inventory_item_id, cantidad_requerida)
        VALUES (?, ?, ?)
    """, (treatment[0], item[0], 1))  # 1 jeringa por tratamiento
    
    conn.commit()
    conn.close()
    
    print(f"  ✅ Configured Duraform to use 1 unit of Ácido Hialurónico")

def add_duraform_self_consumption():
    """Agregar consumo del propio producto Duraform."""
    conn = sqlite3.connect('consultorio.db')
    cursor = conn.cursor()
    
    # Primero verificar si existe un item Duraform en inventario
    cursor.execute("SELECT id FROM inventoryitem WHERE nombre = 'Duraform'")
    item = cursor.fetchone()
    
    if not item:
        # Crear el item Duraform
        cursor.execute("""
            INSERT INTO inventoryitem 
            (nombre, descripcion, unidad_medida, stock_actual, stock_minimo, stock_maximo, 
             costo_unitario, proveedor, activo, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            'Duraform',
            'Producto Duraform para tratamientos',
            'jeringa',
            15,  # Stock inicial
            3,   # Stock mínimo
            30,  # Stock máximo
            2000.0,  # Costo unitario
            'Proveedor Duraform',
            True,
            datetime.utcnow(),
            datetime.utcnow()
        ))
        
        item_id = cursor.lastrowid
        print(f"  ✅ Created Duraform inventory item with ID {item_id}")
    else:
        item_id = item[0]
        print(f"  ⚠️ Duraform item already exists with ID {item_id}")
    
    # Configurar el tratamiento para consumir el producto
    cursor.execute("SELECT id FROM treatment WHERE nombre = 'Duraform'")
    treatment = cursor.fetchone()
    
    if treatment:
        # Verificar si ya existe
        cursor.execute("""
            SELECT id FROM treatmentinventoryitem 
            WHERE treatment_id = ? AND inventory_item_id = ?
        """, (treatment[0], item_id))
        
        existing = cursor.fetchone()
        
        if not existing:
            cursor.execute("""
                INSERT INTO treatmentinventoryitem (treatment_id, inventory_item_id, cantidad_requerida)
                VALUES (?, ?, ?)
            """, (treatment[0], item_id, 1))  # 1 unidad por tratamiento
            
            print(f"  ✅ Configured Duraform to consume 1 unit of itself")
        else:
            print(f"  ⚠️ Self-consumption already configured")
    
    conn.commit()
    conn.close()

def test_duraform_consumption():
    """Probar el consumo de inventario con Duraform."""
    
    # Autenticarse
    login_data = {
        "username": "test@example.com",
        "password": "test123"
    }
    
    auth_response = requests.post(f"{BASE_URL}/token", data=login_data)
    if auth_response.status_code != 200:
        print(f"  ❌ Authentication failed: {auth_response.status_code}")
        return
    
    token = auth_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Obtener ID del tratamiento Duraform
    treatments_response = requests.get(f"{BASE_URL}/treatments", headers=headers)
    treatments = treatments_response.json()
    
    duraform = None
    for treatment in treatments:
        if treatment['nombre'] == 'Duraform':
            duraform = treatment
            break
    
    if not duraform:
        print("  ❌ Duraform treatment not found")
        return
    
    # Crear record de Duraform
    record_data = {
        "patient_id": 1,
        "treatment_id": duraform['id'],
        "fecha": datetime.utcnow().isoformat(),
        "monto_pagado": float(duraform['precio']),
        "monto_neto": float(duraform['precio']),
        "ganancia": float(duraform['precio']) - float(duraform['costo_unitario']),
        "costo_unitario": float(duraform['costo_unitario']),
        "metodo_pago": "efectivo",
        "notas": "Test Duraform consumption"
    }
    
    record_response = requests.post(
        f"{BASE_URL}/records/",
        headers={**headers, "Content-Type": "application/json"},
        json=record_data
    )
    
    if record_response.status_code == 200:
        record = record_response.json()
        print(f"  ✅ Duraform record created successfully (ID: {record['id']})")
    else:
        print(f"  ❌ Failed to create record: {record_response.status_code}")
        print(f"      {record_response.text}")

def check_final_status():
    """Verificar el estado final del inventario."""
    conn = sqlite3.connect('consultorio.db')
    cursor = conn.cursor()
    
    # Items relevantes
    items = ['Duraform', 'Ácido Hialurónico', 'Jeringas Desechables', 'Alcohol Isopropílico']
    
    print("  📊 Final inventory status:")
    for item_name in items:
        cursor.execute("SELECT stock_actual FROM inventoryitem WHERE nombre = ?", (item_name,))
        result = cursor.fetchone()
        if result:
            print(f"    - {item_name}: {result[0]} units")
        else:
            print(f"    - {item_name}: Not found")
    
    # Últimos movimientos
    print("\n  📋 Recent movements for new items:")
    cursor.execute("""
        SELECT ii.nombre, im.tipo, im.cantidad, im.created_at, im.referencia_id
        FROM inventorymovement im
        JOIN inventoryitem ii ON im.item_id = ii.id
        WHERE ii.nombre IN ('Duraform', 'Ácido Hialurónico')
        ORDER BY im.created_at DESC
        LIMIT 5
    """)
    
    movements = cursor.fetchall()
    for movement in movements:
        print(f"    - {movement[0]}: {movement[1]} {movement[2]} units (Record #{movement[4]})")
    
    conn.close()

if __name__ == "__main__":
    test_complete_inventory_system()
