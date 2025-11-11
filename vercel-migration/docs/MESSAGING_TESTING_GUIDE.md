# 🧪 Guía de Testing - Sistema de Mensajería

## 📋 Pre-requisitos

1. **Session Token**: Necesitas estar autenticado
2. **Credenciales SMS**: Twilio, MessageBird o Plivo
3. **Número de prueba**: Un teléfono válido para recibir SMS

---

## 🚀 Opción 1: Script Interactivo (Node.js)

### Instalación
```bash
cd vercel-migration
npm install node-fetch readline
```

### Uso
```bash
node scripts/test-messaging.mjs
```

**Características:**
- ✅ Interfaz interactiva paso a paso
- ✅ Configurar credenciales SMS
- ✅ Enviar mensajes de prueba
- ✅ Ver mensajes recientes
- ✅ Ejecutar worker manualmente

---

## 🔧 Opción 2: Script PowerShell

### Configuración

1. **Obtener Session Token**:
   ```
   1. Abre http://localhost:3000 en tu navegador
   2. Inicia sesión
   3. F12 > Application > Cookies
   4. Copia el valor de "sb-access-token"
   ```

2. **Editar script**:
   ```powershell
   # Abrir en editor
   code scripts/test-messaging.ps1
   
   # Actualizar:
   $SESSION_TOKEN = "tu_token_aqui"
   $CRON_SECRET = "dev_cron_secret_12345"
   ```

3. **Ejecutar**:
   ```powershell
   cd vercel-migration
   .\scripts\test-messaging.ps1
   ```

---

## 📱 Opción 3: Testing Manual (Paso a Paso)

### Paso 1: Configurar Credenciales

**Endpoint**: `POST /api/user/sms-credentials`

```bash
curl -X POST http://localhost:3000/api/user/sms-credentials \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "provider": "twilio",
    "credentials": {
      "account_sid": "AC1234567890abcdef",
      "auth_token": "your_auth_token",
      "phone_number": "+15551234567"
    }
  }'
```

**Respuesta esperada**:
```json
{
  "success": true,
  "provider": {
    "id": "uuid-here",
    "channel": "sms",
    "provider": "twilio",
    "status": "active"
  }
}
```

---

### Paso 2: Enviar Mensaje de Prueba

**Endpoint**: `POST /api/messaging/send`

```bash
curl -X POST http://localhost:3000/api/messaging/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "channel": "sms",
    "to_contact": {
      "phone": "+521234567890",
      "name": "Juan Pérez"
    },
    "body": "🧪 Mensaje de prueba desde SGMM Pro"
  }'
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": {
    "id": "msg-uuid",
    "status": "queued",
    "scheduled_at": "2025-11-10T12:00:00Z"
  },
  "job": {
    "id": "job-uuid",
    "run_at": "2025-11-10T12:00:00Z"
  }
}
```

---

### Paso 3: Ejecutar Worker Manualmente

**Endpoint**: `GET /api/cron/messaging-worker`

```bash
curl http://localhost:3000/api/cron/messaging-worker \
  -H "Authorization: Bearer dev_cron_secret_12345"
```

**Respuesta esperada**:
```json
{
  "success": true,
  "result": {
    "processed": 1,
    "succeeded": 1,
    "failed": 0,
    "errors": []
  },
  "duration_ms": 1250
}
```

---

### Paso 4: Verificar en Base de Datos

**Supabase SQL Editor**:

```sql
-- Ver el mensaje
SELECT 
  id,
  channel,
  to_contact->>'phone' as phone,
  body,
  status,
  sent_at,
  delivered_at,
  provider_message_id,
  error_message
FROM messaging_messages
ORDER BY created_at DESC
LIMIT 5;

-- Ver el job
SELECT 
  id,
  message_id,
  run_at,
  status,
  attempts,
  last_error
FROM messaging_jobs
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔍 Verificación de Estados

### Estados del Mensaje

| Estado | Descripción | Cuándo ocurre |
|--------|-------------|---------------|
| `queued` | En cola | Al crear el mensaje |
| `processing` | Procesando | Worker tomó el job |
| `sent` | Enviado | Provider confirmó recepción |
| `delivered` | Entregado | Webhook de delivery |
| `read` | Leído | Webhook de read receipt |
| `failed` | Fallido | Error en envío |

### Estados del Job

| Estado | Descripción |
|--------|-------------|
| `pending` | Esperando procesamiento |
| `processing` | Siendo procesado |
| `done` | Completado exitosamente |
| `failed` | Falló después de 3 reintentos |

---

## 🐛 Troubleshooting

### El mensaje no se envía

**Verificar**:
```sql
-- ¿Hay un provider activo?
SELECT * FROM messaging_providers 
WHERE user_id = 'tu-user-id' 
AND channel = 'sms' 
AND status = 'active';

-- ¿El job está pendiente?
SELECT * FROM messaging_jobs 
WHERE status = 'pending' 
AND run_at <= NOW();

-- ¿Hay errores en el mensaje?
SELECT error_message FROM messaging_messages 
WHERE id = 'tu-message-id';
```

### El worker no procesa

**Posibles causas**:
1. `MESSAGING_CIPHER_KEY` no configurado
2. Credenciales incorrectas
3. Job programado en el futuro
4. Cron no ejecutándose (solo en prod)

**Solución local**:
```bash
# Ejecutar worker manualmente
curl http://localhost:3000/api/cron/messaging-worker \
  -H "Authorization: Bearer dev_cron_secret_12345"
```

### Verificar logs en Vercel

**Producción**:
1. Ve a https://vercel.com/tu-proyecto
2. Deployments > Latest > Logs
3. Busca: `[Messaging Worker]`

---

## 📊 Endpoints de Monitoreo

### Ver Estadísticas
```bash
curl http://localhost:3000/api/messaging/stats \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

### Ver Mensajes Recientes
```bash
curl http://localhost:3000/api/messaging/recent \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

---

## ✅ Checklist de Testing

- [ ] Credenciales configuradas en `/api/user/sms-credentials`
- [ ] Mensaje enviado con `POST /api/messaging/send`
- [ ] Worker ejecutado (automático o manual)
- [ ] Mensaje actualizado a `sent` en DB
- [ ] SMS recibido en teléfono
- [ ] Webhook procesado (si configurado)
- [ ] Estado final: `delivered` o `read`

---

## 🎯 Ejemplo Completo

```bash
# 1. Configurar (solo una vez)
curl -X POST http://localhost:3000/api/user/sms-credentials \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{"provider":"twilio","credentials":{"account_sid":"AC...","auth_token":"...","phone_number":"+1..."}}'

# 2. Enviar mensaje
curl -X POST http://localhost:3000/api/messaging/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{"channel":"sms","to_contact":{"phone":"+52...","name":"Test"},"body":"Hola!"}'

# 3. Procesar inmediatamente (local)
curl http://localhost:3000/api/cron/messaging-worker \
  -H "Authorization: Bearer dev_cron_secret_12345"

# 4. Verificar resultado
curl http://localhost:3000/api/messaging/recent \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

---

## 📞 Testing con Proveedores Reales

### Twilio
- Dashboard: https://console.twilio.com
- Test Phone: +15005550006 (número mágico que siempre funciona)
- Ver logs: Console > Monitor > Logs > Messaging

### MessageBird
- Dashboard: https://dashboard.messagebird.com
- Test mode disponible con API key de test
- Ver logs: Messages > All messages

### Plivo
- Dashboard: https://console.plivo.com
- Powerpack: Crear en Messaging > Powerpack
- Ver logs: Messaging > All logs

---

**Última actualización**: Nov 10, 2025
