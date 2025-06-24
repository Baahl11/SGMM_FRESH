import requests

# Test backend authentication and patient retrieval
BASE_URL = 'http://localhost:8000'

# Login to get token
login_data = {
    'username': 'admin@test.com',
    'password': 'admin123'
}

print("🔐 Testing backend authentication...")
login_response = requests.post(f'{BASE_URL}/auth/login', data=login_data)
print(f"Login status: {login_response.status_code}")

if login_response.status_code == 200:
    token_data = login_response.json()
    token = token_data['access_token']
    print(f"✅ Got token: {token[:20]}...")
    
    # Test patient endpoint
    headers = {'Authorization': f'Bearer {token}'}
    
    print("\n📋 Testing patient endpoints...")
    
    # Test list patients
    patients_response = requests.get(f'{BASE_URL}/patients/', headers=headers)
    print(f"List patients status: {patients_response.status_code}")
    if patients_response.status_code == 200:
        patients = patients_response.json()
        print(f"Found {len(patients)} patients")
        if patients:
            first_patient_id = patients[0]['id']
            print(f"First patient ID: {first_patient_id}")
            
            # Test individual patient
            patient_response = requests.get(f'{BASE_URL}/patients/{first_patient_id}', headers=headers)
            print(f"Individual patient status: {patient_response.status_code}")
            if patient_response.status_code == 200:
                patient = patient_response.json()
                print(f"✅ Got patient: {patient['nombre']}")
            else:
                print(f"❌ Failed to get patient: {patient_response.text}")
    else:
        print(f"❌ Failed to get patients: {patients_response.text}")
else:
    print(f"❌ Login failed: {login_response.text}")
