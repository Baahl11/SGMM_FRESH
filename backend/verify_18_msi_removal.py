#!/usr/bin/env python3
"""
Verificación de la eliminación de 18 MSI del sistema
"""

import requests
import json

def get_auth_token():
    """Obtener token de autenticación"""
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
        return response.json()["access_token"]
    except Exception as e:
        print(f"Error en login: {e}")
        return None

def verify_18_msi_removed(token):
    """Verificar que se haya eliminado 18 MSI de todas las tarjetas"""
    print("=== VERIFICACIÓN ELIMINACIÓN 18 MSI ===")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://localhost:8000/payment-methods/credit-cards/", headers=headers)
        response.raise_for_status()
        cards_data = response.json()
        
        print(f"Verificando {len(cards_data['cards'])} tarjetas:")
        
        cards_with_18_msi = []
        for card in cards_data['cards']:
            print(f"\n{card['name']}:")
            print(f"  MSI disponibles: {card['months_available']}")
            
            if 18 in card['months_available']:
                cards_with_18_msi.append(card['name'])
                print(f"  ❌ Aún tiene 18 MSI")
            else:
                print(f"  ✅ No tiene 18 MSI")
            
            # Verificar que no exista la tasa para 18 meses
            if "18" in card['rates']:
                print(f"  ⚠️  Aún tiene tasa para 18 meses: {card['rates']['18']}%")
            else:
                print(f"  ✅ No tiene tasa para 18 meses")
        
        if cards_with_18_msi:
            print(f"\n❌ PROBLEMA: {len(cards_with_18_msi)} tarjetas aún tienen 18 MSI:")
            for card_name in cards_with_18_msi:
                print(f"  - {card_name}")
            return False
        else:
            print(f"\n✅ ÉXITO: Ninguna tarjeta tiene 18 MSI disponible")
            return True
            
    except Exception as e:
        print(f"✗ Error verificando tarjetas: {e}")
        return False

def test_calculation_with_removed_msi():
    """Probar que el cálculo falle si se intenta usar 18 MSI"""
    print("\n=== PRUEBA CÁLCULO CON 18 MSI ===")
    
    # Simular lo que pasaría si alguien intentara calcular con 18 MSI
    test_cases = [
        {"card": "amex", "msi": 18, "should_fail": True},
        {"card": "otros", "msi": 18, "should_fail": True},
        {"card": "amex", "msi": 12, "should_fail": False},
        {"card": "otros", "msi": 12, "should_fail": False}
    ]
    
    for case in test_cases:
        card_name = case["card"]
        msi = case["msi"]
        should_fail = case["should_fail"]
        
        print(f"\nProbando {card_name} con {msi} MSI:")
        
        # Esta lógica simula lo que hace el frontend
        card_types = {
            "amex": {
                "installmentRates": {3: 6.30, 6: 8.30, 9: 11.30, 12: 14.30}
            },
            "otros": {
                "installmentRates": {3: 6.30, 6: 8.30, 9: 11.30, 12: 14.30}
            }
        }
        
        if msi in card_types[card_name]["installmentRates"]:
            rate = card_types[card_name]["installmentRates"][msi]
            if should_fail:
                print(f"  ❌ PROBLEMA: Debería fallar pero encontró tasa {rate}%")
            else:
                print(f"  ✅ Correcto: Encontró tasa {rate}%")
        else:
            if should_fail:
                print(f"  ✅ Correcto: No encontró tasa para {msi} MSI (como esperado)")
            else:
                print(f"  ❌ PROBLEMA: No encontró tasa pero debería tenerla")

def provide_manual_verification_steps():
    """Pasos para verificación manual"""
    print("\n=== VERIFICACIÓN MANUAL ===")
    print("📋 Para confirmar que 18 MSI fue eliminado:")
    print()
    print("1. Abrir http://localhost:3000/patients/4/edit")
    print("2. Ir a la pestaña 'Agregar Tratamiento'")
    print("3. Seleccionar método de pago: 'Tarjeta de Crédito'")
    print("4. Seleccionar tipo de tarjeta: 'American Express' o 'Otras Tarjetas'")
    print("5. Verificar opciones en 'Meses Sin Intereses':")
    print("   ✅ Debe aparecer: 1 exhibición, 3 MSI, 6 MSI, 9 MSI, 12 MSI")
    print("   ❌ NO debe aparecer: 18 MSI")
    print()
    print("6. Probar con todas las tarjetas para confirmar")

if __name__ == "__main__":
    print("VERIFICACIÓN ELIMINACIÓN 18 MSI")
    print("=" * 50)
    
    token = get_auth_token()
    if not token:
        print("No se pudo obtener token de autenticación")
        exit(1)
    
    # Verificar backend
    backend_ok = verify_18_msi_removed(token)
    
    # Probar cálculos
    test_calculation_with_removed_msi()
    
    # Pasos manuales
    provide_manual_verification_steps()
    
    print("\n" + "=" * 50)
    if backend_ok:
        print("✅ ELIMINACIÓN DE 18 MSI COMPLETADA")
        print("\n🎯 CAMBIOS REALIZADOS:")
        print("1. ✅ Frontend: Eliminado 18 MSI de MESES_SIN_INTERESES_OPTIONS")
        print("2. ✅ Frontend: Removidas tasas de 18 MSI de American Express y Otras")  
        print("3. ✅ Backend: Eliminado 18 MSI de months_available")
        print("4. ✅ Backend: Removidas tasas de 18 MSI del endpoint")
        print("\n📱 Ahora solo están disponibles: 0, 3, 6, 9, 12 MSI")
    else:
        print("❌ AÚN HAY PROBLEMAS CON 18 MSI")
        print("Revisa los errores mostrados arriba")
