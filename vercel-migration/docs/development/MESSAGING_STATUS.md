# 🎯 Messaging Phase 1 - Estado Actual y Próximos Pasos

## ✅ Completado (Nov 7-8, 2025)

### 1. Infraestructura Base
- [x] **Schema SQL**: `supabase/migrations/20251107_messaging_core.sql` aplicado
  - 4 tablas nuevas: `messaging_providers`, `messaging_templates`, `messaging_messages`, `messaging_jobs`
  - RLS policies configuradas (user-scoped + service role)
  - Triggers `updated_at` funcionando
  - Índices optimizados

- [x] **TypeScript Types**: `types/messaging.ts`
  - Enums: `MessagingChannel`, `MessagingProviderType`, `MessagingProviderStatus`
  - Interfaces completas para todas las entidades
  - DTOs para operaciones CRUD

- [x] **Crypto Helpers**: `lib/crypto/messaging.ts`
  - `encryptMessagingSecret()` - XChaCha20-Poly1305 con libsodium
  - `decryptMessagingSecret()` - Decifrado seguro
  - `isEncryptedSecretEnvelope()` - Validación de estructura
  - Clave de cifrado generada: `h6BtcrXwyz61Rn7vKhBhrt0tqrJtsf0OyYvq7FqhlbU=`

- [x] **API Endpoint Actualizado**: `app/api/user/sms-credentials/route.ts`
  - GET: Retorna credenciales masking (`****1234`)
  - POST: Guarda credenciales cifradas en `messaging_providers`
  - DELETE: Elimina provider por canal
  - Validaciones por proveedor (Twilio, MessageBird, Plivo)

- [x] **Variables de Entorno**: `.env.local`
  ```
  MESSAGING_CIPHER_KEY=h6BtcrXwyz61Rn7vKhBhrt0tqrJtsf0OyYvq7FqhlbU=
  POSTGRES_HOST=aws-0-us-east-1.pooler.supabase.com
  POSTGRES_PORT=6543
  POSTGRES_USER=postgres.bpxppzgsgwjlqaykxgmb
  POSTGRES_PASSWORD=DZVfrgV7sBEmX0Uz
  ```

- [x] **Documentación**:
  - `docs/messaging-credential-security.md` - Plan de cifrado
  - `docs/messaging-rls-policies.md` - Estrategia RLS
  - `docs/messaging-schema-test-checklist.md` - QA checklist
  - `docs/MESSAGING_DEPLOYMENT_GUIDE.md` - Guía completa

### 2. Migración de Datos
- [x] Script TypeScript: `scripts/migrate_user_sms_credentials.ts`
- ✅ **Verificado**: `user_sms_credentials` tiene **0 registros** → No requiere migración
- Estado: **Listo para usar directamente con nuevas credenciales**

---

## � Fase 2 - Workers & Envío Real (COMPLETADA - Nov 8, 2025)

### Archivos Creados

1. **Adaptadores de Proveedores** ✅
   - `lib/messaging/types.ts` - Interfaces comunes
   - `lib/messaging/adapters/twilio.ts` - Twilio SMS
   - `lib/messaging/adapters/messagebird.ts` - MessageBird SMS
   - `lib/messaging/adapters/plivo.ts` - Plivo SMS
   - `lib/messaging/adapters/index.ts` - Factory pattern

2. **Worker de Procesamiento** ✅
   - `lib/workers/messaging-worker.ts`
   - Procesa `messaging_jobs` cada minuto
   - Actualiza estados en `messaging_messages`
   - Retry con exponential backoff (3 intentos)
   - Descifra credenciales automáticamente

3. **API de Envío** ✅
   - `app/api/messaging/send/route.ts`
   - POST: Crea mensaje + job
   - Validación de canal y contacto
   - Soporte para scheduling

4. **Webhooks de Delivery** ✅
   - `app/api/messaging/webhooks/[provider]/route.ts`
   - Recibe callbacks de Twilio/MessageBird/Plivo
   - Actualiza `sent_at`, `delivered_at`, `read_at`
   - Almacena raw webhook data en metadata

5. **Cron Job** ✅
   - `app/api/cron/messaging-worker/route.ts`
   - Ejecuta worker cada 60 segundos
   - Protegido con `CRON_SECRET`
   - Configurado en `vercel.json`

### Cómo Funciona el Sistema

```
Usuario → POST /api/messaging/send
          ↓
    Crea mensaje (status: queued)
          ↓
    Crea job (run_at: now/scheduled)
          ↓
Cron cada minuto → /api/cron/messaging-worker
          ↓
    Worker lee jobs pendientes
          ↓
    Descifra credenciales del provider
          ↓
    Envía SMS vía Twilio/MessageBird/Plivo
          ↓
    Actualiza mensaje (status: sent)
          ↓
    Marca job como done
          ↓
Provider → POST /api/messaging/webhooks/[provider]
          ↓
    Actualiza delivered_at, read_at
```

### Configuración del Webhook

Cada proveedor necesita configurar su webhook URL:

**Twilio:**
```
https://tu-dominio.vercel.app/api/messaging/webhooks/twilio
```

**MessageBird:**
```
https://tu-dominio.vercel.app/api/messaging/webhooks/messagebird
```

**Plivo:**
```
https://tu-dominio.vercel.app/api/messaging/webhooks/plivo
```

---

##  Próximos Pasos (Fase 3 - Testing & UI)

### 1. Testing del Sistema Completo (60 min)
```bash
# Hacer deploy
cd vercel-migration
npx vercel --prod

# Probar POST /api/messaging/send con Postman
curl -X POST https://tu-dominio.vercel.app/api/messaging/send \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_SESSION" \
  -d '{
    "channel": "sms",
    "to_contact": {
      "phone": "+521234567890",
      "name": "Juan Pérez"
    },
    "body": "Recordatorio: Tienes cita mañana a las 10:00 AM",
    "patient_id": "uuid-del-paciente",
    "appointment_id": "uuid-de-la-cita"
  }'

# Verificar que el cron se ejecuta
# En Vercel Dashboard → Deployments → Logs
# Buscar: [Messaging Worker] Starting job processing...
```

### 2. Integrar con Sistema de Citas
- [ ] Modificar creación de citas para auto-enviar SMS
- [ ] Agregar botón "Enviar recordatorio" en detalles de cita
- [ ] Mostrar historial de mensajes en perfil de paciente

### 3. Dashboard de Mensajes Enviados (UI)
- [ ] Crear `app/messaging/history/page.tsx`
- [ ] Tabla con filtros por estado/canal/fecha
- [ ] Gráficas de delivery rate
- [ ] Exportar a Excel

### 4. Templates UI
- [ ] CRUD de plantillas en `app/messaging/templates/page.tsx`
- [ ] Editor de placeholders (`{{patient_name}}`, `{{appointment_time}}`)
- [ ] Preview de mensaje antes de enviar

---

## 📦 Deploy a Producción

### Paso 1: Probar Endpoint API (15 min)
```bash
# Levantar servidor de desarrollo
cd vercel-migration
npm run dev

# En otro terminal o Postman:
# 1. POST - Guardar credenciales Twilio
curl -X POST http://localhost:3000/api/user/sms-credentials \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_SESSION" \
  -d '{
    "provider": "twilio",
    "credentials": {
      "account_sid": "AC123test",
      "auth_token": "secret123",
      "phone_number": "+1234567890"
    }
  }'

# 2. GET - Verificar masking
curl http://localhost:3000/api/user/sms-credentials \
  -H "Cookie: sb-access-token=YOUR_SESSION"

# 3. DELETE - Limpiar
curl -X DELETE http://localhost:3000/api/user/sms-credentials \
  -H "Cookie: sb-access-token=YOUR_SESSION"
```

### Paso 2: Verificar en DB (5 min)
```sql
-- En Supabase SQL Editor
SELECT 
  id,
  channel,
  provider,
  status,
  LEFT(credentials_encrypted, 100) as encrypted_preview,
  created_at
FROM messaging_providers
ORDER BY created_at DESC;
```

### Paso 3: Ejecutar Checklist QA (30 min)
Seguir: `docs/messaging-schema-test-checklist.md`
- [ ] Triggers `updated_at` funcionan
- [ ] RLS bloquea usuarios no autorizados
- [ ] Cifrado round-trip exitoso
- [ ] Foreign keys respetados
- [ ] Índices usados en queries

---

## 🚀 Fase 2 - Workers & Envío Real

### Archivos a Crear
1. **Worker de Procesamiento**
   - `lib/workers/messaging-worker.ts`
   - Procesa `messaging_jobs` cada minuto
   - Actualiza estados en `messaging_messages`

2. **Adaptadores de Proveedores**
   - `lib/messaging/adapters/twilio.ts`
   - `lib/messaging/adapters/messagebird.ts`
   - `lib/messaging/adapters/plivo.ts`
   - Interfaz común: `send(message) → Promise<result>`

3. **API de Templates**
   - `app/api/messaging/templates/route.ts`
   - CRUD para plantillas multicanal
   - Validación de placeholders

4. **API de Envío**
   - `app/api/messaging/send/route.ts`
   - Crea mensaje + job
   - Worker lo procesa automáticamente

5. **Webhooks**
   - `app/api/messaging/webhooks/[provider]/route.ts`
   - Recibe delivery status
   - Actualiza `sent_at`, `delivered_at`, `read_at`

### Tareas Técnicas
- [ ] Implementar `lib/workers/messaging-worker.ts`
- [ ] Crear adaptadores para Twilio/MessageBird/Plivo
- [ ] Edge Function o Cron para ejecutar worker cada 60s
- [ ] Endpoints POST `/api/messaging/send`
- [ ] Webhooks para delivery callbacks
- [ ] Dashboard de mensajes enviados (UI)

---

## 📂 Archivos Clave del Proyecto

### Schema & Migrations
- `vercel-migration/supabase/migrations/20251107_messaging_core.sql` ✅ Aplicado
- `vercel-migration/supabase/migrations/20251107_migrate_sms_credentials.sql` (Referencia)

### Types & Helpers
- `vercel-migration/types/messaging.ts` ✅
- `vercel-migration/lib/crypto/messaging.ts` ✅

### API Routes
- `vercel-migration/app/api/user/sms-credentials/route.ts` ✅ Actualizado

### Scripts
- `vercel-migration/scripts/migrate_user_sms_credentials.ts` (No necesario - 0 registros legacy)

### Documentación
- `vercel-migration/docs/messaging-credential-security.md`
- `vercel-migration/docs/messaging-rls-policies.md`
- `vercel-migration/docs/messaging-schema-test-checklist.md`
- `vercel-migration/docs/MESSAGING_DEPLOYMENT_GUIDE.md`

### Planning
- `vercel-migration/PLANS/messaging-schema.md`
- `vercel-migration/PLANS/messaging-integration-plan.md`
- `vercel-migration/TODO/phase-1-messaging.md` (Casi completo)

### Config
- `vercel-migration/.env.local` ✅ `MESSAGING_CIPHER_KEY` configurado
- `vercel-migration/package.json` ✅ Dependencies instaladas
- `vercel-migration/tsconfig.scripts.json` ✅

---

## 🎓 Contexto de Negocio

**Sistema**: SGMM Pro (Agenda Médica SaaS)
**Stack**: Next.js 15 + Supabase + PostgreSQL
**Objetivo**: Mensajería multi-canal unificada (SMS/WhatsApp/Email)
**Modelo**: BYOK (Bring Your Own Keys) - cada doctor configura sus credenciales
**Estado Actual**: Schema listo, endpoint funcional, pendiente testing y workers

---

## ⚡ Quick Start para Siguiente Sesión

```bash
cd vercel-migration
npm run dev

# Verificar que las tablas existen
# En Supabase SQL Editor:
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'messaging_%';

# Probar endpoint POST con Postman o Thunder Client
# Ver: docs/MESSAGING_DEPLOYMENT_GUIDE.md sección "Probar API"
```

---

## 🔑 Credenciales Importantes
- **Supabase URL**: https://bpxppzgsgwjlqaykxgmb.supabase.co
- **DB Password**: DZVfrgV7sBEmX0Uz
- **Cipher Key**: h6BtcrXwyz61Rn7vKhBhrt0tqrJtsf0OyYvq7FqhlbU=
- **Connection**: aws-0-us-east-1.pooler.supabase.com:6543

---

## 📦 Deploy a Producción

```bash
cd vercel-migration
git add .
git commit -m "feat: Fase 2 messaging - workers, send API, webhooks"
git push origin main
npx vercel --prod
```

### ⚠️ Post-Deploy Checklist
- [ ] Verificar que el cron `/api/cron/messaging-worker` se ejecuta cada minuto
- [ ] Configurar webhooks en Twilio/MessageBird/Plivo
- [ ] Probar envío de un SMS de prueba
- [ ] Revisar logs en Vercel Dashboard

---

**Última actualización**: Nov 8, 2025 - 18:45 UTC-6
**Fase actual**: 2 (Workers & Envío) → COMPLETADA ✅
**Siguiente**: Fase 3 (Testing & UI Dashboard)
