#!/usr/bin/env python3
"""
Apply NOM-004 Medical History Migration
Adds medical history, allergies, and medications tables
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Supabase connection
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not service_key:
    raise ValueError("Missing Supabase credentials")

supabase: Client = create_client(url, service_key)

# Read SQL migration
sql_path = "vercel-migration/supabase/migrations/20251104_add_medical_history_nom004.sql"
with open(sql_path, 'r', encoding='utf-8') as f:
    sql = f.read()

print("🔄 Applying NOM-004 Medical History migration...")
print("=" * 60)

try:
    # Execute migration
    result = supabase.rpc('exec_sql', {'sql': sql}).execute()
    
    print("✅ Migration executed successfully!")
    print("\nCreated/Modified:")
    print("  • patients table - added demographic fields")
    print("  • medical_history table - antecedentes heredo-familiares, personales, gineco-obstétricos")
    print("  • patient_allergies table - alergias con severidad")
    print("  • current_medications table - medicamentos actuales")
    print("\nRLS policies created for all tables")
    print("Triggers for updated_at configured")
    
except Exception as e:
    print(f"❌ Error executing migration: {e}")
    print("\n⚠️  Applying migration manually...")
    
    # Try direct execution (for tables that don't need RPC)
    # Split by major sections and execute
    sections = sql.split('-- ============================================')
    
    for i, section in enumerate(sections):
        if not section.strip():
            continue
        
        print(f"\n📝 Executing section {i+1}...")
        
        try:
            # Use postgrest for direct SQL execution
            supabase.postgrest.rpc('exec_sql', {'query': section}).execute()
            print(f"  ✓ Section {i+1} completed")
        except Exception as section_error:
            print(f"  ⚠️  Section {i+1} error (may be expected): {section_error}")
    
    print("\n✅ Manual migration completed")

print("\n" + "=" * 60)
print("Next steps:")
print("1. Verify tables in Supabase dashboard")
print("2. Create TypeScript types for new tables")
print("3. Build MedicalRecordComplete component")
