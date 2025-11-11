#!/usr/bin/env python3

"""
Script para corregir suscripciones en trial que tienen plan_tier incorrecto

Problema: Usuarios con trial de PRO pero tienen plan_tier='basico' en la BD
Resultado: Se les aplican límites de BÁSICO (2 doctores) en lugar de PRO (10 doctores)

Uso: python scripts/fix-trial-subs.py [email]
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

# Cargar variables de entorno desde vercel-migration/.env.local
env_path = Path(__file__).parent.parent / '.env.local'
load_dotenv(env_path)

PLAN_LIMITS = {
    'basico': {'max_doctors': 2, 'max_locations': 1},
    'pro': {'max_doctors': 10, 'max_locations': 5},
    'enterprise': {'max_doctors': 999, 'max_locations': 999}
}

def infer_plan_from_price_id(price_id):
    """Inferir el plan correcto desde el Stripe Price ID"""
    if not price_id:
        return 'basico'
    if 'pro' in price_id.lower():
        return 'pro'
    if 'enterprise' in price_id.lower():
        return 'enterprise'
    return 'basico'

def create_supabase_client() -> Client:
    """Crear cliente de Supabase con las credenciales del entorno"""
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not url or not key:
        print('❌ Error: Faltan credenciales de Supabase')
        print(f'NEXT_PUBLIC_SUPABASE_URL: {"✓" if url else "✗"}')
        print(f'SUPABASE_SERVICE_ROLE_KEY: {"✓" if key else "✗"}')
        sys.exit(1)
    
    return create_client(url, key)

def list_trial_users(supabase: Client):
    """Listar todos los usuarios en trial y detectar inconsistencias"""
    print('📋 Listando todos los usuarios en trial...\n')
    
    try:
        # Obtener todas las suscripciones en trial
        response = supabase.table('subscriptions')\
            .select('*')\
            .eq('status', 'trialing')\
            .order('created_at', desc=True)\
            .execute()
        
        subscriptions = response.data
        
        if not subscriptions:
            print('✓ No hay usuarios en trial actualmente')
            return
        
        print(f'Encontrados {len(subscriptions)} usuarios en trial:\n')
        
        # Para cada suscripción, obtener el email del usuario
        for sub in subscriptions:
            user_id = sub['user_id']
            
            # Obtener usuario desde auth.users
            try:
                user_response = supabase.auth.admin.get_user_by_id(user_id)
                email = user_response.user.email if user_response and user_response.user else 'Email no disponible'
            except Exception as e:
                email = f'Error obteniendo email: {str(e)}'
            
            inferred_plan = infer_plan_from_price_id(sub.get('stripe_price_id'))
            expected_limits = PLAN_LIMITS[inferred_plan]
            has_issue = (sub['plan_tier'] != inferred_plan or 
                        sub['max_doctors'] != expected_limits['max_doctors'])
            
            icon = '⚠️ ' if has_issue else '✓ '
            print(f'{icon} {email}')
            print(f'   Plan actual: {sub["plan_tier"]} ({sub["max_doctors"]} doctores, {sub["max_locations"]} ubicaciones)')
            print(f'   Stripe Price: {sub.get("stripe_price_id", "N/A")}')
            print(f'   Plan inferido: {inferred_plan} (debería tener {expected_limits["max_doctors"]} doctores)')
            print(f'   Trial termina: {sub.get("trial_end", "N/A")}')
            if has_issue:
                print('   🔧 NECESITA CORRECCIÓN')
            print()
            
    except Exception as e:
        print(f'❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()

def fix_user_trial_plan(supabase: Client, email: str):
    """Corregir la suscripción de un usuario específico"""
    print(f'🔍 Buscando usuario: {email}\n')
    
    try:
        # Buscar usuario por email
        user_response = supabase.auth.admin.list_users()
        user = None
        
        if user_response and hasattr(user_response, 'users'):
            for u in user_response.users:
                if u.email == email:
                    user = u
                    break
        
        if not user:
            print('❌ No se encontró usuario con ese email')
            return
        
        # Buscar suscripción en trial
        response = supabase.table('subscriptions')\
            .select('*')\
            .eq('user_id', user.id)\
            .eq('status', 'trialing')\
            .execute()
        
        if not response.data:
            print('❌ No se encontró suscripción en trial para este usuario')
            return
        
        sub = response.data[0]
        inferred_plan = infer_plan_from_price_id(sub.get('stripe_price_id'))
        expected_limits = PLAN_LIMITS[inferred_plan]
        
        print('📊 Situación actual:')
        print(f'   Email: {email}')
        print(f'   Plan actual: {sub["plan_tier"]}')
        print(f'   Límites actuales: {sub["max_doctors"]} doctores, {sub["max_locations"]} ubicaciones')
        print(f'   Stripe Price ID: {sub.get("stripe_price_id", "N/A")}')
        print()
        print('🎯 Plan correcto inferido:')
        print(f'   Plan: {inferred_plan}')
        print(f'   Límites correctos: {expected_limits["max_doctors"]} doctores, {expected_limits["max_locations"]} ubicaciones')
        print()
        
        if (sub['plan_tier'] == inferred_plan and 
            sub['max_doctors'] == expected_limits['max_doctors'] and
            sub['max_locations'] == expected_limits['max_locations']):
            print('✓ El usuario ya tiene el plan correcto. No se necesitan cambios.')
            return
        
        # Pedir confirmación
        answer = input('¿Actualizar suscripción? (si/no): ')
        
        if answer.lower() not in ['si', 's', 'yes', 'y']:
            print('❌ Operación cancelada')
            return
        
        # Actualizar suscripción
        from datetime import datetime
        update_response = supabase.table('subscriptions')\
            .update({
                'plan_tier': inferred_plan,
                'max_doctors': expected_limits['max_doctors'],
                'max_locations': expected_limits['max_locations'],
                'updated_at': datetime.utcnow().isoformat()
            })\
            .eq('id', sub['id'])\
            .execute()
        
        if update_response.data:
            updated_sub = update_response.data[0]
            print('\n✅ Suscripción actualizada exitosamente:')
            print(f'   Plan: {updated_sub["plan_tier"]}')
            print(f'   Límites: {updated_sub["max_doctors"]} doctores, {updated_sub["max_locations"]} ubicaciones')
        else:
            print('❌ Error al actualizar la suscripción')
            
    except Exception as e:
        print(f'❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()

def main():
    """Función principal"""
    supabase = create_supabase_client()
    
    if len(sys.argv) > 1:
        email = sys.argv[1]
        fix_user_trial_plan(supabase, email)
    else:
        list_trial_users(supabase)

if __name__ == '__main__':
    main()
