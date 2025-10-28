import os
import requests

SUPABASE_URL = "https://sbwpqtrxhiuucwlbozet.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid3BxdHJ4aGl1dWN3bGJvemV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc1MDkwMCwiZXhwIjoyMDc0MzI2OTAwfQ.6qrtlq12xGkSXWXZeP5L7bEPNnhzHuEW1c2cvN5oGsE"

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# 1. Get all users
print("📋 Obteniendo usuarios...")
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/auth.users",
    headers=headers
)
print(f"Status: {response.status_code}")
print(f"Users: {response.text[:500]}")

# 2. Execute SQL to create admin profile
print("\n🔨 Creando perfil admin...")
sql = """
INSERT INTO user_profiles (user_id, name, email, role, plan_type)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', email),
  email,
  'admin',
  'premium'
FROM auth.users
LIMIT 1
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';
"""

# Try with RPC
response = requests.post(
    f"{SUPABASE_URL}/rest/v1/rpc/exec",
    headers=headers,
    json={"query": sql}
)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

# 3. Verify
print("\n✅ Verificando user_profiles...")
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/user_profiles?select=*",
    headers=headers
)
print(f"Status: {response.status_code}")
print(f"Profiles: {response.text}")
