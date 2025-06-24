import requests
import json

def test_inventory_health():
    try:
        # Test the debug endpoint (no auth required)
        print("🔍 Testing debug inventory health endpoint...")
        response = requests.get("http://localhost:8000/debug/inventory/health")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Debug endpoint working!")
            print(f"📊 Data: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Debug endpoint failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing debug endpoint: {e}")

if __name__ == "__main__":
    test_inventory_health()
