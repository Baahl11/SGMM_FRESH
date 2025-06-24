#!/usr/bin/env python3

import sqlite3
import json

def check_inventory_status():
    """Quick check of inventory status directly from database"""
    
    conn = sqlite3.connect('consultorio.db')
    cursor = conn.cursor()
    
    try:
        # Count active inventory items
        cursor.execute("SELECT COUNT(*) FROM inventoryitem WHERE activo = 1")
        total_items = cursor.fetchone()[0]
        
        print(f"📦 Total active inventory items: {total_items}")
        
        if total_items > 0:
            # Get details of each item
            cursor.execute("""
                SELECT id, nombre, stock_actual, stock_minimo, stock_maximo 
                FROM inventoryitem 
                WHERE activo = 1
            """)
            items = cursor.fetchall()
            
            print("\n📋 Inventory items:")
            for item in items:
                item_id, nombre, stock_actual, stock_minimo, stock_maximo = item
                
                # Calculate status
                if stock_actual == 0:
                    status = "out"
                elif stock_actual < stock_minimo:
                    status = "low"
                elif stock_actual < (stock_maximo * 0.5):
                    status = "medium"
                else:
                    status = "high"
                
                print(f"  • {nombre}: {stock_actual}/{stock_maximo} ({status})")
            
            # Summary by status
            high_count = sum(1 for item in items if item[2] >= item[4] * 0.5 and item[2] > 0)
            medium_count = sum(1 for item in items if item[2] < item[4] * 0.5 and item[2] >= item[3])
            low_count = sum(1 for item in items if item[2] < item[3] and item[2] > 0)
            out_count = sum(1 for item in items if item[2] == 0)
            
            print(f"\n📊 Status summary:")
            print(f"  🟢 High stock: {high_count}")
            print(f"  🟡 Medium stock: {medium_count}")
            print(f"  🟠 Low stock: {low_count}")
            print(f"  🔴 Out of stock: {out_count}")
            
            if out_count > 0 or low_count > total_items * 0.3:
                overall_status = "critical"
            elif low_count > 0 or medium_count > total_items * 0.5:
                overall_status = "warning"
            else:
                overall_status = "good"
            
            print(f"  📈 Overall status: {overall_status}")
            
            # Simulate what the backend should return
            expected_response = {
                "total_items": total_items,
                "high_stock": high_count,
                "medium_stock": medium_count,
                "low_stock": low_count,
                "out_of_stock": out_count,
                "overall_status": overall_status
            }
            
            print(f"\n🔍 Expected API response:")
            print(json.dumps(expected_response, indent=2))
            
        else:
            print("⚠️ No active inventory items found!")
            print("   Run setup_test_inventory_clean.py to create test data")
            
    except Exception as e:
        print(f"❌ Error checking inventory: {e}")
        
    finally:
        conn.close()

if __name__ == "__main__":
    print("🔍 SGMM Inventory Status Check")
    print("=" * 40)
    check_inventory_status()
