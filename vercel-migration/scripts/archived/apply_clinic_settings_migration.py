"""
Apply clinic_settings migration for PDF customization
Run: python apply_clinic_settings_migration.py
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def apply_migration():
    """Apply the clinic_settings migration"""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Error: Missing Supabase credentials")
        print("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
        return
    
    print("🔗 Connecting to Supabase...")
    supabase: Client = create_client(url, key)
    
    # Read migration file
    migration_path = os.path.join(
        os.path.dirname(__file__),
        'supabase',
        'migrations',
        '20250120_clinic_settings.sql'
    )
    
    print(f"📂 Reading migration file: {migration_path}")
    with open(migration_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print("🚀 Applying migration...")
    try:
        # Execute SQL using Supabase RPC or direct query
        # Note: Supabase Python client doesn't have direct SQL execution
        # We'll need to run this through psql or Supabase dashboard
        
        print("\n" + "="*60)
        print("⚠️  MANUAL STEP REQUIRED:")
        print("="*60)
        print("\nOption 1: Run via Supabase Dashboard")
        print("   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql")
        print("   2. Copy-paste the SQL from: supabase/migrations/20250120_clinic_settings.sql")
        print("   3. Click 'Run'")
        print("\nOption 2: Run via psql command line")
        print(f"   psql $DATABASE_URL -f {migration_path}")
        print("\nOption 3: Use Supabase CLI (if installed)")
        print("   supabase db push")
        print("="*60)
        
        # Check if table exists (as verification after manual run)
        result = supabase.table('clinic_settings').select('*').limit(1).execute()
        print("\n✅ SUCCESS: clinic_settings table exists and is accessible!")
        print(f"   Found {len(result.data)} existing records")
        
    except Exception as e:
        error_msg = str(e)
        if 'relation "clinic_settings" does not exist' in error_msg:
            print("\n⚠️  Table not created yet. Please run the SQL manually (see above).")
        else:
            print(f"\n❌ Error: {error_msg}")
            print("\n💡 This likely means the table hasn't been created yet.")
            print("   Please run the SQL migration manually (see options above).")

def create_storage_bucket():
    """Create Supabase Storage bucket for clinic logos"""
    print("\n" + "="*60)
    print("📦 STORAGE BUCKET SETUP:")
    print("="*60)
    print("\nManual steps to create storage bucket:")
    print("\n1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets")
    print("2. Click 'Create bucket'")
    print("3. Settings:")
    print("   - Name: clinic-logos")
    print("   - Public: YES (so PDFs can reference the images)")
    print("   - File size limit: 5 MB")
    print("   - Allowed MIME types: image/png, image/jpeg, image/svg+xml")
    print("\n4. Set up RLS policies:")
    print("   - Allow authenticated users to upload to their own folder")
    print("   - Allow public read access")
    print("\nExample RLS policy SQL:")
    print("""
-- Allow authenticated users to upload
CREATE POLICY "Users can upload their own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'clinic-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'clinic-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'clinic-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'clinic-logos');
    """)
    print("="*60)

if __name__ == "__main__":
    print("🏥 AgendaMedPro - Clinic Settings Migration")
    print("=" * 60)
    apply_migration()
    create_storage_bucket()
    print("\n✨ Migration instructions complete!")
    print("   After running the SQL manually, this table will be ready to use.")
