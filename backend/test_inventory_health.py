#!/usr/bin/env python3

import sqlite3
from datetime import datetime
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import crud, database

def test_inventory_health():
    """Test the inventory health calculation directly"""
    
    # Connect to database
    conn = sqlite3.connect('consultorio.db')
    cursor = conn.cursor()
    
    try:
        # Get inventory items directly from SQL
        cursor.execute("""
            SELECT id, nombre, stock_actual, stock_minimo, stock_maximo, activo
            FROM inventoryitem 
            WHERE activo = 1
        """)
        items = cursor.fetchall()
        
        print("=== INVENTORY ITEMS FROM DATABASE ===")
        print(f"Total items found: {len(items)}")
        for item in items:
            print(f"  ID: {item[0]}, Name: {item[1]}, Stock: {item[2]}, Min: {item[3]}, Max: {item[4]}, Active: {item[5]}")
        
        # Now test the CRUD function
        print("\n=== TESTING CRUD FUNCTION ===")
        try:
            # Import SQLAlchemy components
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker
            from app.database import get_session
            
            # Create a test session
            engine = create_engine("sqlite:///consultorio.db")
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            session = SessionLocal()
            
            # Call the CRUD function
            health_status = crud.get_inventory_health_status(session)
            print("Health status result:", health_status)
            
            session.close()
            
        except Exception as e:
            print(f"Error calling CRUD function: {e}")
            print(f"Error type: {type(e)}")
            import traceback
            traceback.print_exc()
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    test_inventory_health()
