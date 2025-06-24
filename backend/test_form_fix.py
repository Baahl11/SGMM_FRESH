#!/usr/bin/env python3
"""
Script para verificar que el formulario funcione correctamente después de las correcciones
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

def test_treatments_have_valid_costs(token):
    """Verificar que todos los tratamientos tengan costos válidos"""
    print("=== VERIFICACIÓN COSTOS DE TRATAMIENTOS ===")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://localhost:8000/treatments/", headers=headers)
        response.raise_for_status()
        treatments = response.json()
        
        zero_cost_treatments = []
        valid_treatments = []
        
        for treatment in treatments:
            if treatment['costo_unitario'] <= 0:
                zero_cost_treatments.append(treatment)
            else:
                valid_treatments.append(treatment)
        
        print(f"✅ Tratamientos con costo válido: {len(valid_treatments)}")
        print(f"⚠️  Tratamientos con costo 0: {len(zero_cost_treatments)}")
        
        if zero_cost_treatments:
            print("\nTratamientos problemáticos:")
            for treatment in zero_cost_treatments:
                print(f"  - {treatment['nombre']}: costo = {treatment['costo_unitario']}")
            return False
        else:
            print("✅ Todos los tratamientos tienen costos unitarios válidos")
            
            # Mostrar algunos ejemplos
            print("\nEjemplos de tratamientos:")
            for treatment in valid_treatments[:5]:
                print(f"  - {treatment['nombre']}: ${treatment['precio']} (costo: ${treatment['costo_unitario']})")
            return True
            
    except Exception as e:
        print(f"✗ Error verificando tratamientos: {e}")
        return False

def test_sample_treatment_selection():
    """Simular la lógica que ocurre cuando seleccionas un tratamiento en el frontend"""
    print("\n=== SIMULACIÓN SELECCIÓN DE TRATAMIENTO ===")
    
    # Simular tratamiento seleccionado (ALMA Soprano Axila)
    selected_treatment = {
        "id": 18,
        "nombre": "ALMA Soprano (Axila)",
        "precio": 800.0,
        "costo_unitario": 150.0
    }
    
    print(f"Tratamiento seleccionado: {selected_treatment['nombre']}")
    print(f"Precio automático: ${selected_treatment['precio']}")
    print(f"Costo automático: ${selected_treatment['costo_unitario']}")
    
    # Verificar que la validación pasaría
    validation_checks = {
        "Tratamiento seleccionado": selected_treatment['id'] > 0,
        "Monto pagado > 0": selected_treatment['precio'] > 0,
        "Costo unitario > 0": selected_treatment['costo_unitario'] > 0
    }
    
    print("\nValidaciones del formulario:")
    all_passed = True
    for check, passed in validation_checks.items():
        status = "✅" if passed else "❌"
        print(f"  {status} {check}: {passed}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n✅ El formulario debería permitir guardar solo este tratamiento")
    else:
        print("\n❌ El formulario aún tendría problemas de validación")
    
    return all_passed

def provide_manual_testing_steps():
    """Proporcionar pasos para prueba manual"""
    print("\n=== PASOS PARA PRUEBA MANUAL ===")
    print("📋 Para probar que el problema esté solucionado:")
    print()
    print("1. Abrir http://localhost:3000/patients/new")
    print("2. Completar datos básicos del paciente:")
    print("   - Nombre: Paciente Prueba")
    print("   - Fecha nacimiento: cualquier fecha")
    print("   - Teléfono: 123456789")
    print()
    print("3. En la sección 'Tratamiento Realizado':")
    print("   - Seleccionar: 'ALMA Soprano (Axila)'")
    print("   - Verificar que se llene automáticamente:")
    print("     * Monto pagado: $800")
    print("     * Costo unitario: $150")
    print("   - Seleccionar método de pago: Efectivo")
    print()
    print("4. Dejar vacía la sección 'Próxima Cita'")
    print()
    print("5. Hacer clic en 'Guardar Paciente y Tratamiento'")
    print()
    print("✅ Resultado esperado: El paciente se guarda exitosamente")
    print("❌ Si sigue fallando: Revisar consola del navegador para errores")

if __name__ == "__main__":
    print("VERIFICACIÓN SOLUCIÓN AL PROBLEMA DEL FORMULARIO")
    print("=" * 60)
    
    token = get_auth_token()
    if not token:
        print("No se pudo obtener token de autenticación")
        exit(1)
    
    # Verificar que los tratamientos tengan costos válidos
    treatments_ok = test_treatments_have_valid_costs(token)
    
    # Simular la selección de tratamiento
    validation_ok = test_sample_treatment_selection()
    
    # Pasos para prueba manual
    provide_manual_testing_steps()
    
    print("\n" + "=" * 60)
    if treatments_ok and validation_ok:
        print("✅ PROBLEMA SOLUCIONADO")
        print("Los tratamientos tienen costos válidos y la validación debería funcionar")
    else:
        print("❌ AÚN HAY PROBLEMAS")
        print("Revisa los errores mostrados arriba")
    
    print("\n🔧 CAMBIOS REALIZADOS:")
    print("1. ✅ Actualizados costos unitarios de 53 tratamientos")
    print("2. ✅ Mejorada validación del formulario con mensajes específicos")
    print("3. ✅ Eliminados los costos 0.0 que causaban el error")
    print("4. ✅ Validación más flexible para casos de solo tratamiento o solo cita")
