import requests
import json

def test_protected_inventory_health():
    try:
        # Try to test the protected endpoint (this should fail without auth)
        print("🔍 Testing protected inventory health endpoint (without auth)...")
        response = requests.get("http://localhost:8000/inventory/health")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 422:
            print("❌ Still getting 422 error - route conflict not fixed!")
            print(f"Response: {response.text}")
        elif response.status_code == 401:
            print("✅ Good! Getting 401 (Unauthorized) as expected for protected endpoint")
            print("The route is working correctly, just needs authentication")
        elif response.status_code == 200:
            print("⚠️ Unexpected 200 response (should require auth)")
            data = response.json()
            print(f"📊 Data: {json.dumps(data, indent=2)}")
        else:
            print(f"⚠️ Unexpected status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing protected endpoint: {e}")

if __name__ == "__main__":
    test_protected_inventory_health()
