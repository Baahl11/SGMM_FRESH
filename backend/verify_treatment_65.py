import sqlite3

conn = sqlite3.connect('consultorio.db')
cursor = conn.cursor()

# Verificar el tratamiento creado
cursor.execute('SELECT * FROM treatment WHERE id = 65')
treatment = cursor.fetchone()
print('Treatment:', treatment)

# Verificar si se creó inventario
cursor.execute('SELECT * FROM inventoryitem WHERE nombre LIKE "%Tratamiento Directo Backend%"')
inventory = cursor.fetchone()
print('Inventory:', inventory)

# Verificar relación tratamiento-inventario
cursor.execute('SELECT * FROM treatmentinventoryitem WHERE treatment_id = 65')
relation = cursor.fetchone()
print('Treatment-Inventory relation:', relation)

conn.close()
