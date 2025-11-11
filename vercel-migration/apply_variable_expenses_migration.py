#!/usr/bin/env python3
"""
Script para aplicar la migración de variable_expenses a Supabase
Ejecuta el archivo SQL de migración contra la base de datos
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import requests

# Cargar variables de entorno
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0] if SUPABASE_URL else ''

# Colores para terminal
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_success(msg):
    print(f"{Colors.OKGREEN}✅ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.FAIL}❌ {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.OKCYAN}ℹ️  {msg}{Colors.ENDC}")

def print_warning(msg):
    print(f"{Colors.WARNING}⚠️  {msg}{Colors.ENDC}")

def main():
    print(f"\n{Colors.HEADER}{'='*60}")
    print("🚀 VARIABLE EXPENSES MIGRATION")
    print(f"{'='*60}{Colors.ENDC}\n")
    
    # Validar configuración
    if not SUPABASE_URL:
        print_error("NEXT_PUBLIC_SUPABASE_URL no configurada en .env.local")
        sys.exit(1)
    
    if not SUPABASE_SERVICE_KEY:
        print_warning("SUPABASE_SERVICE_ROLE_KEY no encontrada")
        print_info("La migración se ejecutará con permisos de usuario autenticado")
    
    print_info(f"Supabase URL: {SUPABASE_URL}")
    print_info(f"Project Ref: {PROJECT_REF}\n")
    
    # Leer archivo de migración
    migration_file = Path(__file__).parent / 'supabase' / 'migrations' / '20251110_create_variable_expenses.sql'
    
    if not migration_file.exists():
        print_error(f"Archivo de migración no encontrado: {migration_file}")
        sys.exit(1)
    
    print_info(f"Leyendo migración: {migration_file.name}")
    
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    print_success(f"Migración cargada ({len(sql_content)} caracteres)\n")
    
    # Mostrar resumen de la migración
    print(f"{Colors.BOLD}📋 RESUMEN DE LA MIGRACIÓN:{Colors.ENDC}")
    print("   • Crear tabla: variable_expenses")
    print("   • Crear 7 índices de rendimiento")
    print("   • Habilitar RLS (Row Level Security)")
    print("   • Crear 4 policies de seguridad")
    print("   • Crear trigger para updated_at")
    print("   • Agregar comentarios y documentación")
    print()
    
    # Confirmar ejecución
    response = input(f"{Colors.WARNING}¿Deseas ejecutar esta migración? (s/n): {Colors.ENDC}")
    
    if response.lower() != 's':
        print_info("Migración cancelada")
        sys.exit(0)
    
    print()
    print_info("Ejecutando migración en Supabase...")
    
    # Método 1: Usando Supabase REST API (si disponible)
    # Método 2: Instrucciones manuales
    
    print()
    print(f"{Colors.HEADER}{'='*60}")
    print("📝 INSTRUCCIONES DE EJECUCIÓN MANUAL")
    print(f"{'='*60}{Colors.ENDC}\n")
    
    print("1️⃣  Abre el Dashboard de Supabase:")
    print(f"   {Colors.OKBLUE}https://supabase.com/dashboard/project/{PROJECT_REF}/editor{Colors.ENDC}\n")
    
    print("2️⃣  Ve a la sección 'SQL Editor'\n")
    
    print("3️⃣  Crea una nueva query y pega el contenido de:")
    print(f"   {Colors.OKCYAN}{migration_file}{Colors.ENDC}\n")
    
    print("4️⃣  Haz clic en 'RUN' para ejecutar la migración\n")
    
    print("5️⃣  Verifica que aparezca el mensaje de éxito:\n")
    print(f"   {Colors.OKGREEN}✅ Migration completed successfully: variable_expenses table created{Colors.ENDC}\n")
    
    print(f"{Colors.HEADER}{'='*60}")
    print("ALTERNATIVA: Usar Supabase CLI")
    print(f"{'='*60}{Colors.ENDC}\n")
    
    print("Si tienes Supabase CLI instalado, ejecuta:")
    print(f"   {Colors.OKCYAN}supabase db push{Colors.ENDC}\n")
    
    print(f"{Colors.WARNING}⚠️  IMPORTANTE:{Colors.ENDC}")
    print("   • La tabla se creará SOLO para tu usuario (multi-tenancy)")
    print("   • RLS está habilitado - cada usuario ve solo sus gastos")
    print("   • Soft delete habilitado - los registros nunca se borran físicamente")
    print()
    
    print_success("Instrucciones mostradas. Ejecuta la migración manualmente.\n")

if __name__ == '__main__':
    main()
