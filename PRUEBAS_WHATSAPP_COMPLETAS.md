# 🧪 Guía de Pruebas Completas - WhatsApp + AI + Recordatorios

## ✅ Pre-requisitos
- [x] WhatsApp configurado con Phone Number ID
- [x] Access Token permanente guardado
- [x] Webhook configurado en Meta (si aún no, ver paso 1)

---

## 📋 PASO 1: Configurar Webhook en Meta

### 1.1 Ir a tu App en Meta
1. Ve a https://developers.facebook.com/apps
2. Selecciona tu app
3. En el menú lateral: **WhatsApp → Configuration**

### 1.2 Agregar Webhook URL
En la sección "Webhook":

**Callback URL:**
```
https://agendamedpro.com/api/webhooks/whatsapp
```

**Verify Token:**
```
agendamedpro_verify_2026
```

Haz clic en **"Verify and Save"**

### 1.3 Suscribirse a Eventos
Marca estas casillas en "Webhook fields":
- ✅ **messages** (recibir mensajes)
- ✅ **message_status** (estados de entrega - opcional)

**Guardar cambios**

---

## 🧪 PASO 2: Probar Asistente IA

### 2.1 Enviar mensaje desde tu WhatsApp
1. Abre WhatsApp en tu celular
2. Envía un mensaje al número configurado en Meta
3. Escribe algo como:
   ```
   Hola, quiero agendar una cita
   ```

### 2.2 ¿Qué debería pasar?
✅ **El bot debe responder automáticamente** en menos de 5 segundos con:
- Saludo personalizado
- Menú de opciones
- Información sobre servicios

### 2.3 Si NO responde...
**Verificar en Vercel:**
1. Ve a https://vercel.com/guillermo-melgarejos-projects/vercel-migration
2. Busca la pestaña **"Functions"**
3. Busca `/api/webhooks/whatsapp`
4. Revisa los logs de ejecución

**Verificar en Meta:**
1. Ve a **WhatsApp → Configuration**
2. Busca sección "Webhooks"
3. Haz clic en **"Test"** al lado del webhook
4. Debe decir "Success" o mostrar el error

---

## 📅 PASO 3: Probar Recordatorios Automáticos

### 3.1 Crear una Cita de Prueba
1. Ve a https://agendamedpro.com/dashboard/appointments
2. Crea una cita para **dentro de 23 horas** (para probar recordatorio de 24h)
3. Asegúrate de:
   - ✅ Seleccionar un paciente con número de WhatsApp
   - ✅ Poner fecha/hora futura (23 horas desde ahora)
   - ✅ Estado: "confirmada" o "pendiente"

### 3.2 ¿Qué debería pasar?
**Recordatorio 24 horas antes:**
- El cron job corre cada hora
- Encuentra citas entre 23-24 horas en el futuro
- Envía WhatsApp automáticamente

**Recordatorio 2 horas antes:**
- Similar, pero para citas entre 1.5-2.5 horas

### 3.3 Verificar que el Cron esté activo

**Opción A: Vercel Dashboard**
1. Ve a https://vercel.com/guillermo-melgarejos-projects/vercel-migration
2. Pestaña **"Cron Jobs"**
3. Debe aparecer: `0 * * * *` (cada hora)
4. Estado: ✅ Enabled

**Opción B: Ver logs del Cron**
1. En Vercel → **Functions**
2. Busca `/api/agents/reminders/cron`
3. Revisa ejecuciones recientes (cada hora)

### 3.4 Forzar prueba manual (sin esperar 1 hora)

Ejecuta esto en tu navegador con DevTools:

```javascript
// Ir a: https://agendamedpro.com/dashboard

// Enviar recordatorios AHORA (requiere CRON_SECRET)
fetch('/api/agents/reminders/cron', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer TU_CRON_SECRET_AQUI'
  }
}).then(r => r.json()).then(console.log)
```

**⚠️ IMPORTANTE:** Necesitas configurar `CRON_SECRET` en Vercel (ver paso 4)

---

## 🔐 PASO 4: Configurar CRON_SECRET (si no está)

### 4.1 Generar un Secret
Ejecuta en PowerShell:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Copia el resultado (algo como: `xK3mP9wQ2nL8vR4tY7uA5bN6cM1dF0eH`)

### 4.2 Agregarlo a Vercel
1. Ve a https://vercel.com/guillermo-melgarejos-projects/vercel-migration
2. **Settings → Environment Variables**
3. Agregar nueva:
   - **Name:** `CRON_SECRET`
   - **Value:** (pega el secret generado)
   - **Environment:** Production ✅
4. **Redeploy** la app para aplicar cambios

---

## 📊 PASO 5: Monitoreo y Debugging

### 5.1 Ver logs de WhatsApp en tiempo real

**Webhook logs:**
```
Vercel → Functions → /api/webhooks/whatsapp → View Invocations
```

**Qué buscar:**
- ✅ Status 200 = Todo bien
- ❌ Status 500 = Error del servidor
- ❌ Status 401/403 = Problema de autenticación

### 5.2 Ver logs de Recordatorios

**Cron logs:**
```
Vercel → Functions → /api/agents/reminders/cron
```

**Qué buscar:**
- `Found X appointments for 24h reminders`
- `Sent reminder to +52xxxxxxxxxx`
- `✅ Sent X reminders`

### 5.3 Verificar en Base de Datos

**Query en Supabase SQL Editor:**
```sql
-- Ver últimos mensajes de WhatsApp enviados
SELECT 
  a.appointment_date,
  a.recordatorio_enviado,
  a.recordatorio_24h_at,
  a.recordatorio_2h_at,
  p.name,
  p.whatsapp_phone
FROM appointments a
JOIN patients p ON a.patient_id = p.id
WHERE a.appointment_date > NOW()
ORDER BY a.appointment_date ASC
LIMIT 20;
```

---

## 🎯 Checklist Final

### ✅ WhatsApp AI Assistant
- [ ] Webhook configurado en Meta
- [ ] Mensaje de prueba enviado
- [ ] Bot respondió automáticamente
- [ ] Logs en Vercel sin errores

### ✅ Recordatorios Automáticos
- [ ] Cron job visible en Vercel
- [ ] CRON_SECRET configurado
- [ ] Cita de prueba creada (23 horas futuro)
- [ ] Recordatorio enviado correctamente

### ✅ Monitoreo
- [ ] Logs accesibles en Vercel
- [ ] Base de datos marca `recordatorio_enviado = true`
- [ ] Timestamps `recordatorio_24h_at` actualizados

---

## 🚨 Solución de Problemas Comunes

### Problema 1: Bot no responde
**Causa:** Webhook no configurado o token incorrecto

**Solución:**
1. Verificar webhook en Meta
2. Hacer "Test" del webhook en Meta
3. Revisar logs en Vercel Functions

### Problema 2: Recordatorios no se envían
**Causa:** CRON_SECRET faltante o cron job deshabilitado

**Solución:**
1. Configurar CRON_SECRET en Vercel
2. Verificar cron job en pestaña "Cron Jobs"
3. Forzar ejecución manual con el endpoint

### Problema 3: Error "Invalid token"
**Causa:** Access Token expiró (si usaste temporal)

**Solución:**
1. Generar nuevo token PERMANENTE en Meta
2. Ir a System Users → Generate Token → "Never expires"
3. Actualizar en Dashboard de AgendaMedPro

### Problema 4: "Phone number not registered"
**Causa:** Número de WhatsApp no verificado en Meta

**Solución:**
1. Ve a WhatsApp → API Setup en Meta
2. Verifica que el número tenga checkmark verde
3. Si no, sigue proceso de verificación de Meta

---

## 📞 Endpoints Útiles

### Probar conexión manual:
```bash
curl -X POST https://agendamedpro.com/api/whatsapp/validate-config \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number_id": "TU_PHONE_NUMBER_ID",
    "access_token": "TU_ACCESS_TOKEN"
  }'
```

### Enviar recordatorios manualmente:
```bash
curl https://agendamedpro.com/api/agents/reminders/cron \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

---

## ✨ Todo funcionando?

Si todos los checks están ✅:

🎉 **¡Sistema completamente operativo!**

- Asistente IA responde 24/7
- Recordatorios se envían automáticamente cada hora
- Logs disponibles para debugging
- 1,000 mensajes gratis/mes de Meta

**Siguiente paso:** Invita a pacientes reales a probar el sistema!
