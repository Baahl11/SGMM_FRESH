#!/usr/bin/env python3
"""
Script para verificar que la opción de 18 meses sin intereses ha sido eliminada completamente
del frontend del sistema SGMM.
"""

import os
import re
import json

def buscar_18_meses_en_archivo(archivo_path):
    """Busca referencias a 18 meses en un archivo específico."""
    referencias = []
    try:
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
            lineas = contenido.split('\n')
            
            for i, linea in enumerate(lineas, 1):
                # Buscar patrones relacionados con 18 meses
                patrones = [
                    r'18.*meses',
                    r'meses.*18', 
                    r'18.*MSI',
                    r'MSI.*18',
                    r'SelectItem.*value="18"',
                    r'value.*18.*meses'
                ]
                
                for patron in patrones:
                    if re.search(patron, linea, re.IGNORECASE):
                        referencias.append({
                            'archivo': archivo_path,
                            'linea': i,
                            'contenido': linea.strip(),
                            'patron': patron
                        })
    except Exception as e:
        print(f"Error leyendo {archivo_path}: {e}")
    
    return referencias

def verificar_eliminacion_18_msi():
    """Verifica que la opción de 18 MSI ha sido eliminada del frontend."""
    print("🔍 Verificando eliminación de 18 meses sin intereses del frontend...")
      # Directorios a verificar
    directorios_frontend = [
        '../src/components/patients',
        '../src/app/patients', 
        '../src/lib'
    ]
    
    total_referencias = []
    
    for directorio in directorios_frontend:
        if os.path.exists(directorio):
            for root, dirs, files in os.walk(directorio):
                for file in files:
                    if file.endswith(('.tsx', '.ts', '.js', '.jsx')):
                        archivo_path = os.path.join(root, file)
                        referencias = buscar_18_meses_en_archivo(archivo_path)
                        total_referencias.extend(referencias)
    
    # Mostrar resultados
    if total_referencias:
        print(f"❌ Se encontraron {len(total_referencias)} referencias a 18 meses:")
        for ref in total_referencias:
            print(f"  📁 {ref['archivo']} (línea {ref['linea']})")
            print(f"     📄 {ref['contenido']}")
            print(f"     🔍 Patrón: {ref['patron']}")
            print()
        return False
    else:
        print("✅ No se encontraron referencias a 18 meses sin intereses en el frontend")
        return True

def verificar_opciones_disponibles():
    """Verifica las opciones de MSI disponibles en el archivo payment.ts."""
    print("\n🔍 Verificando opciones de MSI disponibles...")
    
    payment_file = '../src/lib/payment.ts'
    if os.path.exists(payment_file):
        with open(payment_file, 'r', encoding='utf-8') as f:
            contenido = f.read()
            
            # Buscar MESES_SIN_INTERESES_OPTIONS
            match = re.search(r'export const MESES_SIN_INTERESES_OPTIONS = \[(.*?)\];', contenido, re.DOTALL)
            if match:
                opciones_text = match.group(1)
                print("📋 Opciones de MSI encontradas:")
                
                # Extraer opciones
                opciones = re.findall(r'value:\s*(\d+),\s*label:\s*[\'"]([^\'"]+)[\'"]', opciones_text)
                for valor, etiqueta in opciones:
                    print(f"  • {valor} meses: {etiqueta}")
                
                # Verificar que no incluya 18
                valores = [int(valor) for valor, _ in opciones]
                if 18 in valores:
                    print("❌ ERROR: Se encontró la opción de 18 meses en MESES_SIN_INTERESES_OPTIONS")
                    return False
                else:
                    print("✅ La opción de 18 meses no está en MESES_SIN_INTERESES_OPTIONS")
                    return True
            else:
                print("❌ No se pudo encontrar MESES_SIN_INTERESES_OPTIONS")
                return False
    else:
        print(f"❌ No se encontró el archivo {payment_file}")
        return False

def main():
    """Función principal."""
    print("🚀 Iniciando verificación de eliminación de 18 MSI...")
    print("=" * 60)
    
    # Ya estamos en el directorio backend, no necesitamos cambiar
    
    verificacion1 = verificar_eliminacion_18_msi()
    verificacion2 = verificar_opciones_disponibles()
    
    print("\n" + "=" * 60)
    
    if verificacion1 and verificacion2:
        print("🎉 VERIFICACIÓN EXITOSA: La opción de 18 meses sin intereses ha sido eliminada completamente")
        print("\n📋 Resumen:")
        print("  ✅ No hay referencias a 18 meses en componentes de pacientes")
        print("  ✅ MESES_SIN_INTERESES_OPTIONS no incluye 18 meses")
        print("  ✅ El formulario de edición de pacientes ya no muestra 18 MSI")
        return True
    else:
        print("❌ VERIFICACIÓN FALLIDA: Aún existen referencias a 18 meses sin intereses")
        return False

if __name__ == "__main__":
    main()
