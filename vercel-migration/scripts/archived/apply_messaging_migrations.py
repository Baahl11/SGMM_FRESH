"""
Apply SQL migrations directly to Supabase using psycopg2
"""
import sys
import os
from supabase import create_client

# Supabase connection details
SUPABASE_URL = "https://sbwpqtrxhiuucwlbozet.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid3BxdHJ4aGl1dWN3bGJvemV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc1MDkwMCwiZXhwIjoyMDc0MzI2OTAwfQ.6qrtlq12xGkSXWXZeP5L7bEPNnhzHuEW1c2cvN5oGsE"

def apply_messaging_migrations():
    """Apply messaging config migrations"""
    supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    
    print("🔨 Applying messaging config migrations...")
    
    # First, check if messaging_config table exists
    try:
        result = supabase.table('messaging_config').select('id').limit(1).execute()
        print("✅ messaging_config table already exists")
        table_exists = True
    except Exception as e:
        print(f"⚠️  messaging_config table doesn't exist yet: {e}")
        table_exists = False
    
    if not table_exists:
        print("❌ Cannot apply personalization migration without base table")
        print("💡 The base messaging_config table needs to be created first")
        print("   Please run: supabase migration up (in Supabase Dashboard → SQL Editor)")
        return False
    
    # Now add personalization fields
    print("🔧 Adding personalization fields...")
    
    # We'll use raw SQL through the RPC if available, or manual INSERT
    # For now, let's just verify the structure
    try:
        # Try to query with new fields
        result = supabase.table('messaging_config').select('doctor_name, clinic_name').limit(1).execute()
        print("✅ Personalization fields already exist")
        return True
    except Exception as e:
        print(f"⚠️  Personalization fields don't exist: {e}")
        print("❌ Cannot add columns via Supabase client")
        print("💡 Please apply this migration manually in Supabase Dashboard → SQL Editor:")
        print()
        print("=" * 80)
        with open('supabase/migrations/20251113_add_messaging_personalization.sql', 'r', encoding='utf-8') as f:
            print(f.read())
        print("=" * 80)
        return False

if __name__ == '__main__':
    success = apply_messaging_migrations()
    sys.exit(0 if success else 1)
