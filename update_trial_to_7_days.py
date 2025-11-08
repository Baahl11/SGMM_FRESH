"""
Script para actualizar el período de prueba de 15 a 7 días
Actualiza usuarios existentes con trial activo
"""

import os
from supabase import create_client, Client
from datetime import datetime, timedelta

# Configurar cliente de Supabase
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY")
    print("💡 Cópialas de tu archivo .env.local")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def update_trial_periods():
    """Actualiza el período de prueba a 7 días para usuarios con trial activo"""
    
    print("🔍 Buscando usuarios con status 'trialing'...")
    
    # Obtener todos los usuarios con trial activo
    response = supabase.table('subscriptions')\
        .select('*')\
        .eq('status', 'trialing')\
        .execute()
    
    subscriptions = response.data
    
    if not subscriptions:
        print("✅ No hay usuarios con trial activo")
        return
    
    print(f"📊 Encontrados {len(subscriptions)} usuarios con trial activo\n")
    
    updated_count = 0
    
    for sub in subscriptions:
        user_id = sub['user_id']
        trial_start = sub.get('trial_start')
        
        if not trial_start:
            # Si no tiene trial_start, usar la fecha de creación
            trial_start = sub.get('created_at', datetime.utcnow().isoformat())
        
        # Calcular nuevo trial_end (7 días desde trial_start)
        trial_start_dt = datetime.fromisoformat(trial_start.replace('Z', '+00:00'))
        new_trial_end = trial_start_dt + timedelta(days=7)
        
        print(f"👤 Usuario: {user_id}")
        print(f"   Trial Start: {trial_start}")
        print(f"   Nuevo Trial End: {new_trial_end.isoformat()}")
        
        # Actualizar la suscripción
        try:
            supabase.table('subscriptions')\
                .update({
                    'trial_start': trial_start,
                    'trial_end': new_trial_end.isoformat()
                })\
                .eq('user_id', user_id)\
                .execute()
            
            updated_count += 1
            print(f"   ✅ Actualizado correctamente\n")
            
        except Exception as e:
            print(f"   ❌ Error al actualizar: {e}\n")
    
    print(f"\n🎉 Proceso completado: {updated_count}/{len(subscriptions)} usuarios actualizados")

if __name__ == "__main__":
    print("=" * 60)
    print("  ACTUALIZAR PERÍODO DE PRUEBA A 7 DÍAS")
    print("=" * 60)
    print()
    
    confirm = input("¿Quieres continuar? (s/n): ")
    
    if confirm.lower() == 's':
        update_trial_periods()
    else:
        print("❌ Operación cancelada")
