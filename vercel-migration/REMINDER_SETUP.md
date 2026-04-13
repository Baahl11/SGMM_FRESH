# Variables de Entorno para Sistema de Recordatorios

## 1. APLICAR MIGRACIÓN SQL
Primero, aplica la migración de base de datos:
1. Ve a Supabase Dashboard > SQL Editor
2. Ejecuta el contenido de: `migrations/add-reminder-columns.sql`
3. Verifica que las columnas se crearon correctamente

## 2. CONFIGURAR WHATSAPP (Meta/Facebook)
Ya tienes el servicio configurado en `lib/whatsapp-service.ts`
Asegúrate de tener estas variables en tu `.env.local` y Vercel:

```env
# WhatsApp API (Meta Business)
WHATSAPP_API_KEY=tu_token_de_acceso_permanente
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id

# O si prefieres usar Twilio (alternativa):
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## 3. CONFIGURAR CRON SECRET
Para proteger el endpoint del cron job:

```env
CRON_SECRET=genera_un_token_secreto_aleatorio_aqui
```

Genera un token seguro con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. APP URL
```env
NEXT_PUBLIC_APP_URL=https://agendamedpro.com
```

## 5. AGREGAR VARIABLES EN VERCEL
1. Ve a Vercel Dashboard > tu-proyecto > Settings > Environment Variables
2. Agrega todas las variables anteriores
3. Re-deploya el proyecto

## 6. PROBAR MANUALMENTE
Después del deploy, prueba enviando un recordatorio manual:

```bash
curl -X POST https://agendamedpro.com/api/agents/reminders/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_DE_USUARIO" \
  -d '{
    "type": "24h",
    "force": false
  }'
```

## 7. VERIFICAR CRON JOB
El cron job se ejecutará cada hora automáticamente.
URL protegida: `/api/agents/reminders/cron?secret=TU_CRON_SECRET`

## 8. MONITOREAR LOGS
En Vercel Dashboard > tu-proyecto > Logs
Busca por: [Reminders]

---

## Estructura Creada:

✅ `/api/agents/reminders/send` - Endpoint para envío manual/automático
✅ `/api/agents/reminders/cron` - Endpoint para cron job (cada hora)
✅ `migrations/add-reminder-columns.sql` - Migración de BD
✅ `vercel.json` - Configurado con cron job cada hora

## Próximos pasos opcionales:

- [ ] Dashboard para ver historial de recordatorios
- [ ] Configuración de templates personalizados por usuario
- [ ] Análisis de tasa de confirmación de citas
- [ ] Respuestas automáticas (webhook de WhatsApp)
