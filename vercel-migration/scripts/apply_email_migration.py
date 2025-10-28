#!/usr/bin/env python3
"""
Apply email tracking migration to invoices table
Adds emailed_at timestamp field
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Initialize Supabase client
url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    raise ValueError('Missing Supabase credentials in .env.local')

supabase: Client = create_client(url, key)

def apply_migration():
    """Apply the emailed_at column migration"""
    
    migration_sql = """
    -- Add emailed_at timestamp to track when invoices were sent by email
    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ;

    COMMENT ON COLUMN invoices.emailed_at IS 'Timestamp when the invoice was sent by email';
    """
    
    print("Applying migration: Add emailed_at to invoices table...")
    
    try:
        # Execute migration SQL
        result = supabase.rpc('exec_sql', {'sql': migration_sql}).execute()
        print("✅ Migration applied successfully!")
        print(f"Result: {result}")
        
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        print("\nPlease apply this migration manually in Supabase SQL Editor:")
        print(migration_sql)

if __name__ == '__main__':
    apply_migration()
