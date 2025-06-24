#!/usr/bin/env python3

import requests
import json

def test_backend_inventory():
    """Test the backend inventory endpoints"""
      # First login to get a token
    login_url = "http://localhost:8000/auth/login"
    login_data = {
        "username": "admin@admin.com",
        "password": "password"
    }
    
    try:
        # Login
        print("🔐 Logging in...")
        login_response = requests.post(login_url, data=login_data)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return False
        
        token_data = login_response.json()
        token = token_data.get("access_token")
        
        if not token:
            print("❌ No access token received")
            return False
        
        print(f"✅ Login successful! Token: {token[:30]}...")
        
        # Test inventory endpoint
        headers = {"Authorization": f"Bearer {token}"}
        
        print("\n📦 Testing inventory endpoint...")
        inventory_url = "http://localhost:8000/inventory"
        inventory_response = requests.get(inventory_url, headers=headers)
        
        if inventory_response.status_code != 200:
            print(f"❌ Inventory endpoint failed: {inventory_response.status_code}")
            print(f"Response: {inventory_response.text}")
            return False
        
        inventory_data = inventory_response.json()
        print(f"✅ Inventory endpoint successful! Found {len(inventory_data)} items")
        
        # Test inventory health endpoint
        print("\n🩺 Testing inventory health endpoint...")
        health_url = "http://localhost:8000/inventory/health"
        health_response = requests.get(health_url, headers=headers)
        
        if health_response.status_code != 200:
            print(f"❌ Health endpoint failed: {health_response.status_code}")
            print(f"Response: {health_response.text}")
            return False
        
        health_data = health_response.json()
        print(f"✅ Health endpoint successful!")
        print(f"📊 Total items: {health_data.get('total_items', 'Unknown')}")
        print(f"📊 Overall status: {health_data.get('overall_status', 'Unknown')}")
        print(f"📊 High stock: {health_data.get('high_stock', 'Unknown')}")
        print(f"📊 Medium stock: {health_data.get('medium_stock', 'Unknown')}")
        print(f"📊 Low stock: {health_data.get('low_stock', 'Unknown')}")
        print(f"📊 Out of stock: {health_data.get('out_of_stock', 'Unknown')}")
        
        print(f"\n📋 Full health data:")
        print(json.dumps(health_data, indent=2, ensure_ascii=False))
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing SGMM Backend Inventory Endpoints")
    print("=" * 50)
    
    success = test_backend_inventory()
    
    if success:
        print("\n🎉 All tests passed! Backend is working correctly.")
    else:
        print("\n💥 Tests failed! Check the backend and database.")
