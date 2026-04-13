# 🤖 Agente de Recordatorios Automáticos

Agente autónomo que envía recordatorios de citas a pacientes 24 horas antes.

## 🎯 Funcionalidad

- **Corre automáticamente** cada día a las 10:00 AM (hora de México)
- Busca todas las citas del **día siguiente**
- Envía WhatsApp/SMS a cada paciente
- Registra todos los envíos en `reminder_logs`
- Maneja errores y reintentos

## 📋 Configuración

### 1. Variables de entorno

Agrega a Vercel:

```bash
CRON_SECRET=tu_secret_super_seguro_aqui
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 2. Crear tabla en Supabase

Ejecuta el SQL en `migrations/001_reminder_logs.sql`

### 3. Deploy

```bash
npx vercel --prod
```

El cron job se configura automáticamente en `vercel.json`.

## 🧪 Testing Manual

Para probar el agente sin esperar al cron:

```bash
curl -X GET https://agendamedpro.com/api/agents/reminders \
  -H "Authorization: Bearer tu_cron_secret"
```

## 📊 Logs

El agente registra todo en:
- Console logs (Vercel Functions logs)
- Tabla `reminder_logs` (Supabase)

Ver logs en:
- https://vercel.com/tu-proyecto/deployments → Seleccionar deployment → Functions

## 🔄 Flujo del Agente

```
10:00 AM (daily)
    ↓
Vercel Cron ejecuta GET /api/agents/reminders
    ↓
Busca citas de mañana (confirmed/pending)
    ↓
Para cada cita:
  - Obtener datos del paciente
  - Enviar WhatsApp/SMS via Twilio
  - Registrar en reminder_logs
    ↓
Retorna resumen (enviados, fallidos)
```

## ⚙️ Configuración del Cron

En `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/agents/reminders",
      "schedule": "0 10 * * *"  // 10:00 AM diario
    }
  ]
}
```

Formato: minuto hora día mes día-semana (UTC)
- `0 10 * * *` = 10:00 AM todos los días

## 📱 Integración WhatsApp/Twilio

### Setup Twilio:

1. Crear cuenta en https://twilio.com
2. Activar WhatsApp Sandbox
3. Obtener credentials
4. Agregar a Vercel env vars

### Código de integración:

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

await client.messages.create({
  body: mensaje,
  from: 'whatsapp:+14155238886',
  to: `whatsapp:+52${phone}`
});
```

## 🎨 Personalización

### Cambiar horario del agente:

Edita `vercel.json`:
```json
"schedule": "0 18 * * *"  // 6:00 PM
```

### Cambiar mensaje del recordatorio:

Edita `app/api/agents/reminders/route.ts`:
```typescript
const message = `Tu mensaje personalizado aquí`;
```

### Agregar confirmación de respuesta:

1. Configurar webhook de Twilio
2. Crear endpoint `/api/webhooks/twilio`
3. Actualizar `confirmed` en `reminder_logs`

## 📈 Métricas

Consultar efectividad:

```sql
-- Tasa de envío exitoso
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN message_sent THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN confirmed THEN 1 ELSE 0 END) as confirmed
FROM reminder_logs
WHERE sent_at >= NOW() - INTERVAL '7 days';
```

## 🚨 Troubleshooting

**Problema:** Cron no ejecuta
- Verificar que el proyecto esté en plan Pro de Vercel
- Revisar logs en Vercel dashboard

**Problema:** Recordatorios no se envían
- Verificar CRON_SECRET en env vars
- Revisar credentials de Twilio
- Checar logs de la función

**Problema:** Pacientes no reciben WhatsApp
- Verificar número en formato correcto (+52...)
- Confirmar que Twilio WhatsApp Sandbox está activo
- Verificar saldo de Twilio

## 💰 Costos

- Vercel Cron: **Gratis** (Pro plan)
- Twilio WhatsApp: **$0.005/mensaje**
- Twilio SMS: **$0.0075/mensaje**

Ejemplo: 100 pacientes/día = **$0.50/día** = **$15/mes**

## ✅ Estado Actual

- [x] Endpoint del agente creado
- [x] Lógica de búsqueda de citas
- [x] Logging en base de datos
- [x] Cron job configurado
- [ ] Integración Twilio (pendiente credentials)
- [ ] Webhook de confirmaciones
- [ ] Dashboard de métricas
