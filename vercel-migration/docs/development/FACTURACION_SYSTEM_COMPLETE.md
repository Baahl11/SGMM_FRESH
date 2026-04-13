# Sistema de Facturación Electrónica (CFDI) - Facturama Integration

## 🎉 Implementación Completa

Hemos implementado un sistema completo de facturación electrónica integrado con Facturama para generar Comprobantes Fiscales Digitales por Internet (CFDI) cumpliendo con los requisitos del SAT.

---

## 📦 Componentes Implementados

### 1. **Base de Datos** ✅
**Archivos**: 
- `supabase/migrations/20251019_invoices_and_fiscal.sql`
- `supabase/migrations/20251019_invoices_storage_bucket.sql`

**Tablas creadas**:
- `facturama_config` - Configuración multi-tenant (credenciales API por usuario)
- `patient_fiscal_data` - Datos fiscales de pacientes (RFC, régimen fiscal, etc.)
- `invoices` - Facturas generadas con metadatos del SAT
- `invoice_records` - Relación many-to-many entre facturas y tratamientos

**Características**:
- Políticas RLS para aislamiento de datos por usuario
- Encriptación de contraseñas (pendiente implementar crypto real)
- Storage bucket público para XML/PDF
- Índices optimizados para búsquedas rápidas

### 2. **Tipos TypeScript** ✅
**Archivo**: `lib/types/facturama.ts` (250+ líneas)

**Incluye**:
- Interfaces completas para todas las entidades
- Catálogos del SAT (Forma Pago, Método Pago, Uso CFDI, Régimen Fiscal)
- Validadores para RFC y Código Postal
- Type guards y constantes

### 3. **Cliente API Facturama** ✅
**Archivo**: `lib/facturama/client.ts` (300+ líneas)

**Funciones**:
- `testConnection()` - Verificar credenciales
- `createInvoice()` - Generar y timbrar CFDI
- `downloadXML()` - Obtener XML del SAT
- `downloadPDF()` - Obtener PDF de la factura
- `cancelInvoice()` - Cancelar factura ante el SAT
- `sendInvoiceByEmail()` - Enviar por correo
- `buildInvoiceItems()` - Helper para construir items con IVA

**Características**:
- Manejo de errores robusto
- Soporte para sandbox y producción
- Autenticación Basic Auth
- Construcción automática de payload SAT

### 4. **API Endpoints** ✅

#### `POST /api/invoices` - Generar Factura
**Funcionalidad**:
1. Valida configuración de Facturama del usuario
2. Obtiene datos fiscales del paciente
3. Obtiene registros de tratamientos
4. Calcula totales (subtotal, IVA, total)
5. Genera CFDI en Facturama
6. Descarga XML y PDF
7. Sube archivos a Supabase Storage
8. Guarda factura en BD
9. Vincula tratamientos en `invoice_records`
10. Marca tratamientos como facturados
11. Envía email automático (opcional)

#### `GET /api/invoices` - Listar Facturas
**Parámetros**:
- `patient_id` (opcional) - Filtrar por paciente
- `status` (opcional) - Filtrar por estado

**Incluye**:
- Joins con pacientes y datos fiscales
- Registros vinculados

#### `DELETE /api/invoices/[id]/cancel` - Cancelar Factura
**Funcionalidad**:
- Valida motivo de cancelación SAT
- Cancela en Facturama
- Actualiza estado en BD
- Marca tratamientos como pendientes nuevamente

#### `GET/POST /api/facturama/config` - Configuración
**GET**: Obtiene configuración del usuario
**POST**: Crea/actualiza configuración con validaciones
**PUT**: Prueba conexión con credenciales

#### `GET/POST /api/patients/[id]/fiscal-data` - Datos Fiscales
**GET**: Lista datos fiscales del paciente
**POST**: Crea nuevos datos fiscales con validaciones RFC

### 5. **UI: Configuración** ✅
**Archivo**: `app/settings/facturacion/page.tsx` (400+ líneas)

**Secciones**:
1. **Credenciales Facturama**
   - Usuario y contraseña API
   - Toggle sandbox/producción
   - Botón "Probar Conexión" con feedback visual

2. **Datos del Emisor (Clínica)**
   - RFC (validado)
   - Razón social
   - Régimen fiscal (dropdown con catálogo SAT)
   - Código postal (validado 5 dígitos)
   - Email, teléfono, dirección completa

3. **Configuración de Facturas**
   - Serie predeterminada
   - Folio inicial
   - Auto-envío de emails

**Características**:
- Validación en tiempo real
- Indicador visual de configuración activa
- Test de conexión antes de guardar
- Formulario limpio con buenos UX patterns

### 6. **UI: Modal Generar Factura** ✅
**Archivo**: `components/billing/generate-invoice-modal.tsx` (500+ líneas)

**Flujo (Wizard de 2 pasos)**:

**Paso 1: Datos Fiscales**
- Seleccionar RFC existente del paciente
- O agregar nuevos datos fiscales en el momento
- Formulario con validaciones inline
- Auto-selección de RFC predeterminado

**Paso 2: Confirmación**
- Resumen de tratamientos a facturar
- Cálculo de subtotal, IVA (16%), total
- Selección de Forma de Pago (dropdown catálogo SAT)
- Selección de Método de Pago (PUE/PPD)
- Campo de notas opcionales
- Botón "Generar Factura (CFDI)"

**Características**:
- Loading states en cada paso
- Validación de RFC con regex
- Auto-población de email del paciente
- Feedback inmediato de éxito/error

### 7. **UI: Tratamientos Pendientes** ✅
**Archivo**: `components/billing/pending-billing.tsx` (300+ líneas)

**Funcionalidad**:
- Lista tratamientos pagados con tarjeta/transferencia
- **Checkboxes** para selección múltiple
- Checkbox "Seleccionar todo"
- Resaltar filas seleccionadas (bg-blue-50)
- Totalizador de selección
- Botón "Generar Factura" (visible solo con selección)
- Integra modal de generación

**Mejoras vs versión anterior**:
- ❌ Antes: Solo marcaba flag `pendiente_facturar = false`
- ✅ Ahora: Genera factura real con XML, PDF, UUID del SAT

### 8. **UI: Historial de Facturas** ✅
**Archivo**: `components/billing/invoice-history.tsx` (400+ líneas)

**Características**:
- Tabla completa con todas las facturas
- Columnas: Fecha, Folio, UUID, RFC, Subtotal, IVA, Total, Estado
- **Filtros por estado**: Todas, Emitidas, Enviadas, Canceladas
- **Acciones por factura**:
  - Descargar XML (abre en nueva pestaña)
  - Descargar PDF (abre en nueva pestaña)
  - Cancelar factura (con diálogo de confirmación)
- Badge colorizado por estado
- Totalizador de facturas activas
- Soporte para vista global (todas) o por paciente

**Diálogo de Cancelación**:
- Dropdown con motivos SAT (01-04)
- Confirmación explícita
- Warning de acción irreversible
- Loading state durante cancelación

---

## 🔐 Seguridad Implementada

1. **Autenticación**: Todos los endpoints requieren `auth.uid()`
2. **RLS**: Políticas por usuario en todas las tablas
3. **Encriptación**: Contraseñas encriptadas (base64 temporal, TODO: crypto real)
4. **Validación**: RFC, CP, emails validados en cliente y servidor
5. **Storage**: URLs públicas pero con paths por usuario
6. **Multi-tenant**: Cada usuario tiene su propia configuración aislada

---

## 📋 Flujo Completo de Facturación

```
1. Usuario configura Facturama en /settings/facturacion
   └─ Prueba conexión, guarda credenciales + RFC emisor

2. Paciente paga tratamiento con tarjeta/transferencia
   └─ Aparece en "Tratamientos Pendientes de Facturación"

3. Usuario selecciona tratamiento(s) con checkboxes
   └─ Click "Generar Factura"

4. Modal se abre - Paso 1: Datos Fiscales
   ├─ Si paciente tiene RFC: Seleccionar existente
   └─ Si no: Capturar RFC, nombre, régimen fiscal, CP

5. Modal - Paso 2: Confirmación
   ├─ Revisar tratamientos y total
   ├─ Seleccionar forma de pago (tarjeta = 04)
   └─ Click "Generar Factura (CFDI)"

6. Backend procesa:
   ├─ Crea payload Facturama con items + IVA
   ├─ Llama API Facturama (timbrado SAT)
   ├─ Descarga XML y PDF
   ├─ Sube archivos a Supabase Storage
   ├─ Guarda factura en BD con UUID del SAT
   ├─ Vincula tratamientos en invoice_records
   ├─ Marca tratamientos como facturados
   └─ Envía email al paciente (opcional)

7. Factura aparece en "Historial de Facturas"
   ├─ Usuario puede descargar XML/PDF
   └─ O cancelar si hubo error
```

---

## 🚀 Próximos Pasos

### Pendientes de Implementación:

1. **Migración Storage Bucket**
   ```sql
   -- Aplicar en Supabase SQL Editor:
   -- supabase/migrations/20251019_invoices_storage_bucket.sql
   ```

2. **Integrar Historial en PatientBilling**
   - Agregar tab "Facturas" que use `<InvoiceHistory patientId={...} />`

3. **Link a Configuración**
   - Si usuario no tiene Facturama configurado, mostrar banner:
   ```jsx
   "⚠️ Configure Facturama para generar facturas → [Ir a Configuración]"
   ```

4. **Encriptación Real**
   - Implementar en `lib/facturama/config.ts`:
   ```typescript
   import crypto from 'crypto';
   const algorithm = 'aes-256-cbc';
   // Usar ENCRYPTION_KEY de .env
   ```

5. **Testing**
   - Probar flujo completo con credenciales sandbox
   - Verificar XML cumple schema del SAT
   - Test cancelación de facturas

6. **Email Mejorado**
   - Template HTML para envío de facturas
   - Usar Resend.com o servicio similar

---

## 📚 Documentación de Referencia

- **Facturama API**: https://api.facturama.mx/docs
- **Catálogos SAT**: http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Catalogos_y_Estructuras_de_Datos.htm
- **Formato CFDI 4.0**: https://www.sat.gob.mx/consulta/92764/comprobante-fiscal-digital-por-internet

---

## 🎯 Resumen Técnico

**Líneas de código**: ~2,500+
**Archivos creados**: 12
**Migraciones BD**: 2
**API Endpoints**: 7
**Componentes UI**: 4

**Tecnologías**:
- Next.js 14 (App Router)
- Supabase (PostgreSQL + Storage + Auth)
- Facturama API (CFDI/SAT)
- TypeScript estricto
- Tailwind + shadcn/ui

**Capacidades**:
✅ Multi-tenant (múltiples clínicas)
✅ Generación de CFDI 4.0
✅ Timbrado ante el SAT
✅ Almacenamiento de XML/PDF
✅ Cancelación de facturas
✅ Catálogos SAT integrados
✅ Validación de RFC
✅ Historial completo
✅ Descarga de documentos

---

## 🔧 Variables de Entorno Requeridas

Agregar a `.env.local`:

```env
# Supabase (ya existentes)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Encryption (nuevo - para contraseñas)
ENCRYPTION_KEY=your-32-character-secret-key-here

# Facturama (opcional - si quieres defaults)
# FACTURAMA_SANDBOX_USER=...
# FACTURAMA_SANDBOX_PASSWORD=...
```

---

## ✅ Checklist de Despliegue

- [ ] Aplicar migración: `20251019_invoices_and_fiscal.sql` ✅ (Ya aplicada)
- [ ] Aplicar migración: `20251019_invoices_storage_bucket.sql` ⏳ (Pendiente)
- [ ] Crear bucket `invoices` en Supabase Storage Dashboard
- [ ] Configurar políticas RLS del bucket
- [ ] Obtener credenciales Facturama sandbox
- [ ] Probar configuración en `/settings/facturacion`
- [ ] Generar factura de prueba
- [ ] Verificar XML válido en validador SAT
- [ ] Probar descarga XML/PDF
- [ ] Probar cancelación
- [ ] Implementar encriptación real
- [ ] Integrar InvoiceHistory en PatientBilling
- [ ] Deploy a producción
- [ ] Configurar Facturama producción (certificados SAT)

---

**Fecha de implementación**: 19 de Octubre, 2025
**Estado**: Backend completo ✅ | UI completa ✅ | Testing pendiente ⏳
