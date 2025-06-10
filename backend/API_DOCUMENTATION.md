# API Documentation

## Authentication

```bash
# Login to get access token
POST /token
Content-Type: application/x-www-form-urlencoded
Body: username=admin@consultorio.com&password=admin123
```

## Patients

```bash
# List all patients
GET /patients/
Authorization: Bearer <token>

# Create new patient
POST /patients/
Authorization: Bearer <token>
Content-Type: application/json
{
    "nombre": "Patient Name",
    "fecha_nacimiento": "YYYY-MM-DD",
    "telefono": "1234567890",
    "email": "patient@example.com",
    "direccion": "Patient Address",
    "requiere_factura": true
}

# Get specific patient
GET /patients/{id}
Authorization: Bearer <token>

# Update patient
PUT /patients/{id}
Authorization: Bearer <token>
Content-Type: application/json
{
    "nombre": "Updated Name",
    ...
}

# Delete patient
DELETE /patients/{id}
Authorization: Bearer <token>
```

## Treatments

```bash
# List all treatments
GET /treatments/
Authorization: Bearer <token>

# Create new treatment
POST /treatments/
Authorization: Bearer <token>
Content-Type: application/json
{
    "nombre": "Treatment Name",
    "costo_unitario": 1000.0,
    "precio": 1500.0,
    "descripcion": "Treatment description"
}

# Get specific treatment
GET /treatments/{id}
Authorization: Bearer <token>

# Update treatment
PUT /treatments/{id}
Authorization: Bearer <token>
Content-Type: application/json
{
    "nombre": "Updated Name",
    ...
}

# Delete treatment
DELETE /treatments/{id}
Authorization: Bearer <token>
```

## Records

```bash
# List all records
GET /records/
Authorization: Bearer <token>

# Create new record
POST /records/
Authorization: Bearer <token>
Content-Type: application/json
{
    "patient_id": 1,
    "treatment_id": 1,
    "fecha": "YYYY-MM-DDTHH:MM:SS",
    "monto_pagado": 1500.0,
    "monto_neto": 1200.0,
    "notas": "Optional notes"
}

# Get specific record
GET /records/{id}
Authorization: Bearer <token>

# Update record
PUT /records/{id}
Authorization: Bearer <token>
Content-Type: application/json
{
    "monto_pagado": 2000.0,
    ...
}

# Delete record
DELETE /records/{id}
Authorization: Bearer <token>
```

## Development Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Initialize database:
```bash
python test_setup.py
```

4. Run development server:
```bash
python run.py
```

## Default Admin User

- Email: admin@consultorio.com
- Password: admin123

## Database Models

### User
- id: Integer (Primary Key)
- email: String (Unique)
- hashed_password: String
- is_active: Boolean
- is_superuser: Boolean

### Patient
- id: Integer (Primary Key)
- nombre: String
- fecha_nacimiento: Date
- telefono: String
- email: String (Optional)
- direccion: String (Optional)
- requiere_factura: Boolean
- fotos: List[String]
- created_at: DateTime
- updated_at: DateTime

### Treatment
- id: Integer (Primary Key)
- nombre: String
- costo_unitario: Float
- precio: Float
- descripcion: String (Optional)
- created_at: DateTime
- updated_at: DateTime

### Record
- id: Integer (Primary Key)
- patient_id: Integer (Foreign Key)
- treatment_id: Integer (Foreign Key)
- fecha: DateTime
- monto_pagado: Float
- monto_neto: Float
- notas: String (Optional)
- created_at: DateTime
