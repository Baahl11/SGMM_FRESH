#!/usr/bin/env python3
"""
Test script para depurar la creación de records.
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"

def test_record_creation():
    """Test creating a record with proper authentication."""
    
    print("🔍 Testing record creation with debug...")    # 1. Autenticarse
    login_data = {
        "username": "test@example.com",
        "password": "test123"
    }
    
    try:
        print("\n1. Logging in...")
        auth_response = requests.post(f"{BASE_URL}/token", data=login_data)
        print(f"Auth response status: {auth_response.status_code}")
        
        if auth_response.status_code != 200:
            print(f"Login failed: {auth_response.text}")
            return
            
        token_data = auth_response.json()
        token = token_data.get("access_token")
        
        if not token:
            print("No access token received")
            return
            
        print(f"Token received: {token[:20]}...")
        
        # 2. Obtener un paciente existente
        headers = {"Authorization": f"Bearer {token}"}
        patients_response = requests.get(f"{BASE_URL}/patients", headers=headers)
        
        if patients_response.status_code != 200:
            print(f"Failed to get patients: {patients_response.status_code}")
            return
            
        patients = patients_response.json()
        if not patients:
            print("No patients found")
            return
            
        patient = patients[0]
        print(f"Using patient: {patient['nombre']} (ID: {patient['id']})")
        
        # 3. Obtener un tratamiento existente
        treatments_response = requests.get(f"{BASE_URL}/treatments", headers=headers)
        
        if treatments_response.status_code != 200:
            print(f"Failed to get treatments: {treatments_response.status_code}")
            return
            
        treatments = treatments_response.json()
        if not treatments:
            print("No treatments found")
            return
            
        treatment = treatments[0]
        print(f"Using treatment: {treatment['nombre']} (ID: {treatment['id']})")
        
        # 4. Crear el record
        record_data = {
            "patient_id": patient["id"],
            "treatment_id": treatment["id"],
            "fecha": datetime.now().isoformat(),
            "monto_pagado": treatment["precio"],
            "monto_neto": treatment["precio"],
            "ganancia": treatment["precio"] - treatment.get("costo_unitario", 0),
            "costo_unitario": treatment.get("costo_unitario", 0),
            "metodo_pago": "efectivo",
            "notas": "Test record creation from debug script"
        }
        
        print(f"\n2. Creating record with data:")
        print(json.dumps(record_data, indent=2, default=str))
        
        record_response = requests.post(
            f"{BASE_URL}/records",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json=record_data
        )
        
        print(f"\n3. Record creation response:")
        print(f"Status: {record_response.status_code}")
        print(f"Headers: {dict(record_response.headers)}")
        
        if record_response.status_code == 200:
            record_result = record_response.json()
            print(f"✅ Record created successfully!")
            print(json.dumps(record_result, indent=2, default=str))
        else:
            print(f"❌ Record creation failed:")
            print(f"Response text: {record_response.text}")
            
            try:
                error_data = record_response.json()
                print(f"Error JSON: {json.dumps(error_data, indent=2)}")
            except:
                print("Could not parse error as JSON")
        
    except Exception as e:
        print(f"Exception occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_record_creation()
