# Instrucciones: Ejecutar SQL Migrations

**Tiempo estimado:** 5 minutos

---

## Paso 1: Abrir Supabase Dashboard

1. Ir a: https://supabase.com/dashboard
2. Login con tu cuenta
3. Seleccionar proyecto: **sbwpqtrxhiuucwlbozet**

---

## Paso 2: Ejecutar Migration de Storage

1. En el menú lateral, ir a: **SQL Editor**
2. Click en **"New Query"**
3. Copiar el contenido completo del archivo:
   ```
   vercel-migration/supabase/migrations/20251116_certificates_storage.sql
   ```
4. Pegar en el editor SQL
5. Click en **"Run"** (botón verde)
6. Verificar mensaje: ✅ "Success. No rows returned"

**Verificación:**
- Ir a **Storage** en menú lateral
- Debe aparecer bucket: `facturama-certificates`
- Click en el bucket
- Debe mostrar: 🔒 "Private" (no público)

---

## Paso 3: Verificar Migration de Encriptación (ya ejecutada)

Esta ya la ejecutaste, solo verifica:

1. Ir a: **Table Editor**
2. Seleccionar tabla: `facturama_config`
3. Verificar columnas existen:
   - `api_password_iv` (text)
   - `api_password_tag` (text)
   - `certificate_password_iv` (text)
   - `certificate_password_tag` (text)
   - `encryption_migrated` (boolean)

Si NO existen, ejecutar:
```
vercel-migration/supabase/migrations/20251116_facturama_encryption_aes256.sql
```

---

## Paso 4: Probar Upload de Certificados

### Opción A: Desde la UI (recomendado)

1. Ejecutar app en desarrollo:
   ```powershell
   cd C:\Users\gm_me\SGMM_FRESH\vercel-migration
   npm run dev
   ```

2. Abrir navegador: http://localhost:3000

3. Login con tu cuenta de prueba

4. Ir a: **Settings** → **Facturación**

5. Scroll hasta la sección: **"Certificados CSD del SAT"**

6. Crear archivos de prueba (en PowerShell):
   ```powershell
   mkdir tests\fixtures -ErrorAction SilentlyContinue
   "TEST CER FILE" | Out-File -FilePath tests\fixtures\test.cer -Encoding ASCII
   "TEST KEY FILE" | Out-File -FilePath tests\fixtures\test.key -Encoding ASCII
   ```

7. En la UI:
   - Click **"Seleccionar archivo"** para .cer → elegir `tests\fixtures\test.cer`
   - Click **"Seleccionar archivo"** para .key → elegir `tests\fixtures\test.key`
   - Ingresar contraseña: `test123`
   - Click **"Subir Certificados CSD"**

8. Verificar mensaje: ✅ "Certificados CSD subidos exitosamente"

9. Verificar en Supabase:
   - Ir a **Storage** → `facturama-certificates`
   - Debe aparecer carpeta con tu `user_id`
   - Dentro: `certificate.cer` y `certificate.key`

### Opción B: Desde la terminal (alternativa)

```powershell
cd C:\Users\gm_me\SGMM_FRESH\vercel-migration
npx tsx scripts/test-certificate-upload.ts
```

**Esperado:**
```
✅ Bucket "facturama-certificates" existe
✅ Archivos de prueba creados
✅ Upload .cer exitoso
✅ Upload .key exitoso
✅ URLs generadas
```

---

## Paso 5: Verificar en Supabase Dashboard

1. **Storage:**
   - Ir a: Storage → facturama-certificates
   - Debe haber carpeta con UUID de usuario
   - Dentro: 2 archivos (certificate.cer, certificate.key)

2. **Database:**
   - Ir a: Table Editor → facturama_config
   - Buscar tu registro de usuario
   - Verificar campos poblados:
     - `certificate_cer_url` → https://...supabase.co/storage/...
     - `certificate_key_url` → https://...supabase.co/storage/...
     - `certificate_password_encrypted` → hex string (largo)
     - `certificate_password_iv` → 24 caracteres hex
     - `certificate_password_tag` → 32 caracteres hex

---

## Troubleshooting

### Error: "relation storage.buckets does not exist"
**Causa:** Proyecto muy antiguo sin Storage habilitado  
**Solución:**
1. Ir a Supabase Dashboard → Storage
2. Click "Enable Storage"
3. Esperar 1-2 minutos
4. Re-ejecutar SQL migration

### Error: "duplicate key value violates unique constraint"
**Causa:** Ya ejecutaste la migration antes  
**Solución:** Ignorar, la migration es idempotente

### Error: "Row level security policy violation"
**Causa:** Las policies RLS no se crearon correctamente  
**Solución:**
1. Ir a Storage → Policies
2. Verificar que existan 4 policies para `facturama-certificates`:
   - Users can upload their own certificates (INSERT)
   - Users can view their own certificates (SELECT)
   - Users can update their own certificates (UPDATE)
   - Users can delete their own certificates (DELETE)
3. Si no existen, re-ejecutar la migration SQL

### Error: "File size exceeds limit"
**Causa:** Archivo de prueba muy grande  
**Solución:** Crear archivo más pequeño (< 5MB)

---

## Checklist Final

Marca cada paso completado:

- [ ] SQL migration `20251116_certificates_storage.sql` ejecutada
- [ ] Bucket `facturama-certificates` visible en Storage
- [ ] Bucket marcado como "Private" (🔒)
- [ ] 4 RLS policies creadas
- [ ] Archivos de prueba creados
- [ ] Upload desde UI exitoso
- [ ] Archivos visibles en Supabase Storage
- [ ] `facturama_config` actualizada con URLs
- [ ] Contraseña del .key encriptada (verificar campos `*_iv` y `*_tag`)

---

## Siguiente Paso

Una vez completados todos los checks:

1. **Eliminar archivos de prueba:**
   ```powershell
   # En Supabase Storage, seleccionar archivos y Delete
   # O desde la UI: click "Eliminar" en la tarjeta verde
   ```

2. **Obtener credenciales reales:**
   - Registrarse en Facturama (producción o sandbox)
   - Obtener certificados CSD del SAT
   - Configurar en `/settings/facturacion`

3. **Generar primera factura:**
   - Crear paciente con RFC
   - Generar cita con cobro
   - Facturar desde UI
   - Validar UUID en portal SAT

---

**¿Todo listo?** Marca este documento como completado y continúa con testing real.
