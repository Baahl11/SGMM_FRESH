#!/usr/bin/env python3

import sys
sys.path.append('.')

from app.database import get_session
from app import crud

def test_health_function():
    """Test the inventory health function directly"""
    
    try:
        session = next(get_session())
        print("📊 Testing get_inventory_health_status function...")
        
        result = crud.get_inventory_health_status(session)
        print("✅ Function executed successfully!")
        print("📋 Result:", result)
        
        session.close()
        return True
        
    except Exception as e:
        print(f"❌ Error testing function: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔍 Testing Inventory Health Function")
    print("=" * 40)
    test_health_function()
