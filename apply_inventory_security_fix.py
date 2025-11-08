"""
CRITICAL: Add user_id column to inventory tables
This fixes the security issue where all users were sharing inventory data
"""
import os
from supabase import create_client, Client

def apply_migration():
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ ERROR: Missing environment variables")
        print("   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return
    
    supabase: Client = create_client(url, key)
    
    print("🔥 CRITICAL SECURITY FIX: Adding user_id to inventory tables")
    print("=" * 70)
    
    # Read migration file
    with open("vercel-migration/supabase/migrations/006_add_user_id_to_inventory.sql", "r", encoding="utf-8") as f:
        migration_sql = f.read()
    
    print("\n📄 Migration SQL:")
    print(migration_sql)
    print("\n" + "=" * 70)
    
    response = input("\n⚠️  WARNING: This will modify the database structure.\n   Type 'YES' to continue: ")
    
    if response != "YES":
        print("❌ Migration cancelled")
        return
    
    print("\n🚀 Executing migration...")
    
    try:
        # Execute the migration using RPC or direct SQL
        # Note: Supabase Python client doesn't have direct SQL execution
        # You need to run this in Supabase SQL Editor or use psycopg2
        print("❌ ERROR: Cannot execute SQL directly with supabase-py")
        print("\n📋 INSTRUCTIONS:")
        print("1. Open Supabase Dashboard: https://supabase.com/dashboard")
        print("2. Go to SQL Editor")
        print("3. Copy the SQL from: vercel-migration/supabase/migrations/006_add_user_id_to_inventory.sql")
        print("4. Paste and run it")
        print("\n✅ After running the SQL, the inventory will be properly isolated per user")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    apply_migration()
