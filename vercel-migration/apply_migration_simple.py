import sys
import requests

SUPABASE_URL = "https://sbwpqtrxhiuucwlbozet.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid3BxdHJ4aGl1dWN3bGJvemV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc1MDkwMCwiZXhwIjoyMDc0MzI2OTAwfQ.6qrtlq12xGkSXWXZeP5L7bEPNnhzHuEW1c2cvN5oGsE"

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

if len(sys.argv) < 2:
    print("Usage: py apply_migration_simple.py <migration_file.sql>")
    sys.exit(1)

migration_file = sys.argv[1]

print(f"🔨 Aplicando migración: {migration_file}")

# Read the migration file
with open(migration_file, 'r', encoding='utf-8') as f:
    sql_content = f.read()

# Apply migration
response = requests.post(
    f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
    headers=headers,
    json={"query": sql_content}
)

print(f"Status: {response.status_code}")
if response.status_code != 200:
    print(f"❌ Error: {response.text}")
    sys.exit(1)
else:
    print(f"✅ Migración aplicada exitosamente: {migration_file}")
