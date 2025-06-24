#!/usr/bin/env python3
"""
Script de verificación para comprobar que OpenPay esté correctamente configurado
en el sistema SGMM.
"""

import requests
import json

def test_backend_credit_cards():
    """Probar el endpoint de tarjetas de crédito del backend"""
    print("=== VERIFICACIÓN DEL BACKEND ===")
    
    # 1. Login
    print("1. Haciendo login...")
    login_data = {
        "username": "admin@admin.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        response.raise_for_status()
        token = response.json()["access_token"]
        print("✓ Login exitoso")
    except Exception as e:
        print(f"✗ Error en login: {e}")
        return
    
    # 2. Obtener tarjetas de crédito
    print("2. Obteniendo tarjetas de crédito...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            "http://localhost:8000/payment-methods/credit-cards/",
            headers=headers
        )
        response.raise_for_status()
        cards_data = response.json()
        
        print(f"✓ Se encontraron {len(cards_data['cards'])} tarjetas")
        
        # Verificar OpenPay
        openpay_found = False
        for card in cards_data['cards']:
            if card['id'] == 'openpay':
                openpay_found = True
                print(f"✓ OpenPay encontrado: {card['name']}")
                print(f"  - Tasa base: {card['commission_rate']}%")
                print(f"  - MSI disponibles: {card['months_available']}")
                
                # Verificar tasas específicas
                expected_rates = {
                    "0": 3.364,
                    "3": 8.932,
                    "6": 12.412,
                    "9": 15.892,
                    "12": 19.372
                }
                
                rates_ok = True
                for msi, expected_rate in expected_rates.items():
                    actual_rate = card['rates'].get(msi)
                    if abs(actual_rate - expected_rate) > 0.001:
                        print(f"  ✗ Tasa incorrecta para {msi} MSI: esperado {expected_rate}, actual {actual_rate}")
                        rates_ok = False
                    else:
                        print(f"  ✓ Tasa correcta para {msi} MSI: {actual_rate}%")
                
                if rates_ok:
                    print("✓ Todas las tasas de OpenPay son correctas")
                break
        
        if not openpay_found:
            print("✗ OpenPay NO encontrado en las tarjetas disponibles")
        
        # Mostrar todas las tarjetas
        print("\nTarjetas disponibles:")
        for card in cards_data['cards']:
            print(f"  - {card['id']}: {card['name']} ({card['commission_rate']}%)")
            
    except Exception as e:
        print(f"✗ Error obteniendo tarjetas: {e}")

def test_calculation_endpoint():
    """Probar el endpoint de cálculo de comisiones"""
    print("\n=== VERIFICACIÓN DE CÁLCULOS ===")
    
    # Login
    login_data = {
        "username": "admin@admin.com", 
        "password": "admin123"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Probar cálculo con OpenPay
        test_cases = [
            {"amount": 1000, "commission_rate": 3.364, "description": "OpenPay 1 exhibición"},
            {"amount": 1000, "commission_rate": 8.932, "description": "OpenPay 3 MSI"},
            {"amount": 1000, "commission_rate": 19.372, "description": "OpenPay 12 MSI"}
        ]
        
        for case in test_cases:
            response = requests.post(
                "http://localhost:8000/payment-methods/calculate-commission/",
                json=case,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ {case['description']}:")
                print(f"  Monto: ${result['amount']}")
                print(f"  Comisión: ${result['commission_amount']:.2f}")
                print(f"  Neto: ${result['net_amount']:.2f}")
            else:
                print(f"✗ Error calculando {case['description']}: {response.status_code}")
    
    except Exception as e:
        print(f"✗ Error en cálculos: {e}")

if __name__ == "__main__":
    print("VERIFICACIÓN DE OPENPAY EN SGMM")
    print("=" * 50)
    
    test_backend_credit_cards()
    test_calculation_endpoint()
    
    print("\n=== VERIFICACIÓN MANUAL FRONTEND ===")
    print("Para verificar el frontend:")
    print("1. Abrir http://localhost:3000/patients/1/edit")
    print("2. Ir a la pestaña 'Agregar Tratamiento'")
    print("3. Seleccionar 'Tarjeta de Crédito' como método de pago")
    print("4. Verificar que 'OpenPay' aparezca en el selector de tipo de tarjeta")
    print("5. Seleccionar OpenPay y verificar que las opciones de MSI sean: 0, 3, 6, 9, 12")
    print("6. Probar un cálculo con $1000 y verificar los resultados")
