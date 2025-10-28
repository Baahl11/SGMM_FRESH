import requests

SUPABASE_URL = "https://sbwpqtrxhiuucwlbozet.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid3BxdHJ4aGl1dWN3bGJvemV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc1MDkwMCwiZXhwIjoyMDc0MzI2OTAwfQ.6qrtlq12xGkSXWXZeP5L7bEPNnhzHuEW1c2cvN5oGsE"

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

# Check if user_profiles exists and has your admin
print("1️⃣ Verificando user_profiles...")
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.86cbe61c-8829-41a2-aa29-81e11844f83e&select=*",
    headers=headers
)
print(f"Status: {response.status_code}")
print(f"Profile: {response.text}\n")

# Check if invitations table exists
print("2️⃣ Verificando tabla invitations...")
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/invitations?select=count",
    headers=headers
)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}\n")

# Try to query as your user (simulating the API call)
print("3️⃣ Simulando tu query como usuario autenticado...")
# Get a real session token first
print("Ve a DevTools en tu navegador:")
print("1. Abre Console")
print("2. Pega: localStorage.getItem('sb-sbwpqtrxhiuucwlbozet-auth-token')")
print("3. Copia el access_token que aparece")
print("4. Pégalo aquí y presiona Enter:")
user_token = input("> ")

if user_token and len(user_token) > 20:
    user_headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json",
    }
    
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/invitations?select=*",
        headers=user_headers
    )
    print(f"\nStatus: {response.status_code}")
    print(f"Response: {response.text}")
else:
    print("No ingresaste un token válido")
