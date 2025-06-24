import requests
import json
from datetime import datetime

def test_record_creation():
    print("🧪 Test de Creación de Registros")
    print("===============================")
    
    # Simular datos de un record válido
    test_record = {
        "patient_id": 4,  # El paciente que se usó en el error
        "treatment_id": 1,
        "fecha": datetime.now().isoformat(),
        "monto_pagado": 1000.0,
        "monto_neto": 950.0,
        "costo_unitario": 200.0,
        "ganancia": 750.0,
        "metodo_pago": "efectivo",
        "tiene_multiples_tratamientos": False
    }
    
    print("📤 Datos de prueba:")
    print(json.dumps(test_record, indent=2, default=str))
    
    try:
        print("\n🔍 Enviando request a backend...")
        # Intentar crear el record directamente en el backend
        response = requests.post(
            "http://localhost:8000/records/",
            json=test_record,
            headers={
                "Authorization": "Bearer test-token",  # Token dummy
                "Content-Type": "application/json"
            }
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Record creado exitosamente!")
            print(f"📦 Response data: {json.dumps(data, indent=2, default=str)}")
        else:
            print(f"❌ Error {response.status_code}")
            try:
                error_data = response.json()
                print(f"📋 Error data: {json.dumps(error_data, indent=2)}")
            except:
                print(f"📋 Raw response: {response.text}")
                
    except Exception as e:
        print(f"💥 Exception: {e}")

if __name__ == "__main__":
    test_record_creation()
