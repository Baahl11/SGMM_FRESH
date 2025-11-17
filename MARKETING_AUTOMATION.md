# Marketing Automation Completo - AgendaMedPro

**Fecha de creación:** 16 de noviembre, 2025  
**Prioridad:** ⭐⭐⭐⭐ (Alta - 3ra en roadmap)  
**Inversión total:** $15,000 USD (escalonada en 3 fases)  
**Timeline:** 12-16 meses (Fase 1: Abr-Jun 2026)  
**Impacto esperado:** +40% retención, +$60K MXN/año por cliente

---

## **📊 CONTEXTO ACTUAL DEL SISTEMA**

### **Estado de Mensajería (Noviembre 2025)**

#### **✅ Email Básico IMPLEMENTADO**
- **Proveedor:** SendGrid API + SMTP nativo (doctor's email)
- **Templates activos:** 2 (Recordatorio 24h, Recordatorio 2h)
- **Fallback automático:** SMTP → SendGrid → Resend
- **Rate limiting:**
  - Gmail: 500 emails/día
  - Outlook: 300 emails/día
- **Trial emails:** Welcome + Expiration reminder
- **Ubicación código:** `vercel-migration/lib/email-service.ts`

#### **✅ WhatsApp PARCIALMENTE IMPLEMENTADO**
- **Modelo:** BYOK (Bring Your Own Key) - Twilio
- **Tablas DB:**
  - `messaging_config` (credenciales por usuario)
  - `whatsapp_messages` (logs de envío)
- **API Endpoints:**
  - `POST /api/messaging/whatsapp/send` (envío individual)
  - `POST /api/messaging/whatsapp/test` (validar credenciales)
- **Templates:** Configurables vía JSONB
- **Status tracking:** sent, delivered, read, failed

#### **✅ Infraestructura DB Existente**
```sql
-- Tablas base para messaging
notification_logs (id, user_id, type, channel, recipient, status, sent_at)
email_templates (id, user_id, name, subject, body_html, variables)
messaging_providers (id, user_id, provider_type, credentials, is_active)
messaging_jobs (id, type, payload, status, scheduled_at, executed_at)
```

#### **❌ FALTA - Marketing Automation**
- Campañas bulk (envío masivo a 100+ pacientes)
- Segmentación avanzada de pacientes
- Flujos automatizados (drip campaigns)
- A/B testing de mensajes
- Analytics de campañas (open rate, click rate, ROI)
- Social media booking (Facebook/Instagram)
- SMS bulk campaigns

---

## **🎯 QUÉ ES MARKETING AUTOMATION**

**Definición:** Sistema que permite enviar mensajes personalizados y masivos a segmentos de pacientes de forma automatizada, midiendo resultados y optimizando conversión para incrementar retención y revenue.

### **Componentes Principales**

#### **1. Email Campaigns (Bulk Sending)**

```typescript
interface EmailCampaign {
  id: string
  user_id: string
  name: string
  subject: string
  body_html: string
  body_text: string // Fallback para clientes sin HTML
  segment_id: string // Qué pacientes reciben
  
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  scheduled_at: Date
  
  // Metrics
  total_recipients: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  bounced_count: number
  unsubscribed_count: number
  
  created_at: Date
  updated_at: Date
}
```

**Casos de uso reales:**

1. **Recordatorio de revisión periódica**
   - Target: Pacientes sin cita en 6+ meses
   - Subject: "Es momento de tu revisión dental, Dr. García te espera"
   - Body: Personalizado con nombre, última visita, link de booking
   - Frecuencia: Automática cada trimestre

2. **Promociones estacionales**
   - Target: Todos los pacientes activos
   - Subject: "20% descuento en limpieza dental - Solo este mes"
   - Body: Imagen promocional, términos, botón "Agendar ahora"
   - Timing: Primera semana del mes

3. **Educación de pacientes**
   - Target: Pacientes que recibieron tratamiento X
   - Subject: "Cuidados post-tratamiento: 5 tips esenciales"
   - Body: Newsletter con consejos, imágenes, videos
   - Frecuencia: Mensual

4. **Re-engagement (recuperación)**
   - Target: Pacientes inactivos 90+ días
   - Subject: "Te extrañamos - Vuelve y obtén una consulta gratis"
   - Body: Mensaje emotivo + incentivo
   - Frecuencia: Una vez (no spam)

5. **Cumpleaños**
   - Target: Pacientes con cumpleaños este mes
   - Subject: "¡Feliz cumpleaños! 🎂 Aquí está tu regalo"
   - Body: Descuento especial 15%
   - Timing: Automático 3 días antes del cumpleaños

#### **2. SMS Bulk Campaigns**

```typescript
interface SMSCampaign {
  id: string
  user_id: string
  name: string
  message: string // Max 160 caracteres (1 SMS)
  segment_id: string
  
  scheduled_at: Date
  status: 'draft' | 'scheduled' | 'sending' | 'sent'
  
  // Costos
  cost_per_sms: number // ~$0.05 USD (Twilio)
  total_recipients: number
  estimated_cost: number
  actual_cost: number
  
  // Metrics
  sent_count: number
  delivered_count: number
  clicked_count: number // Si incluye link corto
  
  created_at: Date
}
```

**Casos de uso SMS:**

1. **Cancelaciones de última hora**
   - Message: "URGENTE: Cancelación hoy 3PM. Agenda ahora: agendamedpro.com/dr-garcia"
   - Timing: Inmediato
   - Target: Pacientes disponibles ese día

2. **Confirmación masiva**
   - Message: "Confirma tu cita del 20 Nov 10AM respondiendo SÍ. Dr. García"
   - Timing: 48 horas antes
   - Target: Todas las citas del día siguiente

3. **Alertas de salud**
   - Message: "Nueva vacuna COVID disponible para niños. Más info: [link]"
   - Timing: Cuando hay novedad
   - Target: Pacientes con hijos menores de 12 años

4. **Recordatorios de pago**
   - Message: "Tienes $500 MXN pendiente de tu última consulta. Paga aquí: [link]"
   - Timing: 7 días después de cita
   - Target: Pacientes con saldo pendiente

**Importante:** SMS es **25x más caro** que email pero tiene **98% open rate** vs 20% email.

#### **3. Segmentación Avanzada de Pacientes**

```typescript
interface PatientSegment {
  id: string
  user_id: string
  name: string
  description: string
  
  criteria: {
    // ===== DEMOGRÁFICOS =====
    age_min?: number
    age_max?: number
    gender?: 'M' | 'F' | 'Otro'
    city?: string
    
    // ===== COMPORTAMIENTO DE VISITAS =====
    last_visit_days_ago_min?: number
    last_visit_days_ago_max?: number
    total_visits_min?: number
    total_visits_max?: number
    first_visit_days_ago_min?: number // Pacientes nuevos
    first_visit_days_ago_max?: number
    
    // ===== FINANCIERO =====
    total_spent_min?: number
    total_spent_max?: number
    average_ticket_min?: number
    average_ticket_max?: number
    has_pending_invoices?: boolean
    pending_amount_min?: number
    
    // ===== TRATAMIENTOS =====
    received_treatments?: string[] // IDs de treatments
    NOT_received_treatments?: string[] // No han recibido X
    has_treatment_tag?: string[] // Ej: "botox", "facial"
    treatment_count_min?: number
    
    // ===== ENGAGEMENT =====
    opened_last_email?: boolean
    clicked_last_link?: boolean
    unsubscribed?: boolean
    email_bounced?: boolean
    responded_to_whatsapp?: boolean
    
    // ===== FECHAS ESPECIALES =====
    birthday_this_month?: boolean
    anniversary_this_month?: boolean // Primera visita
    
    // ===== SUBSCRIPTION TIER (para segmentar doctores) =====
    subscription_tier?: 'basico' | 'pro' | 'enterprise' | 'lifetime'
  }
  
  is_dynamic: boolean // Si se recalcula automáticamente
  patient_count: number // Cached count
  last_calculated_at: Date
  
  created_at: Date
  updated_at: Date
}
```

**Segmentos Pre-configurados (Templates):**

1. **Inactivos (Alto riesgo churn)**
   ```json
   {
     "name": "Pacientes inactivos",
     "criteria": {
       "last_visit_days_ago_min": 90,
       "unsubscribed": false
     }
   }
   ```

2. **VIP (Alto valor)**
   ```json
   {
     "name": "Pacientes VIP",
     "criteria": {
       "total_spent_min": 10000,
       "total_visits_min": 5
     }
   }
   ```

3. **Nuevos (Onboarding)**
   ```json
   {
     "name": "Pacientes nuevos",
     "criteria": {
       "first_visit_days_ago_max": 30
     }
   }
   ```

4. **Cumpleañeros del mes**
   ```json
   {
     "name": "Cumpleaños este mes",
     "criteria": {
       "birthday_this_month": true,
       "unsubscribed": false
     }
   }
   ```

5. **Sin completar tratamiento**
   ```json
   {
     "name": "Tratamiento incompleto",
     "criteria": {
       "has_treatment_tag": ["ortodoncia"],
       "last_visit_days_ago_min": 45
     }
   }
   ```

6. **Candidatos a upsell**
   ```json
   {
     "name": "Candidatos a blanqueamiento",
     "criteria": {
       "total_visits_min": 3,
       "NOT_received_treatments": ["blanqueamiento_dental_123"],
       "total_spent_min": 2000
     }
   }
   ```

#### **4. Automatización de Flujos (Drip Campaigns)**

```typescript
interface AutomationFlow {
  id: string
  user_id: string
  name: string
  description: string
  
  trigger: {
    type: 'patient_created' | 'appointment_completed' | 'segment_join' | 
          'date_based' | 'manual' | 'treatment_completed'
    
    // Config específico por tipo
    segment_id?: string // Si type = 'segment_join'
    treatment_id?: string // Si type = 'treatment_completed'
    days_after_trigger?: number // Delay inicial
  }
  
  steps: Array<{
    step_number: number
    delay_days: number // Días después del paso anterior
    channel: 'email' | 'sms' | 'whatsapp'
    template_id: string
    
    // Condiciones para continuar en flujo
    conditions?: {
      opened_email?: boolean // Solo si abrió email anterior
      clicked_link?: boolean // Solo si hizo click
      NOT_booked_appointment?: boolean // Solo si no agendó
      time_of_day?: string // "09:00" - enviar a esta hora
    }
    
    // Acciones adicionales
    actions?: {
      add_to_segment?: string // Agregar a otro segmento
      remove_from_segment?: string
      create_task?: boolean // Tarea para secretaria
    }
  }>
  
  exit_conditions: {
    appointment_booked?: boolean // Salir si agenda cita
    unsubscribed?: boolean // Salir si se da de baja
    max_steps?: number // Máximo de pasos
  }
  
  status: 'active' | 'paused' | 'draft'
  
  // Metrics del flujo
  total_enrolled: number
  currently_active: number
  completed: number
  exited_early: number
  conversion_rate: number // % que completó objetivo
  
  created_at: Date
  updated_at: Date
}
```

**Flujos Pre-configurados (Templates):**

**FLUJO 1: Onboarding de Paciente Nuevo**
```typescript
{
  name: "Bienvenida paciente nuevo",
  trigger: { type: 'patient_created', days_after_trigger: 0 },
  steps: [
    {
      step_number: 1,
      delay_days: 0, // Inmediato
      channel: 'email',
      template_id: 'welcome_email',
      // "Bienvenido a [Consultorio], conoce nuestros servicios"
    },
    {
      step_number: 2,
      delay_days: 3,
      channel: 'sms',
      template_id: 'reminder_first_appointment',
      conditions: { NOT_booked_appointment: true },
      // "Hola [Nombre], aún no has agendado tu primera cita. ¿Te ayudamos?"
    },
    {
      step_number: 3,
      delay_days: 7,
      channel: 'email',
      template_id: 'follow_up_post_visit',
      conditions: { NOT_booked_appointment: false },
      // Solo si ya vino: "¿Cómo estuvo tu experiencia?"
    },
    {
      step_number: 4,
      delay_days: 30,
      channel: 'email',
      template_id: 'satisfaction_survey',
      // Encuesta de satisfacción + link a Google Review
    }
  ],
  exit_conditions: {
    unsubscribed: true,
    max_steps: 4
  }
}
```

**FLUJO 2: Recordatorio de Seguimiento Post-Tratamiento**
```typescript
{
  name: "Seguimiento post-tratamiento",
  trigger: { 
    type: 'treatment_completed',
    treatment_id: 'limpieza_dental_123'
  },
  steps: [
    {
      step_number: 1,
      delay_days: 7,
      channel: 'whatsapp',
      template_id: 'post_treatment_care',
      // "¿Cómo te sientes después de tu limpieza? Aquí hay consejos"
    },
    {
      step_number: 2,
      delay_days: 90,
      channel: 'email',
      template_id: 'schedule_next_cleaning',
      // "Han pasado 3 meses, es momento de tu próxima limpieza"
    },
    {
      step_number: 3,
      delay_days: 97, // 7 días después
      channel: 'sms',
      template_id: 'urgent_reminder',
      conditions: { NOT_booked_appointment: true },
      // "Última oportunidad: 15% descuento si agendas esta semana"
    }
  ],
  exit_conditions: {
    appointment_booked: true // Sale del flujo si agenda
  }
}
```

**FLUJO 3: Re-engagement de Inactivos**
```typescript
{
  name: "Recuperación de pacientes inactivos",
  trigger: { 
    type: 'segment_join',
    segment_id: 'inactivos_90_dias'
  },
  steps: [
    {
      step_number: 1,
      delay_days: 0,
      channel: 'email',
      template_id: 'we_miss_you',
      // "Te extrañamos [Nombre], vuelve con 20% descuento"
    },
    {
      step_number: 2,
      delay_days: 7,
      channel: 'sms',
      template_id: 'special_offer',
      conditions: { opened_email: false },
      // Solo si NO abrió email: "Consulta GRATIS si vuelves este mes"
    },
    {
      step_number: 3,
      delay_days: 14,
      channel: 'whatsapp',
      template_id: 'personal_call',
      actions: { create_task: true }, // Tarea para secretaria
      // "Nuestra secretaria te contactará para ofrecerte una cita especial"
    }
  ],
  exit_conditions: {
    appointment_booked: true,
    max_steps: 3
  }
}
```

**FLUJO 4: Cumpleaños (Automático)**
```typescript
{
  name: "Felicitación de cumpleaños",
  trigger: { 
    type: 'date_based',
    days_after_trigger: -3 // 3 días antes del cumpleaños
  },
  steps: [
    {
      step_number: 1,
      delay_days: 0,
      channel: 'email',
      template_id: 'birthday_greeting',
      conditions: { time_of_day: '09:00' },
      // "¡Feliz cumpleaños! 🎂 Aquí está tu regalo: 15% descuento"
    },
    {
      step_number: 2,
      delay_days: 14, // 2 semanas después
      channel: 'sms',
      template_id: 'birthday_offer_expiring',
      conditions: { NOT_booked_appointment: true },
      // "Tu descuento de cumpleaños vence en 7 días, úsalo ahora"
    }
  ]
}
```

#### **5. Facebook/Instagram Booking Directo**

```typescript
interface SocialMediaIntegration {
  id: string
  user_id: string
  platform: 'facebook' | 'instagram'
  
  // Meta Business API
  page_id: string
  access_token: string
  app_id: string
  app_secret: string
  
  // Lead Ads (formularios nativos en Facebook/Instagram)
  lead_form_id?: string
  lead_form_config: {
    questions: Array<{
      type: 'name' | 'phone' | 'email' | 'custom'
      label: string
      required: boolean
    }>
    thank_you_message: string
    privacy_policy_url: string
  }
  
  // Messenger Chatbot
  messenger_enabled: boolean
  auto_reply_templates: {
    greeting: string
    appointment_request: string
    price_inquiry: string
    hours_inquiry: string
    fallback: string
  }
  
  // WhatsApp Business Button (click-to-chat)
  whatsapp_number: string
  whatsapp_pre_filled_message: string
  
  // Instagram Stories
  stories_swipe_up_enabled: boolean
  booking_url: string // Link a /public/clinic/[slug]
  
  status: 'active' | 'pending_review' | 'rejected'
  created_at: Date
}
```

**Funcionalidades Social Media:**

1. **Lead Ads (Facebook/Instagram)**
   - Formulario nativo: Usuario NO sale de la app
   - Auto-rellena nombre/email de su perfil
   - Envío directo a AgendaMedPro
   - Conversión típica: 15-25% (vs 5% con link externo)

2. **Messenger Chatbot**
   ```
   Usuario: "Hola"
   Bot: "¡Hola! Soy el asistente virtual de Dr. García. ¿En qué puedo ayudarte?
         1️⃣ Agendar cita
         2️⃣ Ver precios
         3️⃣ Horarios
         4️⃣ Hablar con humano"
   
   Usuario: "1"
   Bot: "Perfecto, puedes agendar aquí: [link] o dime tu teléfono y te llamamos"
   ```

3. **Click-to-WhatsApp Button**
   - Botón en perfil de Facebook/Instagram
   - Pre-llena mensaje: "Hola, quiero agendar una cita con Dr. García"
   - Abre WhatsApp directo

4. **Instagram Stories Swipe-Up**
   - Sticker "Agenda tu cita" en Stories
   - Link a página pública de booking
   - Trackeable con UTM params

---

## **💡 PROS - Beneficios Estratégicos**

### **1. Retención de Pacientes (+40%)**

**Problema actual sin automation:**
- 60% de pacientes NO regresan después de 6 meses
- No hay seguimiento proactivo
- Secretaria no tiene tiempo de llamar a 200+ pacientes

**Con Marketing Automation:**

**Escenario real de un consultorio:**
- **Base de datos:** 500 pacientes
- **Inactivos (>90 días):** 300 pacientes (60%)
- **Automation recupera:** 30% de inactivos = 90 pacientes
- **Revenue adicional:** 90 × $800 MXN promedio = **$72,000 MXN/año**

**Flujo automático anti-churn:**
```
Día 90 sin cita → Email "Te extrañamos" (20% abre)
Día 97 → SMS "Promoción especial" (95% lee)
Día 104 → WhatsApp personalizado (85% lee)
Resultado: 30-40% re-agenda
```

**Comparativa:**
| Método | Costo | Tiempo | Tasa de éxito |
|--------|-------|--------|---------------|
| Llamadas manuales | $0 | 12 hrs/semana | 15% |
| Email automation | $0.001/email | 0 hrs | 30% |
| SMS automation | $0.05/sms | 0 hrs | 40% |

### **2. Revenue Incremental ($60K-120K MXN/año por cliente)**

**Caso 1: Recuperación de inactivos**
```
500 pacientes × 60% inactivos = 300
300 × 30% recuperación = 90 pacientes
90 × $800 promedio cita = $72,000 MXN/año
```

**Caso 2: Upsell de tratamientos**
```
Campaña: "Blanqueamiento dental $1,500 este mes"
Target: 200 pacientes que NO lo tienen
Conversión: 10% = 20 pacientes
20 × $1,500 = $30,000 MXN adicional
```

**Caso 3: Reducción de no-shows**
```
Sin automation: 20% no-shows
Con recordatorios SMS 2h antes: 8% no-shows
Reducción: 12% × 100 citas/mes × $800 = $9,600 MXN/mes
= $115,200 MXN/año recuperado
```

**TOTAL REVENUE ADICIONAL:** $72K + $30K + $115K = **$217,000 MXN/año**

### **3. Eficiencia Operativa (Ahorro 10-15 horas/semana)**

**Sin automation (proceso manual):**
- Secretaria llama a 50 pacientes/día para recordatorios
- 3 min por llamada = 150 min/día
- 5 días × 150 min = **750 min/semana = 12.5 horas**
- Costo: 12.5 hrs × $50 MXN/hr = $625 MXN/semana = **$32,500 MXN/año**

**Con automation:**
- Bulk SMS/WhatsApp a 50 pacientes: **2 clicks, 30 segundos**
- Costo operativo: $0.05 × 50 × 20 días = $50 USD/mes = $1,000 MXN/mes

**Ahorro neto:** $32,500 - $12,000 = **$20,500 MXN/año**

**Plus:** Secretaria puede dedicar esas 12 horas a:
- Atención al cliente (mejor experiencia)
- Seguimiento personalizado a VIPs
- Gestión de agenda (optimización)

### **4. Datos y Optimización (Ventaja competitiva)**

**Sin analytics:** "Envío emails, pero no sé si sirven"

**Con Marketing Automation:**

```typescript
// Dashboard de campaña en tiempo real
{
  campaign: "Promoción blanqueamiento Nov 2025",
  
  funnel: {
    sent: 500,
    delivered: 485, // 97% delivery rate
    opened: 290, // 60% open rate (industria: 20%)
    clicked: 87, // 30% CTR (de los abiertos)
    appointments_booked: 23, // 26% conversion (de los clicks)
    revenue_generated: 34500, // $34,500 MXN
    cost: 240, // $240 MXN (Twilio)
    roi: 14375% // Return on investment
  },
  
  insights: {
    best_subject_line: "🎁 Blanqueamiento $1,500 - Solo hoy",
    best_send_time: "Martes 10:00 AM",
    best_segment: "Mujeres 25-40 años, VIP",
    underperforming_segment: "Hombres >50 años"
  }
}
```

**Poder de optimización:**
- **A/B test subject lines:** "Promoción" vs "🎁 Regalo especial" → +15% open rate
- **Mejor horario:** Martes 10 AM vs Viernes 6 PM → +25% engagement
- **Segmentación precisa:** Solo mujeres interesadas → +50% conversión

**Resultado:** Cada campaña es mejor que la anterior (aprendizaje continuo).

### **5. Ventaja Competitiva vs Competidores**

| Feature | AgendaMedPro (con automation) | Doctoralia | QMedic | Medikas | AgendaPro |
|---------|-------------------------------|------------|--------|---------|-----------|
| **Email bulk campaigns** | ✅ Ilimitadas | ❌ No tiene | ⚠️ Básico (100/mes) | ❌ No tiene | ✅ Limitadas |
| **SMS bulk** | ✅ BYOK Twilio | ❌ | ❌ | ❌ | ⚠️ Caro ($0.15/sms) |
| **WhatsApp bulk** | ✅ BYOK | ❌ | ❌ | ❌ | ✅ BYOK |
| **Segmentación avanzada** | ✅ 15+ criterios | ⚠️ Básica (3) | ❌ | ❌ | ⚠️ 5 criterios |
| **Flujos automatizados** | ✅ Drip campaigns | ❌ | ❌ | ❌ | ⚠️ Solo recordatorios |
| **Facebook/Instagram booking** | ✅ Direct integration | ⚠️ Solo perfil | ❌ | ❌ | ❌ |
| **Analytics de campañas** | ✅ Dashboard completo | ❌ | ❌ | ❌ | ⚠️ Básico |
| **A/B testing** | ✅ Automático | ❌ | ❌ | ❌ | ❌ |
| **Templates profesionales** | ✅ 20+ diseñados | ⚠️ 5 básicos | ⚠️ 3 | ❌ | ⚠️ 10 |

**Argumento de venta diferenciador:**

> "Los otros sistemas solo envían recordatorios básicos de citas. **AgendaMedPro tiene campañas de marketing profesionales** como Mailchimp o HubSpot, pero **integradas con tu agenda médica**.
> 
> Recupera pacientes inactivos, envía promociones segmentadas y mide todo. **AgendaPro cobra $0.15 por SMS, nosotros usas tu cuenta Twilio a $0.05**. Ahorro 66%."

### **6. Incremento en Precio de Planes (Justificado)**

**Pricing actual:**
- Básico: $599 MXN/mes
- Pro: $999 MXN/mes
- Enterprise: $2,999 MXN/mes
- Lifetime: $19,999 MXN (pago único)

**Con Marketing Automation, puedes subir:**
- Básico: $599 → **$699** (+$100/mes) - Email campaigns básico
- Pro: $999 → **$1,299** (+$300/mes) - Email + SMS + Segmentación
- Enterprise: $2,999 → **$3,499** (+$500/mes) - Todo + Social media + Automation flows

**Justificación para clientes:**
- "Recupera el costo con solo 2 pacientes inactivos que regresen"
- "Otros sistemas de email marketing cuestan $300 MXN/mes aparte (Mailchimp, Sendinblue)"
- "Aquí está TODO integrado: agenda + pacientes + marketing"

**Revenue adicional para AgendaMedPro:**
```
50 clientes × $200 promedio aumento = $10,000 MXN/mes adicional
= $120,000 MXN/año
= $6,000 USD/año extra revenue
```

---

## **⚠️ CONTRAS - Desafíos y Riesgos**

### **1. Complejidad de Desarrollo (3-4 meses full-time)**

**Scope creep:** NO es solo "agregar botón de envío masivo".

**Componentes requeridos:**

✅ **Campaign Builder UI (4 semanas)**
- Drag & drop email editor (ej: GrapeJS, Unlayer)
- Preview desktop/mobile
- Template library (20+ diseños)
- Variable system ({{nombre}}, {{ultima_visita}})
- Image upload + gallery
- Link shortener (trackear clicks)

✅ **Segment Editor (3 semanas)**
- Visual query builder (no código SQL)
- Real-time count de pacientes
- Preview de pacientes en segmento
- Save + share segments
- Dynamic vs static segments

✅ **Scheduling Engine (2 semanas)**
- Cron jobs system (node-cron o BullMQ)
- Queue management (prioridad, retry)
- Rate limiting (no saturar Twilio)
- Timezone handling (México, USA)
- Batch processing (enviar 1000 emails en chunks de 100)

✅ **Analytics Dashboard (3 semanas)**
- Charts (recharts): Line, bar, pie
- Funnel visualization
- Export CSV/PDF
- Date range filters
- Comparison (campaña A vs B)

✅ **A/B Testing (2 semanas)**
- Split traffic (50/50 o custom)
- Winner selection (auto o manual)
- Statistical significance calculator

✅ **Compliance (1 semana)**
- Unsubscribe management (1-click)
- Opt-in tracking (GDPR/CAN-SPAM)
- Bounce/spam handling
- Physical address in footer
- List-Unsubscribe header (email)

✅ **Social Media Integration (4 semanas)**
- Facebook Graph API
- Instagram Graph API
- Lead Ads webhook
- Messenger webhook
- OAuth flow

**Total:** ~16-18 semanas (4-4.5 meses)

**Estimación costo desarrollo:**
- In-house (1 dev full-time): $4,000 USD/mes × 4 = **$16,000 USD**
- Outsource (agencia): **$20,000-25,000 USD**
- Freelancers (México): **$10,000-12,000 USD**

**Recomendación:** Contratar dev senior con experiencia en email marketing systems.

### **2. Costos Operativos Recurrentes**

**Proveedores necesarios:**

| Servicio | Plan | Costo Mensual | Límite | Notas |
|----------|------|---------------|--------|-------|
| **SendGrid** | Pro | $19 USD | 50,000 emails | Recomendado para deliverability |
| **Twilio SMS** | Pay-as-you-go | Variable | Ilimitado | ~$0.05 USD/SMS en México |
| **Twilio WhatsApp** | Pay-as-you-go | Variable | Ilimitado | ~$0.005 USD/msg |
| **Meta Business API** | Gratis | $0 | Ilimitado | Requiere App Review |
| **BullMQ (Redis)** | Upstash | $10 USD | 10K jobs/día | Para queue de mensajes |
| **Link Shortener** | Bitly Pro | $29 USD | 1,500 links/mes | Trackear clicks en SMS |
| **Segment (opcional)** | Team | $120 USD | 10K MTU | Advanced analytics |

**Total mínimo:** ~$60-80 USD/mes  
**Total con opcionales:** ~$180-200 USD/mes

**Problema de costos variables:**

**Escenario 1 - Doctor conservador:**
- 500 pacientes
- 2 campañas/mes
- 200 emails × 2 = 400 emails
- 50 SMS × 2 = 100 SMS
- **Costo:** $5 USD/mes ✅ Barato

**Escenario 2 - Doctor agresivo:**
- 2,000 pacientes
- 8 campañas/mes (2/semana)
- 1,500 emails × 8 = 12,000 emails
- 500 SMS × 8 = 4,000 SMS
- **Costo:** $200 USD/mes (SMS) + $19 (SendGrid) = **$219 USD/mes** ⚠️

**Riesgo:** Doctor se sorprende con factura Twilio de $200 USD.

**Solución - Budget Controls:**

```typescript
interface BudgetControls {
  user_id: string
  monthly_email_limit: number // Ej: 10,000
  monthly_sms_limit: number // Ej: 500
  monthly_budget_usd: number // Ej: $50
  
  current_month_emails_sent: number
  current_month_sms_sent: number
  current_month_spend_usd: number
  
  alert_at_percentage: number // Ej: 80%
  stop_at_percentage: number // Ej: 100%
}
```

**UI warnings:**
```
⚠️ Has enviado 450/500 SMS este mes ($22.50 USD)
   Quedan 50 SMS antes de alcanzar tu límite.
   [Aumentar límite] [Ver factura Twilio]

🛑 LÍMITE ALCANZADO: No puedes enviar más SMS este mes.
   Ya usaste $50 USD de tu presupuesto.
   [Aumentar presupuesto] [Contactar soporte]
```

### **3. Compliance Legal (CAN-SPAM / LFPDPPP / GDPR)**

**Regulaciones que DEBES cumplir:**

#### **CAN-SPAM Act (USA) - Multas hasta $46,517 USD por violación**

Requisitos obligatorios:
```typescript
interface EmailCompliance {
  // 1. Header honesto (no misleading)
  from_email: "noreply@agendamedpro.com", // ✅ Válido
  from_name: "Dr. García - Consultorio Dental", // ✅ Claro
  subject: "Promoción 20% descuento", // ✅ Honesto
  // ❌ PROHIBIDO: "RE: Tu cuenta", "FWD: Urgente" (engañoso)
  
  // 2. Dirección física visible
  physical_address: "Av. Reforma 123, Col. Centro, CDMX 06000", // ✅ Obligatorio
  
  // 3. Unsubscribe claro y funcional
  unsubscribe_link: "https://agendamedpro.com/unsubscribe/abc123", // ✅ 1-click
  unsubscribe_process_days: 10, // ✅ Máximo 10 días para procesar
  list_unsubscribe_header: "mailto:unsub@agendamedpro.com", // ✅ Email header
  
  // 4. Identificar como publicidad (si aplica)
  is_transactional: false, // false = promotional
  promotional_label: "[Promoción]" // Opcional pero recomendado
}
```

#### **LFPDPPP (México) - Multas hasta $40 millones MXN**

```typescript
interface MexicoCompliance {
  // 1. Consentimiento expreso
  opt_in_required: true,
  opt_in_text: "Acepto recibir mensajes promocionales de [Consultorio]",
  opt_in_date: "2025-11-16T10:30:00Z",
  opt_in_ip: "192.168.1.1", // Prueba de consentimiento
  
  // 2. Aviso de privacidad
  privacy_notice_url: "https://consultorio.com/aviso-privacidad",
  privacy_notice_version: "v2.0",
  privacy_notice_accepted: true,
  
  // 3. Revocación fácil
  revocation_method: ["email", "link", "teléfono"],
  revocation_response_time: "48 horas"
}
```

#### **GDPR (Europa) - Si tienes pacientes en EU**

```typescript
interface GDPRCompliance {
  // 1. Double opt-in (confirmación por email)
  double_opt_in: true,
  confirmation_email_sent: true,
  confirmation_link_clicked: true,
  
  // 2. Derecho al olvido
  data_deletion_request_honored: true,
  deletion_completed_within_days: 30,
  
  // 3. Portabilidad de datos
  data_export_available: true,
  export_format: "JSON", // O CSV
  
  // 4. Base legal para procesamiento
  legal_basis: "consent" // o "legitimate_interest" o "contract"
}
```

**Implementación técnica - Tabla de consentimientos:**

```sql
CREATE TABLE patient_consents (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  consent_type VARCHAR(50), -- 'marketing_email', 'marketing_sms', 'marketing_whatsapp'
  
  granted BOOLEAN,
  granted_at TIMESTAMPTZ,
  granted_ip INET,
  granted_user_agent TEXT,
  
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  -- Compliance fields
  privacy_notice_version VARCHAR(10),
  double_opt_in_confirmed BOOLEAN DEFAULT false,
  confirmation_token VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para performance
CREATE INDEX idx_patient_consents_lookup 
  ON patient_consents(patient_id, consent_type, granted);
```

**UI de consentimiento (en formulario de paciente):**

```tsx
<Checkbox
  label="Acepto recibir mensajes promocionales por email"
  checked={emailConsent}
  onChange={(e) => {
    setEmailConsent(e.target.checked)
    
    // Log consent con IP + user agent
    if (e.target.checked) {
      logConsent({
        patient_id: patientId,
        type: 'marketing_email',
        ip: await getClientIP(),
        user_agent: navigator.userAgent
      })
    }
  }}
/>

<Text variant="caption" color="gray">
  Al marcar esta casilla, aceptas nuestro{' '}
  <Link href="/aviso-privacidad">Aviso de Privacidad</Link>.
  Puedes darte de baja en cualquier momento.
</Text>
```

**Riesgo legal si NO cumples:**
- USA: $46,517 USD × # de violaciones (si mandas a 1,000 sin consent = $46M potencial)
- México: INAI puede multar hasta $40,000,000 MXN
- Europa: GDPR hasta 4% de revenue global o €20M (lo que sea mayor)

**Mitigación:**
- ✅ Double opt-in para email (confirmación)
- ✅ Checkbox explícito en UI (no pre-checked)
- ✅ Unsubscribe en TODOS los emails (footer + header)
- ✅ Procesar unsubscribes en <48 horas
- ✅ Auditoría mensual de compliance

### **4. Deliverability y Riesgo de Spam**

**Problema:** Email bulk → alto riesgo de ir a spam.

**Factores que te mandan a carpeta spam:**

1. **IP reputation baja**
   - IP nueva sin historial
   - Enviaste spam antes
   - Compartida con spammers (shared IP)

2. **Domain reputation baja**
   - SPF/DKIM/DMARC no configurados
   - Domain nuevo (<6 meses)
   - High bounce rate (>5%)

3. **Content issues**
   - Subject con "GRATIS", "DESCUENTO 90%", "!!!"
   - Texto en MAYÚSCULAS
   - Ratio imagen/texto desequilibrado (>60% imágenes)
   - Links acortados sospechosos

4. **Engagement bajo**
   - Open rate <10%
   - Usuarios marcan como spam
   - Alto unsubscribe rate (>0.5%)

5. **Technical issues**
   - HTML mal formado
   - Links rotos
   - Sin versión texto plano
   - Falta unsubscribe link

**Solución completa (compleja pero necesaria):**

#### **Setup técnico ANTES de enviar campañas:**

```bash
# 1. Configurar SPF (Sender Policy Framework)
# En DNS de agendamedpro.com
TXT @ "v=spf1 include:sendgrid.net include:_spf.google.com ~all"

# 2. Configurar DKIM (DomainKeys Identified Mail)
# SendGrid genera keys, agregar a DNS:
TXT sendgrid._domainkey "v=DKIM1; k=rsa; p=[PUBLIC_KEY]"

# 3. Configurar DMARC (Domain-based Message Authentication)
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@agendamedpro.com"

# 4. Subdomain dedicado (recomendado)
# Usar mail.agendamedpro.com para campañas
# Protege reputación del dominio principal
```

#### **IP Warmup (6-8 semanas):**

No puedes enviar 10,000 emails el primer día desde IP nueva.

```typescript
// Warmup schedule (SendGrid)
const warmupPlan = [
  { week: 1, daily_limit: 50 },
  { week: 2, daily_limit: 100 },
  { week: 3, daily_limit: 500 },
  { week: 4, daily_limit: 1000 },
  { week: 5, daily_limit: 5000 },
  { week: 6, daily_limit: 10000 },
  { week: 7, daily_limit: 25000 },
  { week: 8, daily_limit: 50000 }
]

// Empezar con usuarios más engaged
// 1. Pacientes que abrieron último email (mejor engagement)
// 2. Pacientes VIP (menos probable marquen spam)
// 3. Resto de base de datos
```

#### **List Hygiene (limpieza de lista):**

```typescript
// Remover automáticamente cada mes
const cleanupCriteria = {
  hard_bounces: true, // Email no existe
  soft_bounces_consecutive: 3, // 3 fallos seguidos
  spam_complaints: true, // Marcó como spam
  unengaged_days: 365, // No abre emails en 1 año
  invalid_format: true // Email mal formado
}

// Resultado típico
// 1,000 emails en lista
// - 50 hard bounces (5%) → remover
// - 30 spam complaints (3%) → remover
// - 100 unengaged (10%) → mover a segmento "reactivación"
// = 820 emails limpios (82% deliverability)
```

#### **Monitoring de sender score:**

```typescript
// Herramientas para monitorear reputación
const monitoringTools = {
  sender_score: "https://senderscore.org", // Score 0-100 (>80 = good)
  google_postmaster: "https://postmaster.google.com", // Para Gmail
  microsoft_snds: "https://sendersupport.olc.protection.outlook.com", // Outlook
  mxtoolbox: "https://mxtoolbox.com/blacklists.aspx" // Blacklist check
}

// Alertas automáticas
if (senderScore < 70) {
  alert("⚠️ Sender score bajo. Pausar campañas y revisar.")
}

if (bounceRate > 5%) {
  alert("🛑 Bounce rate alto. Limpiar lista urgente.")
}

if (spamRate > 0.1%) {
  alert("⚠️ Spam complaints altos. Revisar contenido.")
}
```

#### **Content best practices:**

```typescript
// ✅ BUENOS subject lines
const goodSubjects = [
  "Dr. García: Tu revisión de 6 meses",
  "Recordatorio: Cita 20 Nov 10:00 AM",
  "Consejos para cuidar tus dientes después de limpieza",
  "Feliz cumpleaños Juan - Aquí está tu regalo"
]

// ❌ MALOS subject lines (spam triggers)
const badSubjects = [
  "!!!GRATIS!!! BLANQUEAMIENTO DENTAL",
  "Ganaste un premio increíble",
  "RE: Factura pendiente" // (cuando no es reply real)
  "💰💰💰 DESCUENTO 90% HOY 💰💰💰"
]

// Template HTML best practices
const emailTemplate = {
  text_to_image_ratio: 0.6, // 60% texto, 40% imagen
  max_width: "600px", // Mobile-friendly
  fallback_text_version: true, // Siempre incluir plaintext
  unsubscribe_link_visible: true,
  physical_address: true,
  max_links: 10, // No más de 10 links
  avoid_url_shorteners: true, // bit.ly puede ser spam flag
  test_before_send: true // Litmus o Email on Acid
}
```

**Riesgo real:**
- Si reputación baja, **TODO el consultorio** queda en spam
- Incluso recordatorios importantes de citas NO llegan
- Recuperar reputación toma 3-6 meses

**Mitigación:**
- Subdomain dedicado (mail.agendamedpro.com) protege dominio principal
- Usar IP dedicada (SendGrid Pro $90/mes) si envías >50K/mes
- Monitoreo 24/7 con alertas
- Pausar campañas automáticamente si metrics bajan

### **5. Curva de Aprendizaje para Usuarios (70% de doctores no saben usar Mailchimp)**

**Realidad del mercado:**
- 🧑‍⚕️ Doctores: Expertos en medicina, NO en marketing
- 💼 Mayoría nunca usó herramienta de email marketing
- 📊 No entienden métricas (open rate, CTR, bounce)
- ⏱️ No tienen tiempo de aprender sistema complejo

**Problema con UIs complejas:**

```
❌ MALO (como Mailchimp):
"Crear flujo con triggers y conditions"
→ Doctor: "¿Qué es un trigger? ¿Qué es una condition?"

❌ MALO:
Mostrar código HTML del email
→ Doctor: "No sé programar"

❌ MALO:
15 opciones de segmentación con operadores SQL
→ Doctor: "¿AND vs OR?"
```

**Solución - UI súper simple:**

```tsx
// ✅ BUENO - Templates listos (wizard)
<CampaignWizard>
  <Step1_SelectGoal>
    "¿Qué quieres lograr?"
    
    [📅 Recuperar pacientes que no vienen hace 3 meses]
    [🎁 Enviar promoción a todos]
    [🎂 Felicitar cumpleañeros]
    [📋 Recordar citas de mañana]
  </Step1_SelectGoal>
  
  <Step2_SelectTemplate>
    "Elige un diseño"
    
    [Preview template 1] [Preview template 2] [Preview template 3]
  </Step2_SelectTemplate>
  
  <Step3_Customize>
    "Personaliza el mensaje"
    
    <Input label="Tu mensaje" placeholder="Hola {{nombre}}, te extrañamos..." />
    <ImageUpload label="Imagen (opcional)" />
  </Step3_Customize>
  
  <Step4_Review>
    "Vista previa"
    
    <EmailPreview />
    
    Se enviará a: 234 pacientes
    Costo estimado: $11.70 USD (234 SMS)
    
    [Enviar ahora] [Programar para después]
  </Step4_Review>
</CampaignWizard>
```

**Onboarding necesario:**

1. **Video tutoriales cortos (2-3 min cada uno):**
   - "Tu primera campaña en 5 minutos"
   - "Cómo recuperar pacientes inactivos"
   - "Enviar promociones sin ir a spam"

2. **Templates pre-configurados (20+):**
   - Recordatorio de revisión
   - Promoción blanqueamiento
   - Cumpleaños
   - Paciente nuevo (bienvenida)
   - Encuesta de satisfacción

3. **Tooltips contextuales:**
   ```tsx
   <Tooltip content="Open rate es el % de personas que abrieron tu email. 20% es promedio.">
     Open rate: 32% ✅
   </Tooltip>
   ```

4. **Smart defaults:**
   ```typescript
   // No obligar a configurar todo
   const smartDefaults = {
     send_time: "10:00 AM", // Mejor hora según datos
     from_name: "Dr. [Nombre del doctor]",
     reply_to: user.email,
     segment: "all_active_patients" // Por defecto todos
   }
   ```

**Métricas simplificadas (no técnicas):**

```tsx
// ❌ MALO (técnico)
<Metric label="Bounce rate" value="4.2%" />
<Metric label="CTR" value="2.8%" />

// ✅ BUENO (lenguaje humano)
<Metric 
  label="Emails entregados" 
  value="96%" 
  sentiment="good"
  explanation="Excelente, casi todos llegaron"
/>

<Metric 
  label="Personas que abrieron" 
  value="150 de 500 (30%)" 
  sentiment="good"
  explanation="Mejor que el promedio (20%)"
/>

<Metric 
  label="Personas que dieron click" 
  value="23 de 150 (15%)" 
  sentiment="good"
  explanation="15 agendaron cita, 8 aún están decidiendo"
/>
```

### **6. Cannibalización de Recordatorios Automáticos (Fatiga de mensajes)**

**Problema - Email/SMS fatigue:**

```
Escenario real:
- Lunes: Email "Promoción blanqueamiento"
- Martes: Email "Newsletter mensual"
- Miércoles: SMS "Encuesta de satisfacción"
- Jueves: Email "Nueva promoción limpieza"
- Viernes: SMS "Recordatorio de cita mañana" ← IMPORTANTE

Resultado: Paciente ya ignora TODOS tus mensajes (incluso el importante)
```

**Datos de industria:**
- Más de 2 emails/semana → Open rate cae 40%
- Más de 4 SMS/mes → Unsubscribe rate sube 300%

**Solución - Frequency Capping:**

```typescript
interface FrequencyLimits {
  user_id: string
  
  // Límites de marketing (no aplica a transaccionales)
  max_marketing_emails_per_week: 1,
  max_marketing_emails_per_month: 4,
  
  max_marketing_sms_per_week: 0, // 0 = no SMS marketing, solo transaccional
  max_marketing_sms_per_month: 2,
  
  // Exclude zones (no enviar marketing si...)
  exclude_marketing_if_appointment_within_days: 7, // Tiene cita próxima
  exclude_marketing_if_recently_visited_days: 14, // Vino hace poco
  
  // Quiet hours (no molestar)
  quiet_hours_start: "20:00",
  quiet_hours_end: "09:00",
  quiet_days: ["sunday"], // No enviar domingos
  
  // Priority system
  transactional_always_send: true, // Recordatorios de cita SIEMPRE
  marketing_can_be_skipped: true
}
```

**UI de configuración (por paciente):**

```tsx
<PatientPreferences>
  <Section title="Frecuencia de mensajes">
    <Select
      label="Emails de marketing"
      value={emailFrequency}
      options={[
        { value: 'never', label: 'Nunca (solo recordatorios de citas)' },
        { value: 'monthly', label: '1 vez al mes' },
        { value: 'weekly', label: '1 vez a la semana' },
        { value: 'unlimited', label: 'Sin límite' }
      ]}
    />
    
    <Checkbox
      label="No enviar mensajes si tengo cita próxima (7 días)"
      checked={excludeIfAppointment}
    />
  </Section>
</PatientPreferences>
```

**Smart scheduling (evitar overlap):**

```typescript
// Antes de enviar campaña, check si paciente ya recibió mucho
async function canSendMarketingMessage(patientId: string, channel: 'email' | 'sms') {
  const limits = await getFrequencyLimits(patientId)
  const sent = await getMarketingSentThisWeek(patientId, channel)
  
  // Check 1: Límite semanal
  if (sent >= limits.max_per_week) {
    return { canSend: false, reason: 'weekly_limit_reached' }
  }
  
  // Check 2: Tiene cita próxima?
  const upcomingAppointment = await getUpcomingAppointment(patientId)
  if (upcomingAppointment && upcomingAppointment.days_until < 7) {
    return { canSend: false, reason: 'has_upcoming_appointment' }
  }
  
  // Check 3: Visitó recientemente?
  const lastVisit = await getLastVisit(patientId)
  if (lastVisit && lastVisit.days_ago < 14) {
    return { canSend: false, reason: 'recently_visited' }
  }
  
  // Check 4: Quiet hours?
  const now = new Date()
  if (now.getHours() < 9 || now.getHours() >= 20) {
    return { canSend: false, reason: 'quiet_hours', retryAt: 'tomorrow 10:00 AM' }
  }
  
  return { canSend: true }
}

// Resultado en campaña
Campaign "Promoción Nov" to 500 patients
  ✅ 340 enviados
  ⏭️ 85 skipped (weekly limit)
  ⏭️ 45 skipped (has appointment soon)
  ⏭️ 30 skipped (recently visited)
```

---

## **🔧 IMPLEMENTACIÓN TÉCNICA DETALLADA**

### **Base de Datos (8 tablas nuevas)**

```sql
-- ==========================================
-- 1. CAMPAIGNS
-- ==========================================
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL, -- 'email', 'sms', 'whatsapp'
  
  -- Email specific
  subject TEXT,
  from_name VARCHAR(255),
  reply_to VARCHAR(255),
  
  -- Content
  body_text TEXT NOT NULL, -- Plaintext or SMS message
  body_html TEXT, -- Email only (NULL for SMS)
  
  -- Targeting
  segment_id UUID REFERENCES patient_segments(id),
  
  -- Scheduling
  status VARCHAR(20) NOT NULL DEFAULT 'draft', 
    -- 'draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metrics (updated in real-time)
  total_recipients INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  bounced_count INT DEFAULT 0,
  unsubscribed_count INT DEFAULT 0,
  
  -- A/B testing
  is_ab_test BOOLEAN DEFAULT false,
  ab_variant VARCHAR(10), -- 'A', 'B', 'control'
  ab_winning_variant VARCHAR(10),
  
  -- Cost tracking
  estimated_cost_usd DECIMAL(10,2),
  actual_cost_usd DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_user_status ON marketing_campaigns(user_id, status);
CREATE INDEX idx_campaigns_scheduled ON marketing_campaigns(scheduled_at) WHERE status = 'scheduled';

-- ==========================================
-- 2. PATIENT SEGMENTS
-- ==========================================
CREATE TABLE patient_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Filter criteria (stored as JSONB for flexibility)
  criteria JSONB NOT NULL DEFAULT '{}',
  /* Example criteria:
  {
    "age_min": 25,
    "age_max": 40,
    "last_visit_days_ago_min": 90,
    "total_spent_min": 5000,
    "received_treatments": ["treatment_id_1", "treatment_id_2"],
    "has_treatment_tag": ["botox", "facial"]
  }
  */
  
  -- Dynamic vs static
  is_dynamic BOOLEAN DEFAULT true, -- Recalcula automáticamente
  
  -- Cached count (updated by cron job)
  patient_count INT DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  
  -- Pre-defined templates
  is_template BOOLEAN DEFAULT false,
  template_key VARCHAR(50), -- 'inactive_90', 'vip', 'new_patients'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_segments_user ON patient_segments(user_id);
CREATE INDEX idx_segments_template ON patient_segments(template_key) WHERE is_template = true;

-- ==========================================
-- 3. CAMPAIGN RECIPIENTS (Individual tracking)
-- ==========================================
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
    -- 'queued', 'sending', 'sent', 'delivered', 'opened', 'clicked', 
    -- 'bounced', 'unsubscribed', 'failed', 'skipped'
  
  -- Timestamps
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ, -- First open
  clicked_at TIMESTAMPTZ, -- First click
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Provider tracking
  provider_message_id TEXT, -- Twilio SID or SendGrid message ID
  provider_status TEXT, -- Raw status from provider
  error_message TEXT,
  
  -- Engagement metrics
  open_count INT DEFAULT 0, -- Multiple opens
  click_count INT DEFAULT 0, -- Multiple clicks
  
  -- Cost
  cost_usd DECIMAL(6,4), -- Ej: 0.0500 for SMS
  
  -- Skipped reason (if status = 'skipped')
  skip_reason VARCHAR(100), -- 'weekly_limit', 'has_appointment', 'unsubscribed'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, patient_id)
);

CREATE INDEX idx_recipients_campaign ON campaign_recipients(campaign_id, status);
CREATE INDEX idx_recipients_patient ON campaign_recipients(patient_id);
CREATE INDEX idx_recipients_status ON campaign_recipients(status) 
  WHERE status IN ('queued', 'sending');

-- ==========================================
-- 4. AUTOMATION FLOWS
-- ==========================================
CREATE TABLE automation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Trigger configuration
  trigger_type VARCHAR(50) NOT NULL,
    -- 'patient_created', 'appointment_completed', 'segment_join', 
    -- 'date_based', 'manual', 'treatment_completed'
  trigger_config JSONB,
  /* Example:
  {
    "segment_id": "uuid",
    "treatment_id": "uuid",
    "days_after_trigger": 7
  }
  */
  
  -- Flow steps (array of step objects)
  steps JSONB NOT NULL DEFAULT '[]',
  /* Example:
  [
    {
      "step_number": 1,
      "delay_days": 0,
      "channel": "email",
      "template_id": "welcome_email",
      "conditions": { "time_of_day": "10:00" }
    },
    {
      "step_number": 2,
      "delay_days": 3,
      "channel": "sms",
      "template_id": "reminder",
      "conditions": { "NOT_booked_appointment": true }
    }
  ]
  */
  
  -- Exit conditions
  exit_conditions JSONB,
  /* Example:
  {
    "appointment_booked": true,
    "unsubscribed": true,
    "max_steps": 5
  }
  */
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'draft'
  
  -- Metrics
  total_enrolled INT DEFAULT 0,
  currently_active INT DEFAULT 0,
  completed INT DEFAULT 0,
  exited_early INT DEFAULT 0,
  conversion_rate DECIMAL(5,2), -- Percentage
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flows_user_status ON automation_flows(user_id, status);
CREATE INDEX idx_flows_trigger ON automation_flows(trigger_type) WHERE status = 'active';

-- ==========================================
-- 5. FLOW ENROLLMENTS (Pacientes en flujo)
-- ==========================================
CREATE TABLE flow_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_step INT DEFAULT 0, -- Which step is executing next
  total_steps INT, -- Cached from flow.steps.length
  
  status VARCHAR(20) DEFAULT 'active',
    -- 'active', 'paused', 'completed', 'exited'
  exit_reason VARCHAR(100), -- If exited: 'unsubscribed', 'goal_achieved', 'max_steps'
  
  -- Scheduling
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  next_action_at TIMESTAMPTZ, -- When to send next step
  completed_at TIMESTAMPTZ,
  exited_at TIMESTAMPTZ,
  
  -- Context data (for personalization)
  context_data JSONB,
  /* Example:
  {
    "trigger_appointment_id": "uuid",
    "trigger_treatment_name": "Limpieza dental",
    "enrollment_source": "segment_join"
  }
  */
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(flow_id, patient_id)
);

CREATE INDEX idx_enrollments_flow ON flow_enrollments(flow_id, status);
CREATE INDEX idx_enrollments_patient ON flow_enrollments(patient_id);
CREATE INDEX idx_enrollments_next_action ON flow_enrollments(next_action_at) 
  WHERE status = 'active';

-- ==========================================
-- 6. PATIENT CONSENTS (Compliance)
-- ==========================================
CREATE TABLE patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  consent_type VARCHAR(50) NOT NULL,
    -- 'marketing_email', 'marketing_sms', 'marketing_whatsapp', 'data_processing'
  
  -- Grant tracking
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  granted_ip INET,
  granted_user_agent TEXT,
  granted_method VARCHAR(50), -- 'checkbox', 'double_opt_in', 'verbal', 'imported'
  
  -- Revocation tracking
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_method VARCHAR(50), -- 'unsubscribe_link', 'email_request', 'phone_request'
  revoked_reason TEXT,
  
  -- Compliance fields
  privacy_notice_version VARCHAR(10),
  privacy_notice_url TEXT,
  double_opt_in_required BOOLEAN DEFAULT false,
  double_opt_in_confirmed BOOLEAN DEFAULT false,
  confirmation_token VARCHAR(255),
  confirmation_sent_at TIMESTAMPTZ,
  confirmation_clicked_at TIMESTAMPTZ,
  
  -- GDPR specific
  legal_basis VARCHAR(50), -- 'consent', 'legitimate_interest', 'contract'
  data_retention_days INT, -- How long to keep data
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(patient_id, consent_type)
);

CREATE INDEX idx_consents_patient ON patient_consents(patient_id);
CREATE INDEX idx_consents_lookup ON patient_consents(patient_id, consent_type, granted, revoked);

-- ==========================================
-- 7. FREQUENCY LIMITS (Prevent fatigue)
-- ==========================================
CREATE TABLE marketing_frequency_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Global limits (applies to ALL patients)
  global_max_emails_per_week INT DEFAULT 2,
  global_max_sms_per_month INT DEFAULT 4,
  
  -- Exclusion rules
  exclude_if_appointment_within_days INT DEFAULT 7,
  exclude_if_visited_within_days INT DEFAULT 14,
  
  -- Quiet hours
  quiet_hours_start TIME DEFAULT '20:00',
  quiet_hours_end TIME DEFAULT '09:00',
  quiet_days TEXT[], -- ['sunday', 'saturday']
  
  -- Priority system
  transactional_ignore_limits BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ==========================================
-- 8. SOCIAL MEDIA INTEGRATIONS
-- ==========================================
CREATE TABLE social_media_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  platform VARCHAR(20) NOT NULL, -- 'facebook', 'instagram', 'whatsapp_business'
  
  -- Meta Business API credentials
  app_id VARCHAR(255),
  app_secret VARCHAR(255),
  page_id VARCHAR(255),
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Lead Ads
  lead_form_id VARCHAR(255),
  lead_form_active BOOLEAN DEFAULT false,
  
  -- Messenger
  messenger_enabled BOOLEAN DEFAULT false,
  webhook_verify_token VARCHAR(255),
  
  -- WhatsApp Business
  whatsapp_business_account_id VARCHAR(255),
  whatsapp_phone_number_id VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'rejected', 'expired'
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_social_user_platform ON social_media_integrations(user_id, platform);
```

### **APIs Nuevas (12 endpoints principales)**

```typescript
// ==========================================
// CAMPAIGN MANAGEMENT
// ==========================================

// Create campaign
POST /api/marketing/campaigns
Body: {
  name: string
  type: 'email' | 'sms' | 'whatsapp'
  subject?: string // email only
  body_text: string
  body_html?: string // email only
  segment_id: string
  scheduled_at?: string // ISO datetime
}
Response: { campaign: Campaign }

// List campaigns
GET /api/marketing/campaigns?status=sent&limit=20&offset=0
Response: { campaigns: Campaign[], total: number }

// Get campaign details + metrics
GET /api/marketing/campaigns/:id
Response: { 
  campaign: Campaign,
  metrics: {
    funnel: { sent, delivered, opened, clicked, bounced },
    timeline: [ { date, opens, clicks } ],
    top_links: [ { url, clicks } ],
    engagement_by_segment: { ... }
  }
}

// Update campaign
PUT /api/marketing/campaigns/:id
Body: { name?, subject?, body_html?, scheduled_at? }
Response: { campaign: Campaign }

// Delete campaign
DELETE /api/marketing/campaigns/:id
Response: { success: true }

// Launch campaign (send now or schedule)
POST /api/marketing/campaigns/:id/send
Body: { 
  send_now?: boolean,
  test_recipients?: string[] // Email addresses for testing
}
Response: { 
  status: 'queued' | 'sending',
  estimated_send_time: string,
  total_recipients: number,
  estimated_cost_usd: number
}

// Pause/resume campaign
POST /api/marketing/campaigns/:id/pause
POST /api/marketing/campaigns/:id/resume

// ==========================================
// SEGMENTATION
// ==========================================

// Create segment
POST /api/marketing/segments
Body: {
  name: string
  description?: string
  criteria: SegmentCriteria
  is_dynamic: boolean
}
Response: { segment: Segment }

// List segments
GET /api/marketing/segments
Response: { segments: Segment[] }

// Calculate segment count (preview)
POST /api/marketing/segments/:id/calculate
Response: { 
  patient_count: number,
  estimated_calculation_time_ms: number
}

// Get patients in segment (preview)
GET /api/marketing/segments/:id/patients?limit=50
Response: { 
  patients: Patient[],
  total: number,
  sample: boolean // true if showing sample only
}

// Update segment
PUT /api/marketing/segments/:id
Body: { name?, description?, criteria? }

// Delete segment
DELETE /api/marketing/segments/:id

// ==========================================
// AUTOMATION FLOWS
// ==========================================

// Create flow
POST /api/marketing/flows
Body: {
  name: string
  trigger_type: string
  trigger_config: object
  steps: FlowStep[]
  exit_conditions: object
}
Response: { flow: AutomationFlow }

// List flows
GET /api/marketing/flows?status=active
Response: { flows: AutomationFlow[] }

// Activate/pause flow
PUT /api/marketing/flows/:id/status
Body: { status: 'active' | 'paused' }

// Get flow metrics
GET /api/marketing/flows/:id/metrics
Response: {
  total_enrolled: number,
  active: number,
  completed: number,
  conversion_rate: number,
  step_performance: [
    { step_number, sent, opened, clicked }
  ]
}

// ==========================================
// ANALYTICS
// ==========================================

// Campaign analytics
GET /api/marketing/analytics/campaign/:id
Response: {
  overview: { sent, delivered, opened, clicked, roi },
  timeline: [ { hour, opens, clicks } ],
  devices: { desktop: 60%, mobile: 35%, tablet: 5% },
  email_clients: { gmail: 45%, outlook: 30%, apple_mail: 20% },
  link_clicks: [ { url, clicks, unique_clicks } ]
}

// Dashboard overview
GET /api/marketing/analytics/overview?date_range=last_30_days
Response: {
  total_campaigns: number,
  total_sent: number,
  avg_open_rate: number,
  avg_click_rate: number,
  total_revenue_attributed: number,
  top_campaigns: Campaign[],
  recent_activity: Activity[]
}

// ==========================================
// TEMPLATES
// ==========================================

// List templates
GET /api/marketing/templates?type=email&category=promotional
Response: { templates: Template[] }

// Get template
GET /api/marketing/templates/:id
Response: { template: Template }

// Create custom template
POST /api/marketing/templates
Body: {
  name: string
  type: 'email' | 'sms'
  category: string
  subject?: string
  body_html?: string
  body_text: string
  variables: string[] // ['nombre', 'ultima_visita']
}

// ==========================================
// COMPLIANCE
// ==========================================

// Update consent
POST /api/marketing/consents
Body: {
  patient_id: string
  consent_type: 'marketing_email' | 'marketing_sms'
  granted: boolean
  method: string
}
Response: { consent: PatientConsent }

// Unsubscribe (public endpoint)
GET /api/marketing/unsubscribe/:token
Response: { success: true, message: "You've been unsubscribed" }

// Export patient data (GDPR)
GET /api/marketing/export/:patient_id
Response: { data: object, format: 'json' }

// Delete patient data (right to be forgotten)
DELETE /api/marketing/patient-data/:patient_id
Response: { success: true, deleted_records: number }
```

### **Componentes UI (15 screens nuevas)**

```typescript
// ==========================================
// MAIN NAVIGATION
// ==========================================

/marketing                              // Dashboard overview
/marketing/campaigns                    // Campaign list
/marketing/campaigns/new                // Campaign builder
/marketing/campaigns/:id                // Campaign details + analytics
/marketing/campaigns/:id/edit           // Edit campaign

/marketing/segments                     // Segment list
/marketing/segments/new                 // Segment builder
/marketing/segments/:id                 // Segment preview

/marketing/automation                   // Automation flows list
/marketing/automation/new               // Flow builder
/marketing/automation/:id               // Flow details + metrics

/marketing/templates                    // Template library
/marketing/templates/new                // Template creator
/marketing/templates/:id/edit           // Edit template

/marketing/settings                     // Frequency limits, compliance
/marketing/analytics                    // Advanced analytics dashboard

/marketing/social-media                 // Facebook/Instagram integration
/marketing/social-media/facebook/setup  // Facebook setup wizard
```

**Component specs:**

#### **1. Campaign Builder (`/marketing/campaigns/new`)**

```tsx
<CampaignBuilder>
  {/* Step 1: Goal selection */}
  <StepGoal>
    <Card onClick={() => selectGoal('reactivation')}>
      <Icon name="users-slash" />
      <Title>Recuperar pacientes inactivos</Title>
      <Description>Envía mensaje a pacientes que no vienen hace 90+ días</Description>
    </Card>
    
    <Card onClick={() => selectGoal('promotion')}>
      <Icon name="percentage" />
      <Title>Enviar promoción</Title>
      <Description>Descuentos o ofertas especiales a todos o segmento</Description>
    </Card>
    
    <Card onClick={() => selectGoal('birthday')}>
      <Icon name="cake" />
      <Title>Felicitar cumpleañeros</Title>
      <Description>Mensaje automático con descuento especial</Description>
    </Card>
  </StepGoal>
  
  {/* Step 2: Audience */}
  <StepAudience>
    <SegmentSelector
      value={selectedSegment}
      onChange={setSelectedSegment}
      showPreview={true}
    />
    
    <PreviewBox>
      <Text>Se enviará a: <strong>234 pacientes</strong></Text>
      <Button variant="ghost" onClick={openPreview}>
        Ver lista de pacientes
      </Button>
    </PreviewBox>
  </StepAudience>
  
  {/* Step 3: Channel */}
  <StepChannel>
    <RadioGroup value={channel} onChange={setChannel}>
      <Radio value="email">
        <Icon name="mail" />
        Email ($0.001 cada uno)
        <Badge>Mejor para contenido largo</Badge>
      </Radio>
      
      <Radio value="sms">
        <Icon name="message" />
        SMS ($0.05 cada uno)
        <Badge>98% open rate</Badge>
      </Radio>
      
      <Radio value="whatsapp">
        <Icon name="whatsapp" />
        WhatsApp ($0.005 cada uno)
        <Badge>85% open rate</Badge>
      </Radio>
    </RadioGroup>
  </StepChannel>
  
  {/* Step 4: Design */}
  <StepDesign>
    {channel === 'email' && (
      <EmailEditor
        initialValue={bodyHtml}
        onChange={setBodyHtml}
        templates={emailTemplates}
        variables={['{{nombre}}', '{{ultima_visita}}', '{{proxima_cita}}']}
      />
    )}
    
    {channel === 'sms' && (
      <SMSEditor
        value={bodyText}
        onChange={setBodyText}
        maxLength={160}
        showCharCount={true}
        variables={['{{nombre}}', '{{fecha}}']}
      />
    )}
  </StepDesign>
  
  {/* Step 5: Schedule */}
  <StepSchedule>
    <RadioGroup value={scheduleType}>
      <Radio value="now">
        Enviar ahora
      </Radio>
      
      <Radio value="scheduled">
        Programar para después
        <DateTimePicker
          value={scheduledAt}
          onChange={setScheduledAt}
          minDate={new Date()}
        />
      </Radio>
    </RadioGroup>
    
    <Alert type="info">
      <Icon name="clock" />
      Mejor momento para enviar: <strong>Martes 10:00 AM</strong>
      <Text variant="caption">Basado en tu historial de campañas</Text>
    </Alert>
  </StepSchedule>
  
  {/* Step 6: Review */}
  <StepReview>
    <Summary>
      <Row>
        <Label>Campaña</Label>
        <Value>{campaignName}</Value>
      </Row>
      <Row>
        <Label>Destinatarios</Label>
        <Value>{recipientCount} pacientes</Value>
      </Row>
      <Row>
        <Label>Canal</Label>
        <Value>{channel.toUpperCase()}</Value>
      </Row>
      <Row>
        <Label>Costo estimado</Label>
        <Value>${estimatedCost} USD</Value>
      </Row>
    </Summary>
    
    <PreviewPane>
      <DeviceToggle value={previewDevice} onChange={setPreviewDevice}>
        <Button value="desktop">Desktop</Button>
        <Button value="mobile">Mobile</Button>
      </DeviceToggle>
      
      <EmailPreview device={previewDevice} html={bodyHtml} />
    </PreviewPane>
    
    <Actions>
      <Button variant="ghost" onClick={sendTest}>
        Enviar prueba a mi email
      </Button>
      
      <Button variant="primary" onClick={launchCampaign}>
        {scheduleType === 'now' ? 'Enviar ahora' : 'Programar campaña'}
      </Button>
    </Actions>
  </StepReview>
</CampaignBuilder>
```

#### **2. Segment Builder (`/marketing/segments/new`)**

```tsx
<SegmentBuilder>
  <Header>
    <Input
      label="Nombre del segmento"
      placeholder="Ej: Pacientes VIP inactivos"
      value={name}
      onChange={setName}
    />
    
    <Toggle
      label="Dinámico (se actualiza automáticamente)"
      checked={isDynamic}
      onChange={setIsDynamic}
    />
  </Header>
  
  <FilterBuilder>
    <FilterGroup>
      <FilterLabel>Demográficos</FilterLabel>
      
      <FilterRow>
        <Label>Edad</Label>
        <NumberInput placeholder="Mín" value={ageMin} onChange={setAgeMin} />
        <Text>a</Text>
        <NumberInput placeholder="Máx" value={ageMax} onChange={setAgeMax} />
      </FilterRow>
      
      <FilterRow>
        <Label>Género</Label>
        <Select value={gender} onChange={setGender}>
          <Option value="">Todos</Option>
          <Option value="M">Masculino</Option>
          <Option value="F">Femenino</Option>
        </Select>
      </FilterRow>
    </FilterGroup>
    
    <FilterGroup>
      <FilterLabel>Comportamiento</FilterLabel>
      
      <FilterRow>
        <Label>Última visita hace</Label>
        <NumberInput value={lastVisitMin} />
        <Text>a</Text>
        <NumberInput value={lastVisitMax} />
        <Text>días</Text>
      </FilterRow>
      
      <FilterRow>
        <Label>Total de visitas</Label>
        <NumberInput placeholder="Mínimo" value={totalVisitsMin} />
      </FilterRow>
    </FilterGroup>
    
    <FilterGroup>
      <FilterLabel>Financiero</FilterLabel>
      
      <FilterRow>
        <Label>Gasto total mínimo</Label>
        <NumberInput
          prefix="$"
          suffix="MXN"
          value={totalSpentMin}
        />
      </FilterRow>
      
      <FilterRow>
        <Checkbox
          label="Tiene facturas pendientes"
          checked={hasPendingInvoices}
          onChange={setHasPendingInvoices}
        />
      </FilterRow>
    </FilterGroup>
    
    <FilterGroup>
      <FilterLabel>Tratamientos</FilterLabel>
      
      <FilterRow>
        <Label>Ha recibido</Label>
        <TreatmentMultiSelect
          value={receivedTreatments}
          onChange={setReceivedTreatments}
        />
      </FilterRow>
      
      <FilterRow>
        <Label>NO ha recibido</Label>
        <TreatmentMultiSelect
          value={notReceivedTreatments}
          onChange={setNotReceivedTreatments}
        />
      </FilterRow>
    </FilterGroup>
    
    <FilterGroup>
      <FilterLabel>Engagement</FilterLabel>
      
      <FilterRow>
        <Checkbox
          label="Abrió último email"
          checked={openedLastEmail}
        />
      </FilterRow>
      
      <FilterRow>
        <Checkbox
          label="Hizo click en último email"
          checked={clickedLastLink}
        />
      </FilterRow>
    </FilterGroup>
  </FilterBuilder>
  
  <PreviewPanel>
    <Header>
      <Title>Vista previa del segmento</Title>
      <Button onClick={refreshCount}>Recalcular</Button>
    </Header>
    
    <CountDisplay>
      <Number>{patientCount}</Number>
      <Text>pacientes en este segmento</Text>
    </CountDisplay>
    
    <PatientList>
      {patients.slice(0, 10).map(patient => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </PatientList>
    
    <Actions>
      <Button variant="ghost" onClick={cancel}>Cancelar</Button>
      <Button variant="primary" onClick={save}>Guardar segmento</Button>
    </Actions>
  </PreviewPanel>
</SegmentBuilder>
```

#### **3. Automation Flow Builder (`/marketing/automation/new`)**

```tsx
<FlowBuilder>
  <Canvas>
    {/* Visual flow builder */}
    <FlowNode type="trigger">
      <Icon name="play" />
      <Title>Trigger</Title>
      
      <TriggerSelector value={triggerType} onChange={setTriggerType}>
        <Option value="patient_created">Paciente nuevo</Option>
        <Option value="appointment_completed">Cita completada</Option>
        <Option value="segment_join">Se une a segmento</Option>
        <Option value="treatment_completed">Tratamiento completado</Option>
      </TriggerSelector>
      
      {triggerType === 'segment_join' && (
        <SegmentSelector value={triggerSegmentId} />
      )}
    </FlowNode>
    
    <Arrow />
    
    <FlowNode type="delay">
      <Icon name="clock" />
      <Title>Esperar</Title>
      <NumberInput value={step1DelayDays} suffix="días" />
    </FlowNode>
    
    <Arrow />
    
    <FlowNode type="action">
      <Icon name="mail" />
      <Title>Enviar email</Title>
      
      <TemplateSelector
        value={step1TemplateId}
        onChange={setStep1TemplateId}
      />
      
      <Conditions>
        <Checkbox label="Solo si no ha agendado cita" />
        <TimePicker label="Enviar a las" value="10:00" />
      </Conditions>
    </FlowNode>
    
    <AddStepButton onClick={addStep}>
      + Agregar paso
    </AddStepButton>
    
    <FlowNode type="goal">
      <Icon name="flag" />
      <Title>Objetivo</Title>
      
      <Select value={goalType}>
        <Option value="appointment_booked">Paciente agendó cita</Option>
        <Option value="completed_flow">Completó todos los pasos</Option>
        <Option value="max_steps">Alcanzó máximo de pasos</Option>
      </Select>
    </FlowNode>
  </Canvas>
  
  <Sidebar>
    <Section>
      <Title>Configuración del flujo</Title>
      
      <Input
        label="Nombre del flujo"
        placeholder="Ej: Onboarding paciente nuevo"
        value={flowName}
      />
      
      <Textarea
        label="Descripción"
        value={flowDescription}
      />
    </Section>
    
    <Section>
      <Title>Condiciones de salida</Title>
      
      <Checkbox label="Si paciente agenda cita" />
      <Checkbox label="Si se da de baja" />
      <NumberInput label="Máximo de pasos" value={maxSteps} />
    </Section>
    
    <Section>
      <Title>Métricas del flujo</Title>
      
      <Stat label="Actualmente inscritos" value="0" />
      <Stat label="Completados" value="0" />
      <Stat label="Tasa de conversión" value="0%" />
    </Section>
    
    <Actions>
      <Button variant="ghost">Guardar borrador</Button>
      <Button variant="primary">Activar flujo</Button>
    </Actions>
  </Sidebar>
</FlowBuilder>
```

#### **4. Campaign Analytics (`/marketing/campaigns/:id`)**

```tsx
<CampaignAnalytics>
  <Header>
    <BackButton />
    <CampaignName>{campaign.name}</CampaignName>
    <StatusBadge status={campaign.status} />
  </Header>
  
  <MetricsOverview>
    <MetricCard>
      <Icon name="send" />
      <Value>{campaign.sent_count}</Value>
      <Label>Enviados</Label>
      <Change>de {campaign.total_recipients} total</Change>
    </MetricCard>
    
    <MetricCard>
      <Icon name="check" />
      <Value>{campaign.delivered_count}</Value>
      <Label>Entregados</Label>
      <Percentage>{deliveryRate}%</Percentage>
    </MetricCard>
    
    <MetricCard sentiment="good">
      <Icon name="eye" />
      <Value>{campaign.opened_count}</Value>
      <Label>Abiertos</Label>
      <Percentage>{openRate}%</Percentage>
      <Comparison>
        {openRate > 20 ? '✅ Arriba del promedio' : '⚠️ Abajo del promedio'}
      </Comparison>
    </MetricCard>
    
    <MetricCard sentiment="good">
      <Icon name="cursor-click" />
      <Value>{campaign.clicked_count}</Value>
      <Label>Clics</Label>
      <Percentage>{clickRate}%</Percentage>
    </MetricCard>
    
    <MetricCard>
      <Icon name="dollar" />
      <Value>${revenueGenerated} MXN</Value>
      <Label>Revenue generado</Label>
      <ROI>ROI: {roi}%</ROI>
    </MetricCard>
  </MetricsOverview>
  
  <Charts>
    <Card>
      <CardHeader>
        <Title>Engagement en el tiempo</Title>
        <DateRangePicker />
      </CardHeader>
      <LineChart
        data={engagementTimeline}
        lines={[
          { key: 'opens', label: 'Aperturas', color: 'blue' },
          { key: 'clicks', label: 'Clics', color: 'green' }
        ]}
      />
    </Card>
    
    <Card>
      <CardHeader>
        <Title>Dispositivos</Title>
      </CardHeader>
      <PieChart
        data={[
          { label: 'Desktop', value: 60, color: '#0066CC' },
          { label: 'Mobile', value: 35, color: '#00CC66' },
          { label: 'Tablet', value: 5, color: '#CCCCCC' }
        ]}
      />
    </Card>
  </Charts>
  
  <LinkPerformance>
    <Title>Links con más clics</Title>
    <Table>
      <thead>
        <tr>
          <th>URL</th>
          <th>Clics</th>
          <th>Clics únicos</th>
          <th>CTR</th>
        </tr>
      </thead>
      <tbody>
        {topLinks.map(link => (
          <tr key={link.url}>
            <td>{link.url}</td>
            <td>{link.clicks}</td>
            <td>{link.unique_clicks}</td>
            <td>{link.ctr}%</td>
          </tr>
        ))}
      </tbody>
    </Table>
  </LinkPerformance>
  
  <RecipientList>
    <Title>Destinatarios</Title>
    <Filters>
      <Select value={filterStatus}>
        <Option value="all">Todos</Option>
        <Option value="opened">Solo abiertos</Option>
        <Option value="clicked">Solo clics</Option>
        <Option value="bounced">Rebotados</Option>
      </Select>
      
      <SearchInput placeholder="Buscar paciente..." />
    </Filters>
    
    <Table>
      <thead>
        <tr>
          <th>Paciente</th>
          <th>Estado</th>
          <th>Enviado</th>
          <th>Abierto</th>
          <th>Clic</th>
        </tr>
      </thead>
      <tbody>
        {recipients.map(recipient => (
          <tr key={recipient.id}>
            <td>{recipient.patient_name}</td>
            <td><StatusBadge status={recipient.status} /></td>
            <td>{formatDate(recipient.sent_at)}</td>
            <td>{recipient.opened_at ? formatDate(recipient.opened_at) : '-'}</td>
            <td>{recipient.clicked_at ? formatDate(recipient.clicked_at) : '-'}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  </RecipientList>
</CampaignAnalytics>
```

---

## **📈 ROI PROYECTADO (Actualizado con Pricing Real)**

### **Inversión Inicial**

```
Desarrollo (in-house):
  - Backend (DB + APIs): 4 semanas × $1,000 USD/sem = $4,000
  - Frontend (UI components): 6 semanas × $1,000 USD/sem = $6,000
  - Testing + QA: 2 semanas × $800 USD/sem = $1,600
  - Documentación + videos: $500
  
  TOTAL IN-HOUSE: $12,100 USD

Desarrollo (outsource):
  - Agencia México: $18,000-22,000 USD
  - Freelancers: $10,000-14,000 USD
  
  RECOMENDADO: $12,000-15,000 USD
```

### **Costos Operativos Mensuales**

```
Infraestructura mínima:
  - SendGrid Pro: $19 USD/mes
  - Twilio (promedio 500 SMS): $25 USD/mes
  - BullMQ (Redis): $10 USD/mes
  - Link shortener: $10 USD/mes (Rebrandly)
  
  TOTAL: ~$65 USD/mes

Infraestructura óptima (si creces):
  - SendGrid Premier: $90 USD/mes (IP dedicada)
  - Twilio (2,000 SMS): $100 USD/mes
  - BullMQ Pro: $25 USD/mes
  - Bitly Pro: $29 USD/mes
  - Segment: $120 USD/mes
  
  TOTAL: ~$365 USD/mes
```

### **Revenue Adicional para AgendaMedPro**

**Opción A: Incremento en precio de planes existentes**

| Plan | Precio Actual | Precio Nuevo | Incremento | Clientes | Revenue Adicional/Mes |
|------|---------------|--------------|------------|----------|-----------------------|
| Básico | $599 MXN | $699 MXN | +$100 | 30 | $3,000 MXN |
| Pro | $999 MXN | $1,299 MXN | +$300 | 20 | $6,000 MXN |
| Enterprise | $2,999 MXN | $3,499 MXN | +$500 | 5 | $2,500 MXN |
| **TOTAL** | | | | **55** | **$11,500 MXN/mes** |

**Revenue anual adicional:** $11,500 × 12 = **$138,000 MXN/año** = **~$7,600 USD/año**

**Opción B: Nuevo tier "Marketing Pro" (add-on)**

```
Plan Add-on "Marketing Automation":
  - Precio: $399 MXN/mes adicional
  - Features: Email campaigns ilimitadas, SMS bulk, segmentación avanzada, 3 automation flows
  - Target: 40% de clientes Pro/Enterprise (10 clientes)
  
  Revenue: 10 × $399 = $3,990 MXN/mes = $47,880 MXN/año
```

### **Revenue para Clientes (Justifica el precio)**

**Escenario conservador (doctor pequeño):**
```
Base de datos: 500 pacientes
Inactivos (60%): 300 pacientes
Recuperación con automation (20%): 60 pacientes
Revenue: 60 × $800 MXN promedio = $48,000 MXN/año

ROI para cliente: 
  Inversión: $1,299/mes × 12 = $15,588 MXN/año
  Retorno: $48,000 MXN/año
  ROI: 208% ✅
```

**Escenario agresivo (doctor grande):**
```
Base de datos: 2,000 pacientes
Inactivos (50%): 1,000 pacientes
Recuperación (25%): 250 pacientes
Revenue: 250 × $1,200 MXN = $300,000 MXN/año

Promociones adicionales:
  - 4 campañas/año × 15% conversión × $2,000 = $120,000 MXN
  
TOTAL: $420,000 MXN/año adicional

ROI para cliente:
  Inversión: $3,499/mes × 12 = $41,988 MXN/año
  Retorno: $420,000 MXN/año
  ROI: 900% ✅✅✅
```

### **Payback Period**

```
Inversión: $15,000 USD desarrollo
Revenue adicional: $7,600 USD/año (pricing increase)

Payback: 15,000 / 7,600 = 1.97 años ≈ 24 meses

Con Opción B (add-on):
  Revenue adicional: $7,600 + $2,600 = $10,200 USD/año
  Payback: 15,000 / 10,200 = 1.47 años ≈ 18 meses
```

**Mejora con adquisición de nuevos clientes:**
```
Si Marketing Automation atrae 10 nuevos clientes/año (argumento de venta):
  10 × $1,299 MXN/mes × 12 = $155,880 MXN/año = $8,600 USD/año
  
  Revenue total: $10,200 + $8,600 = $18,800 USD/año
  Payback: 15,000 / 18,800 = 0.8 años ≈ 10 meses ✅
```

---

## **🚀 ROADMAP DE IMPLEMENTACIÓN (3 FASES)**

### **FASE 1: MVP - Email Campaigns Básico (6-8 semanas) - $4,000 USD**

**Objetivo:** Validar demanda con funcionalidad mínima viable.

#### **Semana 1-2: Backend Core**
- ✅ Tablas DB: `marketing_campaigns`, `campaign_recipients`, `patient_segments`
- ✅ APIs: POST/GET/PUT campaigns
- ✅ Segment calculation engine (basic criteria: age, last_visit, total_spent)
- ✅ SendGrid integration (sending service)

#### **Semana 3-4: UI Básica**
- ✅ Campaign list screen
- ✅ Simple campaign builder (no drag & drop, solo form)
- ✅ 5 templates pre-diseñados (HTML)
- ✅ Segment builder (5 criterios básicos)

#### **Semana 5-6: Sending & Analytics**
- ✅ Queue system (BullMQ)
- ✅ Batch sending (chunks de 100)
- ✅ Tracking (opens, clicks vía webhook)
- ✅ Basic analytics dashboard (sent/opened/clicked)

#### **Semana 7-8: Compliance & Testing**
- ✅ Unsubscribe link + página
- ✅ Consent management (checkbox en patient form)
- ✅ Frequency limits (max 2 emails/week)
- ✅ Beta testing con 5 clientes

**Entregables Fase 1:**
- ✅ Email campaigns funcionales
- ✅ 5 segmentos pre-configurados
- ✅ 10 templates profesionales
- ✅ Analytics básico
- ❌ NO automation flows
- ❌ NO SMS bulk
- ❌ NO social media

**KPIs de éxito para continuar Fase 2:**
- 20+ clientes usan feature activamente en 3 meses
- 50+ campaigns enviadas
- Feedback score >4.0/5.0
- <5% unsubscribe rate

---

### **FASE 2: Automation + SMS (6-8 semanas) - $5,000 USD**

**Objetivo:** Agregar automation flows y SMS bulk.

#### **Semana 1-2: Automation Engine**
- ✅ Tablas: `automation_flows`, `flow_enrollments`
- ✅ Trigger system (patient_created, appointment_completed, segment_join)
- ✅ Cron job para ejecutar flows (check every 15 min)
- ✅ Step processor (delay, conditions, actions)

#### **Semana 3-4: Automation UI**
- ✅ Flow builder (visual canvas)
- ✅ 3 flow templates pre-configurados
- ✅ Flow metrics dashboard
- ✅ Enrollment management

#### **Semana 5-6: SMS Bulk**
- ✅ Twilio SMS integration
- ✅ SMS campaign builder (160 char limit)
- ✅ Cost calculator (mostrar costo antes de enviar)
- ✅ Budget controls (pausar si excede límite)

#### **Semana 7-8: Advanced Segmentation**
- ✅ 15 criterios de segmentación (vs 5 en Fase 1)
- ✅ Segment templates (10 pre-configurados)
- ✅ A/B testing básico (split 50/50)
- ✅ Testing + refinamiento

**Entregables Fase 2:**
- ✅ 5 automation flow templates
- ✅ SMS bulk campaigns
- ✅ Segmentación avanzada (15 criterios)
- ✅ A/B testing
- ✅ Budget controls

---

### **FASE 3: Social Media + Advanced Analytics (8 semanas) - $6,000 USD**

**Objetivo:** Integración completa con Facebook/Instagram.

#### **Semana 1-3: Meta Business API**
- ✅ OAuth flow para Facebook/Instagram
- ✅ Lead Ads integration (webhook)
- ✅ Messenger webhook (basic bot)
- ✅ WhatsApp Business API setup

#### **Semana 4-5: Social Campaigns**
- ✅ Facebook Lead Ad builder
- ✅ Messenger bot configurator
- ✅ Instagram Stories link generator
- ✅ Click-to-WhatsApp buttons

#### **Semana 6-7: Advanced Analytics**
- ✅ Advanced dashboard (Mixpanel-style)
- ✅ Funnel visualization
- ✅ Cohort analysis
- ✅ Revenue attribution (qué campaña generó cuánto)

#### **Semana 8: Polish & Launch**
- ✅ Performance optimization
- ✅ Documentation completa
- ✅ Video tutorials (5-6 videos)
- ✅ Public launch

**Entregables Fase 3:**
- ✅ Facebook/Instagram booking directo
- ✅ Messenger chatbot
- ✅ Advanced analytics
- ✅ Revenue attribution

---

## **🎯 PRIORIDAD EN ROADMAP GENERAL**

Según situación actual de AgendaMedPro:

### **CRÍTICO (Hacer primero - Q1 2026)**
1. ✅ **Facturación SAT (CFDI 4.0)** - Compliance obligatorio México
2. ✅ **WhatsApp recordatorios automáticos** - Feature más pedida
3. ✅ **RLS subscription validation** - Bloquear acceso si trial vencido

### **ALTO (Q2 2026)**
4. **Pagos en línea (Stripe + OpenPay)** - Monetización crítica
5. **Teleconsultas (Twilio Video)** - Diferenciador vs competencia

### **MEDIO-ALTO (Q3 2026)**
6. ⭐ **Marketing Automation Fase 1** - Multiplicador de revenue
7. **Multi-location (sucursales)** - Enterprise feature

### **MEDIO (Q4 2026)**
8. **Marketing Automation Fase 2** - SMS + Automation
9. **Reportes avanzados** - Analytics deep dive

### **FUTURO (2027)**
10. **Marketing Automation Fase 3** - Social media
11. **White-label** - Custom branding para clientes enterprise

---

## **📋 DECISIÓN: ¿IMPLEMENTAR O NO?**

### **✅ IMPLEMENTAR SI:**
- Tienes 50+ clientes activos (base estable)
- Clientes piden "recuperación de pacientes" frecuentemente
- Competencia local tiene automation (presión competitiva)
- Quieres aumentar pricing $200-300 MXN/mes (justificado)
- Tienes $15K USD disponibles o puedes escalonar en 3 fases

### **❌ POSPONER SI:**
- Tienes <30 clientes (focus en adquisición primero)
- Features críticas sin terminar (facturación SAT, pagos)
- No tienes dev capacity (equipo pequeño)
- Budget limitado (<$5K USD)

### **✅ RECOMENDACIÓN FINAL:**

**IMPLEMENTAR EN FASES (Timeline sugerido):**

```
Nov 2025 - Mar 2026: Features críticas (SAT + WhatsApp + Pagos)
Abr - Jun 2026: Marketing Automation FASE 1 (MVP Email)
  → Validar con 20+ clientes
  → Subir precio Pro a $1,299 MXN
Jul - Sep 2026: Marketing Automation FASE 2 (SMS + Automation)
  → Lanzar add-on $399 MXN/mes
Oct - Dic 2026: Marketing Automation FASE 3 (Social Media)
  → Feature completo para Enterprise
```

**Ventajas de este approach:**
- ✅ Generas revenue desde Fase 1 para financiar Fases 2-3
- ✅ Validas demanda antes de invertir todo
- ✅ No bloqueas roadmap crítico
- ✅ Puedes ajustar según feedback

**KPIs de éxito año 1:**
- 40+ clientes usando campaigns (70% adoption rate)
- 200+ campaigns enviadas
- $150K MXN adicional revenue (pricing increase)
- 4.5/5.0 satisfaction score
- <3% unsubscribe rate promedio

---

## **🔗 RECURSOS Y REFERENCIAS**

### **Proveedores Recomendados**

**Email Service:**
- SendGrid (recomendado): https://sendgrid.com/pricing
- Resend (moderno, buena DX): https://resend.com/pricing
- Amazon SES (más barato, más complejo): https://aws.amazon.com/ses/pricing

**SMS/WhatsApp:**
- Twilio (líder del mercado): https://www.twilio.com/messaging/pricing/mx
- MessageBird (alternativa europea): https://messagebird.com/pricing
- Vonage (antes Nexmo): https://www.vonage.com/communications-apis/sms/pricing

**Email Editor (WYSIWYG):**
- Unlayer (recomendado): https://unlayer.com
- GrapeJS (open source): https://grapesjs.com
- EmailJS (React component): https://www.emailjs.com

**Link Shortener:**
- Rebrandly (custom domain): https://www.rebrandly.com/pricing
- Bitly (más conocido): https://bitly.com/pages/pricing
- YOURLS (self-hosted): https://yourls.org

### **Compliance Resources**

- **CAN-SPAM Act:** https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- **LFPDPPP México:** http://inicio.ifai.org.mx/SitePages/ifai.aspx
- **GDPR Checklist:** https://gdpr.eu/checklist/

### **Learning Resources**

- **Email Deliverability:** https://www.validity.com/resource-center/email-deliverability-guide/
- **Sender Score:** https://senderscore.org
- **Email Design Best Practices:** https://www.campaignmonitor.com/resources/guides/email-marketing-best-practices/

---

## **📞 PRÓXIMOS PASOS**

### **Si decides implementar ahora:**

1. **Semana 1:** Setup proveedores (SendGrid + Twilio accounts)
2. **Semana 2:** Contratar dev senior o definir sprint interno
3. **Semana 3-4:** Kickoff Fase 1 (backend + DB)
4. **Semana 10:** Beta con 5 clientes selectos
5. **Semana 12:** Launch Fase 1 + aumentar precio Pro a $1,299

### **Si decides posponer:**

1. Terminar features críticas (SAT + Pagos)
2. Alcanzar 50+ clientes activos
3. Revalidar demanda (encuesta a clientes)
4. Revisar competencia (si lanzan automation primero)
5. Kickoff en Q2-Q3 2026

---

**Última actualización:** 16 de noviembre, 2025  
**Versión:** 1.0  
**Autor:** AgendaMedPro Team  
**Status:** 📋 Planificación completa - Pendiente decisión de implementación

