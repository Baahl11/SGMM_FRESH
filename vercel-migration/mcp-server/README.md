# AgendaMedPro MCP Server

Model Context Protocol server para AgendaMedPro - proporciona herramientas para gestión de citas, pacientes y estadísticas.

## 🚀 Quick Start

### 1. Instalar dependencias

```bash
cd mcp-server
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

### 3. Compilar

```bash
npm run build
```

### 4. Ejecutar

```bash
npm start
```

## 📦 Tools Disponibles

### Appointments (Citas)

- **get_appointments** - Obtener citas de una fecha
  - `date` (opcional): Fecha en formato YYYY-MM-DD
  - `status` (opcional): Filtrar por estado (confirmed/cancelled/completed/pending)

- **create_appointment** - Crear nueva cita
  - `patient_id` (requerido): ID del paciente
  - `start_time` (requerido): Fecha/hora inicio (ISO 8601)
  - `duration_minutes` (requerido): Duración en minutos
  - `notes` (opcional): Notas de la cita
  - `price` (opcional): Precio de la consulta

- **cancel_appointment** - Cancelar cita
  - `appointment_id` (requerido): ID de la cita
  - `reason` (opcional): Motivo de cancelación

### Patients (Pacientes)

- **search_patients** - Buscar pacientes por nombre
  - `query` (requerido): Nombre o apellido a buscar
  - `limit` (opcional): Máximo de resultados (default: 10)

- **get_patient_details** - Obtener detalles completos de un paciente
  - `patient_id` (requerido): ID del paciente

- **create_patient** - Crear nuevo paciente
  - `name` (requerido): Nombre completo
  - `phone` (requerido): Teléfono
  - `email` (opcional): Email
  - `date_of_birth` (opcional): Fecha de nacimiento

### Stats (Estadísticas)

- **get_day_stats** - Estadísticas del día
  - `date` (opcional): Fecha (default: hoy)

- **get_week_summary** - Resumen de la semana
  - `start_date` (opcional): Fecha inicio (default: inicio de semana)

## 🧪 Testing

### Probar localmente

```bash
# Terminal 1: Ejecutar servidor
npm run dev

# Terminal 2: Probar con Claude Desktop
# (Configurar en ~/Library/Application Support/Claude/claude_desktop_config.json)
```

### Configuración Claude Desktop

```json
{
  "mcpServers": {
    "agendamedpro": {
      "command": "node",
      "args": ["/ruta/absoluta/a/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "tu_url",
        "SUPABASE_SERVICE_KEY": "tu_key"
      }
    }
  }
}
```

## 📝 Development

```bash
# Modo desarrollo con hot reload
npm run dev

# Build para producción
npm run build

# Tests
npm test

# Linting
npm run lint
```

## 🔒 Seguridad

- Todas las tools validan inputs con Zod
- Se usa service role key (nunca anon key)
- Errores son capturados y formateados
- Logs para debugging (stderr)

## 📖 Documentación MCP

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
