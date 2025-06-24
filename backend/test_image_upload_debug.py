import requests
import os
import json

def test_image_upload():
    print("🧪 Testing Image Upload Backend...")
    
    # Test backend health
    try:
        response = requests.get("http://localhost:8000/docs")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend is not responding correctly")
            return
    except Exception as e:
        print(f"❌ Backend is not running: {e}")
        return
      # Test login
    try:
        login_data = {
            "username": "admin@consultorio.com",
            "password": "admin123"
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        login_response = requests.post(
            "http://localhost:8000/auth/login",
            data=login_data,
            headers=headers
        )
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data.get("access_token")
            print("✅ Login successful")
        else:
            print(f"❌ Login failed: {login_response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Test get patients
    try:
        auth_headers = {"Authorization": f"Bearer {token}"}
        patients_response = requests.get(
            "http://localhost:8000/patients?skip=0&limit=1",
            headers=auth_headers
        )
        
        if patients_response.status_code == 200:
            patients = patients_response.json()
            if patients:
                patient_id = patients[0]["id"]
                print(f"✅ Found patient ID: {patient_id}")
            else:
                print("❌ No patients found")
                return
        else:
            print(f"❌ Failed to get patients: {patients_response.text}")
            return
    except Exception as e:
        print(f"❌ Error getting patients: {e}")
        return
    
    # Test upload endpoint structure (without actual file)
    try:
        # Create a simple test file
        test_content = b"fake image content for testing"
        files = {"file": ("test.jpg", test_content, "image/jpeg")}
        
        upload_response = requests.post(
            f"http://localhost:8000/patients/{patient_id}/upload-image",
            files=files,
            headers=auth_headers
        )
        
        if upload_response.status_code == 200:
            print("✅ Upload endpoint works correctly")
            result = upload_response.json()
            print(f"📄 Response: {result}")
        else:
            print(f"❌ Upload failed: {upload_response.status_code} - {upload_response.text}")
            
    except Exception as e:
        print(f"❌ Upload error: {e}")
    
    print("\n💡 If frontend still shows errors:")
    print("   1. Check browser console for detailed errors")
    print("   2. Verify file format (JPG, PNG, etc.)")
    print("   3. Check file size (max 5MB)")
    print("   4. Ensure frontend and backend are both running")

if __name__ == "__main__":
    test_image_upload()
