# Guía de Migración: Encriptación AES-256-GCM para Facturama

## ✅ Cambios Implementados

### 1. Nueva Librería de Encriptación
📁 `lib/crypto/encryption.ts`
- AES-256-GCM (estándar enterprise-grade)
- IV aleatorio por registro (no reutilizable)
- Authentication tag anti-tampering
- Funciones: `encrypt()`, `decrypt()`, `decryptDatabaseField()`

### 2. Migración SQL
📁 `supabase/migrations/20251116_facturama_encryption_aes256.sql`
```sql
ALTER TABLE facturama_config
  ADD COLUMN api_password_iv TEXT,
  ADD COLUMN api_password_tag TEXT,
  ADD COLUMN encryption_migrated BOOLEAN DEFAULT false;
```

### 3. FacturamaClient Actualizado
📁 `lib/facturama/client.ts`
- Ahora usa `decryptDatabaseField()` automáticamente
- Compatible con formato viejo (base64) y nuevo (AES-256-GCM)
- Password se desencripta en constructor y se guarda en memoria

### 4. API Endpoints Actualizados
📁 `app/api/facturama/config/route.ts`
- `POST /api/facturama/config` → Usa `encrypt()` para guardar
- Almacena `encrypted`, `iv`, `tag` en DB
- Marca `encryption_migrated = true`

📁 `app/api/invoices/route.ts`
📁 `app/api/invoices/[id]/cancel/route.ts`
- Pasan `api_password_iv` y `api_password_tag` a FacturamaClient

### 5. Script de Migración de Datos
📁 `scripts/migrate-facturama-encryption.ts`
- Migra passwords base64 → AES-256-GCM
- Valida encriptación antes de migrar
- Reporta éxito/errores por registro

---

## 🚀 Pasos para Ejecutar la Migración

### Paso 1: Generar Master Key
```bash
openssl rand -hex 32
```

Copia el output (64 caracteres hex) y agrégalo a `.env.local`:

```env
# AES-256-GCM Encryption Key (CRITICAL - DO NOT COMMIT)
# Generated with: openssl rand -hex 32
ENCRYPTION_MASTER_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

⚠️ **IMPORTANTE:** 
- NUNCA commitees esta key a Git
- Guárdala en 1Password/Vault seguro
- En producción, usa Vercel Environment Variables

### Paso 2: Aplicar Migración SQL
```bash
cd vercel-migration
psql $DATABASE_URL -f supabase/migrations/20251116_facturama_encryption_aes256.sql
```

O desde Supabase Dashboard:
1. SQL Editor → New query
2. Pega el contenido de `20251116_facturama_encryption_aes256.sql`
3. Run

### Paso 3: Migrar Datos Existentes
```bash
cd vercel-migration
npx tsx scripts/migrate-facturama-encryption.ts
```

Output esperado:
```
🔐 Facturama Password Migration - Base64 → AES-256-GCM

Step 1: Validating encryption configuration...
✅ Encryption setup valid

Step 2: Finding configs that need migration...
📋 Found 3 config(s) to migrate

🔄 Migrating config abc-123...
   User: user-xyz
   API User: pruebas
   ✅ Decoded base64 password (length: 16)
   ✅ Encrypted with AES-256-GCM
   ✅ Database updated successfully
   ✅ Config abc-123 migration COMPLETE

============================================================
📊 Migration Summary
============================================================
✅ Successful: 3
❌ Failed: 0
📋 Total: 3
============================================================

🎉 All passwords migrated successfully!
```

### Paso 4: Validar en Producción
Crear un cliente de prueba con credenciales nuevas:

```bash
curl -X POST https://agendamedpro.com/api/facturama/config \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "api_user": "pruebas",
    "api_password": "pruebas2011",
    "is_sandbox": true,
    "emisor_rfc": "EKU9003173C9",
    "emisor_razon_social": "Clínica Dental Ejemplo",
    "emisor_regimen_fiscal": "612",
    "emisor_codigo_postal": "45050"
  }'
```

Verificar en DB:
```sql
SELECT 
  id,
  api_user,
  LENGTH(api_password_encrypted) as encrypted_length,
  LENGTH(api_password_iv) as iv_length,
  LENGTH(api_password_tag) as tag_length,
  encryption_migrated
FROM facturama_config
ORDER BY created_at DESC
LIMIT 1;
```

Resultado esperado:
```
encrypted_length | iv_length | tag_length | encryption_migrated
-----------------|-----------|------------|--------------------
      64-128     |     24    |     32     |       true
```

### Paso 5: Probar Facturación
```bash
# Test connection
curl -X PUT https://agendamedpro.com/api/facturama/config \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "api_user": "pruebas",
    "api_password": "pruebas2011",
    "is_sandbox": true
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Conexión exitosa con Facturama"
}
```

---

## 🔒 Seguridad

### Antes (❌ INSEGURO)
```typescript
// Base64 encoding (reversible fácilmente)
const password = "secret123";
const stored = Buffer.from(password).toString('base64'); // "c2VjcmV0MTIz"

// Cualquiera con acceso a DB puede hacer:
const decoded = Buffer.from(stored, 'base64').toString('utf8'); // "secret123" ✅
```

### Después (✅ SEGURO)
```typescript
// AES-256-GCM encryption
const password = "secret123";
const encrypted = encrypt(password);
// encrypted.encrypted: "7a3f8b2c1d4e..." (128 chars random)
// encrypted.iv:        "9f2a7b4c..." (24 chars random, único por registro)
// encrypted.tag:       "4e7c9a2f..." (32 chars, authentication tag)

// Sin ENCRYPTION_MASTER_KEY en .env, IMPOSIBLE desencriptar
const decrypted = decrypt(encrypted.encrypted, encrypted.iv, encrypted.tag);
// Requiere master key correcta ✅
// Si alguien modifica data, authentication tag falla ✅
```

### Comparación
| Aspecto | Base64 (Viejo) | AES-256-GCM (Nuevo) |
|---------|----------------|---------------------|
| Reversibilidad | ❌ Inmediata | ✅ Requiere master key |
| Protección tampering | ❌ No | ✅ Authentication tag |
| Estándar | ❌ Encoding | ✅ NIST encryption |
| PCI-DSS compliant | ❌ No | ✅ Sí |
| Unique per record | ❌ No (misma key) | ✅ Sí (random IV) |

---

## 🧪 Testing

### Test 1: Validar Encriptación/Desencriptación
```typescript
import { encrypt, decrypt } from '@/lib/crypto/encryption';

const original = "mi-password-super-secreto";
const encrypted = encrypt(original);
const decrypted = decrypt(encrypted.encrypted, encrypted.iv, encrypted.tag);

console.assert(decrypted === original, "Encryption roundtrip failed!");
console.log("✅ Encryption test passed");
```

### Test 2: Backward Compatibility
```typescript
import { decryptDatabaseField } from '@/lib/crypto/encryption';

// Formato viejo (base64)
const oldFormat = Buffer.from("oldpassword").toString('base64');
const decoded1 = decryptDatabaseField(oldFormat, null, null);
console.assert(decoded1 === "oldpassword", "Base64 compatibility failed");

// Formato nuevo (AES-256-GCM)
const newFormat = encrypt("newpassword");
const decoded2 = decryptDatabaseField(
  newFormat.encrypted, 
  newFormat.iv, 
  newFormat.tag
);
console.assert(decoded2 === "newpassword", "AES-256-GCM failed");

console.log("✅ Backward compatibility test passed");
```

### Test 3: FacturamaClient con Credentials Reales
```typescript
import FacturamaClient from '@/lib/facturama/client';
import { encrypt } from '@/lib/crypto/encryption';

// Simular DB record
const encryptedCreds = encrypt("pruebas2011");

const client = new FacturamaClient({
  api_user: "pruebas",
  api_password_encrypted: encryptedCreds.encrypted,
  api_password_iv: encryptedCreds.iv,
  api_password_tag: encryptedCreds.tag,
  is_sandbox: true
});

const result = await client.testConnection();
console.assert(result.success === true, "Facturama connection failed");
console.log("✅ FacturamaClient test passed");
```

---

## 🚨 Rollback Plan

Si algo sale mal, puedes revertir:

### 1. Revertir Migración SQL
```sql
-- Remover columnas nuevas
ALTER TABLE facturama_config
  DROP COLUMN IF EXISTS api_password_iv,
  DROP COLUMN IF EXISTS api_password_tag,
  DROP COLUMN IF EXISTS encryption_migrated;
```

### 2. Revertir Código
```bash
git checkout HEAD~1 -- lib/facturama/client.ts
git checkout HEAD~1 -- app/api/facturama/config/route.ts
git checkout HEAD~1 -- app/api/invoices/route.ts
```

### 3. Restaurar Passwords Base64
Si migraste y quieres volver a base64 (NO RECOMENDADO):

```typescript
// scripts/rollback-encryption.ts
const configs = await supabase.from('facturama_config').select('*');

for (const config of configs) {
  if (config.encryption_migrated) {
    const plaintext = decrypt(
      config.api_password_encrypted,
      config.api_password_iv,
      config.api_password_tag
    );
    
    const base64 = Buffer.from(plaintext).toString('base64');
    
    await supabase.from('facturama_config').update({
      api_password_encrypted: base64,
      api_password_iv: null,
      api_password_tag: null,
      encryption_migrated: false
    }).eq('id', config.id);
  }
}
```

---

## 📚 Referencias

- [NIST AES-GCM](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

---

## ✅ Checklist Final

- [ ] ENCRYPTION_MASTER_KEY generada y guardada en .env.local
- [ ] ENCRYPTION_MASTER_KEY agregada a Vercel Environment Variables (Producción)
- [ ] Migración SQL aplicada (columnas iv, tag, encryption_migrated existen)
- [ ] Script de migración ejecutado exitosamente (todos los registros migrados)
- [ ] Test de conexión Facturama funciona con credenciales nuevas
- [ ] Test de facturación genera UUID válido
- [ ] Backup de DB realizado antes de migración
- [ ] Documentación compartida con equipo

**Estado:** 🎯 COMPLETADO

**Próximos Pasos:** Testing en producción con cliente piloto (Día 2 - Martes)
