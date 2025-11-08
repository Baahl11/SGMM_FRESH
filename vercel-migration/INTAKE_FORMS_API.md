# API de Formularios de Admisión (Intake Forms)

## Resumen

Sistema completo de APIs para gestionar formularios personalizables que los doctores pueden enviar a pacientes vía WhatsApp o Email. Los pacientes completan el formulario a través de un enlace público sin necesidad de login.

---

## Endpoints Implementados

### 1. Gestión de Formularios (Doctor - Autenticado)

#### `GET /api/forms`
**Descripción:** Lista todos los formularios del usuario autenticado.

**Autenticación:** Requerida

**Response:**
```json
{
  "forms": [
    {
      "id": "uuid",
      "name": "Historia Clínica General",
      "description": "Formulario de admisión completo",
      "category": "historia_clinica",
      "fields": [...],
      "require_signature": true,
      "allow_file_upload": true,
      "active": true,
      "is_template": false,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

#### `POST /api/forms`
**Descripción:** Crea un nuevo formulario.

**Autenticación:** Requerida

**Body:**
```json
{
  "name": "Formulario de Admisión",
  "description": "Opcional",
  "category": "admision",
  "fields": [
    {
      "id": "field_1",
      "type": "text",
      "label": "Nombre completo",
      "required": true
    },
    {
      "id": "field_2",
      "type": "email",
      "label": "Correo electrónico",
      "required": true
    }
  ],
  "require_signature": true,
  "allow_file_upload": false
}
```

**Response:**
```json
{
  "form": {
    "id": "uuid",
    "name": "Formulario de Admisión",
    ...
  }
}
```

---

#### `GET /api/forms/[id]`
**Descripción:** Obtiene los detalles de un formulario específico con las últimas 10 submissions.

**Autenticación:** Requerida

**Response:**
```json
{
  "form": {
    "id": "uuid",
    "name": "Historia Clínica",
    "fields": [...],
    ...
  },
  "recent_submissions": [
    {
      "id": "uuid",
      "patient": {
        "nombre": "Juan",
        "apellido_paterno": "Pérez"
      },
      "status": "submitted",
      "submitted_at": "2025-01-15T14:30:00Z"
    }
  ]
}
```

---

#### `PUT /api/forms/[id]`
**Descripción:** Actualiza un formulario existente.

**Autenticación:** Requerida

**Body:** (todos los campos son opcionales)
```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripción",
  "fields": [...],
  "active": false
}
```

**Response:**
```json
{
  "form": {
    "id": "uuid",
    "name": "Nuevo nombre",
    ...
  }
}
```

---

#### `DELETE /api/forms/[id]`
**Descripción:** Elimina un formulario (hard delete).

**Autenticación:** Requerida

**Response:**
```json
{
  "message": "Formulario eliminado"
}
```

---

### 2. Envío de Formularios a Pacientes

#### `POST /api/forms/[id]/send`
**Descripción:** Genera un token único y prepara el envío del formulario a un paciente.

**Autenticación:** Requerida

**Body:**
```json
{
  "patient_id": "uuid",
  "expiration_hours": 72,
  "send_via": "whatsapp"
}
```

**Parámetros:**
- `patient_id` (requerido): ID del paciente
- `expiration_hours` (opcional, default: 72): Horas de validez del token
- `send_via` (opcional, default: "whatsapp"): "whatsapp", "email" o "manual"

**Response:**
```json
{
  "success": true,
  "token": "abc123...",
  "public_url": "https://app.com/public/forms/abc123...",
  "expires_at": "2025-01-18T14:30:00Z",
  "patient": {
    "id": "uuid",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "+521234567890"
  },
  "send_result": {
    "method": "whatsapp",
    "recipient": "+521234567890",
    "status": "ready",
    "message": "Listo para enviar por WhatsApp (requiere integración Twilio)"
  },
  "message_template": "Hola Juan Pérez, te comparto el formulario..."
}
```

**Notas:**
- Si ya existe un token válido para ese form+patient, lo reutiliza
- El envío real de WhatsApp/Email requiere integración con Twilio/SendGrid

---

### 3. Acceso Público al Formulario (Sin Autenticación)

#### `GET /api/public/forms/[token]`
**Descripción:** Obtiene el formulario usando un token público. Registra la apertura automáticamente.

**Autenticación:** NO requerida

**Response (si es válido):**
```json
{
  "status": "active",
  "form": {
    "id": "uuid",
    "name": "Historia Clínica General",
    "description": "Por favor completa todos los campos",
    "fields": [
      {
        "id": "field_1",
        "type": "text",
        "label": "Nombre completo",
        "required": true
      },
      {
        "id": "field_2",
        "type": "date",
        "label": "Fecha de nacimiento",
        "required": true
      }
    ],
    "require_signature": true,
    "allow_file_upload": false
  },
  "patient": {
    "nombre": "Juan",
    "apellido_paterno": "Pérez",
    "apellido_materno": "González"
  },
  "expires_at": "2025-01-18T14:30:00Z",
  "require_signature": true,
  "allow_file_upload": false
}
```

**Response (si ya fue completado):**
```json
{
  "status": "completed",
  "message": "Este formulario ya fue completado",
  "completed_at": "2025-01-15T16:00:00Z"
}
```

---

#### `POST /api/public/forms/[token]`
**Descripción:** Envía las respuestas del formulario completado.

**Autenticación:** NO requerida

**Body:**
```json
{
  "responses": {
    "field_1": "Juan Pérez González",
    "field_2": "1990-05-15",
    "field_3": "Diabetes tipo 2"
  },
  "signature_data": "data:image/png;base64,iVBORw0KGgo...",
  "uploaded_files": [
    {
      "field_id": "field_5",
      "url": "https://storage.supabase.co/...",
      "filename": "laboratorio.pdf",
      "size": 245000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Formulario completado exitosamente",
  "submission_id": "uuid",
  "submitted_at": "2025-01-15T16:00:00Z"
}
```

**Notas:**
- El token queda marcado como "completed" automáticamente
- Se registra IP address y User Agent del cliente
- `signature_data` es opcional (solo si require_signature=true)
- `uploaded_files` es opcional (solo si allow_file_upload=true)

---

### 4. Gestión de Respuestas (Doctor - Autenticado)

#### `GET /api/forms/[id]/submissions`
**Descripción:** Lista todas las respuestas recibidas para un formulario.

**Autenticación:** Requerida

**Response:**
```json
{
  "form_id": "uuid",
  "total": 15,
  "submissions": [
    {
      "id": "uuid",
      "form_id": "uuid",
      "patient_id": "uuid",
      "patient": {
        "id": "uuid",
        "nombre": "Juan",
        "apellido_paterno": "Pérez",
        "email": "juan@example.com",
        "telefono": "+521234567890"
      },
      "responses": {
        "field_1": "Juan Pérez González",
        "field_2": "1990-05-15"
      },
      "signature_data": "data:image/png;base64,...",
      "uploaded_files": [...],
      "status": "submitted",
      "submitted_at": "2025-01-15T16:00:00Z",
      "ip_address": "192.168.1.1",
      "reviewed_by": null,
      "reviewed_at": null
    }
  ]
}
```

---

#### `GET /api/submissions/[id]`
**Descripción:** Obtiene los detalles completos de una submission específica.

**Autenticación:** Requerida

**Response:**
```json
{
  "submission": {
    "id": "uuid",
    "form": {
      "id": "uuid",
      "name": "Historia Clínica General",
      "fields": [...]
    },
    "patient": {
      "id": "uuid",
      "nombre": "Juan",
      "apellido_paterno": "Pérez",
      "email": "juan@example.com",
      "fecha_nacimiento": "1990-05-15"
    },
    "responses": {...},
    "signature_data": "data:image/png;base64,...",
    "uploaded_files": [...],
    "status": "submitted",
    "submitted_at": "2025-01-15T16:00:00Z",
    "reviewed_by": null,
    "reviewed_at": null,
    "reviewed_by_user": null
  }
}
```

---

#### `PUT /api/submissions/[id]`
**Descripción:** Actualiza el estado de revisión de una submission.

**Autenticación:** Requerida

**Body:**
```json
{
  "status": "reviewed"
}
```

**Estados válidos:**
- `submitted`: Recién enviado
- `reviewed`: Revisado por el doctor
- `approved`: Aprobado
- `rejected`: Rechazado

**Response:**
```json
{
  "success": true,
  "submission": {
    "id": "uuid",
    "status": "reviewed",
    "reviewed_by": "doctor_user_id",
    "reviewed_at": "2025-01-15T17:00:00Z",
    ...
  }
}
```

---

## Seguridad

### Autenticación
- **Endpoints privados** (doctor): Requieren header `Authorization: Bearer <token>`
- **Endpoints públicos** (paciente): No requieren auth, validación por token único

### RLS (Row Level Security)
- **intake_forms**: Los doctores solo ven/editan sus propios formularios
- **form_submissions**: Los doctores solo ven submissions de sus formularios
- **form_tokens**: Validación pública mediante función `is_form_token_valid()`

### Validaciones
- Tokens tienen expiración configurable (default: 72 horas)
- Tokens son de un solo uso (marcan como "completed" después de submit)
- Se registra IP y User Agent en cada submission
- Verificación de ownership en todos los endpoints privados

---

## Flujo Completo de Uso

### 1. Doctor crea formulario
```
POST /api/forms
Body: { name, fields, require_signature, ... }
```

### 2. Doctor envía formulario a paciente
```
POST /api/forms/{formId}/send
Body: { patient_id, expiration_hours: 72, send_via: "whatsapp" }
Response: { public_url: "https://app.com/public/forms/abc123..." }
```

### 3. Paciente abre el link
```
GET /api/public/forms/abc123...
Response: { form con todos los campos, patient info, expires_at }
```

### 4. Paciente completa y envía el formulario
```
POST /api/public/forms/abc123...
Body: { responses, signature_data, uploaded_files }
Response: { success: true, submission_id }
```

### 5. Doctor revisa las respuestas
```
GET /api/forms/{formId}/submissions
Response: { submissions: [todas las respuestas recibidas] }

GET /api/submissions/{submissionId}
Response: { submission con detalles completos }

PUT /api/submissions/{submissionId}
Body: { status: "reviewed" }
```

---

## Próximos Pasos

### Backend Completado ✅
- [x] CRUD de formularios
- [x] Generación de tokens
- [x] Endpoints públicos de acceso
- [x] Gestión de submissions
- [x] Actualización de estados

### Pendiente: Frontend
- [ ] UI de Form Builder (drag-drop para crear formularios)
- [ ] Selector de templates pre-diseñados
- [ ] Modal de envío (seleccionar paciente, método, expiración)
- [ ] Dashboard de submissions recibidas
- [ ] Página pública de formulario (/public/forms/[token])
- [ ] Canvas para firma digital
- [ ] Upload de archivos (integración con Supabase Storage)

### Integraciones Pendientes
- [ ] Twilio para envío de WhatsApp
- [ ] SendGrid/SMTP para envío de Email
- [ ] Supabase Storage para manejo de archivos adjuntos

---

## Tipos de Campos Soportados

```typescript
type FieldType = 
  | 'text'           // Texto corto
  | 'textarea'       // Texto largo
  | 'email'          // Email
  | 'phone'          // Teléfono
  | 'number'         // Número
  | 'date'           // Fecha
  | 'select'         // Dropdown
  | 'radio'          // Radio buttons
  | 'checkbox'       // Checkboxes
  | 'file'           // Upload de archivo
  | 'signature'      // Canvas de firma
```

Ejemplo de field en JSONB:
```json
{
  "id": "field_1",
  "type": "select",
  "label": "Tipo de sangre",
  "required": true,
  "options": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "placeholder": "Selecciona tu tipo de sangre"
}
```

---

## Templates Pre-cargados

### 1. Historia Clínica General
- Nombre completo
- Fecha de nacimiento
- Tipo de sangre
- Alergias conocidas
- Medicamentos actuales
- Antecedentes familiares
- Motivo de consulta
- Síntomas actuales
- Consentimiento informado
- Firma digital

### 2. Consentimiento Informado
- Nombre completo del paciente
- Fecha de nacimiento
- Procedimiento a realizar
- He leído y comprendo el procedimiento (checkbox)
- Firma digital

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos o faltantes |
| 401 | Unauthorized - Token de autenticación inválido o faltante |
| 403 | Forbidden - No tienes permiso para acceder a este recurso |
| 404 | Not Found - Recurso no encontrado o token expirado |
| 500 | Internal Server Error - Error en el servidor |

---

**Última actualización:** 2025-01-15
**Versión API:** 1.0
