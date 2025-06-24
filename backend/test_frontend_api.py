import requests
import json

def test_frontend_inventory_health():
    try:
        # Test the frontend debug endpoint (no auth required)
        print("🔍 Testing frontend debug inventory health endpoint...")
        response = requests.get("http://localhost:3000/api/debug/inventory/health")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Frontend debug endpoint working!")
            print(f"📊 Data: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Frontend debug endpoint failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing frontend debug endpoint: {e}")

if __name__ == "__main__":
    test_frontend_inventory_health()
