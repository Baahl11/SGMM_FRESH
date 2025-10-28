import requests

SUPABASE_URL = "https://sbwpqtrxhiuucwlbozet.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid3BxdHJ4aGl1dWN3bGJvemV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc1MDkwMCwiZXhwIjoyMDc0MzI2OTAwfQ.6qrtlq12xGkSXWXZeP5L7bEPNnhzHuEW1c2cvN5oGsE"

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

# Read the invitations migration
with open('supabase/migrations/20250120_invitations_system.sql', 'r', encoding='utf-8') as f:
    invitations_sql = f.read()

# Read the notifications migration
with open('supabase/migrations/20250120_notifications_system.sql', 'r', encoding='utf-8') as f:
    notifications_sql = f.read()

print("🔨 Aplicando migración de invitations...")
response = requests.post(
    f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
    headers=headers,
    json={"query": invitations_sql}
)
print(f"Status: {response.status_code}")
if response.status_code != 200:
    print(f"Error: {response.text}")
else:
    print("✅ Invitations migration aplicada")

print("\n🔨 Aplicando migración de notifications...")
response = requests.post(
    f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
    headers=headers,
    json={"query": notifications_sql}
)
print(f"Status: {response.status_code}")
if response.status_code != 200:
    print(f"Error: {response.text}")
else:
    print("✅ Notifications migration aplicada")

print("\n✅ LISTO! Ahora:")
print("1. Ve a https://agendamedpro.com")
print("2. CIERRA SESIÓN (importante)")
print("3. INICIA SESIÓN de nuevo")
print("4. Ve a /admin/invitations")
