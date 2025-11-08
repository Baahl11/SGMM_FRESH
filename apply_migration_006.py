#!/usr/bin/env python3
"""
Apply migration 006: Add user_sms_credentials table
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

def apply_migration():
    """Apply the SMS credentials migration"""
    
    db_config = {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'database': os.getenv('POSTGRES_DATABASE', 'agendamedpro'),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'admin')
    }
    
    try:
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(**db_config)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("📋 Reading migration file...")
        migration_path = 'vercel-migration/migrations/006_add_user_sms_credentials.sql'
        
        with open(migration_path, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        print("🚀 Applying migration...")
        cursor.execute(sql)
        
        print("✅ Migration 006 applied successfully!")
        
        # Verify table was created
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_sms_credentials'
        """)
        
        if cursor.fetchone():
            print("✅ Table 'user_sms_credentials' created successfully")
            
            # Show table structure
            cursor.execute("""
                SELECT column_name, data_type, character_maximum_length, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'user_sms_credentials'
                ORDER BY ordinal_position
            """)
            
            print("\n📊 Table structure:")
            print("-" * 80)
            for row in cursor.fetchall():
                print(f"  {row[0]:25} {row[1]:15} {str(row[2] or ''):10} {'NULL' if row[3] == 'YES' else 'NOT NULL'}")
            print("-" * 80)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        raise

if __name__ == '__main__':
    apply_migration()
