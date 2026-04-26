# Plan de Implementación: SAT + WhatsApp (Parte 1)

**Fecha:** Noviembre 2025  
**Objetivo:** Completar y estabilizar Facturación SAT y WhatsApp Recordatorios para Q1 2026  
**Prioridad:** CRÍTICA (Features solicitadas por clientes existentes)

---

## Índice - Parte 1

1. [Facturación SAT (CFDI 4.0)](#1-facturación-sat-cfdi-40)
   - Estado Actual (80% Completo)
   - Gaps Críticos
   - Plan de Implementación
   - Migración de Seguridad
   - Testing en Producción
2. [WhatsApp Recordatorios](#2-whatsapp-recordatorios)
   - Estado Actual (90% Completo)
   - Gaps Críticos
   - Aprobación de Templates Meta
   - Webhooks y Rastreo
   - Opt-in/Opt-out

---

## 1. Facturación SAT (CFDI 4.0)

### 1.1 Estado Actual (80% Completo)

#### ✅ Implementado

**Backend - Facturama Client (`lib/facturama/client.ts` - 300+ líneas)**
```typescript
export class FacturamaClient {
  private baseUrl: string;
  private apiUser: string;
  private apiPassword: string;

  // ✅ CRUD completo de facturas
  async createInvoice(invoiceData: FacturamaInvoiceRequest)
  async getInvoiceXML(invoiceId: string): Promise<string>
  async getInvoicePDF(invoiceId: string): Promise<Buffer>
  async cancelInvoice(invoiceId: string, motive: string, replacementUuid?: string)
  async sendInvoiceByEmail(invoiceId: string, email: string)
  async testConnection(): Promise<boolean>
}
```

**SAT Catálogos (`lib/facturama/sat-catalogos.ts` - 250+ líneas)**
- ✅ 28 formas de pago (efectivo, tarjeta, transferencia, etc.)
- ✅ 24 usos de CFDI (honorarios, gastos médicos, adquisición, etc.)
- ✅ 13 regímenes fiscales (persona física/moral, actividades empresariales, etc.)
- ✅ Validaciones de formato (RFC, CP, monto)

**Database Schema (4 tablas)**
```sql
-- ✅ Configuración multi-tenant
CREATE TABLE facturama_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  api_user TEXT NOT NULL,
  api_password_encrypted TEXT NOT NULL,  -- ⚠️ INSEGURO (base64)
  emisor_rfc TEXT NOT NULL,
  emisor_nombre TEXT NOT NULL,
  regimen_fiscal TEXT NOT NULL,
  is_sandbox BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ✅ Facturas emitidas
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  record_id UUID REFERENCES records,  -- Tratamiento facturado
  patient_id UUID REFERENCES patients,
  uuid TEXT UNIQUE,  -- UUID SAT
  folio TEXT,
  serie TEXT,
  xml_url TEXT,
  pdf_url TEXT,
  status TEXT DEFAULT 'active',  -- active, cancelled
  fecha_emision TIMESTAMPTZ,
  subtotal DECIMAL(10,2),
  iva DECIMAL(10,2),
  total DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ✅ Datos fiscales de pacientes
CREATE TABLE patient_fiscal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients NOT NULL UNIQUE,
  rfc TEXT NOT NULL,
  razon_social TEXT NOT NULL,
  regimen_fiscal TEXT NOT NULL,
  uso_cfdi TEXT NOT NULL DEFAULT 'G03',  -- Gastos en general
  codigo_postal TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ✅ Conceptos de factura
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices NOT NULL,
  clave_prod_serv TEXT NOT NULL,  -- Clave SAT producto/servicio
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  importe DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**API Endpoints (`app/api/invoices/route.ts`)**
```typescript
// ✅ POST /api/invoices - Crear factura
// ✅ GET /api/invoices - Listar facturas del usuario
// ✅ GET /api/invoices/[id] - Obtener factura específica
// ✅ POST /api/invoices/[id]/cancel - Cancelar factura
// ✅ POST /api/invoices/[id]/send-email - Enviar factura por correo
// ✅ GET /api/invoices/[id]/xml - Descargar XML
// ✅ GET /api/invoices/[id]/pdf - Descargar PDF
```

**UI Components (`components/billing/`)**
- ✅ `InvoiceForm.tsx` - Formulario de generación de facturas
- ✅ `PendingBillingTable.tsx` - Tratamientos pendientes de facturar
- ✅ `InvoiceHistoryTable.tsx` - Historial de facturas emitidas
- ✅ `FacturamaConfigForm.tsx` - Configuración de credenciales Facturama

**Flujo de Facturación Actual**
```
1. Médico completa tratamiento → records.status = 'completed'
2. Va a "Facturación Pendiente" → Lista de records.monto_pagado > 0 sin invoice_id
3. Selecciona paciente → Verifica patient_fiscal_data (RFC, uso CFDI)
4. Click "Generar Factura" → POST /api/invoices
5. Backend llama Facturama API → Recibe UUID, XML, PDF
6. Guarda en table invoices → Asocia record_id
7. Paciente recibe XML/PDF por email → Puede descargar desde portal
```

---

### 1.2 Gaps Críticos (20% Faltante)

#### 🚨 **GAP 1: Seguridad de Credenciales (CRÍTICO)**

**Problema Actual:**
```typescript
// ❌ INSEGURO - lib/facturama/client.ts línea 15
constructor(config: FacturamaConfig) {
  this.apiUser = config.api_user;
  this.apiPassword = Buffer.from(config.api_password_encrypted, 'base64').toString('utf-8');
  // Base64 NO ES ENCRIPTACIÓN - Cualquiera con acceso a DB puede decodificar
}
```

**Riesgo:**
- Base64 es encoding reversible (no encriptación)
- Credenciales Facturama expuestas en `facturama_config.api_password_encrypted`
- Violación PCI-DSS si almacenamos datos de pago
- Un atacante con acceso a DB puede facturar ilegalmente

**Solución Requerida:**
```typescript
// ✅ OPCIÓN A: AES-256-GCM con clave maestra en variables de entorno
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.FACTURAMA_ENCRYPTION_KEY!; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// ✅ OPCIÓN B: Supabase Vault (recomendado para multi-tenant)
// https://supabase.com/docs/guides/database/vault
// Almacenamiento seguro nativo de Supabase con RLS integrado
```

**Migración Requerida:**
```sql
-- Migration: 20251116_encrypt_facturama_passwords.sql

-- 1. Agregar columnas para AES-256-GCM
ALTER TABLE facturama_config 
  ADD COLUMN api_password_iv TEXT,
  ADD COLUMN api_password_tag TEXT;

-- 2. Script de migración de datos (ejecutar en backend)
-- backend/migrate_facturama_encryption.py
```

```python
# backend/migrate_facturama_encryption.py
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from supabase import create_client

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
encryption_key = bytes.fromhex(os.getenv("FACTURAMA_ENCRYPTION_KEY"))
aesgcm = AESGCM(encryption_key)

# Obtener todas las configs
configs = supabase.table("facturama_config").select("*").execute()

for config in configs.data:
    # Decodificar base64 actual
    plaintext_password = base64.b64decode(config["api_password_encrypted"]).decode()
    
    # Encriptar con AES-256-GCM
    nonce = os.urandom(12)  # 96 bits para GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext_password.encode(), None)
    
    # Actualizar en DB
    supabase.table("facturama_config").update({
        "api_password_encrypted": ciphertext.hex(),
        "api_password_iv": nonce.hex(),
        "api_password_tag": ciphertext[-16:].hex()  # AuthTag en últimos 16 bytes
    }).eq("id", config["id"]).execute()

print("✅ Migración completada - Passwords encriptados con AES-256-GCM")
```

**Esfuerzo Estimado:** 8 horas
- 2h: Implementar funciones encrypt/decrypt
- 2h: Script de migración Python
- 2h: Testing con credenciales reales
- 2h: Documentación y rollback plan

---

#### 🚨 **GAP 2: No Probado en Producción**

**Problema Actual:**
```typescript
// Todos los endpoints usan is_sandbox: true
const facturamaConfig = await supabase
  .from('facturama_config')
  .select('*')
  .eq('user_id', userId)
  .single();

// ⚠️ SIEMPRE apunta a sandbox.facturama.mx
if (facturamaConfig.is_sandbox) {
  baseUrl = 'https://apisandbox.facturama.mx';
}
```

**Riesgos:**
- Ningún cliente puede emitir facturas reales ante SAT
- No sabemos si funciona con certificados CSD reales
- Costos de Facturama: $299 MXN/mes en producción (vs gratis en sandbox)

**Solución:**
1. **Obtener credenciales de producción de 1 cliente piloto:**
   - RFC real registrado en Facturama
   - Certificados CSD (.cer y .key) vigentes
   - Contraseña de llave privada

2. **Actualizar UI para permitir cambio sandbox/producción:**
```typescript
// components/billing/FacturamaConfigForm.tsx
<Switch
  checked={!isSandbox}
  onCheckedChange={(checked) => setIsSandbox(!checked)}
  disabled={!hasCSDCertificates}
/>
<Label>
  Modo Producción (requiere certificados CSD)
  {!hasCSDCertificates && (
    <Alert variant="warning">
      Sube certificados .cer y .key antes de activar producción
    </Alert>
  )}
</Label>
```

3. **Implementar carga de certificados CSD:**
```typescript
// app/api/facturama/certificates/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const cerFile = formData.get('cer') as File;
  const keyFile = formData.get('key') as File;
  const keyPassword = formData.get('password') as string;

  // Validar que sean archivos válidos
  const cerContent = await cerFile.arrayBuffer();
  const keyContent = await keyFile.arrayBuffer();

  // Almacenar en Supabase Storage con encriptación
  const { data: cerUpload } = await supabase.storage
    .from('facturama-certificates')
    .upload(`${userId}/certificate.cer`, cerContent, {
      contentType: 'application/x-x509-ca-cert',
      upsert: true
    });

  // Encriptar contraseña de llave privada
  const encryptedPassword = encrypt(keyPassword);

  // Guardar referencia en facturama_config
  await supabase
    .from('facturama_config')
    .update({
      cer_storage_path: cerUpload.path,
      key_storage_path: keyUpload.path,
      key_password_encrypted: encryptedPassword.encrypted,
      key_password_iv: encryptedPassword.iv,
      key_password_tag: encryptedPassword.tag,
      is_sandbox: false  // Activar producción
    })
    .eq('user_id', userId);

  return NextResponse.json({ success: true });
}
```

4. **Testing en producción:**
```typescript
// tests/facturacion_production_test.ts
describe('Facturación Producción', () => {
  it('genera factura real con UUID SAT válido', async () => {
    const invoice = await createInvoice({
      receptorRfc: 'XAXX010101000',
      total: 100.00,
      conceptos: [{
        descripcion: 'Consulta médica',
        valorUnitario: 100.00
      }]
    });

    // Verificar en SAT
    const satValidation = await fetch(
      `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${invoice.uuid}`
    );
    expect(satValidation.status).toBe(200);
    expect(invoice.status).toBe('active');
  });
});
```

**Esfuerzo Estimado:** 12 horas
- 3h: UI para carga de certificados CSD
- 3h: Storage de certificados en Supabase
- 4h: Testing con cliente piloto real
- 2h: Validación en portal SAT

---

#### ⚠️ **GAP 3: Falta Facturación Masiva**

**Problema Actual:**
```typescript
// Solo se puede facturar de 1 en 1 desde UI
// No hay endpoint para facturar múltiples tratamientos de un paciente
```

**Caso de Uso:**
- Médico realiza 10 tratamientos en el mes
- Paciente pide factura global al final del mes
- Actualmente tiene que generar 10 facturas individuales

**Solución:**
```typescript
// app/api/invoices/bulk/route.ts
export async function POST(request: Request) {
  const { recordIds, patientId } = await request.json();

  // Validar que todos los records sean del mismo paciente
  const records = await supabase
    .from('records')
    .select('*, patients!inner(*)')
    .in('id', recordIds)
    .eq('patient_id', patientId);

  // Agrupar conceptos
  const conceptos = records.data.map(record => ({
    claveProdServ: '85121800',  // Servicios de consulta médica
    descripcion: `${record.treatment_name} - ${record.procedure_description}`,
    valorUnitario: record.monto_pagado,
    cantidad: 1
  }));

  // Generar factura única
  const invoice = await facturamaClient.createInvoice({
    receptor: fiscalData,
    conceptos,
    total: records.data.reduce((sum, r) => sum + r.monto_pagado, 0)
  });

  // Asociar invoice_id a todos los records
  await supabase
    .from('records')
    .update({ invoice_id: invoice.id })
    .in('id', recordIds);

  return NextResponse.json(invoice);
}
```

**UI:**
```typescript
// components/billing/PendingBillingTable.tsx
const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

<Checkbox
  checked={selectedRecords.includes(record.id)}
  onCheckedChange={(checked) => {
    if (checked) {
      setSelectedRecords([...selectedRecords, record.id]);
    } else {
      setSelectedRecords(selectedRecords.filter(id => id !== record.id));
    }
  }}
/>

<Button
  onClick={() => createBulkInvoice(selectedRecords)}
  disabled={selectedRecords.length === 0}
>
  Generar Factura Global ({selectedRecords.length} tratamientos)
</Button>
```

**Esfuerzo Estimado:** 6 horas
- 2h: Backend bulk endpoint
- 2h: UI con checkboxes
- 2h: Testing y validación

---

#### ⚠️ **GAP 4: Notas de Crédito**

**Problema Actual:**
```typescript
// Solo se puede cancelar factura
// No se puede emitir nota de crédito para devoluciones parciales
```

**Caso de Uso:**
- Paciente pagó $1,000 por tratamiento
- Se facturaron $1,000
- Hubo devolución de $200
- Necesita nota de crédito por $200 (no cancelar factura completa)

**Solución:**
```typescript
// lib/facturama/client.ts
async createCreditNote(params: {
  originalInvoiceId: string;
  motive: string;  // '01' Devolución, '02' Descuento
  amount: number;
  relatedUuid: string;  // UUID de factura original
}): Promise<CreditNote> {
  const response = await fetch(`${this.baseUrl}/api-lite/cfdi`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify({
      TipoDocumento: 'E',  // Egreso (Nota de Crédito)
      CfdiRelacionados: {
        TipoRelacion: '01',  // Nota de crédito
        Uuid: params.relatedUuid
      },
      Total: params.amount,
      // ... resto del CFDI
    })
  });

  const creditNote = await response.json();
  
  // Guardar en DB
  await supabase.from('credit_notes').insert({
    invoice_id: params.originalInvoiceId,
    uuid: creditNote.Complement.TimbreFiscalDigital.UUID,
    amount: params.amount,
    motive: params.motive
  });

  return creditNote;
}
```

**Database:**
```sql
CREATE TABLE credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices NOT NULL,
  uuid TEXT UNIQUE NOT NULL,
  motive TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  xml_url TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Esfuerzo Estimado:** 8 horas
- 3h: Backend credit notes
- 2h: UI para generar notas
- 3h: Testing y validación SAT

---

#### 📊 **GAP 5: Reportes de Facturación**

**Problema Actual:**
```typescript
// No hay dashboard de facturación
// No se puede filtrar por rango de fechas, RFC, total
```

**Solución:**
```typescript
// app/api/invoices/reports/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  const { data } = await supabase
    .from('invoices')
    .select(`
      *,
      patients(name, rfc),
      records(treatment_name, monto_pagado)
    `)
    .gte('fecha_emision', startDate)
    .lte('fecha_emision', endDate)
    .order('fecha_emision', { ascending: false });

  // Calcular totales
  const totals = {
    subtotal: data.reduce((sum, inv) => sum + inv.subtotal, 0),
    iva: data.reduce((sum, inv) => sum + inv.iva, 0),
    total: data.reduce((sum, inv) => sum + inv.total, 0),
    count: data.length
  };

  return NextResponse.json({ invoices: data, totals });
}
```

**UI:**
```typescript
// components/billing/InvoiceReportsPage.tsx
<Card>
  <CardHeader>
    <CardTitle>Reporte de Facturación</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex gap-4 mb-6">
      <DateRangePicker onChange={setDateRange} />
      <Button onClick={exportToExcel}>Exportar Excel</Button>
    </div>

    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatCard label="Facturas" value={totals.count} />
      <StatCard label="Subtotal" value={formatCurrency(totals.subtotal)} />
      <StatCard label="IVA" value={formatCurrency(totals.iva)} />
      <StatCard label="Total" value={formatCurrency(totals.total)} />
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Folio</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>RFC</TableHead>
          <TableHead>Paciente</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      {/* ... */}
    </Table>
  </CardContent>
</Card>
```

**Esfuerzo Estimado:** 4 horas
- 2h: Backend reports endpoint
- 2h: UI dashboard

---

### 1.3 Resumen Facturación SAT

| Componente | Estado | Esfuerzo Faltante | Prioridad |
|------------|--------|------------------|-----------|
| Encriptación AES-256-GCM | ❌ 0% | 8 horas | **P0** |
| Testing Producción + CSD | ❌ 0% | 12 horas | **P0** |
| Facturación Masiva | ❌ 0% | 6 horas | **P1** |
| Notas de Crédito | ❌ 0% | 8 horas | **P1** |
| Reportes Dashboard | ❌ 0% | 4 horas | **P2** |
| **TOTAL** | **80%** | **38 horas** | **2-3 semanas** |

---

## 2. WhatsApp Recordatorios

### 2.1 Estado Actual (90% Completo)

#### ✅ Implementado

**Backend - Cron Job (`app/api/cron/whatsapp-reminders/route.ts` - 400+ líneas)**
```typescript
export async function GET(request: Request) {
  // 1. Validar cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Buscar citas para hoy y mañana
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      patients(*),
      doctors(*),
      locations(*)
    `)
    .gte('date', now.toISOString())
    .lte('date', tomorrow.toISOString())
    .eq('status', 'scheduled')
    .order('date', { ascending: true });

  // 3. Agrupar por usuario (multi-tenant)
  const userAppointments = groupBy(appointments, 'user_id');

  // 4. Para cada usuario, obtener config WhatsApp
  for (const [userId, appts] of Object.entries(userAppointments)) {
    const { data: config } = await supabase
      .from('messaging_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!config || !config.whatsapp_enabled) continue;

    // 5. Enviar recordatorios
    for (const appt of appts) {
      const timeUntilAppt = appt.date - now;
      const shouldSend24h = timeUntilAppt <= 25 * 3600 * 1000 && !appt.reminder_24h_sent;
      const shouldSend1h = timeUntilAppt <= 2 * 3600 * 1000 && !appt.reminder_1h_sent;

      if (shouldSend24h) {
        await sendWhatsAppReminder(appt, config, '24h');
      }
      if (shouldSend1h) {
        await sendWhatsAppReminder(appt, config, '1h');
      }
    }
  }

  return NextResponse.json({ success: true, processed: appointments.length });
}

async function sendWhatsAppReminder(
  appointment: Appointment,
  config: MessagingConfig,
  reminderType: '24h' | '1h'
) {
  const message = `
Hola ${appointment.patients.name} 👋

Te recordamos tu cita médica:
📅 Fecha: ${formatDate(appointment.date)}
🕐 Hora: ${formatTime(appointment.time)}
👨‍⚕️ Doctor: ${appointment.doctors.name}
📍 Ubicación: ${appointment.locations.name}

${reminderType === '24h' 
  ? 'Es mañana, te esperamos!' 
  : '¡Es en 1 hora! No olvides llegar 10 minutos antes.'}

Si necesitas reagendar, llámanos al ${config.phone_number}
  `.trim();

  // Enviar via Meta WhatsApp Business API
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${config.whatsapp_phone_number_id}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsapp_access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: appointment.patients.phone,
        type: 'text',
        text: { body: message }
      })
    }
  );

  const result = await response.json();

  // Guardar log
  await supabase.from('whatsapp_messages').insert({
    user_id: appointment.user_id,
    patient_id: appointment.patient_id,
    appointment_id: appointment.id,
    message_body: message,
    whatsapp_message_id: result.messages[0].id,
    status: 'sent',
    sent_at: new Date().toISOString()
  });

  // Marcar como enviado
  await supabase
    .from('appointments')
    .update({
      [reminderType === '24h' ? 'reminder_24h_sent' : 'reminder_1h_sent']: true
    })
    .eq('id', appointment.id);
}
```

**Database Schema (2 tablas)**
```sql
-- ✅ Configuración WhatsApp multi-tenant (BYOK model)
CREATE TABLE messaging_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_business_account_id TEXT,
  whatsapp_phone_number_id TEXT,
  whatsapp_access_token TEXT,  -- ⚠️ Encriptar también
  phone_number TEXT,
  daily_message_limit INTEGER DEFAULT 1000,
  messages_sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ✅ Audit log de mensajes enviados
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  patient_id UUID REFERENCES patients,
  appointment_id UUID REFERENCES appointments,
  message_body TEXT NOT NULL,
  whatsapp_message_id TEXT,  -- ID de Meta
  status TEXT DEFAULT 'pending',  -- sent, delivered, read, failed
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ✅ Flags en appointments para evitar duplicados
ALTER TABLE appointments
  ADD COLUMN reminder_24h_sent BOOLEAN DEFAULT false,
  ADD COLUMN reminder_1h_sent BOOLEAN DEFAULT false;
```

**Cron Job Configuration (Vercel)**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/whatsapp-reminders",
    "schedule": "0 * * * *"  // Cada hora
  }]
}
```

**UI Components**
```typescript
// components/settings/WhatsAppConfigForm.tsx
// ✅ Formulario para ingresar credenciales Meta Business
// ✅ Toggle para activar/desactivar recordatorios
// ✅ Test de conexión (enviar mensaje de prueba)
// ✅ Configuración de límites diarios
```

---

### 2.2 Gaps Críticos (10% Faltante) - ✅ COMPLETADO

#### ✅ **GAP 1: Templates + Opt-in/Opt-out - IMPLEMENTADO**

**Estado:** ✅ Sistema completo implementado (16/Nov/2025)

**Problema Original:**
```typescript
// ❌ Enviando mensajes de texto plano (tipo "text")
// Meta Business requiere Message Templates aprobados para iniciar conversaciones
```

**Solución Implementada:**

**1. Base de Datos (`20251116_whatsapp_templates.sql`)**
- ✅ Tabla `whatsapp_templates` - gestión de plantillas
- ✅ Tabla `patient_whatsapp_consent` - opt-in/opt-out
- ✅ RLS policies completas
- ✅ Estados: draft → pending → approved/rejected

**2. APIs REST (7 endpoints)**
- ✅ `GET/POST /api/whatsapp/templates` - CRUD de templates
- ✅ `POST /api/whatsapp/templates/[id]/submit` - Enviar a Meta
- ✅ `POST /api/whatsapp/templates/[id]/approve` - Marcar aprobado
- ✅ `POST /api/whatsapp/templates/[id]/reject` - Marcar rechazado
- ✅ `GET/POST /api/whatsapp/consent` - Gestionar consentimiento
- ✅ `POST /api/whatsapp/consent/opt-out` - Dar de baja paciente

**3. UI Nueva**
- ✅ `/dashboard/settings/whatsapp-templates` - Gestión completa
- ✅ Editor de pacientes con checkbox de consentimiento WhatsApp
- ✅ Validación de consent antes de enviar mensajes

**4. Cumplimiento Legal**
- ✅ GDPR/LFPDPPP compliance
- ✅ Opt-in explícito del paciente
- ✅ Opt-out permanente con fecha y razón

---

#### ⚠️ **PENDIENTE: Configurar WhatsApp Business Account**

**Requisitos para usar el sistema:**

**Paso 1: Crear cuenta WhatsApp Business (Meta Business Manager)**

1. Ir a https://business.facebook.com/
2. Crear cuenta de negocio "AgendaMedPro" (o tu marca)
3. Verificar negocio con Meta
4. WhatsApp Manager → Agregar número de teléfono
5. Verificar número con SMS (debe ser dedicado, NO personal)

**Paso 2: Obtener credenciales API**

En WhatsApp Manager:
- `WABA ID` (WhatsApp Business Account ID)
- `Phone Number ID`
- `Access Token` (permanente, para production)

**Paso 3: Configurar en AgendaMedPro**

1. Ir a `/dashboard/settings/whatsapp`
2. Pegar credenciales de Meta Business
3. Probar conexión
4. Activar recordatorios automáticos

**Paso 4: Crear templates en Meta Business Manager**

1. WhatsApp Manager → Message Templates → Create Template
2. Crear estos templates básicos:

```
Template: recordatorio_cita_24h
Categoría: UTILITY
Idioma: es_MX

Cuerpo:
Hola {{1}} 👋

Te recordamos tu cita médica:
📅 Fecha: {{2}}
🕐 Hora: {{3}}
👨‍⚕️ Doctor: {{4}}
📍 Ubicación: {{5}}

Es mañana, ¡te esperamos!

Botones:
[Confirmar ✅] [Reagendar 📅]
```

```
Template: confirmacion_cita
Categoría: UTILITY
Idioma: es_MX

Cuerpo:
✅ Tu cita ha sido confirmada

👤 Paciente: {{1}}
📅 Fecha: {{2}}
🕐 Hora: {{3}}
👨‍⚕️ Doctor: {{4}}

Recibirás un recordatorio 24 horas antes.
```

3. Enviar a aprobación (esperar 1-3 días)
4. Una vez aprobados, ir a `/dashboard/settings/whatsapp-templates`
5. Marcar templates como "approved" con Template ID de Meta

**Paso 5: Probar sistema completo**

```bash
npx tsx scripts/test-whatsapp-templates.ts
```

---

#### 🚨 **GAP 2: Webhooks para Status de Mensajes (PENDIENTE)**
3. Crear template "recordatorio_24h":

```
Nombre: recordatorio_24h
Categoría: UTILITY
Idioma: es_MX

Cuerpo:
Hola {{1}} 👋

Te recordamos tu cita médica:
📅 Fecha: {{2}}
🕐 Hora: {{3}}
👨‍⚕️ Doctor: {{4}}
📍 Ubicación: {{5}}

Es mañana, ¡te esperamos!

Botones:
[Confirmar Asistencia] [Reagendar]
```

4. Crear template "recordatorio_1h":

```
Nombre: recordatorio_1h
Categoría: UTILITY
Idioma: es_MX

Cuerpo:
Hola {{1}} 👋

Tu cita es en 1 hora:
🕐 Hora: {{2}}
📍 Ubicación: {{3}}

¡No olvides llegar 10 minutos antes!

Botón:
[Ver Ubicación]
```

**Paso 2: Actualizar código para usar templates**

```typescript
// lib/whatsapp/send-template-message.ts
export async function sendTemplateMessage(params: {
  config: MessagingConfig;
  to: string;
  templateName: string;
  components: Array<{
    type: 'body' | 'button';
    parameters: Array<{ type: 'text', text: string }>;
  }>;
}) {
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${params.config.whatsapp_phone_number_id}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${params.config.whatsapp_access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'template',
        template: {
          name: params.templateName,
          language: { code: 'es_MX' },
          components: params.components
        }
      })
    }
  );

  return response.json();
}

// Usar en cron job
await sendTemplateMessage({
  config,
  to: appointment.patients.phone,
  templateName: 'recordatorio_24h',
  components: [{
    type: 'body',
    parameters: [
      { type: 'text', text: appointment.patients.name },
      { type: 'text', text: formatDate(appointment.date) },
      { type: 'text', text: formatTime(appointment.time) },
      { type: 'text', text: appointment.doctors.name },
      { type: 'text', text: appointment.locations.name }
    ]
  }]
});
```

**Paso 3: Guardar template names en DB**

```sql
ALTER TABLE messaging_config
  ADD COLUMN template_reminder_24h TEXT DEFAULT 'recordatorio_24h',
  ADD COLUMN template_reminder_1h TEXT DEFAULT 'recordatorio_1h';
```

**Esfuerzo Estimado:** 6 horas
- 2h: Crear templates en Meta Business Manager (esperar aprobación 1-3 días)
- 2h: Actualizar código para usar templates
- 2h: Testing en producción

---

#### ⚠️ **GAP 2: Falta Webhook para Status Updates**

**Problema Actual:**
```typescript
// whatsapp_messages.status siempre queda en 'sent'
// No sabemos si el mensaje fue delivered o read
```

**Solución:**

**Paso 1: Configurar webhook en Meta**

1. Ir a Meta App → WhatsApp → Configuration
2. Webhook URL: `https://agendamedpro.com/api/webhooks/whatsapp`
3. Verificar token: `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
4. Subscribe a eventos: `messages`, `message_status`

**Paso 2: Crear endpoint de webhook**

```typescript
// app/api/webhooks/whatsapp/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verificación inicial de Meta
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const body = await request.json();

  // Procesar status updates
  if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
    const statuses = body.entry[0].changes[0].value.statuses;

    for (const status of statuses) {
      const whatsappMessageId = status.id;
      const newStatus = status.status;  // sent, delivered, read, failed

      // Actualizar en DB
      await supabase
        .from('whatsapp_messages')
        .update({
          status: newStatus,
          delivered_at: newStatus === 'delivered' ? new Date().toISOString() : undefined,
          read_at: newStatus === 'read' ? new Date().toISOString() : undefined,
          error_message: status.errors?.[0]?.message
        })
        .eq('whatsapp_message_id', whatsappMessageId);
    }
  }

  return NextResponse.json({ success: true });
}
```

**Paso 3: UI para ver status**

```typescript
// components/messaging/WhatsAppMessageStatus.tsx
function WhatsAppMessageStatus({ status, sentAt, deliveredAt, readAt }: Props) {
  return (
    <div className="flex items-center gap-2">
      {status === 'sent' && <Clock className="w-4 h-4 text-gray-400" />}
      {status === 'delivered' && <Check className="w-4 h-4 text-blue-500" />}
      {status === 'read' && <CheckCheck className="w-4 h-4 text-blue-500" />}
      {status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
      
      <span className="text-sm text-gray-600">
        {status === 'sent' && `Enviado ${formatDistanceToNow(sentAt)}`}
        {status === 'delivered' && `Entregado ${formatDistanceToNow(deliveredAt)}`}
        {status === 'read' && `Leído ${formatDistanceToNow(readAt)}`}
        {status === 'failed' && 'No entregado'}
      </span>
    </div>
  );
}
```

**Esfuerzo Estimado:** 4 horas
- 2h: Configurar webhook en Meta + crear endpoint
- 1h: Actualizar DB con timestamps
- 1h: UI para mostrar status

---

#### ⚠️ **GAP 3: Opt-in/Opt-out Management**

**Problema Actual:**
```typescript
// No hay forma de que pacientes se den de baja de recordatorios
// Violación GDPR y Ley Federal de Protección de Datos (México)
```

**Solución:**

**Paso 1: Agregar preferencias a pacientes**

```sql
ALTER TABLE patients
  ADD COLUMN whatsapp_opt_in BOOLEAN DEFAULT true,
  ADD COLUMN whatsapp_opt_out_date TIMESTAMPTZ;
```

**Paso 2: Botón en UI para opt-out**

```typescript
// components/patients/PatientMessagingPreferences.tsx
<Switch
  checked={patient.whatsapp_opt_in}
  onCheckedChange={async (checked) => {
    await updatePatient(patient.id, {
      whatsapp_opt_in: checked,
      whatsapp_opt_out_date: checked ? null : new Date()
    });
  }}
/>
<Label>
  Recibir recordatorios por WhatsApp
</Label>
```

**Paso 3: Respetar opt-out en cron job**

```typescript
// app/api/cron/whatsapp-reminders/route.ts
const { data: appointments } = await supabase
  .from('appointments')
  .select(`
    *,
    patients!inner(*, whatsapp_opt_in)  // Join con pacientes
  `)
  .eq('patients.whatsapp_opt_in', true)  // ✅ Solo pacientes que aceptaron
  .gte('date', now.toISOString());
```

**Paso 4: Keyword "STOP" en mensajes**

```typescript
// Agregar footer a templates de Meta
Footer: "Responde STOP para cancelar recordatorios"

// Webhook para procesar respuestas
if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
  const message = body.entry[0].changes[0].value.messages[0];
  
  if (message.text?.body?.toUpperCase() === 'STOP') {
    // Buscar paciente por teléfono
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', message.from)
      .single();

    // Opt-out
    await supabase
      .from('patients')
      .update({
        whatsapp_opt_in: false,
        whatsapp_opt_out_date: new Date()
      })
      .eq('id', patient.id);

    // Enviar confirmación
    await sendWhatsAppMessage({
      to: message.from,
      text: 'Has cancelado los recordatorios. Para reactivarlos, contacta a tu médico.'
    });
  }
}
```

**Esfuerzo Estimado:** 4 horas
- 1h: Agregar campos a patients
- 2h: UI para preferencias + filtro en cron
- 1h: Keyword "STOP" processing

---

### 2.3 Resumen WhatsApp Recordatorios

| Componente | Estado | Esfuerzo Faltante | Prioridad |
|------------|--------|------------------|-----------|
| Templates Meta Aprobados | ❌ 0% | 6 horas | **P0** |
| Webhook Status Updates | ❌ 0% | 4 horas | **P1** |
| Opt-in/Opt-out | ❌ 0% | 4 horas | **P0** |
| **TOTAL** | **90%** | **14 horas** | **1-2 semanas** |

---

## Próximos Pasos

Ver [PLAN_SAT_WHATSAPP_PAGOS_PARTE2.md](./PLAN_SAT_WHATSAPP_PAGOS_PARTE2.md) para:
- Pagos con Stripe (estado 95%)
- Pagos con OpenPay (estado 40%)
- Timeline de implementación
- Matriz de prioridades

---

**Última actualización:** Noviembre 16, 2025  
**Autor:** AgendaMedPro Development Team