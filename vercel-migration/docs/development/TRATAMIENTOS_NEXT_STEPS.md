# 🎯 TRATAMIENTOS - Próximos Pasos Priorizados

**Fecha:** 3 Noviembre 2025  
**Módulo:** Tratamientos/Servicios  
**Status Actual:** ✅ Completo (funcionalidad básica)

---

## 📊 Estado Actual vs Competencia

### ✅ Lo que YA tenemos (Funcional)
- ✅ Registro de tratamientos realizados
- ✅ Tracking de costos y precios
- ✅ Historial por paciente
- ✅ Facturación básica
- ✅ Gestión de inventario vinculado
- ✅ Reportes básicos de tratamientos

### ❌ Gaps Críticos (vs SimplePractice, Jane App)
De **42 gaps totales**, los más críticos son:

1. ❌ **Service Catalog Management** - Hard-coded services
2. ❌ **Multi-tier Pricing** - Solo un precio por servicio
3. ❌ **SOAP Note Templates** - No estructurados
4. ❌ **Treatment Plans** - No existe sistema formal
5. ❌ **Session Packages/Bundles** - No disponible
6. ❌ **CPT/ICD-10 Integration** - No hay búsqueda de códigos
7. ❌ **ePrescribe** - Crítico para México
8. ❌ **AI Scribe** - Voice-to-text notes

---

## 🎯 ROADMAP RECOMENDADO

### **🔥 Prioridad 1: Q1 2026 (Enero-Marzo) - SERVICE CATALOG**

#### **Semana 1-3: Service Management System**
**Objetivo:** Permitir a doctores crear/editar servicios personalizados

**Features:**
- ✅ CRUD de servicios (Create, Read, Update, Delete)
- ✅ Nombre y descripción personalizable
- ✅ Duración configurable (15min, 30min, 1hr, custom)
- ✅ Precio base por servicio
- ✅ Categorías de servicios (consulta, procedimiento, estudio, etc.)
- ✅ Toggle active/inactive
- ✅ Color coding para visualización

**Database:**
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'consultation', 'procedure', 'study', etc.
  duration_minutes INTEGER DEFAULT 30,
  base_price DECIMAL(10,2),
  color TEXT, -- hex color
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies para multi-tenant
```

**APIs Necesarias:**
- GET /api/services - List all services
- POST /api/services - Create service
- GET /api/services/[id] - Get service
- PUT /api/services/[id] - Update service
- DELETE /api/services/[id] - Soft delete

**UI Components:**
- `/dashboard/settings/services` - List page con search
- `/dashboard/settings/services/new` - Create form
- `/dashboard/settings/services/[id]` - Edit form
- Service selector en appointment booking
- Service selector en treatment recording

**Tiempo:** 3 semanas  
**Costo:** $0 (Supabase)

---

#### **Semana 4-6: Multi-tier Pricing & Packages**
**Objetivo:** Precios diferenciados y paquetes de sesiones

**Features:**
- ✅ Pricing tiers (new patient, returning, member, insurance)
- ✅ Practitioner-specific price override
- ✅ Sliding scale pricing
- ✅ Session packages (5 sessions, 10 sessions)
- ✅ Package discounts
- ✅ Prepaid vs pay-as-you-go
- ✅ Package expiration dates

**Database:**
```sql
CREATE TABLE service_pricing (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services,
  tier TEXT, -- 'new_patient', 'returning', 'member', 'insurance'
  price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_packages (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT, -- "Paquete 10 Sesiones Botox"
  service_id UUID REFERENCES services,
  sessions_included INTEGER,
  total_price DECIMAL(10,2),
  discount_percent DECIMAL(5,2),
  valid_for_days INTEGER, -- Expiration
  active BOOLEAN DEFAULT true
);

CREATE TABLE package_purchases (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES service_packages,
  patient_id UUID REFERENCES patients,
  sessions_used INTEGER DEFAULT 0,
  sessions_remaining INTEGER,
  purchase_date DATE,
  expiration_date DATE,
  status TEXT -- 'active', 'expired', 'completed'
);
```

**UI Updates:**
- Pricing section en service editor
- Package builder UI
- Package selector en treatment booking
- Package tracking en patient detail
- Package usage dashboard

**Tiempo:** 3 semanas  
**Costo:** $0 (Supabase)

---

#### **Semana 7-9: SOAP Note Templates**
**Objetivo:** Documentación clínica estructurada

**Features:**
- ✅ SOAP format builder (Subjective, Objective, Assessment, Plan)
- ✅ Custom fields per section
- ✅ Template library (10+ common formats)
- ✅ Quick phrases (hotkeys)
- ✅ Auto-populate patient data
- ✅ Digital signatures
- ✅ Template save/load

**Database:**
```sql
CREATE TABLE soap_note_templates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  specialty TEXT, -- 'dermatology', 'aesthetics', etc.
  subjective_fields JSONB, -- [{field: "Chief Complaint", type: "textarea"}]
  objective_fields JSONB,
  assessment_fields JSONB,
  plan_fields JSONB,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ
);

CREATE TABLE soap_notes (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  appointment_id UUID REFERENCES appointments,
  template_id UUID REFERENCES soap_note_templates,
  subjective JSONB, -- {chief_complaint: "...", history: "..."}
  objective JSONB, -- {vital_signs: {...}, exam_findings: "..."}
  assessment JSONB, -- {diagnosis: "...", icd10_code: "..."}
  plan JSONB, -- {treatment: "...", prescriptions: [...], followup: "..."}
  signed_by UUID REFERENCES auth.users,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

**UI Components:**
- `/dashboard/settings/soap-templates` - Template manager
- SOAP note editor modal (2-column layout)
- Template selector en appointment
- SOAP note viewer en patient expediente
- Quick phrases library

**Tiempo:** 3 semanas  
**Costo:** $0 (Supabase)

---

#### **Semana 10-12: Treatment Plans Basic**
**Objetivo:** Planificación de tratamientos a largo plazo

**Features:**
- ✅ Treatment plan builder
- ✅ Problem list (diagnósticos activos)
- ✅ Goal setting per problem
- ✅ Intervention strategies
- ✅ Target dates
- ✅ Progress tracking
- ✅ Link notes to plan

**Database:**
```sql
CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  name TEXT, -- "Plan de Rejuvenecimiento Facial"
  start_date DATE,
  end_date DATE,
  status TEXT, -- 'active', 'completed', 'cancelled'
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ
);

CREATE TABLE treatment_plan_problems (
  id UUID PRIMARY KEY,
  treatment_plan_id UUID REFERENCES treatment_plans,
  problem TEXT,
  icd10_code TEXT,
  priority INTEGER, -- 1 = highest
  status TEXT -- 'active', 'resolved', 'inactive'
);

CREATE TABLE treatment_plan_goals (
  id UUID PRIMARY KEY,
  problem_id UUID REFERENCES treatment_plan_problems,
  goal TEXT,
  target_date DATE,
  status TEXT, -- 'not_started', 'in_progress', 'achieved', 'not_achieved'
  progress_percent INTEGER,
  notes TEXT
);

CREATE TABLE treatment_plan_interventions (
  id UUID PRIMARY KEY,
  goal_id UUID REFERENCES treatment_plan_goals,
  intervention TEXT,
  frequency TEXT, -- "Weekly", "Monthly", etc.
  assigned_to UUID REFERENCES auth.users
);
```

**UI Components:**
- `/dashboard/patients/[id]/treatment-plans` - Plans list
- `/dashboard/patients/[id]/treatment-plans/new` - Plan builder
- Treatment plan viewer modal
- Progress tracking UI (progress bars, charts)
- Goals checklist

**Tiempo:** 3 semanas  
**Costo:** $0 (Supabase)

---

### **📊 Q1 2026 Summary**

**Total Tiempo:** 12 semanas (3 meses)  
**Features Implementadas:** 4 sistemas completos
- ✅ Service Catalog & Management
- ✅ Multi-tier Pricing & Packages
- ✅ SOAP Note Templates
- ✅ Treatment Plans Basic

**Gaps Cerrados:** 10 de 42 (24%)  
**Costo Total:** $0/mes (Supabase)  
**ROI Estimado:**
- +40% eficiencia en documentación clínica
- +60% adoption de paquetes prepagados
- +50% calidad de datos para reportes

---

## 🎯 Prioridad 2: Q2 2026 (Abril-Junio) - CÓDIGOS & ePRESCRIBE

### **Mes 1: CPT/ICD-10 Integration**

**Features:**
- ✅ Import ICD-10 database (CIE-10 México + International)
- ✅ CPT code database (USA, opcional)
- ✅ Code search con auto-complete
- ✅ Link codes to services
- ✅ Link codes to SOAP notes
- ✅ Favorite codes
- ✅ Recent codes history

**Data Sources:**
- CIE-10 México: https://www.cenetec.salud.gob.mx/
- ICD-10 International: WHO public datasets
- CPT Codes: AMA (USA) - optional

**Database:**
```sql
CREATE TABLE icd10_codes (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE, -- "E11.9"
  description TEXT, -- "Diabetes mellitus tipo 2 sin complicaciones"
  category TEXT,
  language TEXT DEFAULT 'es',
  searchable TSVECTOR -- For full-text search
);

CREATE TABLE cpt_codes (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE, -- "99213"
  description TEXT,
  category TEXT,
  searchable TSVECTOR
);

CREATE TABLE service_codes (
  service_id UUID REFERENCES services,
  code_type TEXT, -- 'icd10' or 'cpt'
  code TEXT,
  PRIMARY KEY (service_id, code_type, code)
);
```

**UI:**
- Code search modal con autocomplete
- Favorite codes section
- Recent codes quick access
- Code linking en service editor
- Code linking en SOAP notes

**Tiempo:** 4 semanas  
**Costo:** $0 (public data)

---

### **Mes 2: ePrescribe para México**

**Features:**
- ✅ Prescription template builder (recetas médicas formato oficial)
- ✅ Medication list management
- ✅ Prescription history per patient
- ✅ Dosage tracking
- ✅ Refill management
- ✅ Prescription PDF generation (formato NOM-177-SSA1-2013)
- ✅ Digital signature on prescriptions (e.firma SAT)
- ✅ Prescription printing

**⚠️ Important:** No electronic transmission to pharmacies (not available in México)

**Database:**
```sql
CREATE TABLE medications (
  id UUID PRIMARY KEY,
  name TEXT, -- "Metformina"
  generic_name TEXT,
  presentation TEXT, -- "Tabletas 850mg"
  administration_route TEXT, -- "Oral", "Tópica", etc.
  controlled BOOLEAN DEFAULT false, -- Requiere receta especial
  searchable TSVECTOR
);

CREATE TABLE prescriptions (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  appointment_id UUID REFERENCES appointments,
  prescribed_by UUID REFERENCES auth.users,
  prescription_date DATE,
  status TEXT, -- 'active', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE prescription_items (
  id UUID PRIMARY KEY,
  prescription_id UUID REFERENCES prescriptions,
  medication_id UUID REFERENCES medications,
  dosage TEXT, -- "850mg"
  frequency TEXT, -- "Cada 12 horas"
  duration_days INTEGER,
  quantity INTEGER,
  instructions TEXT,
  refills_allowed INTEGER DEFAULT 0
);

CREATE TABLE prescription_pdfs (
  id UUID PRIMARY KEY,
  prescription_id UUID REFERENCES prescriptions,
  pdf_url TEXT, -- Supabase Storage URL
  signed BOOLEAN DEFAULT false,
  signature_data TEXT, -- Base64 firma digital
  generated_at TIMESTAMPTZ
);
```

**UI:**
- Prescription builder modal
- Medication search (autocomplete)
- Dosage calculator
- PDF preview
- Print interface
- Signature pad (for digital signature)
- Prescription history list

**Legal Requirements (México):**
- Formato oficial NOM-177-SSA1-2013
- Datos del médico: Cédula profesional, especialidad
- Datos del paciente: Nombre completo, edad
- Fecha de prescripción
- Firma del médico (puede ser digital con e.firma SAT)
- Para medicamentos controlados: Formato especial

**Tiempo:** 4 semanas  
**Costo:** $0 (no APIs needed)

---

### **Mes 3: Treatment Plans Advanced**

**Features:**
- ✅ Treatment plan templates (20+ specialties)
- ✅ Goal tracking con milestones
- ✅ Progress visualization (charts/graphs)
- ✅ Outcome measure integration
- ✅ Treatment plan reviews/updates
- ✅ Share to patient portal (future)
- ✅ Reporting

**Templates por Especialidad:**
1. Dermatología Estética: Rejuvenecimiento facial
2. Medicina Estética: Contorno corporal
3. Dermatología Clínica: Acné persistente
4. Tricología: Alopecia androgenética
5. Etc. (15+ más)

**UI:**
- Template library modal
- Plan visualization con timeline
- Progress charts (Chart.js)
- Milestone tracker
- Review scheduler
- PDF export de plan

**Tiempo:** 4 semanas  
**Costo:** $0 (Supabase)

---

## 🎯 Prioridad 3: Q3 2026 - PACKAGES & MEMBERSHIPS

### **Mes 1-2: Session Packages**
- Package builder avanzado
- Gifting system
- Refund workflow
- Expiration automation
- Usage analytics

### **Mes 3: Recurring Memberships**
- Membership tiers
- Auto-recurring billing (Stripe)
- Member-only pricing
- Cancellation workflow

**Tiempo:** 12 semanas  
**Costo:** $0 (Stripe handles recurring)

---

## 🎯 Prioridad 4: Q4 2026 - AI & ADVANCED

### **AI Scribe (Voice-to-SOAP)**
- OpenAI Whisper integration
- Speech-to-text (español + inglés)
- Auto-generate SOAP format
- Review & edit interface

**Tiempo:** 8 semanas  
**Costo:** $50-100/mes (OpenAI Whisper $0.006/min)

---

## 💰 Inversión Total Estimada

| Quarter | Features | Tiempo | Costo Mensual | ROI |
|---------|----------|--------|---------------|-----|
| **Q1 2026** | Service Catalog + SOAP + Plans | 12 sem | $0 | +40% efficiency |
| **Q2 2026** | ICD-10 + ePrescribe + Advanced Plans | 12 sem | $0 | +Legal compliance |
| **Q3 2026** | Packages + Memberships | 12 sem | $0 | +60% prepaid adoption |
| **Q4 2026** | AI Scribe + Advanced | 8 sem | $50-100 | -30min/day per doctor |

**Total Development:** 44 semanas (~11 meses)  
**Total Cost:** $50-100/mes (solo AI features)

---

## ✅ Quick Wins (Próximas 2 Semanas)

Si quieres empezar YA con algo pequeño antes de Q1 2026:

### **Quick Win 1: Service Categories**
- Agregar campo `category` a tabla `treatments`
- UI para crear categorías personalizadas
- Filter por categoría en reportes

**Tiempo:** 3 días  
**Impacto:** +20% organization

---

### **Quick Win 2: Quick Phrases Library**
- Tabla de frases guardadas por doctor
- Hotkeys para insertar frases comunes
- Use en notas de tratamiento

**Tiempo:** 4 días  
**Impacto:** -10min per treatment note

---

### **Quick Win 3: Treatment Favorites**
- Mark tratamientos como favoritos
- Quick access en appointment booking
- Frecuency tracking

**Tiempo:** 2 días  
**Impacto:** +15% booking speed

---

## 🎬 Siguiente Acción Inmediata

**Recomendación:** Empezar con **Service Catalog Management** (Semana 1-3 de Q1)

**Por qué es prioridad:**
1. Base para todo lo demás (pricing, packages, SOAP notes)
2. Impact inmediato en UX
3. No tiene dependencias externas
4. 0 costo de APIs

**Siguiente paso concreto:**
1. Crear migration 010: `services` table
2. Crear APIs CRUD básicas
3. UI list page en `/dashboard/settings/services`
4. Service selector en appointment booking

**¿Empezamos con Service Catalog?** 🚀
