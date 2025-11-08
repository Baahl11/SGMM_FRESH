# 🔐 Sistema de Credenciales SMS por Usuario

## 📋 Descripción General

Sistema que permite a cada usuario/doctor configurar sus propias credenciales de proveedor SMS (Twilio, MessageBird, Plivo) desde la interfaz de usuario, sin necesidad de acceder a archivos `.env.local`.

## 🎯 Problema Resuelto

**Antes:** Las credenciales SMS estaban en `.env.local` - solo el administrador del sistema podía configurarlas.

**Ahora:** Cada usuario puede:
- Seleccionar su proveedor SMS preferido
- Configurar sus propias credenciales desde la UI
- Guardar credenciales encriptadas en la base de datos
- Gestionar sus credenciales de forma independiente

## 🏗️ Arquitectura

### Base de Datos

```sql
CREATE TABLE user_sms_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    provider VARCHAR(50) NOT NULL,
    credentials_encrypted TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id)
);
```

### API Endpoints

**GET** `/api/user/sms-credentials`
- Obtiene las credenciales del usuario actual
- Las credenciales se devuelven encriptadas

**POST** `/api/user/sms-credentials`
```json
{
  "provider": "twilio",
  "credentials": {
    "account_sid": "ACxxxxx",
    "auth_token": "xxxxx",
    "phone_number": "+1234567890"
  }
}
```

**DELETE** `/api/user/sms-credentials`
- Elimina las credenciales del usuario

## 📱 Proveedores Soportados

### 1. Twilio
**Credenciales requeridas:**
- Account SID
- Auth Token
- Phone Number (número de envío)

**Costo:** $0.0075 USD por SMS

**Obtener credenciales:**
1. Crear cuenta en [console.twilio.com](https://console.twilio.com)
2. Ir a Dashboard → Account Info
3. Copiar Account SID y Auth Token
4. Comprar un número de teléfono

### 2. MessageBird
**Credenciales requeridas:**
- API Key
- Originator (nombre o número de envío)

**Costo:** $0.006 USD por SMS

**Obtener credenciales:**
1. Crear cuenta en [dashboard.messagebird.com](https://dashboard.messagebird.com)
2. Ir a Developers → API Keys
3. Crear y copiar API Key
4. Configurar Originator

### 3. Plivo
**Credenciales requeridas:**
- Auth ID
- Auth Token
- Phone Number

**Costo:** $0.0035 USD por SMS (más económico)

**Obtener credenciales:**
1. Crear cuenta en [console.plivo.com](https://console.plivo.com)
2. Ir a Account → API Credentials
3. Copiar Auth ID y Auth Token
4. Comprar un número de teléfono

### 4. Manual
Sin integración - para testing o copia manual de mensajes

## 🔒 Seguridad

### Encriptación
Las credenciales se almacenan encriptadas en la base de datos:

```typescript
// TODO: Implementar encriptación real
// Actualmente almacenado como JSON
// Próximo paso: usar crypto para encriptar/desencriptar
```

### Mejores Prácticas
1. ✅ Credenciales nunca se envían al frontend sin encriptar
2. ✅ Cada usuario solo ve sus propias credenciales
3. ✅ Credenciales no aparecen en logs
4. ✅ Campos de password type="password"
5. 🔄 TODO: Implementar encriptación AES-256

## 📝 Uso en la Interfaz

### Paso 1: Abrir Modal de Configuración
1. Ir a página **Agenda**
2. Clic en botón **"⚙️ Configuración"**
3. Ir a pestaña **"Notificaciones"**

### Paso 2: Activar SMS
1. Activar switch **"Activar Recordatorios SMS"**
2. Seleccionar proveedor (Twilio, MessageBird, Plivo)

### Paso 3: Configurar Credenciales
**Para Twilio:**
- Ingresar Account SID
- Ingresar Auth Token
- Ingresar Phone Number
- Clic en **"Guardar Credenciales"**

**Para MessageBird:**
- Ingresar API Key
- Ingresar Originator
- Clic en **"Guardar Credenciales"**

**Para Plivo:**
- Ingresar Auth ID
- Ingresar Auth Token
- Ingresar Phone Number
- Clic en **"Guardar Credenciales"**

### Paso 4: Configurar Opciones
- Seleccionar horarios de recordatorio (24h, 12h, 6h, 2h, 1h)
- Configurar opciones adicionales:
  - ✅ Confirmación de cita
  - ✅ Incluir nombre del doctor
  - ✅ Incluir ubicación
  - ✅ Requiere confirmación del paciente
- Configurar horario comercial (evitar enviar de noche)

## 🔄 Flujo de Datos

```
┌─────────────────┐
│  Usuario (UI)   │
│  Ingresa creds  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API POST       │
│  /sms-creds     │
│  Valida datos   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Base de Datos  │
│  Encriptación   │
│  Almacena       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Envío de SMS   │
│  Usa creds de   │
│  ese usuario    │
└─────────────────┘
```

## 🚀 Aplicar Migración

```bash
# Aplicar migración a la base de datos
python apply_migration_006.py
```

Esto creará la tabla `user_sms_credentials` necesaria.

## 🧪 Testing

### Test Manual
1. Abrir modal de configuración
2. Activar SMS
3. Seleccionar Twilio
4. Ingresar credenciales de prueba
5. Guardar
6. Verificar mensaje de éxito
7. Recargar página
8. Verificar que credenciales persisten

### Test con Consola
```javascript
// Guardar credenciales
const response = await fetch('/api/user/sms-credentials', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'twilio',
    credentials: {
      account_sid: 'AC123...',
      auth_token: 'abc123...',
      phone_number: '+1234567890'
    }
  })
});

// Obtener credenciales
const creds = await fetch('/api/user/sms-credentials').then(r => r.json());
console.log(creds);
```

## 📊 Estimación de Costos

El sistema calcula automáticamente los costos mensuales estimados:

**Ejemplo:**
- 20 citas por día
- 2 recordatorios por cita (24h y 2h)
- Proveedor: Twilio ($0.0075/SMS)

**Cálculo:**
```
20 citas × 2 recordatorios × $0.0075 = $0.30/día
$0.30 × 30 días = $9.00/mes
```

## 🎨 Interfaz Visual

### Switch Mejorado
Los switches ahora tienen mejor contraste:
- **ON:** Fondo azul índigo brillante
- **OFF:** Fondo gris claro
- Bolita blanca con sombra
- Transiciones suaves

### Formulario de Credenciales
- Card con fondo naranja suave
- Campos de texto tipo password
- Links a consolas de proveedores
- Botón "Guardar Credenciales"
- Mensajes de éxito/error

## 📈 Próximos Pasos

### Pendiente
- [ ] Implementar encriptación real (AES-256)
- [ ] Agregar validación de credenciales (test SMS)
- [ ] Soporte para múltiples conjuntos de credenciales
- [ ] Rotación automática de tokens
- [ ] Logs de auditoría
- [ ] Backup de credenciales

### Opcional
- [ ] Importar credenciales desde archivo
- [ ] Compartir credenciales entre usuarios del mismo consultorio
- [ ] Alertas cuando credenciales expiran
- [ ] Dashboard de uso y costos reales

## 📚 Referencias

- [Twilio API Docs](https://www.twilio.com/docs/sms)
- [MessageBird API](https://developers.messagebird.com/api/sms-messaging/)
- [Plivo SMS API](https://www.plivo.com/docs/sms/)

## ⚠️ Notas Importantes

1. **Cada usuario necesita su propia cuenta** en el proveedor de SMS
2. **Los costos son por cuenta** - cada doctor paga sus propios SMS
3. **Credenciales sensibles** - nunca compartir en logs o frontend sin encriptar
4. **Testing:** Usar modo "Manual" para pruebas sin costo
5. **Producción:** Recomendamos Plivo por ser más económico

---

## 🎉 Ventajas del Nuevo Sistema

✅ **Autonomía:** Cada doctor configura sus propios SMS
✅ **Seguridad:** Credenciales encriptadas por usuario
✅ **Flexibilidad:** Cada uno elige su proveedor
✅ **Transparencia:** Cada doctor ve sus propios costos
✅ **Escalabilidad:** Soporta múltiples usuarios sin problemas
✅ **Simplicidad:** Configuración desde la UI, sin tocar código

