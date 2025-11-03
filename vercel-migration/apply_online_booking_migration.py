#!/usr/bin/env python3
"""
Apply online booking migration to Supabase
"""

import os
import sys
from pathlib import Path

# Load .env.local
from dotenv import load_dotenv
load_dotenv('.env.local')

try:
    import psycopg2
except ImportError:
    print("❌ psycopg2-binary not installed")
    print("Installing...")
    os.system("pip install psycopg2-binary")
    import psycopg2

# Get connection string
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', '')
PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0]

# Construct Postgres connection string
DB_PASSWORD = input(f"Enter database password for project {PROJECT_REF}: ")
DB_CONNECTION = f"postgresql://postgres.{PROJECT_REF}:{DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

print(f"\n🔗 Connecting to Supabase project: {PROJECT_REF}")

# Read migration file
migration_file = Path('supabase/migrations/20251102_online_booking_system.sql')
if not migration_file.exists():
    print(f"❌ Migration file not found: {migration_file}")
    sys.exit(1)

migration_sql = migration_file.read_text(encoding='utf-8')

print(f"📄 Read migration file: {migration_file}")
print(f"📏 SQL length: {len(migration_sql)} characters")

try:
    # Connect
    conn = psycopg2.connect(DB_CONNECTION)
    conn.autocommit = False
    cursor = conn.cursor()
    
    print("✅ Connected to database")
    
    # Execute migration
    print("\n🚀 Executing migration...")
    cursor.execute(migration_sql)
    
    # Commit
    conn.commit()
    print("✅ Migration applied successfully!")
    
    # Verify new tables exist
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('booking_settings', 'public_bookings')
        ORDER BY table_name;
    """)
    
    tables = cursor.fetchall()
    print(f"\n📊 New tables created:")
    for table in tables:
        print(f"  ✅ {table[0]}")
    
    # Check booking_slug column
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name IN ('booking_slug', 'booking_enabled');
    """)
    
    columns = cursor.fetchall()
    print(f"\n📊 New columns in user_profiles:")
    for column in columns:
        print(f"  ✅ {column[0]}")
    
    cursor.close()
    conn.close()
    
    print("\n✨ Migration complete! Online booking system is ready.")
    
except psycopg2.Error as e:
    print(f"\n❌ Database error: {e}")
    if conn:
        conn.rollback()
        conn.close()
    sys.exit(1)
except Exception as e:
    print(f"\n❌ Unexpected error: {e}")
    if conn:
        conn.rollback()
        conn.close()
    sys.exit(1)
