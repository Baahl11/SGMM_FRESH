# Sistema de Gestión Médica (SGMM)

Sistema integral para la gestión de consultorios médicos construido con Next.js y FastAPI.

## Características Principales

### 🔐 Autenticación y Gestión de Usuarios
- **Registro de usuarios**: Sistema completo de registro con validación de email único
- **Inicio de sesión seguro**: Autenticación JWT con protección de rutas
- **Gestión de sesiones**: Tokens seguros con expiración automática

### 👥 Gestión de Pacientes
- **CRUD completo**: Crear, leer, actualizar y eliminar pacientes
- **Historial médico**: Seguimiento completo de tratamientos por paciente
- **Información detallada**: Datos personales, contacto y historial de pagos

### 💊 Gestión de Tratamientos
- **Catálogo de servicios**: Administración de tratamientos disponibles
- **Precios y costos**: Control de precios de venta y costos unitarios
- **Descripciones detalladas**: Información completa de cada tratamiento

### 💰 Sistema Financiero
- **Múltiples métodos de pago**: Efectivo, tarjeta (BBVA/OpenPay), transferencia
- **Cálculo automático**: Comisiones, ganancias netas y reportes financieros
- **Meses sin intereses**: Soporte para financiamiento con tarjetas
- **Dashboard financiero**: Resumen de ingresos, costos y ganancias

### 📊 Reportes y Dashboard
- **Panel principal**: Vista general con métricas clave y análisis de facturación
- **Registros recientes**: Historial de tratamientos con nombres de pacientes
- **Análisis financiero**: Distribución por método de pago y tendencias
- **Reportes de ingresos diarios**: Análisis de 7, 15 y 30 días con gráficos interactivos
- **Análisis de facturación**: Porcentaje de ingresos facturados vs no facturados
- **Gráficos interactivos**: Visualización de barras y líneas para diferentes períodos

### 🖼️ Gestión de Imágenes
- **Galería de pacientes**: Subida y visualización de imágenes médicas
- **Eliminación segura**: Sistema robusto para eliminar imágenes con manejo de errores
- **Codificación URL**: Soporte para nombres de archivos especiales y caracteres especiales

## Tecnologías Utilizadas

### Frontend
- **Next.js 14**: Framework React con App Router
- **TypeScript**: Tipado estático para mejor desarrollo
- **Tailwind CSS**: Estilos utilitarios y diseño responsivo
- **Shadcn/ui**: Componentes de UI modernos y accesibles

### Backend
- **FastAPI**: Framework Python asíncrono de alto rendimiento
- **SQLModel**: ORM moderno basado en SQLAlchemy y Pydantic
- **JWT Authentication**: Tokens seguros para autenticación
- **bcrypt**: Hash seguro de contraseñas

### Base de Datos
- **SQLite**: Base de datos ligera para desarrollo y producción pequeña
- **Alembic**: Migraciones de base de datos automáticas

## Configuración e Instalación

### Prerrequisitos
- Node.js 18+ y npm
- Python 3.10+
- Git

### Instalación del Backend

```bash
# Navegar al directorio backend
cd backend

# Activar entorno virtual (Windows)
python\Scripts\activate

# Instalar dependencias (si es la primera vez)
pip install -r requirements.txt

# Inicializar base de datos (si es la primera vez)
python test_setup.py

# Ejecutar servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```

### Instalación del Frontend

```bash
# Instalar dependencias (si es la primera vez)
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

## 🚀 Comandos para Ejecutar Ambos Servidores

### **Backend (Terminal 1):**
```powershell
cd C:\Users\gm_me\SGMM\SGMM\backend
python\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### **Frontend (Terminal 2):**
```powershell
cd C:\Users\gm_me\SGMM\SGMM
npm run dev
```

### Acceso a la Aplicación

1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:8000
3. **Documentación API**: http://localhost:8000/docs

### Credenciales de Testing

- **Usuario de prueba**: test@test.com
- **Contraseña**: test123

> **Nota**: Si necesitas acceso rápido, puedes usar la página `/auto-login` para autenticación automática durante el desarrollo.

## Funcionalidades de Usuario

### Registro de Nuevos Usuarios
1. Acceder a `/register` o hacer clic en "¿No tienes cuenta? Registrarse"
2. Ingresar email único y contraseña (mínimo 6 caracteres)
3. Confirmar contraseña
4. Registro automático y redirección al login

### Gestión de Pacientes
1. **Crear paciente**: Formulario completo con datos personales
2. **Editar información**: Actualización de datos y tratamientos
3. **Historial de tratamientos**: Vista completa de registros médicos
4. **Eliminar registros**: Gestión individual de tratamientos

### Registro de Tratamientos
1. **Selección de tratamiento**: Catálogo de servicios disponibles
2. **Método de pago**: Efectivo, tarjeta con MSI, transferencia
3. **Cálculos automáticos**: Comisiones y ganancias netas
4. **Tratamientos futuros**: Programación de citas

### Dashboard y Reportes
1. **Resumen financiero**: Ingresos, costos y ganancias
2. **Métricas mensuales**: Seguimiento de tendencias
3. **Registros recientes**: Últimos tratamientos realizados
4. **Distribución de pagos**: Análisis por método de pago

## Estructura del Proyecto

```
SGMM/
├── src/                    # Frontend Next.js
│   ├── app/               # App Router pages
│   ├── components/        # Componentes reutilizables
│   ├── lib/              # Utilidades y servicios
│   └── hooks/            # React hooks personalizados
├── backend/              # Backend FastAPI
│   ├── app/              # Código de aplicación
│   ├── migrations/       # Migraciones de DB
│   └── tests/           # Pruebas unitarias
└── docs/                # Documentación adicional
```

## Documentación Adicional

- [**API Documentation**](backend/API_DOCUMENTATION.md): Endpoints y esquemas de API
- [**Development Plan**](DEVELOPMENT_PLAN.md): Plan de desarrollo y funcionalidades
- [**User Registration Docs**](USER_REGISTRATION_DOCS.md): Sistema de registro detallado
- [**Data Setup Guide**](DATA_SETUP_GUIDE.md): Configuración de datos inicial

## Seguridad

- ✅ **Autenticación JWT**: Tokens seguros con expiración
- ✅ **Hash de contraseñas**: bcrypt para almacenamiento seguro
- ✅ **Validación de entrada**: Sanitización en frontend y backend
- ✅ **Protección de rutas**: Middleware de autenticación
- ✅ **CORS configurado**: Acceso controlado desde frontend

## ✅ Estado Actual - COMPLETAMENTE FUNCIONAL

### 🎯 Todas las Funcionalidades Principales Operativas
- ✅ **Autenticación**: Sistema JWT unificado funcionando
- ✅ **Gestión de Pacientes**: CRUD completo incluyendo rutas individuales
- ✅ **Tratamientos**: Catálogo y gestión completa
- ✅ **Dashboard**: Estadísticas y métricas en tiempo real
- ✅ **Reportes**: Registros con nombres y análisis financiero
- ✅ **Gastos Fijos**: CRUD completo para gestión de costos
- ✅ **Inventario**: Sistema de salud y movimientos
- ✅ **API Routes**: Todas las rutas proxy implementadas y funcionando

### 🔧 Correcciones Implementadas
- 🎯 **Rutas dinámicas**: `/api/patients/[id]` completamente funcional
- 🔐 **Autenticación unificada**: Función `authenticateRequest` en todas las rutas
- 🌐 **Proxy completo**: Frontend actúa como proxy hacia el backend
- 🛠️ **URLs corregidas**: Backend endpoints sin prefijo `/api` innecesario

### 🧪 Verificación de Estado
```bash
# Test completo de todas las funcionalidades
node test_comprehensive_final.js

# Resultado esperado: ✅ SGMM is ready for deployment!
```

## Troubleshooting

### Problemas Comunes

#### "Error loading dashboard data"
- **Causa**: Backend no está corriendo o no es accesible
- **Solución**: Verificar que el backend esté ejecutándose en puerto 8000
```powershell
netstat -ano | findstr :8000
cd backend && python\Scripts\activate && uvicorn app.main:app --reload --port 8000
```

#### "ERR_CONNECTION_REFUSED :8000"
- **Causa**: El servidor backend se ha detenido
- **Solución**: Reiniciar el servidor backend con el comando anterior

#### "Puerto 3000 ya está en uso"
- **Causa**: Otra instancia del frontend está corriendo
- **Solución**: Usar un puerto diferente o cerrar la instancia anterior
```powershell
npm run dev -- -p 3001
```

#### "Usuario no autenticado"
- **Causa**: Token expirado o sesión inválida
- **Solución**: Hacer login nuevamente o usar `/auto-login` para desarrollo

### Verificación Rápida del Sistema

```powershell
# Verificar backend
curl http://localhost:8000/docs

# Verificar frontend
curl http://localhost:3000

# Verificar autenticación
curl -X POST http://localhost:8000/token -H "Content-Type: application/x-www-form-urlencoded" -d "username=test@test.com&password=test123"
```

## 🔧 Resolución de Problemas

### Problemas Comunes API y Autenticación

Para una guía completa de resolución de problemas técnicos, incluyendo errores 500/404 y problemas de autenticación, consultar [`RESUMEN_FINAL_COMPLETO.md`](./RESUMEN_FINAL_COMPLETO.md#-resolución-de-problemas-api-y-autenticación).

#### Soluciones Rápidas:
- **Error 500 en API**: Verificar autenticación y rutas implementadas
- **Error 404 endpoints**: Confirmar que todas las rutas API existen
- **Login no funciona**: Validar formato de datos y credenciales
- **Dashboard vacío**: Probar conectividad backend y autenticación

### Verificación del Sistema

```javascript
// Test rápido de endpoints (usar en consola del navegador)
node test_all_endpoints.js
```

## Soporte y Contribución

Para reportar problemas o sugerir mejoras, consultar la documentación técnica o contactar al equipo de desarrollo.

---

Este proyecto está diseñado para proporcionar una solución completa y escalable para la gestión de consultorios médicos, priorizando la facilidad de uso, seguridad y eficiencia operacional.
