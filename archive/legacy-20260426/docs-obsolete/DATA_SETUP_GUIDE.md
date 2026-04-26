# Guía de Configuración de Datos - SGMM

## Sistema de Gestión Médica Moderna (SGMM)
**UME López & López - Consultorio Médico**

---

## 📋 Tabla de Contenidos

1. [Estructura de la Base de Datos](#estructura-de-la-base-de-datos)
2. [Configuración Inicial](#configuración-inicial)
3. [Datos de Prueba](#datos-de-prueba)
4. [Scripts de Población](#scripts-de-población)
5. [Validación de Datos](#validación-de-datos)
6. [Backup y Restauración](#backup-y-restauración)

---

## 🏗️ Estructura de la Base de Datos

### Tablas Principales

#### 1. **Users (Usuarios del Sistema)**
```sql
- id: Integer (Primary Key)
- email: String (Unique)
- hashed_password: String
- is_active: Boolean
- created_at: DateTime
```

#### 2. **Patients (Pacientes)**
```sql
- id: Integer (Primary Key)
- nombre: String
- fecha_nacimiento: Date
- telefono: String
- email: String (Optional)
- direccion: String (Optional)
- requiere_factura: Boolean
- created_at: DateTime
- updated_at: DateTime
```

#### 3. **Treatments (Tratamientos)**
```sql
- id: Integer (Primary Key)
- nombre: String
- descripcion: String
- costo_unitario: Float
- precio: Float
- created_at: DateTime
- updated_at: DateTime
```

#### 4. **Records (Registros Médicos/Financieros)**
```sql
- id: Integer (Primary Key)
- paciente_id: Integer (Foreign Key)
- tratamiento_id: Integer (Foreign Key)
- fecha: Date
- monto_pagado: Float
- costo_unitario: Float
- ganancia: Float
- metodo_pago: String ('efectivo', 'tarjeta', 'transferencia')
- tipo_tarjeta: String ('bbva', 'openpay') - Optional
- meses_sin_intereses: Integer - Default 0
- tasa_comision: Float - Default 0
- comision_monto: Float - Default 0
- notas: String - Optional
- created_at: DateTime
```

---

## ⚙️ Configuración Inicial

### 1. **Setup de la Base de Datos**

```bash
# Navegar al directorio backend
cd backend

# Activar entorno virtual
python\Scripts\activate

# Ejecutar migraciones
alembic upgrade head

# Inicializar datos básicos
python init_db.py
```

### 2. **Usuario Administrador por Defecto**
- **Email**: `admin@consultorio.com`
- **Password**: `admin123`
- **Rol**: Administrador del sistema

---

## 🧪 Datos de Prueba

### Script de Creación de Datos Robustos

```python
# Archivo: backend/create_robust_data.py

import asyncio
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import User, Patient, Treatment, Record
from app.auth import get_password_hash
from datetime import datetime, timedelta
import random
from app.payment_utils import calcular_comision_tarjeta

def create_robust_test_data():
    db = SessionLocal()
    
    try:
        # 1. CREAR USUARIOS
        users_data = [
            {"email": "admin@consultorio.com", "password": "admin123"},
            {"email": "doctor@lopez.com", "password": "doctor123"},
            {"email": "asistente@lopez.com", "password": "asistente123"}
        ]
        
        for user_data in users_data:
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing_user:
                user = User(
                    email=user_data["email"],
                    hashed_password=get_password_hash(user_data["password"]),
                    is_active=True
                )
                db.add(user)
        
        # 2. CREAR TRATAMIENTOS REALISTAS
        treatments_data = [
            {"nombre": "Consulta General", "descripcion": "Consulta médica general", "costo": 150, "precio": 500},
            {"nombre": "Consulta Especializada", "descripcion": "Consulta médica especializada", "costo": 200, "precio": 800},
            {"nombre": "Limpieza Dental", "descripcion": "Limpieza dental profunda", "costo": 100, "precio": 400},
            {"nombre": "Extracción Dental", "descripcion": "Extracción de pieza dental", "costo": 80, "precio": 350},
            {"nombre": "Endodoncia", "descripcion": "Tratamiento de conducto", "costo": 300, "precio": 1200},
            {"nombre": "Ortodoncia - Consulta", "descripcion": "Consulta ortodóntica", "costo": 100, "precio": 600},
            {"nombre": "Radiografía", "descripcion": "Estudio radiográfico", "costo": 50, "precio": 200},
            {"nombre": "Blanqueamiento Dental", "descripcion": "Blanqueamiento dental profesional", "costo": 200, "precio": 800},
            {"nombre": "Corona Dental", "descripcion": "Colocación de corona", "costo": 400, "precio": 1500},
            {"nombre": "Implante Dental", "descripcion": "Colocación de implante", "costo": 800, "precio": 2500}
        ]
        
        treatment_objects = []
        for treatment_data in treatments_data:
            existing = db.query(Treatment).filter(Treatment.nombre == treatment_data["nombre"]).first()
            if not existing:
                treatment = Treatment(
                    nombre=treatment_data["nombre"],
                    descripcion=treatment_data["descripcion"],
                    costo_unitario=treatment_data["costo"],
                    precio=treatment_data["precio"]
                )
                db.add(treatment)
                treatment_objects.append(treatment)
        
        db.commit()
        
        # 3. CREAR PACIENTES REALISTAS
        patients_data = [
            {"nombre": "María González Pérez", "fecha": "1985-03-15", "telefono": "55-1234-5678", "email": "maria.gonzalez@email.com"},
            {"nombre": "Juan Carlos Rodríguez", "fecha": "1990-07-22", "telefono": "55-9876-5432", "email": "juan.rodriguez@email.com"},
            {"nombre": "Ana Sofía Martínez", "fecha": "1978-11-08", "telefono": "55-5555-1111", "email": "ana.martinez@email.com"},
            {"nombre": "Roberto López Hernández", "fecha": "1982-05-30", "telefono": "55-7777-2222", "email": "roberto.lopez@email.com"},
            {"nombre": "Carmen Patricia Silva", "fecha": "1992-12-12", "telefono": "55-3333-4444", "email": "carmen.silva@email.com"},
            {"nombre": "Fernando Ramírez Castro", "fecha": "1975-09-03", "telefono": "55-8888-9999", "email": "fernando.ramirez@email.com"},
            {"nombre": "Lucía Fernández Torres", "fecha": "1988-01-25", "telefono": "55-2222-6666", "email": "lucia.fernandez@email.com"},
            {"nombre": "Diego Morales Vega", "fecha": "1995-04-17", "telefono": "55-6666-7777", "email": "diego.morales@email.com"},
            {"nombre": "Valeria Jiménez Ruiz", "fecha": "1987-08-09", "telefono": "55-4444-8888", "email": "valeria.jimenez@email.com"},
            {"nombre": "Andrés Gutiérrez Mendoza", "fecha": "1983-10-14", "telefono": "55-9999-1111", "email": "andres.gutierrez@email.com"},
            {"nombre": "Paola Sánchez Rivera", "fecha": "1991-06-28", "telefono": "55-1111-3333", "email": "paola.sanchez@email.com"},
            {"nombre": "Sergio Vargas Herrera", "fecha": "1980-02-19", "telefono": "55-5555-7777", "email": "sergio.vargas@email.com"},
            {"nombre": "Isabella Cruz Moreno", "fecha": "1989-12-05", "telefono": "55-7777-9999", "email": "isabella.cruz@email.com"},
            {"nombre": "Ricardo Delgado Peña", "fecha": "1976-07-11", "telefono": "55-3333-5555", "email": "ricardo.delgado@email.com"},
            {"nombre": "Daniela Rojas Campos", "fecha": "1993-03-27", "telefono": "55-8888-2222", "email": "daniela.rojas@email.com"}
        ]
        
        patient_objects = []
        for patient_data in patients_data:
            existing = db.query(Patient).filter(Patient.telefono == patient_data["telefono"]).first()
            if not existing:
                patient = Patient(
                    nombre=patient_data["nombre"],
                    fecha_nacimiento=datetime.strptime(patient_data["fecha"], "%Y-%m-%d").date(),
                    telefono=patient_data["telefono"],
                    email=patient_data["email"],
                    direccion=f"Av. Ejemplo #{random.randint(100, 999)}, CDMX",
                    requiere_factura=random.choice([True, False])
                )
                db.add(patient)
                patient_objects.append(patient)
        
        db.commit()
        
        # 4. CREAR REGISTROS MÉDICOS CON DATOS FINANCIEROS REALISTAS
        all_patients = db.query(Patient).all()
        all_treatments = db.query(Treatment).all()
        
        # Generar registros para los últimos 6 meses
        start_date = datetime.now() - timedelta(days=180)
        
        metodos_pago = ['efectivo', 'tarjeta', 'transferencia']
        tipos_tarjeta = ['bbva', 'openpay']
        msi_options = [0, 3, 6, 9, 12]
        
        for i in range(80):  # 80 registros
            patient = random.choice(all_patients)
            treatment = random.choice(all_treatments)
            
            # Fecha aleatoria en los últimos 6 meses
            random_days = random.randint(0, 180)
            fecha = start_date + timedelta(days=random_days)
            
            # Método de pago aleatorio
            metodo_pago = random.choice(metodos_pago)
            tipo_tarjeta = None
            meses_sin_intereses = 0
            tasa_comision = 0
            comision_monto = 0
            
            monto_pagado = treatment.precio
            costo_unitario = treatment.costo_unitario
            
            # Calcular comisiones si es tarjeta
            if metodo_pago == 'tarjeta':
                tipo_tarjeta = random.choice(tipos_tarjeta)
                meses_sin_intereses = random.choice(msi_options)
                
                try:
                    tasa_comision, comision_monto = calcular_comision_tarjeta(
                        monto_pagado, tipo_tarjeta, meses_sin_intereses
                    )
                except:
                    tasa_comision = 0
                    comision_monto = 0
            
            # Calcular ganancia
            ganancia = monto_pagado - costo_unitario - comision_monto
            
            record = Record(
                paciente_id=patient.id,
                tratamiento_id=treatment.id,
                fecha=fecha.date(),
                monto_pagado=monto_pagado,
                costo_unitario=costo_unitario,
                ganancia=ganancia,
                metodo_pago=metodo_pago,
                tipo_tarjeta=tipo_tarjeta,
                meses_sin_intereses=meses_sin_intereses,
                tasa_comision=tasa_comision,
                comision_monto=comision_monto,
                notas=f"Tratamiento: {treatment.nombre} - Paciente: {patient.nombre}"
            )
            
            db.add(record)
        
        db.commit()
        print("✅ Datos robustos creados exitosamente!")
        
        # Mostrar estadísticas
        total_patients = db.query(Patient).count()
        total_treatments = db.query(Treatment).count()
        total_records = db.query(Record).count()
        total_revenue = db.query(Record).filter(Record.monto_pagado > 0).with_entities(db.func.sum(Record.monto_pagado)).scalar() or 0
        
        print(f"\n📊 ESTADÍSTICAS:")
        print(f"👥 Pacientes: {total_patients}")
        print(f"🏥 Tratamientos: {total_treatments}")
        print(f"📋 Registros: {total_records}")
        print(f"💰 Ingresos Totales: ${total_revenue:,.2f}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_robust_test_data()
```

---

## 🔧 Scripts de Población

### 1. **Script de Backup de Datos**

```python
# Archivo: backend/backup_data.py

import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Patient, Treatment, Record

def backup_database():
    db = SessionLocal()
    backup_data = {
        "backup_date": datetime.now().isoformat(),
        "users": [],
        "patients": [],
        "treatments": [],
        "records": []
    }
    
    try:
        # Backup Users
        for user in db.query(User).all():
            backup_data["users"].append({
                "id": user.id,
                "email": user.email,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None
            })
        
        # Backup Patients
        for patient in db.query(Patient).all():
            backup_data["patients"].append({
                "id": patient.id,
                "nombre": patient.nombre,
                "fecha_nacimiento": patient.fecha_nacimiento.isoformat(),
                "telefono": patient.telefono,
                "email": patient.email,
                "direccion": patient.direccion,
                "requiere_factura": patient.requiere_factura
            })
        
        # Backup Treatments
        for treatment in db.query(Treatment).all():
            backup_data["treatments"].append({
                "id": treatment.id,
                "nombre": treatment.nombre,
                "descripcion": treatment.descripcion,
                "costo_unitario": treatment.costo_unitario,
                "precio": treatment.precio
            })
        
        # Backup Records
        for record in db.query(Record).all():
            backup_data["records"].append({
                "id": record.id,
                "paciente_id": record.paciente_id,
                "tratamiento_id": record.tratamiento_id,
                "fecha": record.fecha.isoformat(),
                "monto_pagado": record.monto_pagado,
                "costo_unitario": record.costo_unitario,
                "ganancia": record.ganancia,
                "metodo_pago": record.metodo_pago,
                "tipo_tarjeta": record.tipo_tarjeta,
                "meses_sin_intereses": record.meses_sin_intereses,
                "tasa_comision": record.tasa_comision,
                "comision_monto": record.comision_monto,
                "notas": record.notas
            })
        
        # Guardar backup
        filename = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Backup creado: {filename}")
        
    except Exception as e:
        print(f"❌ Error en backup: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    backup_database()
```

---

## ✅ Validación de Datos

### Comandos de Verificación

```sql
-- Verificar integridad de datos
SELECT 
    (SELECT COUNT(*) FROM users) as usuarios,
    (SELECT COUNT(*) FROM patients) as pacientes, 
    (SELECT COUNT(*) FROM treatments) as tratamientos,
    (SELECT COUNT(*) FROM records) as registros;

-- Verificar datos financieros
SELECT 
    metodo_pago,
    COUNT(*) as cantidad,
    SUM(monto_pagado) as total_ingresos,
    SUM(ganancia) as total_ganancia
FROM records 
GROUP BY metodo_pago;

-- Verificar registros por mes
SELECT 
    DATE_FORMAT(fecha, '%Y-%m') as mes,
    COUNT(*) as registros,
    SUM(monto_pagado) as ingresos
FROM records 
GROUP BY DATE_FORMAT(fecha, '%Y-%m')
ORDER BY mes DESC;
```

---

## 🎯 Configuración de Producción

### Variables de Entorno Requeridas

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost/sgmm_prod
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Para desarrollo
DATABASE_URL=sqlite:///./consultorio.db
```

### Comandos de Deployment

```bash
# 1. Backup de datos actuales
python backup_data.py

# 2. Ejecutar migraciones
alembic upgrade head

# 3. Crear datos iniciales (solo primera vez)
python create_robust_data.py

# 4. Verificar datos
python -c "from app.database import SessionLocal; from app.models import *; db = SessionLocal(); print(f'Pacientes: {db.query(Patient).count()}'); db.close()"
```

---

## 📈 Métricas y Monitoreo

### Dashboard de Estadísticas

- **Pacientes Activos**: Total de pacientes registrados
- **Ingresos Mensuales**: Suma de `monto_pagado` por mes
- **Ganancia Neta**: Suma de `ganancia` (después de comisiones)
- **Métodos de Pago**: Distribución por tipo
- **Tratamientos Populares**: Más frecuentes
- **Comisiones**: Total pagado por tipo de tarjeta

### Reportes Disponibles

1. **Reporte Financiero Mensual**
2. **Análisis de Rentabilidad por Tratamiento**
3. **Estadísticas de Métodos de Pago**
4. **Tendencias de Pacientes**
5. **Proyecciones de Ingresos**

---

## 🚀 Próximos Pasos

1. **Ejecutar script de datos robustos**
2. **Verificar funcionalidad del dashboard**
3. **Probar reportes financieros**
4. **Configurar backups automáticos**
5. **Optimizar consultas de base de datos**

---

## 📞 Soporte y Contacto

**Desarrollador**: gmelgarejom@gmail.com  
**Sistema**: SGMM - UME López & López  
**Versión**: 1.0.0  
**Fecha**: Junio 2025

---

*Este documento debe mantenerse actualizado conforme evolucione el sistema.*
