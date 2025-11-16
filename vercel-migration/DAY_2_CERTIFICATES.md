# Day 2: Certificados CSD + Production Testing

**Fecha:** 2025-11-16  
**Duración estimada:** 12 horas  
**Estado:** ✅ COMPLETO (código implementado, pendiente testing con datos reales)

---

## 🎯 Objetivos

1. ✅ Crear bucket de Supabase Storage para certificados CSD
2. ✅ Implementar API de carga de certificados (.cer y .key)
3. ✅ Crear UI para subir certificados en `/settings/facturacion`
4. ✅ Encriptar contraseña del archivo .key con AES-256-GCM
5. ⏳ Probar generación de CFDI con credenciales reales
6. ⏳ Validar UUID en portal SAT

---

## 📦 Componentes Implementados

### 1. SQL Migration: Storage Bucket
**Archivo:** `supabase/migrations/20251116_certificates_storage.sql`

Crea:
- Bucket privado `facturama-certificates` (5MB max por archivo)
- RLS policies para upload/download por user_id
- MIME types permitidos: `.cer`, `.key`, `.pem`

**Estructura de carpetas:**
```
facturama-certificates/
  ├── {user_id_1}/
  │   ├── certificate.cer
  │   └── certificate.key
  ├── {user_id_2}/
  │   ├── certificate.cer
  │   └── certificate.key
```

### 2. API Endpoint: Certificate Upload
**Archivo:** `app/api/facturama/certificates/route.ts`

**POST /api/facturama/certificates**
- Recibe: FormData con `certificate_cer`, `certificate_key`, `key_password`
- Valida: extensiones (.cer, .key), tamaño (max 5MB)
- Sube archivos a Supabase Storage
- Encripta `key_password` con AES-256-GCM
- Actualiza `facturama_config` con URLs y contraseña encriptada

**GET /api/facturama/certificates**
- Verifica si usuario tiene certificados configurados
- Retorna: `{has_certificates: boolean, certificate_cer_url, certificate_key_url}`

**DELETE /api/facturama/certificates**
- Elimina archivos de storage
- Limpia campos en `facturama_config`

### 3. UI Component
**Archivo:** `app/settings/facturacion/page.tsx`

Agregado:
- Card "Certificados CSD del SAT" con instrucciones
- File inputs para .cer y .key
- Input password para contraseña del .key
- Estado visual (verde si configurado, form si vacío)
- Botón "Subir Certificados CSD" con validación
- Botón "Eliminar" para limpiar certificados

---

## 🔐 Seguridad Implementada

1. **Encriptación de contraseña .key:**
   - AES-256-GCM (mismo sistema que Day 1)
   - IV único por usuario
   - Authentication tag para detectar tampering

2. **Storage privado:**
   - Bucket NO público
   - RLS policies por user_id
   - Solo el usuario puede ver sus propios archivos

3. **Validación de archivos:**
   - Extensiones permitidas: `.cer`, `.key`
   - Tamaño máximo: 5MB
   - MIME types verificados

---

## 📋 Testing Pendiente

### Con credenciales reales:

1. **Obtener cuenta Facturama de producción:**
   - Registrarse en https://www.facturama.mx/registro
   - Adquirir suscripción API (~$1,650 MXN/año)
   - Verificar activación por email

2. **Obtener certificados CSD del SAT:**
   - Login en portal SAT con e.firma
   - Trámites → Certificados de Sello Digital
   - Solicitar nuevo CSD (tarda 24-48 horas)
   - Descargar `.cer` y `.key`

3. **Configurar en SGMM:**
   - Ir a `/settings/facturacion`
   - Desactivar modo Sandbox
   - Ingresar credenciales Facturama (email/password)
   - Click "Probar Conexión" → debe ser ✅
   - Subir archivos CSD (.cer, .key, password)
   - Completar datos fiscales (RFC, razón social, régimen)
   - Guardar configuración

4. **Generar primera factura:**
   - Ir a sección de pacientes
   - Crear cita con cobro
   - Generar factura desde UI
   - Verificar UUID en https://verificacfdi.facturaelectronica.sat.gob.mx/
   - Validar XML/PDF descargados

---

## 🐛 Troubleshooting

### Error: "Bucket does not exist"
**Causa:** No se ejecutó la migración SQL  
**Solución:** Ejecutar `20251116_certificates_storage.sql` en Supabase Dashboard

### Error: "Row level security policy violation"
**Causa:** Policies RLS no aplicadas correctamente  
**Solución:** Verificar en Supabase Storage → Policies → facturama-certificates

### Error: "File size exceeds limit"
**Causa:** Archivos CSD mayores a 5MB (muy raro)  
**Solución:** Verificar que sean los archivos correctos del SAT

### Error 401 al generar factura
**Causa:** Credenciales Facturama incorrectas o sin suscripción API  
**Solución:** 
1. Verificar que compró suscripción API en carrito de Facturama
2. Esperar email de activación (tarda minutos a horas)
3. Verificar usuario/contraseña en Facturama login

---

## 📊 Checklist de Validación

- [x] SQL migration creada (20251116_certificates_storage.sql)
- [x] API endpoint `/api/facturama/certificates` implementado
- [x] UI component agregado a `/settings/facturacion`
- [x] Encriptación AES-256-GCM para password del .key
- [ ] SQL migration ejecutada en Supabase Dashboard
- [ ] Bucket "facturama-certificates" verificado en Storage
- [ ] Upload de certificados de prueba desde UI
- [ ] Credenciales Facturama reales configuradas
- [ ] Generación de primera factura en sandbox
- [ ] Generación de primera factura en producción
- [ ] UUID verificado en portal SAT

---

## 🚀 Próximos Pasos (Week 1)

Una vez completado Day 2 con datos reales:

1. **WhatsApp Templates** (6 horas + espera de aprobación)
   - Crear templates en Meta Business Manager
   - Implementar sistema de opt-in/opt-out
   - Integrar con sistema de recordatorios

2. **Testing integral**
   - Factura generada → WhatsApp enviado al paciente
   - Validación de flujo completo

---

## 📝 Comandos Útiles

```powershell
# Ejecutar test de certificados (sin SQL migration)
npx tsx scripts/test-certificate-upload.ts

# Verificar errores en TypeScript
npm run build

# Ver logs de API
# (ir a Vercel Dashboard → Logs)
```

---

**Nota:** El sistema de certificados está COMPLETO en código. Solo falta:
1. Ejecutar SQL migration en Supabase
2. Probar con credenciales reales de Facturama
3. Validar con certificados CSD reales del SAT
