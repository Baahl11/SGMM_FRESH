# ⚠️ ACCIÓN REQUERIDA: Setup de Supabase Storage

## 🎯 Objetivo
Configurar el bucket de almacenamiento para archivos subidos en formularios de intake.

---

## ⏱️ Tiempo Estimado: 5 minutos

---

## 📋 Pasos

### 1. Abrir Supabase Dashboard
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto (el de AgendaMedPro)
3. Ve a la sección **SQL Editor** (en el menú izquierdo)

### 2. Ejecutar Script SQL
1. Copia el contenido del archivo: `supabase/storage/setup-form-files-bucket.sql`
2. Pega en el SQL Editor
3. Click en **Run** (botón verde)
4. Espera confirmación de éxito

### 3. Verificar Bucket Creado
Ejecuta esta query en el SQL Editor:
```sql
SELECT * FROM storage.buckets WHERE id = 'form-files';
```

**Resultado esperado:**
```
id          | name       | public | file_size_limit | allowed_mime_types
form-files  | form-files | true   | 10485760        | [array of mime types]
```

### 4. Verificar Políticas RLS
Ejecuta:
```sql
SELECT * 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%form files%';
```

**Resultado esperado:**
- 3 policies: upload, read, delete

---

## ✅ Checklist de Verificación

Después de ejecutar, verifica:

- [ ] Bucket `form-files` existe
- [ ] `public` = `true`
- [ ] `file_size_limit` = `10485760` (10MB)
- [ ] `allowed_mime_types` contiene: images, PDF, docs
- [ ] 3 políticas RLS creadas
- [ ] Función `cleanup_orphaned_form_files()` existe

---

## 🧪 Test Rápido

### En la App:
1. Ve a `/dashboard/settings/forms`
2. Crea un nuevo formulario
3. Agrega un campo tipo "Archivos"
4. Guarda el formulario
5. Envía a un paciente (usa tu propio WhatsApp)
6. Abre el link en incognito/otro navegador
7. Intenta subir una imagen
8. **Resultado esperado:** Upload exitoso, URL generada

### En Supabase Dashboard:
1. Ve a **Storage** (menú izquierdo)
2. Busca bucket `form-files`
3. Deberías ver carpeta `form-uploads/`
4. Dentro, el archivo que subiste

---

## 🚨 Troubleshooting

### Error: "Bucket already exists"
- **Causa:** Ya ejecutaste el script antes
- **Solución:** 
  ```sql
  -- Verificar que policies estén correctas
  SELECT * FROM pg_policies 
  WHERE tablename = 'objects' 
  AND policyname LIKE '%form files%';
  ```
  Si faltan policies, ejecuta solo la sección de policies del script.

### Error: "Permission denied"
- **Causa:** No tienes permisos de admin en Supabase
- **Solución:** Usa una cuenta con rol Owner o Admin del proyecto

### Error al subir archivos: "Failed to upload"
- **Posibles causas:**
  1. Bucket no es público → Verifica `public = true`
  2. RLS policies incorrectas → Re-ejecuta policies
  3. MIME type no permitido → Verifica `allowed_mime_types`
  4. Archivo > 10MB → Reduce tamaño

**Debug query:**
```sql
-- Ver detalles del bucket
SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 as max_mb,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'form-files';
```

### Archivos no se ven en UI
- **Causa:** URLs no públicas
- **Solución:**
  ```sql
  UPDATE storage.buckets
  SET public = true
  WHERE id = 'form-files';
  ```

---

## 🔧 Comandos Útiles

### Ver todos los archivos subidos:
```sql
SELECT 
  name,
  metadata->>'size' as size_bytes,
  metadata->>'mimetype' as mime_type,
  created_at
FROM storage.objects
WHERE bucket_id = 'form-files'
ORDER BY created_at DESC
LIMIT 10;
```

### Ver storage usage:
```sql
SELECT 
  COUNT(*) as total_files,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE bucket_id = 'form-files';
```

### Limpiar archivos de prueba:
```sql
DELETE FROM storage.objects
WHERE bucket_id = 'form-files'
  AND name LIKE 'form-uploads/test%';
```

### Ejecutar limpieza de huérfanos:
```sql
SELECT cleanup_orphaned_form_files();
-- Retorna: número de archivos eliminados
```

---

## 📊 Límites y Cuotas

### Supabase Free Tier:
- **Storage:** 1GB gratis
- **Bandwidth:** 2GB/mes gratis
- **Requests:** Unlimited

### Estimación de Uso:
- **Archivo promedio:** 2MB (foto de ID, estudio médico)
- **Archivos por form:** 2-3 promedio
- **Forms por mes:** 50 (estimado para 10 clínicas)
- **Usage mensual:** ~300MB

**Conclusión:** Free tier es suficiente por varios meses.

### Cuando actualizar a Paid Plan:
- Storage > 900MB (90% del límite)
- Bandwidth > 1.8GB/mes (90% del límite)
- **Costo Pro Plan:** $25 USD/mes = ~$450 MXN/mes
  - Storage: 100GB
  - Bandwidth: 200GB/mes

---

## ⏭️ Siguiente Paso

Después de ejecutar este script, el sistema de File Upload está **100% funcional**.

**Test end-to-end:**
1. ✅ Create form con campo "file"
2. ✅ Send form a paciente
3. ✅ Paciente sube archivos
4. ✅ Submit formulario
5. ✅ Doctor ve archivos en submissions dashboard
6. ✅ Click en archivo → descarga/preview

**Si todo funciona → Feature completo! 🎉**

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la sección Troubleshooting arriba
2. Verifica queries de debug
3. Consulta `FILE_UPLOAD_IMPLEMENTATION.md` para detalles técnicos
4. Revisa logs en Supabase Dashboard → Logs

---

**Última actualización:** 3 Nov 2025  
**Status:** ⚠️ Pendiente de ejecutar
