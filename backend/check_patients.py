import sqlite3

conn = sqlite3.connect('consultorio.db')
cursor = conn.cursor()

# Check available tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print('Available tables:')
for t in tables:
    print(f'  {t[0]}')

# Check patient table structure
try:
    cursor.execute("PRAGMA table_info(patient)")
    columns = cursor.fetchall()
    print(f'\nPatient table columns:')
    for col in columns:
        print(f'  {col[1]} ({col[2]})')
        
    # Get some patient data
    cursor.execute("SELECT * FROM patient LIMIT 5")
    patients = cursor.fetchall()
    print(f'\nFirst 5 patients:')
    for p in patients:
        print(f'  {p}')
except sqlite3.OperationalError as e:
    print(f'Error accessing patient table: {e}')

conn.close()
