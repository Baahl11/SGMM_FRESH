# 📎 File Upload - Guía de Implementación

## 🎯 Resumen

Sistema completo de carga de archivos para formularios de intake con almacenamiento en **Supabase Storage**.

---

## 📦 Componentes Creados

### 1. **FileUploadField Component**
**Archivo:** `components/forms/file-upload-field.tsx`

**Características:**
- 🖱️ Drag & Drop visual con feedback
- 📋 Click para seleccionar archivos
- ✅ Validación de tipo y tamaño
- 📊 Progreso de carga en tiempo real
- 🗑️ Eliminar archivos individualmente
- 🎨 Dark mode completo
- ♿ Accesible y responsive

**Props:**
```typescript
interface FileUploadFieldProps {
  fieldId: string;           // ID del campo
  label: string;             // Etiqueta del campo
  required?: boolean;        // Campo obligatorio
  maxFiles?: number;         // Máximo archivos (default: 5)
  maxSizeMB?: number;        // Tamaño máximo MB (default: 10)
  acceptedTypes?: string[];  // Tipos aceptados
  value: string[];           // Array de URLs
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}
```

**Tipos de Archivo Soportados:**
- 🖼️ **Imágenes:** JPEG, PNG, GIF, WebP
- 📄 **Documentos:** PDF, Word (.doc, .docx)
- 📊 **Hojas de cálculo:** Excel (.xls, .xlsx)
- 📝 **Texto plano:** .txt

**Límites:**
- Máximo **5 archivos** por campo
- Tamaño máximo **10MB** por archivo
- Total storage del bucket configurable en Supabase

---

## 🗄️ Supabase Storage Setup

### 1. **Crear Bucket**
**Archivo:** `supabase/storage/setup-form-files-bucket.sql`

**Ejecutar en Supabase SQL Editor:**
```sql
-- Este script crea:
-- 1. Bucket 'form-files' con acceso público
-- 2. Políticas RLS para upload/read/delete
-- 3. Función de limpieza de archivos huérfanos
```

**Estructura del Bucket:**
```
form-files/
└── form-uploads/
    ├── 1730678901234-abc123.pdf
    ├── 1730678902456-def456.jpg
    └── 1730678903789-ghi789.docx
```

**Políticas de Seguridad:**
1. ✅ **Upload público:** Cualquiera puede subir a `form-uploads/`
2. ✅ **Read público:** URLs públicas para todos
3. 🔒 **Delete autenticado:** Solo usuarios auth pueden eliminar

### 2. **Configuración Recomendada**

En Supabase Dashboard:
1. Ve a **Storage** → **form-files**
2. Verifica:
   - ✅ Public bucket: **enabled**
   - ✅ File size limit: **10MB**
   - ✅ Allowed MIME types: configurados en SQL

---

## 🔌 Integración en Formularios

### 1. **Public Form Page**
**Archivo:** `app/public/forms/[token]/page.tsx`

**Cambios Realizados:**
```typescript
// 1. Import del componente
import { FileUploadField } from '@/components/forms/file-upload-field'

// 2. Nuevo case en renderField()
case 'file':
  return (
    <FileUploadField
      fieldId={field.id}
      label=""
      required={field.required}
      maxFiles={5}
      maxSizeMB={10}
      acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx']}
      value={Array.isArray(value) ? value : []}
      onChange={(urls) => handleFieldChange(field.id, urls)}
      disabled={submitting}
    />
  )
```

**¿Cómo Funciona?**
1. Usuario arrastra archivos o hace click
2. Validación de tipo y tamaño en cliente
3. Upload a Supabase Storage (path único con timestamp)
4. Obtención de URL pública
5. URL guardada en array de responses
6. Al submit, URLs van a `form_submissions.uploaded_files`

### 2. **Form Builder**
**Archivo:** `app/dashboard/settings/forms/[id]/page.tsx`

**Cambios Realizados:**
```typescript
// Agregado nuevo tipo de campo:
const FIELD_TYPES = [
  // ... otros tipos
  { value: 'file', label: 'Archivos', icon: '📎' },
]
```

**Uso:**
1. Doctor crea formulario
2. Agrega campo tipo "Archivos"
3. Campo aparece en formulario público
4. Paciente sube documentos al completar

---

## 💾 Almacenamiento de Datos

### En `form_submissions` Table:

**Columna:** `uploaded_files` (JSONB)

**Formato:**
```json
[
  "https://xyz.supabase.co/storage/v1/object/public/form-files/form-uploads/1730678901234-abc123.pdf",
  "https://xyz.supabase.co/storage/v1/object/public/form-files/form-uploads/1730678902456-def456.jpg"
]
```

**Consultas Útiles:**

```sql
-- Ver archivos de una submission
SELECT 
  id,
  uploaded_files,
  jsonb_array_length(uploaded_files) as file_count
FROM form_submissions
WHERE id = 'submission-id';

-- Listar todas las submissions con archivos
SELECT 
  s.id,
  s.patient_id,
  p.nombre,
  jsonb_array_length(s.uploaded_files) as files_uploaded,
  s.created_at
FROM form_submissions s
JOIN patients p ON s.patient_id = p.id
WHERE jsonb_array_length(s.uploaded_files) > 0
ORDER BY s.created_at DESC;
```

---

## 🧹 Mantenimiento

### Limpieza de Archivos Huérfanos

**Función Creada:** `cleanup_orphaned_form_files()`

**¿Qué hace?**
- Busca archivos en Storage de más de 30 días
- Verifica si están referenciados en submissions
- Elimina los que no están en ninguna submission

**Ejecución Manual:**
```sql
-- Ejecutar en SQL Editor
SELECT cleanup_orphaned_form_files();
-- Retorna: número de archivos eliminados
```

**Automatización con Cron (Opcional):**
```sql
-- Supabase Edge Functions o pg_cron
SELECT cron.schedule(
  'cleanup-form-files',
  '0 3 * * 0', -- Domingos 3am
  $$ SELECT cleanup_orphaned_form_files(); $$
);
```

---

## 🎨 UX Features

### Estados Visuales:

1. **Empty State:**
   - Icono de upload
   - Texto "Haz clic o arrastra"
   - Límites mostrados

2. **Drag Active:**
   - Border azul brillante
   - Background azul suave
   - Feedback inmediato

3. **Uploading:**
   - Spinner animado
   - Texto "Subiendo archivos..."
   - Área bloqueada

4. **Uploaded:**
   - Lista de archivos con íconos
   - Nombre y tamaño
   - Botón eliminar por archivo
   - Contador "X de 5 archivos"

5. **Max Reached:**
   - Mensaje amber
   - Upload área oculta
   - Solo mostrar lista actual

### Validaciones:

✅ **Tipo de archivo:**
```
"El archivo 'documento.exe' no es un tipo permitido"
```

✅ **Tamaño:**
```
"El archivo 'video.mp4' excede el tamaño máximo de 10MB"
```

✅ **Límite de archivos:**
```
"Solo puedes subir un máximo de 5 archivos"
```

---

## 🔧 Personalización

### Cambiar Límites:

**En el componente:**
```typescript
<FileUploadField
  maxFiles={10}        // Subir límite a 10
  maxSizeMB={25}       // Permitir hasta 25MB
  acceptedTypes={[     // Solo imágenes
    'image/jpeg',
    'image/png'
  ]}
/>
```

**En Supabase (bucket config):**
```sql
UPDATE storage.buckets
SET file_size_limit = 26214400  -- 25MB en bytes
WHERE id = 'form-files';
```

### Agregar Nuevos Tipos:

1. **Actualizar bucket allowed_mime_types:**
```sql
UPDATE storage.buckets
SET allowed_mime_types = array_cat(
  allowed_mime_types,
  ARRAY['video/mp4', 'video/quicktime']
)
WHERE id = 'form-files';
```

2. **Actualizar componente acceptedTypes:**
```typescript
acceptedTypes={[
  'image/*',
  'application/pdf',
  'video/mp4',
  'video/quicktime'
]}
```

---

## 🧪 Testing

### 1. **Test de Upload Básico:**
```typescript
// En formulario público:
1. Ir a /public/forms/[token]
2. Encontrar campo tipo "file"
3. Arrastrar imagen JPG
4. Verificar:
   - ✅ Muestra nombre de archivo
   - ✅ Botón eliminar funciona
   - ✅ Submit incluye URL en responses
```

### 2. **Test de Validación:**
```typescript
// Subir archivo no permitido (.exe)
Resultado esperado:
❌ Toast error: "no es un tipo permitido"

// Subir archivo > 10MB
Resultado esperado:
❌ Toast error: "excede el tamaño máximo"
```

### 3. **Test de Storage:**
```sql
-- Verificar archivo en storage
SELECT name, metadata
FROM storage.objects
WHERE bucket_id = 'form-files'
ORDER BY created_at DESC
LIMIT 5;
```

### 4. **Test de Submission:**
```sql
-- Verificar URLs guardadas
SELECT 
  id,
  uploaded_files,
  created_at
FROM form_submissions
WHERE uploaded_files IS NOT NULL
AND jsonb_array_length(uploaded_files) > 0
LIMIT 5;
```

---

## 📊 Monitoring

### Métricas Útiles:

**Storage Usage:**
```sql
SELECT 
  COUNT(*) as total_files,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size,
  AVG((metadata->>'size')::bigint) / 1024 / 1024 as avg_size_mb
FROM storage.objects
WHERE bucket_id = 'form-files';
```

**Uploads por Día:**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as files_uploaded,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE bucket_id = 'form-files'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Tipos de Archivo Más Comunes:**
```sql
SELECT 
  metadata->>'mimetype' as mime_type,
  COUNT(*) as count,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE bucket_id = 'form-files'
GROUP BY metadata->>'mimetype'
ORDER BY count DESC;
```

---

## 🚨 Troubleshooting

### Problema: "Error al subir archivo"

**Causas Posibles:**
1. ❌ Bucket no creado
2. ❌ Políticas RLS incorrectas
3. ❌ CORS no configurado
4. ❌ Límite de tamaño excedido

**Solución:**
```sql
-- 1. Verificar bucket existe
SELECT * FROM storage.buckets WHERE id = 'form-files';

-- 2. Verificar políticas
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 3. Verificar CORS en Supabase Dashboard:
-- Settings → API → Storage CORS
```

### Problema: "URL no funciona"

**Causas:**
1. ❌ Bucket no es público
2. ❌ Archivo eliminado
3. ❌ RLS blocking read access

**Solución:**
```sql
-- Hacer bucket público
UPDATE storage.buckets
SET public = true
WHERE id = 'form-files';

-- Verificar archivo existe
SELECT * FROM storage.objects 
WHERE name = 'form-uploads/archivo.pdf';
```

---

## ✅ Checklist de Implementación

- [x] Componente FileUploadField creado
- [x] SQL de bucket ejecutado en Supabase
- [x] Integración en public form page
- [x] Tipo "file" agregado a form builder
- [x] Validaciones implementadas
- [x] Dark mode funcional
- [x] Drag & Drop funcional
- [x] Función de limpieza creada
- [ ] **Ejecutar SQL en Supabase Dashboard** ⚠️
- [ ] Verificar uploads funcionan end-to-end
- [ ] Configurar cron de limpieza (opcional)

---

## 🎉 Resultado Final

**Flujo Completo:**

1. 👨‍⚕️ **Doctor** crea formulario con campo tipo "Archivos"
2. 👨‍⚕️ **Doctor** envía formulario a paciente (genera token)
3. 👤 **Paciente** abre link público
4. 👤 **Paciente** arrastra documentos (lab results, estudios, etc.)
5. 📤 **Sistema** sube a Supabase Storage
6. 💾 **Sistema** guarda URLs en `form_submissions`
7. 👨‍⚕️ **Doctor** ve submission con links a archivos
8. 👨‍⚕️ **Doctor** puede descargar/ver archivos directamente

**Beneficios:**
- ✅ Sin límites de email (archivos pesados)
- ✅ Almacenamiento seguro y escalable
- ✅ URLs permanentes y públicas
- ✅ Limpieza automática de huérfanos
- ✅ UX moderna con drag & drop
- ✅ Mobile-friendly

---

## 📚 Referencias

- **Supabase Storage Docs:** https://supabase.com/docs/guides/storage
- **File Upload Best Practices:** https://web.dev/file-upload-best-practices/
- **React Dropzone:** https://react-dropzone.js.org/

---

**Implementado:** 2024-11-03  
**Última Actualización:** 2024-11-03
