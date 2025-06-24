import sqlite3

conn = sqlite3.connect('consultorio.db')
cursor = conn.cursor()

# Ver todas las tablas
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print('Tables:', [t[0] for t in tables])

# Ver estructura de la tabla user
try:
    cursor.execute('PRAGMA table_info(user)')
    columns = cursor.fetchall()
    print('User table columns:', columns)
    
    cursor.execute('SELECT * FROM user LIMIT 3')
    users = cursor.fetchall()
    print('Users:', users)
except Exception as e:
    print('Error getting users:', e)

conn.close()
