# Phase 1 Messaging - Deployment Guide

## Archivos Nuevos
```
supabase/migrations/
  └── 20251107_messaging_core.sql          # Schema principal
  └── 20251107_migrate_sms_credentials.sql # Referencia de migración de datos

types/
  └── messaging.ts                         # TypeScript types

lib/crypto/
  └── messaging.ts                         # Helpers de cifrado

app/api/user/sms-credentials/
  └── route.ts                             # API actualizada (cifrado integrado)

scripts/
  └── migrate_user_sms_credentials.ts      # Script de migración de datos

docs/
  ├── messaging-credential-security.md     # Plan de seguridad
  ├── messaging-rls-policies.md            # Estrategia RLS
  └── messaging-schema-test-checklist.md   # Checklist de pruebas

PLANS/
  ├── messaging-schema.md                  # Diseño del modelo
  └── messaging-integration-plan.md        # Plan general

TODO/
  └── phase-1-messaging.md                 # Tareas (casi todas ✓)
```

## Pasos para Desplegar

### 1. Instalar Dependencias
```bash
cd vercel-migration
npm install
```
Esto trae `libsodium-wrappers`, `ts-node`, `tsconfig-paths`.

### 2. Generar Clave de Cifrado
```bash
# Generar 32 bytes aleatorios en base64
openssl rand -base64 32
```
Ejemplo de salida: `Kq8Xz5vT9wL2Jh6Fp3Mn0Rg7Ys1Dc4Ue8Vb2Na5Qw==`

### 3. Configurar Variables de Entorno
Añadir a `.env.local` (desarrollo) y Vercel/Supabase (producción):
```env
MESSAGING_CIPHER_KEY=Kq8Xz5vT9wL2Jh6Fp3Mn0Rg7Ys1Dc4Ue8Vb2Na5Qw==
```

### 4. Aplicar Migración SQL Principal
```bash
# Opción A: Con Supabase CLI
cd vercel-migration
supabase db push

# Opción B: Manual en Supabase Dashboard
# 1. Ir a SQL Editor
# 2. Copiar contenido de supabase/migrations/20251107_messaging_core.sql
# 3. Ejecutar
```

### 5. Verificar Schema
```sql
-- Confirmar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'messaging_%'
ORDER BY table_name;

-- Debe retornar:
-- messaging_jobs
-- messaging_messages
-- messaging_providers
-- messaging_templates
```

### 6. Migrar Datos Existentes
```bash
cd vercel-migration
npm run migrate:sms-providers
```

Salida esperada:
```
▶ Starting migration of legacy SMS credentials
Cipher key loaded (44 chars). Processing 5 rows...
✓ Migrated credentials for user abc-123 (sms)
✓ Migrated credentials for user def-456 (sms)
Migration complete { total: 5, migrated: 5, skipped: 0 }
```

### 7. Verificar Migración
```sql
-- Contar proveedores migrados
SELECT channel, provider, COUNT(*) as total
FROM messaging_providers
GROUP BY channel, provider;

-- Ver un ejemplo cifrado
SELECT 
  user_id,
  channel,
  provider,
  status,
  LEFT(credentials_encrypted::text, 100) as encrypted_preview,
  created_at
FROM messaging_providers
LIMIT 1;
```

### 8. Probar API
```bash
# GET - Obtener credenciales (debe retornar masking)
curl -X GET http://localhost:3000/api/user/sms-credentials \
  -H "Cookie: your-session-cookie"

# POST - Guardar nuevas credenciales
curl -X POST http://localhost:3000/api/user/sms-credentials \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "provider": "twilio",
    "credentials": {
      "account_sid": "ACxxxxx",
      "auth_token": "xxxxx",
      "phone_number": "+1234567890"
    }
  }'

# DELETE - Eliminar credenciales
curl -X DELETE http://localhost:3000/api/user/sms-credentials \
  -H "Cookie: your-session-cookie"
```

### 9. Ejecutar Checklist de QA
Seguir `docs/messaging-schema-test-checklist.md`:
- [ ] Triggers de `updated_at` funcionan
- [ ] RLS bloquea usuarios no autorizados
- [ ] Cifrado round-trip exitoso
- [ ] Foreign keys se respetan
- [ ] Índices se usan en queries

### 10. Deploy a Producción
```bash
# 1. Aplicar migración SQL en Supabase producción
# 2. Configurar MESSAGING_CIPHER_KEY en Vercel
# 3. Desplegar app
vercel --prod

# 4. Ejecutar migración de datos en producción
DOTENV_CONFIG_PATH=.env.production npm run migrate:sms-providers
```

## Rollback (si es necesario)

### Deshacer Migración de Datos
```sql
-- Eliminar providers migrados
DELETE FROM messaging_providers WHERE channel = 'sms';

-- Los datos originales permanecen en user_sms_credentials
```

### Deshacer Schema
```sql
DROP TABLE IF EXISTS messaging_jobs CASCADE;
DROP TABLE IF EXISTS messaging_messages CASCADE;
DROP TABLE IF EXISTS messaging_templates CASCADE;
DROP TABLE IF EXISTS messaging_providers CASCADE;
```

## Próximos Pasos (Fase 2)
- [ ] Implementar worker para `messaging_jobs`
- [ ] Crear endpoints para templates y mensajes
- [ ] Integrar envío real via Twilio/MessageBird/Plivo
- [ ] Dashboard de monitoreo de mensajes
- [ ] Webhooks para delivery status
- [ ] Soporte para WhatsApp Business y Email

## Soporte
Para problemas o preguntas, revisar:
- `docs/messaging-credential-security.md` - Detalles de cifrado
- `docs/messaging-rls-policies.md` - Políticas de seguridad
- `PLANS/messaging-schema.md` - Diseño de datos
