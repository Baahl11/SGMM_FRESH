# Consultorio Médico - Backend API

Este es el backend para la aplicación de gestión de consultorio médico, construido con FastAPI.

## Requisitos

- Python 3.10+
- pip (gestor de paquetes de Python)
- SQLite (desarrollo) / PostgreSQL (producción)

## Configuración del Entorno

1. Crear un entorno virtual:
```bash
python -m venv venv
```

2. Activar el entorno virtual:
- En Windows:
```bash
venv\Scripts\activate
```
- En macOS/Linux:
```bash
source venv/bin/activate
```

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

4. Configurar variables de entorno:
- Copiar `.env.example` a `.env`
- Modificar las variables según sea necesario

## Base de Datos

1. Inicializar la base de datos:
```bash
alembic upgrade head
```

2. Para crear nuevas migraciones después de cambios en los modelos:
```bash
alembic revision --autogenerate -m "descripción del cambio"
alembic upgrade head
```

## Ejecutar el Servidor

Para desarrollo:
```bash
uvicorn app.main:app --reload --port 8000
```

## Documentación API

Una vez que el servidor esté corriendo, puedes acceder a:
- Documentación Swagger UI: http://localhost:8000/docs
- Documentación ReDoc: http://localhost:8000/redoc

## Endpoints Principales

### Autenticación
- POST /token - Obtener token de acceso
- POST /register - Registrar nuevo usuario
- POST /auth/login - Endpoint alternativo de login

### Pacientes
- GET /patients/ - Listar pacientes
- POST /patients/ - Crear paciente
- GET /patients/{id} - Obtener paciente
- PUT /patients/{id} - Actualizar paciente
- DELETE /patients/{id} - Eliminar paciente

### Tratamientos
- GET /treatments/ - Listar tratamientos
- POST /treatments/ - Crear tratamiento
- GET /treatments/{id} - Obtener tratamiento
- PUT /treatments/{id} - Actualizar tratamiento
- DELETE /treatments/{id} - Eliminar tratamiento

### Registros
- GET /records/ - Listar registros
- POST /records/ - Crear registro
- GET /records/{id} - Obtener registro
- PUT /records/{id} - Actualizar registro
- DELETE /records/{id} - Eliminar registro

## Estructura del Proyecto

```
backend/
├── app/
│   ├── main.py          # Punto de entrada de la aplicación
│   ├── models.py        # Modelos SQLModel
│   ├── schemas.py       # Esquemas Pydantic
│   ├── crud.py         # Operaciones CRUD
│   ├── database.py     # Configuración de base de datos
│   └── auth.py         # Autenticación y seguridad
├── migrations/         # Migraciones Alembic
├── .env               # Variables de entorno
└── requirements.txt   # Dependencias
```

## Seguridad

- Autenticación JWT
- Contraseñas hasheadas con bcrypt
- CORS configurado para frontend
- Endpoints protegidos con OAuth2

## Desarrollo

Para contribuir:
1. Crear una rama para tu feature
2. Hacer commits de tus cambios
3. Crear un pull request
4. Asegurar que los tests pasen

## Notas

- En desarrollo se usa SQLite para simplicidad
- Para producción, cambiar a PostgreSQL
- Mantener las migraciones actualizadas
- Seguir las convenciones de código PEP 8
