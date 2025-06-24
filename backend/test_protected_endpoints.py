#!/usr/bin/env python3
"""
Test de endpoints de tratamientos e inventario.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_treatment_endpoints():
    """Test treatment endpoints."""
    
    print("🧪 TESTING TREATMENT ENDPOINTS")
    print("=" * 50)
    
    # Autenticarse
    login_data = {
        "username": "test@example.com", 
        "password": "test123"
    }
    
    print("1. Authenticating...")
    auth_response = requests.post(f"{BASE_URL}/token", data=login_data)
    
    if auth_response.status_code != 200:
        print(f"❌ Authentication failed: {auth_response.status_code}")
        return
    
    token = auth_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Authentication successful")
    
    # Test: Get treatment by ID
    treatment_id = 4  # Botox
    print(f"\n2. Testing GET /treatments/{treatment_id}")
    
    response = requests.get(f"{BASE_URL}/treatments/{treatment_id}", headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        treatment = response.json()
        print(f"   ✅ Treatment: {treatment['nombre']}")
    else:
        print(f"   ❌ Error: {response.text}")
    
    # Test: Get treatment inventory
    print(f"\n3. Testing GET /treatments/{treatment_id}/inventory")
    
    response = requests.get(f"{BASE_URL}/treatments/{treatment_id}/inventory", headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        inventory = response.json()
        print(f"   ✅ Inventory items: {len(inventory)}")
        for item in inventory:
            print(f"     - {item['inventory_item_name']}: {item['cantidad_requerida']}")
    else:
        print(f"   ❌ Error: {response.text}")
    
    # Test: Get all inventory items
    print(f"\n4. Testing GET /inventory")
    
    response = requests.get(f"{BASE_URL}/inventory", headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        inventory = response.json()
        print(f"   ✅ Total inventory items: {len(inventory)}")
        for item in inventory[:3]:  # Show first 3
            print(f"     - {item['nombre']}: {item['stock_actual']} {item['unidad_medida']}")
        if len(inventory) > 3:
            print(f"     ... and {len(inventory) - 3} more")
    else:
        print(f"   ❌ Error: {response.text}")
    
    # Test: Non-existent treatment
    print(f"\n5. Testing GET /treatments/999 (should fail)")
    
    response = requests.get(f"{BASE_URL}/treatments/999", headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 404:
        print(f"   ✅ Correctly returns 404 for non-existent treatment")
    else:
        print(f"   ⚠️ Unexpected status: {response.status_code}")
        print(f"      Response: {response.text}")

if __name__ == "__main__":
    test_treatment_endpoints()
