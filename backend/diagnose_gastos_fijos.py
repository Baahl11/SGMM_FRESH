#!/usr/bin/env python3
"""
Script para diagnosticar problemas con gastos fijos en dashboard y reportes
"""

import requests
import json
from datetime import datetime, date

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

def test_gastos_fijos_api(token):
    """Verificar API de gastos fijos"""
    print("=== VERIFICACIÓN API GASTOS FIJOS ===")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://localhost:8000/gastos-fijos/", headers=headers)
        response.raise_for_status()
        gastos = response.json()
        
        print(f"✓ Total gastos fijos encontrados: {len(gastos)}")
        
        total_mensual = 0
        total_diario = 0
        
        for gasto in gastos:
            print(f"- {gasto['concepto']}: ${gasto['monto']:,.2f} ({gasto['frecuencia']})")
            print(f"  Fecha inicio: {gasto['fecha_inicio']}, Activo: {gasto['activo']}")
            
            if gasto['activo']:
                if gasto['frecuencia'] == 'mensual':
                    total_mensual += gasto['monto']
                    total_diario += gasto['monto'] / 30
                elif gasto['frecuencia'] == 'anual':
                    total_mensual += gasto['monto'] / 12
                    total_diario += gasto['monto'] / 365
                elif gasto['frecuencia'] == 'trimestral':
                    total_mensual += gasto['monto'] / 3
                    total_diario += gasto['monto'] / 90
        
        print(f"\n📊 TOTALES CALCULADOS:")
        print(f"Total mensual: ${total_mensual:,.2f}")
        print(f"Total diario: ${total_diario:,.2f}")
        print(f"Total anual: ${total_mensual * 12:,.2f}")
        
        return gastos
        
    except Exception as e:
        print(f"✗ Error verificando gastos fijos: {e}")
        return []

def test_records_api(token):
    """Verificar API de registros para comparar con gastos"""
    print("\n=== VERIFICACIÓN REGISTROS ===")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://localhost:8000/records/with-names/", headers=headers)
        response.raise_for_status()
        records = response.json()
        
        print(f"✓ Total registros encontrados: {len(records)}")
        
        # Calcular estadísticas de registros del mes actual
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        monthly_revenue = 0
        monthly_costs = 0
        monthly_profit = 0
        monthly_records = 0
        
        for record in records:
            if record.get('monto_pagado', 0) > 0:  # Solo registros con pago real
                record_date = datetime.fromisoformat(record['fecha'].replace('Z', '+00:00'))
                
                if record_date.month == current_month and record_date.year == current_year:
                    monthly_records += 1
                    monthly_revenue += record.get('monto_pagado', 0)
                    monthly_costs += record.get('costo_unitario', 0)
                      # Calcular ganancia neta (considerando comisiones)
                    commission = record.get('comision_monto', 0) or 0
                    net_profit = record.get('monto_pagado', 0) - record.get('costo_unitario', 0) - commission
                    monthly_profit += net_profit
        
        print(f"\n📊 ESTADÍSTICAS DEL MES ACTUAL:")
        print(f"Registros con pago: {monthly_records}")
        print(f"Ingresos: ${monthly_revenue:,.2f}")
        print(f"Costos variables: ${monthly_costs:,.2f}")
        print(f"Ganancia bruta: ${monthly_profit:,.2f}")
        
        return {
            'monthly_revenue': monthly_revenue,
            'monthly_costs': monthly_costs,
            'monthly_profit': monthly_profit,
            'monthly_records': monthly_records
        }
        
    except Exception as e:
        print(f"✗ Error verificando registros: {e}")
        return {}

def calculate_net_profit_with_fixed_costs(monthly_stats, gastos_fijos):
    """Calcular ganancia neta considerando gastos fijos"""
    print("\n=== CÁLCULO GANANCIA NETA CON GASTOS FIJOS ===")
    
    # Calcular gastos fijos mensuales
    monthly_fixed_costs = 0
    for gasto in gastos_fijos:
        if gasto['activo']:
            if gasto['frecuencia'] == 'mensual':
                monthly_fixed_costs += gasto['monto']
            elif gasto['frecuencia'] == 'anual':
                monthly_fixed_costs += gasto['monto'] / 12
            elif gasto['frecuencia'] == 'trimestral':
                monthly_fixed_costs += gasto['monto'] / 3
    
    gross_profit = monthly_stats.get('monthly_profit', 0)
    net_profit = gross_profit - monthly_fixed_costs
    
    print(f"Ganancia bruta (sin gastos fijos): ${gross_profit:,.2f}")
    print(f"Gastos fijos mensuales: ${monthly_fixed_costs:,.2f}")
    print(f"Ganancia neta (con gastos fijos): ${net_profit:,.2f}")
    
    if gross_profit > 0:
        margin_percentage = (net_profit / monthly_stats.get('monthly_revenue', 1)) * 100
        print(f"Margen de ganancia neta: {margin_percentage:.2f}%")
    
    return {
        'gross_profit': gross_profit,
        'fixed_costs': monthly_fixed_costs,
        'net_profit': net_profit
    }

def test_dashboard_missing_gastos():
    """Verificar si el dashboard incluye gastos fijos"""
    print("\n=== DIAGNÓSTICO DASHBOARD ===")
    print("El dashboard actualmente NO incluye gastos fijos en sus cálculos.")
    print("Las estadísticas mostradas son solo ganancia bruta.")
    print("\n🔧 ACCIONES REQUERIDAS:")
    print("1. Agregar endpoint /dashboard/stats/ que incluya gastos fijos")
    print("2. Modificar el dashboard para mostrar:")
    print("   - Ganancia bruta (actual)")
    print("   - Gastos fijos mensuales")
    print("   - Ganancia neta (bruta - gastos fijos)")
    print("   - Margen de ganancia neta")

if __name__ == "__main__":
    print("DIAGNÓSTICO EXHAUSTIVO DE GASTOS FIJOS")
    print("=" * 60)
    
    token = get_auth_token()
    if not token:
        print("No se pudo obtener token de autenticación")
        exit(1)
    
    gastos_fijos = test_gastos_fijos_api(token)
    monthly_stats = test_records_api(token)
    
    if gastos_fijos and monthly_stats:
        net_profit_data = calculate_net_profit_with_fixed_costs(monthly_stats, gastos_fijos)
    
    test_dashboard_missing_gastos()
    
    print("\n" + "=" * 60)
    print("DIAGNÓSTICO COMPLETADO")
