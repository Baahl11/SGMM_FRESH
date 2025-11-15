"""
Instructions for applying messaging config migrations manually
"""

print("=" * 80)
print("📋 MESSAGING CONFIG MIGRATIONS - MANUAL APPLICATION REQUIRED")
print("=" * 80)
print()
print("The WhatsApp Business config page requires these database tables/columns.")
print("Please apply these migrations in Supabase Dashboard → SQL Editor:")
print()
print("🔗 https://supabase.com/dashboard/project/sbwpqtrxhiuucwlbozet/sql")
print()
print("=" * 80)
print("STEP 1: Create base messaging_config table")
print("=" * 80)
print()

with open('supabase/migrations/20251027_messaging_config.sql', 'r', encoding='utf-8') as f:
    print(f.read())

print()
print("=" * 80)
print("STEP 2: Add personalization fields")
print("=" * 80)
print()

with open('supabase/migrations/20251113_add_messaging_personalization.sql', 'r', encoding='utf-8') as f:
    print(f.read())

print()
print("=" * 80)
print("✅ After applying both migrations, the WhatsApp config page will work!")
print("=" * 80)
