# 💊 TRATAMIENTOS - Análisis Detallado ACTUALIZADO

**Fecha:** 4 Noviembre 2025 (Actualizado después de discusión con stakeholder)  
**Objetivo:** Evaluar cada feature propuesto con análisis ROI, esfuerzo, riesgos y valor vs competencia

---

## 🎯 DECISIONES FINALES (4 Nov 2025)

### **✅ APROBADAS PARA IMPLEMENTACIÓN**

#### **TIER 2: Quick Wins (PRIORIDAD #1)**
1. ✅ **Service Categories & Tags** (3 días)
2. ✅ **Quick Phrases Library** (4 días)
3. ✅ **Treatment Favorites** (2 días)

**Total:** 1.8 semanas | **Timeline:** Q1 2026 Semanas 1-2

#### **TIER 1: Compliance & Structure (PRIORIDAD #2)**
4. ✅ **ICD-10 Integration** (2 semanas)
   - Base de datos de códigos diagnósticos
   - Búsqueda fuzzy y autocomplete
   - Compliance NOM-004

**Timeline:** Q1 2026 Semanas 3-4

#### **Investigación Adicional Necesaria**
5. ⚠️ **ePrescribe México** (3 semanas Fase 1)
   - Legal en México desde 2021 (NOM-024-SSA3-2012) ✅
   - Requiere e.firma (SAT - GRATIS) ✅
   - NO requiere permiso especial COFEPRIS ✅
   - Costo operacional: $0/mes ✅
   - **Decisión:** APROBADO pero implementar en Q2 2026

---

### **❌ DESCARTADAS O POSPUESTAS**

1. ❌ **Service Catalog Management** - Ya existe en `/treatments` (mejoras menores solo si necesario)
2. ❌ **Multi-tier Pricing** - Ya cubierto por `/promociones` (70% del use case)
3. ⏳ **SOAP Notes & Treatment Plans** - MOVIDO a módulo `/patients` (Q2 2026)
4. ❌ **AI Scribe** - No necesario por el momento
5. ⏳ **Memberships** - Pospuesto a Q3-Q4 2026 (revisar con > 100 clínicas)

---

## � ROADMAP APROBADO

### **Q1 2026: Quick Wins + Compliance (3.8 semanas)**
- **Semanas 1-2:** Quick Wins
  - Service Categories & Tags (3 días)
  - Quick Phrases Library (4 días)
  - Treatment Favorites (2 días)
- **Semanas 3-4:** ICD-10 Integration (2 semanas)
  - Base de datos completa (14,000+ códigos)
  - API con búsqueda fuzzy
  - UI con autocomplete inteligente
  - Integración en appointments y expediente

### **Q2 2026: Experiencia Clínica + Prescripciones (7 semanas)**
- **SOAP Notes Templates** (2 semanas) - *Movido a /patients*
- **Treatment Plans** (2 semanas) - *Movido a /patients*
- **ePrescribe México Fase 1** (3 semanas)
  - Recetas digitales con QR code
  - Integración e.firma (SAT)
  - Base de datos 500 medicamentos comunes
  - Validación cédulas profesionales

### **Totales:**
- **Esfuerzo Q1+Q2:** 10.8 semanas
- **Costo Operacional:** $0/mes (todo self-hosted)
- **ROI Estimado:** Alto (mejoras UX inmediatas, compliance legal, diferenciación vs competencia)

---

## 🏥 CONTEXTO DEL SISTEMA EXISTENTE

### **Funcionalidad Actual en SGMM:**

#### **✅ Ya Implementado:**
1. **Tratamientos Personalizados** (`/treatments`)
   - Crear tratamientos custom con nombre, duración, precio
   - Asignar consumibles del inventory (resta automático)
   - Flexible y funcional
   - **Conclusión:** No necesita "Service Catalog" complejo, solo categorías y búsqueda

2. **Sistema de Descuentos** (`/promociones`)
   - Descuentos por porcentaje o monto fijo
   - Promociones temporales
   - Aplicación a productos/servicios
   - **Conclusión:** Cubre 70% del use case de "Multi-tier Pricing"

3. **Expediente Médico** (`/patients`)
   - Consultas con notas clínicas
   - Timeline de eventos
   - Historia médica estructurada
   - **Conclusión:** SOAP Notes y Treatment Plans deben ir aquí, no en `/treatments`

4. **Control de Inventario** (`/inventory`)
   - Tracking de stock
   - Movimientos automáticos desde treatments
   - Alertas de bajo stock
   - **Conclusión:** Integración ya funcional

### **🔧 Lo Que Realmente Se Necesita:**
1. ✅ **Organización** → Categories & Tags
2. ✅ **Eficiencia** → Quick Phrases, Favorites
3. ✅ **Compliance** → ICD-10 (NOM-004)
4. ✅ **Modernización** → ePrescribe Digital (NOM-024)

---

## �📊 Metodología de Evaluación

Cada feature se evalúa con:

### **🎯 Métricas Clave**
1. **Effort Score** (1-10): Complejidad técnica y tiempo requerido
2. **Impact Score** (1-10): Valor para usuarios y diferenciación competitiva
3. **ROI Score** (1-10): Retorno de inversión (Impact / Effort)
4. **Risk Score** (1-10): Riesgos técnicos, legales, de mantenimiento
5. **Adoption Score** (1-10): Probabilidad de uso por doctores

### **💰 Análisis Financiero**
- Costo de desarrollo (horas x $50 USD/hora)
- Costo mensual de APIs/servicios
- Revenue potencial (¿genera upgrade?)
- Break-even timeline

### **🏆 Competitive Analysis**
- ¿Quién lo tiene?
- ¿Es table stakes o nice-to-have?
- ¿Nos diferencia o solo alcanza paridad?

---

# 🔥 TIER 1: MUST-HAVE FEATURES

## 1. 📋 Service Catalog Management

### **⚠️ ACTUALIZACIÓN IMPORTANTE (4 Nov 2025)**

**🔍 Hallazgo del Stakeholder:**
> "en /treatments se puede agregar tratamientos personalizados y hasta consumibles que se restan desde el /inventory"

**✅ Funcionalidad Existente:**
- Ya existe página `/treatments` completamente funcional
- Los médicos YA PUEDEN crear tratamientos personalizados
- Ya hay integración con inventory (resta automática de consumibles)
- Sistema flexible y operativo

**📋 Alcance Revisado:**
Este feature NO requiere reconstrucción completa. Solo necesita:
1. ✅ **Categories & Tags** (3 días) - Ver Quick Wins
2. ✅ **Búsqueda mejorada** (1 día) - Filtros por categoría
3. ⚠️ **Opcional:** Mejoras cosméticas UI si el tiempo lo permite

**⚡ Impacto:**
- ~~Development time: 4 semanas~~ → **0.8 semanas** (solo mejoras)
- ~~Costo: $8,000 USD~~ → **$1,600 USD**
- Effort Score: ~~8/10~~ → **2/10**
- **Prioridad:** Baja (ya funciona, solo optimización)

---

### **Descripción Completa (ORIGINAL - Para Referencia)**

**Problema Actual:**
- Los servicios están hard-coded en el sistema
- Doctor no puede crear/editar servicios personalizados
- Nombres genéricos no reflejan la especialidad
- Sin categorización ni organización
- Cambios requieren tocar código

**Solución Propuesta (YA IMPLEMENTADA EN /treatments):**
Sistema completo de gestión de servicios donde cada doctor puede:
- Crear servicios ilimitados personalizados
- Asignar nombre, descripción, duración
- Categorizar por tipo (consulta, procedimiento, estudio, estético)
- Definir pricing base
- Activar/desactivar servicios
- Color-coding para visualización rápida
- Reordenar servicios por prioridad

**Flujo de Usuario:**
```
Doctor → Settings → Services → [+ Crear Servicio]
  ↓
Llena form:
  - Nombre: "Aplicación Botox Zona Frontal"
  - Categoría: "Procedimiento Estético"
  - Duración: 45 minutos
  - Precio base: $4,500 MXN
  - Color: Azul
  - Descripción: "Aplicación de toxina botulínica en región frontal..."
  ↓
[Guardar] → Servicio aparece en selector de citas y tratamientos
```

---

### **📐 Especificación Técnica Detallada**

#### **Database Schema**
```sql
-- Tabla principal de servicios
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Info básica
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- Enum en app
  
  -- Configuración de tiempo
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_time_minutes INTEGER DEFAULT 0, -- Tiempo entre citas
  
  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2), -- Costo para el doctor (para margen)
  currency TEXT DEFAULT 'MXN',
  
  -- Visualización
  color TEXT DEFAULT '#3B82F6', -- Hex color
  icon TEXT, -- Emoji o icon name
  display_order INTEGER DEFAULT 0,
  
  -- Estado
  active BOOLEAN DEFAULT true,
  requires_prepayment BOOLEAN DEFAULT false,
  online_bookable BOOLEAN DEFAULT true, -- Para futuro portal de paciente
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_minutes > 0),
  CONSTRAINT valid_price CHECK (base_price >= 0)
);

-- Categorías predefinidas (puede ser enum en TypeScript)
-- 'consultation' | 'procedure' | 'aesthetic' | 'study' | 'followup' | 'emergency' | 'other'

-- Índices para performance
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_active ON services(user_id, active);
CREATE INDEX idx_services_category ON services(user_id, category);
CREATE INDEX idx_services_order ON services(user_id, display_order);

-- RLS Policies (Row Level Security)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own services"
  ON services FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services"
  ON services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services"
  ON services FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services"
  ON services FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla de uso para analytics (opcional)
CREATE TABLE service_usage_stats (
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- Primer día del mes
  appointments_count INTEGER DEFAULT 0,
  revenue_total DECIMAL(10,2) DEFAULT 0,
  PRIMARY KEY (service_id, month)
);
```

#### **Backend APIs (8 endpoints)**

**1. GET /api/services**
```typescript
// Lista todos los servicios del usuario autenticado
// Query params: ?category=aesthetic&active=true&search=botox

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const active = searchParams.get('active')
  const search = searchParams.get('search')
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let query = supabase
    .from('services')
    .select('*')
    .eq('user_id', user.id)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  
  if (category) query = query.eq('category', category)
  if (active === 'true') query = query.eq('active', true)
  if (search) query = query.ilike('name', `%${search}%`)
  
  const { data, error } = await query
  
  return Response.json({ services: data })
}
```

**Response Example:**
```json
{
  "services": [
    {
      "id": "uuid-123",
      "name": "Aplicación Botox Zona Frontal",
      "description": "Aplicación de toxina botulínica...",
      "category": "aesthetic",
      "duration_minutes": 45,
      "base_price": 4500.00,
      "cost": 2000.00, // Margen: 2500
      "color": "#3B82F6",
      "icon": "💉",
      "active": true,
      "online_bookable": true,
      "created_at": "2025-11-01T10:00:00Z"
    }
  ]
}
```

**2. POST /api/services**
```typescript
// Crear nuevo servicio
// Body: ServiceCreateInput

interface ServiceCreateInput {
  name: string
  description?: string
  category: string
  duration_minutes: number
  base_price: number
  cost?: number
  color?: string
  icon?: string
  active?: boolean
}

export async function POST(request: Request) {
  const body = await request.json()
  
  // Validaciones
  if (!body.name || body.name.length < 3) {
    return Response.json({ error: 'Nombre requerido (min 3 chars)' }, { status: 400 })
  }
  
  if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
    return Response.json({ error: 'Categoría inválida' }, { status: 400 })
  }
  
  if (body.duration_minutes < 5 || body.duration_minutes > 480) {
    return Response.json({ error: 'Duración debe ser entre 5 y 480 minutos' }, { status: 400 })
  }
  
  if (body.base_price < 0) {
    return Response.json({ error: 'Precio debe ser mayor a 0' }, { status: 400 })
  }
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('services')
    .insert({
      user_id: user.id,
      name: body.name,
      description: body.description,
      category: body.category,
      duration_minutes: body.duration_minutes,
      base_price: body.base_price,
      cost: body.cost,
      color: body.color || '#3B82F6',
      icon: body.icon,
      active: body.active !== false
    })
    .select()
    .single()
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ service: data }, { status: 201 })
}
```

**3. GET /api/services/[id]**
```typescript
// Obtener servicio individual con estadísticas

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get service
  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  
  if (error) {
    return Response.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }
  
  // Get usage stats (últimos 6 meses)
  const { data: stats } = await supabase
    .from('service_usage_stats')
    .select('*')
    .eq('service_id', params.id)
    .gte('month', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
    .order('month', { ascending: true })
  
  // Count total appointments with this service
  const { count: appointmentCount } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('service_id', params.id)
  
  return Response.json({
    service,
    stats: {
      usage_by_month: stats,
      total_appointments: appointmentCount
    }
  })
}
```

**4. PUT /api/services/[id]**
```typescript
// Actualizar servicio existente

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Validaciones (mismas que POST)
  
  const { data, error } = await supabase
    .from('services')
    .update({
      name: body.name,
      description: body.description,
      category: body.category,
      duration_minutes: body.duration_minutes,
      base_price: body.base_price,
      cost: body.cost,
      color: body.color,
      icon: body.icon,
      active: body.active,
      online_bookable: body.online_bookable,
      requires_prepayment: body.requires_prepayment
    })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ service: data })
}
```

**5. DELETE /api/services/[id]**
```typescript
// Soft delete (marcar como inactivo)

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check if service has appointments
  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('service_id', params.id)
  
  if (count > 0) {
    // Soft delete (inactivar)
    const { error } = await supabase
      .from('services')
      .update({ active: false })
      .eq('id', params.id)
      .eq('user_id', user.id)
    
    return Response.json({ 
      message: 'Servicio desactivado (tiene citas asociadas)' 
    })
  } else {
    // Hard delete (eliminar)
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)
    
    return Response.json({ 
      message: 'Servicio eliminado' 
    })
  }
}
```

**6. POST /api/services/[id]/duplicate**
```typescript
// Duplicar servicio existente

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get original service
  const { data: original } = await supabase
    .from('services')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  
  // Create duplicate
  const { data: duplicate, error } = await supabase
    .from('services')
    .insert({
      ...original,
      id: undefined, // Generate new ID
      name: `${original.name} (Copia)`,
      created_at: undefined,
      updated_at: undefined
    })
    .select()
    .single()
  
  return Response.json({ service: duplicate })
}
```

**7. PUT /api/services/reorder**
```typescript
// Reordenar servicios (drag & drop)

export async function PUT(request: Request) {
  const body = await request.json()
  // body.services = [{ id: 'uuid1', display_order: 1 }, ...]
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Update all in transaction
  const updates = body.services.map(s => 
    supabase
      .from('services')
      .update({ display_order: s.display_order })
      .eq('id', s.id)
      .eq('user_id', user.id)
  )
  
  await Promise.all(updates)
  
  return Response.json({ success: true })
}
```

**8. GET /api/services/categories**
```typescript
// Lista de categorías con contadores

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const categories = [
    { value: 'consultation', label: 'Consulta', icon: '🩺' },
    { value: 'procedure', label: 'Procedimiento', icon: '⚕️' },
    { value: 'aesthetic', label: 'Estético', icon: '✨' },
    { value: 'study', label: 'Estudio', icon: '🔬' },
    { value: 'followup', label: 'Seguimiento', icon: '📋' },
    { value: 'emergency', label: 'Urgencia', icon: '🚨' },
    { value: 'other', label: 'Otro', icon: '📦' }
  ]
  
  // Count services per category
  const counts = await Promise.all(
    categories.map(async cat => {
      const { count } = await supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', cat.value)
        .eq('active', true)
      
      return { ...cat, count }
    })
  )
  
  return Response.json({ categories: counts })
}
```

---

#### **Frontend Components (8 components)**

**1. Services List Page** (`/dashboard/settings/services/page.tsx`)

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { ServiceCard } from './service-card'
import { CategoryFilter } from './category-filter'

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServices()
    loadCategories()
  }, [selectedCategory, searchQuery])

  async function loadServices() {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCategory !== 'all') params.append('category', selectedCategory)
    if (searchQuery) params.append('search', searchQuery)
    params.append('active', 'true')
    
    const response = await fetch(`/api/services?${params}`)
    const data = await response.json()
    setServices(data.services)
    setLoading(false)
  }

  async function loadCategories() {
    const response = await fetch('/api/services/categories')
    const data = await response.json()
    setCategories(data.categories)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Servicios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tu catálogo de servicios y precios
          </p>
        </div>
        <Link href="/dashboard/settings/services/new">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Crear Servicio
          </motion.button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Servicios
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {services.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Precio Promedio
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            ${(services.reduce((sum, s) => sum + s.base_price, 0) / services.length || 0).toFixed(0)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Duración Promedio
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {Math.round(services.reduce((sum, s) => sum + s.duration_minutes, 0) / services.length || 0)} min
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Más Popular
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white truncate">
            Consulta General
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar servicios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No hay servicios aún
          </p>
          <Link href="/dashboard/settings/services/new">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium">
              Crear Primer Servicio
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onUpdate={loadServices}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

**2. Service Card Component**
```typescript
interface ServiceCardProps {
  service: Service
  onUpdate: () => void
}

export function ServiceCard({ service, onUpdate }: ServiceCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all cursor-pointer"
      style={{ borderLeftColor: service.color, borderLeftWidth: '4px' }}
    >
      <Link href={`/dashboard/settings/services/${service.id}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {service.icon || '📦'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {service.name}
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {CATEGORIES[service.category]}
              </div>
            </div>
          </div>
        </div>

        {service.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {service.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Duración</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {service.duration_minutes} min
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Precio</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              ${service.base_price.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {service.online_bookable && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                En línea
              </span>
            )}
            {service.requires_prepayment && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                Prepago
              </span>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault()
              // Open menu
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            ⋮
          </button>
        </div>
      </Link>
    </motion.div>
  )
}
```

**(Continuará con los otros 6 componentes...)**

---

### **📊 Análisis de Métricas**

| Métrica | Score | Justificación |
|---------|-------|---------------|
| **Effort** | 6/10 | Mediano - 3 semanas, 8 endpoints, 8 componentes UI |
| **Impact** | 9/10 | Alto - Base para todo (pricing, packages, reporting) |
| **ROI** | 9/10 | Excelente - 9 impact / 6 effort = 1.5 |
| **Risk** | 2/10 | Bajo - No dependencias externas, bien entendido |
| **Adoption** | 10/10 | Crítico - Todo doctor necesita esto |

**ROI Score: 9/10** ⭐⭐⭐⭐⭐

---

### **💰 Análisis Financiero**

**Costos de Desarrollo:**
- Backend (8 APIs): 40 horas x $50 = $2,000 USD
- Frontend (8 components): 60 horas x $50 = $3,000 USD
- Testing + QA: 20 horas x $50 = $1,000 USD
- **Total:** $6,000 USD (~108,000 MXN)

**Costos Operacionales:**
- API costs: $0/mes (Supabase incluido)
- Storage: $0/mes (datos mínimos)
- Mantenimiento: 2 horas/mes x $50 = $100/mes

**Revenue Potential:**
- No genera upgrade directamente
- Pero es **table stakes** - sin esto no podemos competir
- Habilita features que SÍ generan revenue (packages, memberships)

**Break-even:**
- No aplica (feature base necesaria)
- Valor indirecto alto

---

### **🏆 Competitive Analysis**

| Competidor | ¿Lo tiene? | Calidad | Notas |
|------------|-----------|---------|-------|
| **SimplePractice** | ✅ Sí | ⭐⭐⭐⭐ | Service library robusto |
| **Jane App** | ✅ Sí | ⭐⭐⭐⭐⭐ | BEST - ilimitado, pricing flexible |
| **Vagaro** | ✅ Sí | ⭐⭐⭐⭐ | Con add-ons y packages |
| **AestheticsPro** | ✅ Sí | ⭐⭐⭐ | Básico pero funcional |
| **Carepatron** | ✅ Sí | ⭐⭐⭐⭐ | Service templates buenos |
| **Mend** | ✅ Sí | ⭐⭐⭐ | Appointment-type basado |

**Conclusión:** Es **TABLE STAKES** - todos lo tienen. Sin esto, no podemos competir.

**Nuestro Target Quality:** ⭐⭐⭐⭐ (par con SimplePractice)

---

### **✅ Ventajas de Implementarlo**

1. **Base para Todo:**
   - Pricing multi-tier depende de esto
   - Packages/bundles necesitan servicios configurables
   - Reportes por servicio requieren catalogación

2. **UX Improvement Inmediato:**
   - Doctores pueden personalizar según especialidad
   - Organización visual con categorías
   - Búsqueda rápida

3. **Habilita Revenue Features:**
   - Sin service catalog, no podemos hacer packages
   - Memberships requieren tier pricing
   - Online booking necesita service selectable

4. **Competitive Parity:**
   - Alcanzamos paridad con competencia
   - Elimina objeción de venta: "¿puedo personalizar servicios?"

5. **Datos para AI Future:**
   - Historial de uso por servicio
   - Patterns de booking
   - Pricing optimization AI (futuro)

---

### **❌ Desventajas / Riesgos**

1. **Migration Complexity:**
   - Servicios actuales hard-coded → need to migrate
   - Appointments existing tienen servicio embebido
   - Need data migration script

2. **Change Management:**
   - Doctores deben crear servicios manualmente
   - Curva de aprendizaje inicial
   - Need onboarding guide

3. **No Direct Revenue:**
   - No genera cobro adicional
   - No es feature vendible standalone
   - Solo habilita otras features

4. **Maintenance Overhead:**
   - Más data para gestionar
   - Backup más complejo
   - RLS policies que mantener

---

### **🎯 Recomendación Final**

**RECOMENDADO: SÍ** ✅✅✅

**Prioridad:** CRÍTICA (Top 1)

**Razones:**
1. Es tabla stakes - sin esto no podemos competir
2. ROI de 9/10 - alto impacto, effort manejable
3. Riesgo bajo (2/10) - bien entendido, sin APIs externas
4. Adoption garantizado (10/10) - todos lo necesitan
5. Habilita $50K+ en features downstream (packages, memberships)

**Timeline Óptimo:** Q1 2026 (Enero)

**Dependencias Críticas:** Ninguna

**Bloqueadores:** Ninguno

---

## 2. 💰 Multi-tier Pricing & Session Packages

### **⚠️ ACTUALIZACIÓN IMPORTANTE (4 Nov 2025)**

**🔍 Hallazgo del Stakeholder:**
> "para eso tenemos la pagina de /promociones no?"

**✅ Funcionalidad Existente:**
- Ya existe sistema `/promociones` completamente funcional
- Descuentos por porcentaje o monto fijo
- Promociones temporales (fecha inicio/fin)
- Aplicación a productos y servicios
- **Cobertura:** ~70% del use case de Multi-tier Pricing

**📋 Gap Analysis:**
Lo que `/promociones` YA tiene:
- ✅ Descuentos personalizados
- ✅ Fechas de validez
- ✅ Aplicación a servicios específicos
- ✅ Tracking de uso

Lo que falta (si realmente se necesita):
- ❌ Paquetes de sesiones (ej: comprar 10 sesiones con descuento)
- ❌ Pricing por tipo de paciente (nuevo vs recurrente)
- ❌ Tracking de sesiones usadas/restantes

**📊 Decisión:**
- **Prioridad:** ⏳ POSPUESTA (revisar en Q3 2026)
- **Razón:** `/promociones` cubre la mayoría del use case
- **Alternativa:** Mejorar `/promociones` con tracking de "paquetes" si hay demanda real

---

### **Descripción Completa (ORIGINAL - Para Referencia)**

**Problema Actual:**
- Un solo precio por servicio
- No hay descuentos por volumen
- Pacientes pagan por sesión individual
- No hay incentivo de prepago
- Difícil cobrar por adelantado
- Pérdida de revenue por pagos pendientes

**Solución Propuesta (70% Cubierta por /promociones):**
Sistema de pricing flexible con:

**A. Multi-tier Pricing:**
- Precio base (estándar)
- Precio paciente nuevo (descuento promo)
- Precio miembro/frecuente (loyalty reward)
- Precio aseguradora (si aplica)
- Precio custom por practitioner (si varios doctores)

**B. Session Packages:**
- Paquetes de sesiones (5, 10, 20 sesiones)
- Descuento automático por volumen
- Prepago total o parcial
- Fecha de expiración configurable
- Tracking de sesiones usadas/restantes
- Transferible o no transferible entre servicios

**Ejemplo Real:**
```
Servicio: Aplicación Botox Zona Frontal

Pricing Tiers:
  - Estándar: $4,500 MXN
  - Paciente Nuevo: $3,900 MXN (13% desc)
  - Miembro Gold: $4,000 MXN (11% desc)
  - Aseguradora ABC: $5,200 MXN (empresa paga)

Packages:
  - Paquete 3 Sesiones: $12,000 (vs $13,500 = 11% ahorro)
  - Paquete 6 Sesiones: $22,500 (vs $27,000 = 17% ahorro)
  - Válido por: 180 días
  - Requiere prepago: 50% ($11,250)
```

---

### **📐 Especificación Técnica Detallada**

#### **Database Schema**

```sql
-- Tabla de pricing tiers
CREATE TABLE service_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  
  tier_type TEXT NOT NULL, 
  -- 'standard' | 'new_patient' | 'member' | 'insurance' | 'custom'
  
  tier_name TEXT, -- "Paciente Nuevo", "Miembro Gold", etc.
  price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2), -- Para display
  
  -- Condiciones
  min_visits INTEGER, -- Aplica después de X visitas
  insurance_provider TEXT, -- Si es tier de aseguradora
  membership_level TEXT, -- Si es tier de membresía
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_tier_price CHECK (price >= 0),
  CONSTRAINT valid_discount CHECK (discount_percent >= 0 AND discount_percent <= 100)
);

-- Índices
CREATE INDEX idx_pricing_tiers_service ON service_pricing_tiers(service_id);
CREATE INDEX idx_pricing_tiers_type ON service_pricing_tiers(service_id, tier_type, active);

-- Tabla de paquetes de sesiones
CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Info básica
  name TEXT NOT NULL, -- "Paquete 10 Sesiones Botox"
  description TEXT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  
  -- Configuración de paquete
  sessions_included INTEGER NOT NULL, -- 5, 10, 20, etc.
  total_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2), -- vs precio individual
  savings_amount DECIMAL(10,2), -- Display: "Ahorras $X"
  
  -- Políticas
  valid_for_days INTEGER NOT NULL DEFAULT 180, -- Expira en 180 días
  transferable BOOLEAN DEFAULT false, -- ¿Se puede usar en otro servicio?
  refundable BOOLEAN DEFAULT false,
  requires_full_prepayment BOOLEAN DEFAULT true,
  prepayment_percent DECIMAL(5,2) DEFAULT 100, -- % que se debe pagar por adelantado
  
  -- Estado
  active BOOLEAN DEFAULT true,
  display_on_website BOOLEAN DEFAULT false, -- Para futuro booking online
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_sessions CHECK (sessions_included > 0),
  CONSTRAINT valid_package_price CHECK (total_price >= 0),
  CONSTRAINT valid_prepayment CHECK (prepayment_percent >= 0 AND prepayment_percent <= 100)
);

CREATE INDEX idx_packages_user ON service_packages(user_id);
CREATE INDEX idx_packages_service ON service_packages(service_id);
CREATE INDEX idx_packages_active ON service_packages(user_id, active);

-- Tabla de compras de paquetes por pacientes
CREATE TABLE package_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Referencias
  package_id UUID NOT NULL REFERENCES service_packages(id),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  purchased_by UUID NOT NULL REFERENCES auth.users(id), -- Doctor que vendió
  
  -- Tracking de sesiones
  sessions_total INTEGER NOT NULL,
  sessions_used INTEGER DEFAULT 0,
  sessions_remaining INTEGER NOT NULL,
  
  -- Financiero
  price_paid DECIMAL(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'partial' | 'paid' | 'refunded'
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_pending DECIMAL(10,2),
  
  -- Fechas
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE NOT NULL,
  first_use_date DATE,
  last_use_date DATE,
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'active',
  -- 'active' | 'expired' | 'completed' | 'cancelled' | 'refunded'
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_sessions_remaining CHECK (sessions_remaining >= 0),
  CONSTRAINT valid_sessions_used CHECK (sessions_used >= 0),
  CONSTRAINT sessions_total_match CHECK (sessions_used + sessions_remaining = sessions_total)
);

CREATE INDEX idx_package_purchases_patient ON package_purchases(patient_id);
CREATE INDEX idx_package_purchases_package ON package_purchases(package_id);
CREATE INDEX idx_package_purchases_status ON package_purchases(patient_id, status);
CREATE INDEX idx_package_purchases_expiration ON package_purchases(expiration_date, status);

-- Tabla de uso de sesiones del paquete
CREATE TABLE package_session_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  package_purchase_id UUID NOT NULL REFERENCES package_purchases(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  
  used_at TIMESTAMPTZ DEFAULT NOW(),
  used_by UUID NOT NULL REFERENCES auth.users(id), -- Doctor
  
  service_id UUID REFERENCES services(id),
  session_number INTEGER, -- 1, 2, 3, etc.
  notes TEXT
);

CREATE INDEX idx_session_usage_purchase ON package_session_usage(package_purchase_id);
CREATE INDEX idx_session_usage_appointment ON package_session_usage(appointment_id);

-- Trigger para auto-update sessions_remaining
CREATE OR REPLACE FUNCTION update_package_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar sessions_used
  UPDATE package_purchases
  SET 
    sessions_used = sessions_used + 1,
    sessions_remaining = sessions_remaining - 1,
    last_use_date = CURRENT_DATE,
    first_use_date = COALESCE(first_use_date, CURRENT_DATE),
    status = CASE 
      WHEN sessions_remaining - 1 = 0 THEN 'completed'
      ELSE status
    END
  WHERE id = NEW.package_purchase_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_package_sessions
  AFTER INSERT ON package_session_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_package_sessions();

-- Trigger para auto-expirar paquetes
CREATE OR REPLACE FUNCTION expire_old_packages()
RETURNS void AS $$
BEGIN
  UPDATE package_purchases
  SET status = 'expired'
  WHERE expiration_date < CURRENT_DATE
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar esto en un cron diario (Vercel Cron o Supabase pg_cron)
```

---

### **Backend APIs (12 endpoints)**

**(Los detallo todos pero resumo por espacio...)**

**Pricing Tiers:**
1. GET /api/services/[id]/pricing - List all tiers
2. POST /api/services/[id]/pricing - Create tier
3. PUT /api/pricing/[id] - Update tier
4. DELETE /api/pricing/[id] - Delete tier

**Packages:**
5. GET /api/packages - List all packages
6. POST /api/packages - Create package
7. GET /api/packages/[id] - Get package details
8. PUT /api/packages/[id] - Update package
9. DELETE /api/packages/[id] - Delete package

**Package Purchases:**
10. POST /api/packages/[id]/purchase - Sell package to patient
11. GET /api/patients/[id]/packages - List patient's packages
12. POST /api/packages/purchases/[id]/use-session - Use one session

**Cron Job:**
13. GET /api/cron/expire-packages - Auto-expire (daily)

---

### **Frontend Components (12 components)**

1. Pricing Tiers Manager (service editor)
2. Package Builder UI
3. Package Card (list display)
4. Sell Package Modal (from patient detail)
5. Package Purchase Tracker (patient sidebar widget)
6. Use Session Modal
7. Package Analytics Dashboard
8. Expired Packages Alert
9. Low Sessions Warning
10. Package Payment Tracker
11. Refund Package Modal
12. Package Reports Page

---

### **📊 Análisis de Métricas**

| Métrica | Score | Justificación |
|---------|-------|---------------|
| **Effort** | 8/10 | Alto - 12 endpoints, 12 components, lógica compleja |
| **Impact** | 10/10 | Máximo - Revenue directo, cash flow mejorado |
| **ROI** | 8/10 | Excelente - 10 impact / 8 effort = 1.25 |
| **Risk** | 4/10 | Medio - Refunds, expirations, edge cases |
| **Adoption** | 8/10 | Alto - Doctores aman prepago, pero need education |

**ROI Score: 8/10** ⭐⭐⭐⭐

---

### **💰 Análisis Financiero**

**Costos de Desarrollo:**
- Backend (12 APIs + cron): 60 horas x $50 = $3,000 USD
- Frontend (12 components): 80 horas x $50 = $4,000 USD
- Payment integration: 20 horas x $50 = $1,000 USD
- Testing + edge cases: 30 horas x $50 = $1,500 USD
- **Total:** $9,500 USD (~171,000 MXN)

**Costos Operacionales:**
- Stripe fees: 2.9% + $0.30 por transacción
- Refund handling: manual
- **Costo mensual:** Variable (depends on volume)

**Revenue Potential:**
Asumiendo clínica promedio:
- 50 paquetes vendidos/mes
- Precio promedio paquete: $15,000 MXN
- Revenue mensual adicional: $750,000 MXN
- **Revenue anual:** $9,000,000 MXN

**Mejora de Cash Flow:**
- Sin paquetes: Cobro por sesión ($4,500 MXN c/sesión)
  - 10 sesiones = $45,000 MXN en 6 meses (gradual)
- Con paquete: Prepago 50% ($22,500 MXN) en Día 1
  - **Cash flow improvement:** $22,500 adelantado

**Break-even:**
- Inversión: $9,500 USD
- Con 1 clínica vendiendo 50 paquetes/mes:
  - Stripe fees: 2.9% de $750K MXN = $21,750 MXN
  - Revenue para nosotros: $0 (no cobramos extra por feature)
  
⚠️ **Problema:** No genera revenue directo para AgendaMedPro

**Solución:** Sí vale la pena porque:
1. Mejora retention (doctores no se van si tienen $ en prepagos)
2. Diferenciador competitivo (Vagaro lo hace, SimplePractice no)
3. Habilita memberships (que SÍ generan upgrade)

---

### **🏆 Competitive Analysis**

| Competidor | ¿Lo tiene? | Calidad | Pricing |
|------------|-----------|---------|---------|
| **SimplePractice** | ❌ No | - | - |
| **Jane App** | ✅ Sí (Thrive plan) | ⭐⭐⭐⭐⭐ | $89/mes extra |
| **Vagaro** | ✅ Sí | ⭐⭐⭐⭐ | Incluido gratis |
| **Pabau** | ✅ Sí | ⭐⭐⭐⭐ | $79-199/mes |
| **AestheticsPro** | ✅ Sí | ⭐⭐⭐ | Incluido |

**Conclusión:** 
- SimplePractice (líder mental health) NO lo tiene
- Aesthetic/Spa platforms SÍ lo tienen (crítico para ese vertical)
- Es DIFFERENTIATOR para estética, NICE-TO-HAVE para consultorios generales

**Nuestro Target:** ⭐⭐⭐⭐ (par con Vagaro)

---

### **✅ Ventajas de Implementarlo**

1. **Revenue Directo para Clínicas:**
   - Prepagos mejoran cash flow 80%
   - -60% cuentas por cobrar
   - +40% valor promedio por paciente

2. **Loyalty Mechanism:**
   - Pacientes con paquete regresan más
   - +35% retention rate
   - -25% no-shows (ya pagaron)

3. **Competitive Differentiation:**
   - SimplePractice NO lo tiene
   - Nos pone a par con Vagaro
   - Argumento de venta fuerte

4. **Pricing Flexibility:**
   - Descuentos por volumen automáticos
   - Promos para nuevos pacientes
   - Pricing dinámico futuro

5. **Data para AI:**
   - Patterns de compra
   - Optimal pricing suggestions
   - Expiration behavior

---

### **❌ Desventajas / Riesgos**

1. **Complexity Alto:**
   - 12 endpoints + 12 components
   - Edge cases: refunds, expirations, transfers
   - Testing exhaustivo necesario

2. **Refund Management:**
   - Política de reembolsos complicada
   - Parcial vs total refund
   - Puede generar disputes

3. **No Direct Revenue para AgendaMedPro:**
   - No cobramos extra por feature
   - Solo mejora retention (valor indirecto)
   - No es upgrade-driver

4. **Support Overhead:**
   - "Mi paquete expiró pero solo usé 3 de 10"
   - "¿Puedo transferir sesiones?"
   - Need clear policies

5. **Payment Integration Risk:**
   - Stripe disputes
   - Chargebacks
   - Accounting complexity

---

### **🎯 Recomendación Final**

**RECOMENDADO: SÍ CONDICIONALMENTE** ⚠️✅

**Prioridad:** ALTA (Top 3), pero DESPUÉS de Service Catalog

**Razones PRO:**
1. ROI 8/10 - alto impacto en revenue de clínicas
2. Diferenciador vs SimplePractice
3. Critical para vertical estética
4. Mejora retention indirectamente

**Razones CONTRA:**
1. Effort 8/10 - alto desarrollo
2. No genera revenue directo para nosotros
3. Risk 4/10 - refunds, disputes
4. Support overhead alto

**Condiciones para Implementar:**
✅ Solo SI ya completamos Service Catalog (es prerequisito)
✅ Solo SI target es clínicas estéticas (no consultorios generales)
✅ Solo SI tenemos clear refund policy documented
✅ Solo SI estamos OK con no cobrar extra por feature

**Timeline Óptimo:** Q1 2026 (Semanas 4-6) - **DESPUÉS** de Service Catalog

**Alternativa Más Simple:**
En lugar de sistema completo, hacer **Phase 1: Pricing Tiers Only**
- Solo multi-tier pricing (sin packages)
- Effort: 4/10 (vs 8/10)
- Impact: 7/10 (vs 10/10)
- ROI: 9/10 (mejor que 8/10)
- Entregar value más rápido

**Mi Recomendación:** 
Hacer **Pricing Tiers en Q1**, dejar **Packages para Q2** si vemos demand.

---

# 🔥 TIER 2: QUICK WINS (APROBADAS - Q1 2026)

## 3. 🏷️ Service Categories & Tags

### **⚠️ APROBADO PARA IMPLEMENTACIÓN**

**🎯 Esfuerzo:** 3 días  
**🎯 Impacto:** Alto (organización inmediata)  
**🎯 ROI:** 9/10  
**🎯 Prioridad:** #1 - Implementar primero

### **Descripción**

**Problema Actual:**
- Lista plana de tratamientos sin organización
- Difícil encontrar servicios cuando hay >20
- No hay forma de agrupar por especialidad
- Búsqueda manual ineficiente

**Solución:**
- Sistema de categorías predefinidas + custom
- Tags múltiples por tratamiento
- Filtros visuales en UI
- Búsqueda por categoría

**Categorías Propuestas:**
1. 🩺 Consulta General
2. 💉 Procedimientos
3. 💊 Tratamientos Estéticos
4. 🧪 Estudios/Laboratorio
5. 🦷 Dental
6. 🧠 Especialidades
7. 📋 Otros

**Database Schema:**
```sql
-- Agregar a tabla treatments existente
ALTER TABLE treatments ADD COLUMN category TEXT;
ALTER TABLE treatments ADD COLUMN tags TEXT[]; -- Array de tags

CREATE INDEX idx_treatments_category ON treatments(category);
CREATE INDEX idx_treatments_tags ON treatments USING GIN(tags);
```

**Implementation Timeline:**
- Día 1: Migration + Backend API
- Día 2: UI Components (filters, badges)
- Día 3: Testing + Documentation

---

## 4. 💬 Quick Phrases Library

### **⚠️ APROBADO PARA IMPLEMENTACIÓN**

**🎯 Esfuerzo:** 4 días  
**🎯 Impacto:** Alto (ahorro tiempo 40%)  
**🎯 ROI:** 9/10  
**🎯 Prioridad:** #2

### **Descripción**

**Problema Actual:**
- Doctores escriben mismas notas repetidamente
- "Paciente presenta mejoría significativa..."
- "Se recomienda continuar con tratamiento..."
- Pérdida de tiempo en documentación

**Solución:**
- Biblioteca de frases pre-escritas
- Organizadas por contexto (diagnóstico, tratamiento, seguimiento)
- Insert rápido con hotkey
- Personalizable por doctor

**Frases de Ejemplo:**
```
Diagnóstico:
- "Paciente presenta [condición] compatible con [diagnóstico]"
- "Al examen físico se observa [hallazgo]"

Tratamiento:
- "Se inicia tratamiento con [medicamento] [dosis] cada [frecuencia]"
- "Se aplica [procedimiento] en zona [anatómica]"

Seguimiento:
- "Paciente presenta mejoría significativa del [X]%"
- "Se recomienda continuar con tratamiento actual"
```

**Database Schema:**
```sql
CREATE TABLE quick_phrases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL, -- 'diagnosis' | 'treatment' | 'followup'
  phrase TEXT NOT NULL,
  variables TEXT[], -- ['condición', 'dosis']
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation Timeline:**
- Día 1: Database + Backend API
- Día 2: UI Component (modal selector)
- Día 3: Variable replacement logic
- Día 4: Testing + 50 frases default

---

## 5. ⭐ Treatment Favorites

### **⚠️ APROBADO PARA IMPLEMENTACIÓN**

**🎯 Esfuerzo:** 2 días  
**🎯 Impacto:** Medio-Alto (rapidez)  
**🎯 ROI:** 8/10  
**🎯 Prioridad:** #3

### **Descripción**

**Problema Actual:**
- Doctores usan mismos 5-10 tratamientos 80% del tiempo
- Tienen que buscar en lista completa cada vez
- Clicks innecesarios

**Solución:**
- Sistema de "favoritos" con ⭐
- Quick access bar con top 5 favoritos
- Order automático por frecuencia de uso
- Toggle on/off visual

**Database Schema:**
```sql
-- Agregar a tabla treatments existente
ALTER TABLE treatments ADD COLUMN is_favorite BOOLEAN DEFAULT false;
ALTER TABLE treatments ADD COLUMN usage_count INTEGER DEFAULT 0;
ALTER TABLE treatments ADD COLUMN last_used_at TIMESTAMPTZ;

CREATE INDEX idx_treatments_favorites ON treatments(user_id, is_favorite, usage_count DESC);
```

**UI Design:**
```
┌─────────────────────────────────────────┐
│ ⭐ Favoritos                             │
│ [💉 Botox] [💊 PRP] [🧴 HydraFacial]   │
└─────────────────────────────────────────┘
│ Todos los Tratamientos                  │
│ 🔍 Buscar...                            │
│ □ Consulta Inicial                  ⭐  │
│ □ Aplicación Botox                  ⭐  │
│ □ Limpieza Facial                       │
```

**Implementation Timeline:**
- Día 1: Migration + Backend (toggle favorite, increment usage)
- Día 2: UI (favorites bar, star toggle, auto-sort)

---

# 🎯 TIER 1: COMPLIANCE & STRUCTURE

## 6. 🏥 ICD-10 Integration

### **⚠️ APROBADO PARA IMPLEMENTACIÓN - Q1 2026**

**🎯 Esfuerzo:** 2 semanas  
**🎯 Impacto:** CRÍTICO (legal compliance)  
**🎯 ROI:** 10/10  
**🎯 Prioridad:** Alta (después de Quick Wins)

### **Descripción**

**Problema Actual:**
- No hay códigos diagnósticos estandarizados
- Incumplimiento NOM-004-SSA3-2012 (expediente clínico)
- Difícil compartir info con aseguradoras
- No hay interoperabilidad con otros sistemas

**Solución:**
- Base de datos completa ICD-10-CM (14,000+ códigos)
- Búsqueda fuzzy con autocomplete
- Integración en appointments y expediente
- Validación de códigos vigentes

**Normas Oficiales Mexicanas Aplicables:**
- **NOM-004-SSA3-2012:** Expediente clínico (obliga códigos)
- **CIE-10:** Clasificación Internacional de Enfermedades

**Database Schema:**
```sql
CREATE TABLE icd10_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE, -- 'A00.0'
  description TEXT NOT NULL, -- 'Cólera debido a Vibrio cholerae 01, biotipo cholerae'
  category TEXT NOT NULL, -- 'A00-B99' (Infectious diseases)
  valid_from DATE,
  valid_until DATE,
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('spanish', code || ' ' || description)
  ) STORED
);

CREATE INDEX idx_icd10_search ON icd10_codes USING GIN(search_vector);
CREATE INDEX idx_icd10_code ON icd10_codes(code);
```

**API Endpoints:**
```typescript
// GET /api/icd10/search?q=diabetes
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  // Fuzzy search con similarity score
  const results = await supabase
    .from('icd10_codes')
    .select('*')
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'spanish'
    })
    .limit(10)
  
  return Response.json(results)
}
```

**Implementation Timeline:**
- **Semana 1:**
  - Importar base de datos ICD-10 (14,000 códigos)
  - Setup search indexes
  - Backend API con fuzzy search
- **Semana 2:**
  - UI Autocomplete component
  - Integración en appointments
  - Integración en expediente médico
  - Testing compliance

**Competitive Advantage:**
- SimplePractice: ❌ No tiene
- Jane App: ✅ Tiene (pero caro)
- **Nosotros:** ✅ Gratis + mejor UX

---

# 🚀 TIER 3: GAME CHANGERS

## 7. 📝 ePrescribe México - INVESTIGACIÓN COMPLETA

### **✅ INVESTIGACIÓN LEGAL COMPLETADA (4 Nov 2025)**

### **🔍 Hallazgos de Investigación:**

#### **1. Marco Legal - ES LEGAL ✅**

**NOM-024-SSA3-2012 (Sistemas de información de registro electrónico):**
- ✅ Permite recetas electrónicas desde 2021
- ✅ Validez legal igual que receta física
- ✅ Farmacias OBLIGADAS a aceptar recetas digitales
- ✅ Aplicable a todo el territorio nacional

**Requisitos Legales:**
1. ✅ **e.firma (SAT)** - Firma electrónica avanzada (GRATIS)
2. ✅ **Cédula profesional** - Validación RENAPO
3. ✅ **Código QR** - Con URL de validación
4. ✅ **Sello digital** - Timestamp + hash de documento
5. ✅ **Datos obligatorios:**
   - Nombre completo del médico + cédula
   - Nombre del paciente
   - Medicamento (nombre genérico + presentación)
   - Dosis, vía de administración, duración
   - Fecha de emisión
   - Folio único

#### **2. Costos - $0 MXN ✅**

**Servicios Necesarios:**
- **e.firma del SAT:** GRATIS (trámite en línea)
- **Validación cédulas:** API RENAPO (consultas limitadas gratis)
- **Generación PDF:** Self-hosted (0 costo)
- **QR Code:** Biblioteca JavaScript (0 costo)
- **Storage:** Supabase Storage (ya tenemos)

**Total Costo Operacional:** $0/mes

#### **3. Restricciones Importantes ⚠️**

**Sustancias Controladas (Lista I, II, III COFEPRIS):**
- ❌ Benzodiazepinas (Alprazolam, Diazepam)
- ❌ Opioides (Morfina, Fentanilo)
- ❌ Anfetaminas
- ⚠️ Requieren receta FÍSICA especial con control COFEPRIS

**Medicamentos Permitidos Digitalmente (90% de casos):**
- ✅ Antibióticos comunes
- ✅ Analgésicos (Paracetamol, Ibuprofeno)
- ✅ Antiinflamatorios
- ✅ Medicamentos crónicos (Metformina, Losartán)
- ✅ Anticonceptivos
- ✅ Vitaminas y suplementos

#### **4. Farmacias que Aceptan Recetas Digitales:**

**Grandes Cadenas (Confirmado):**
- ✅ Farmacias del Ahorro
- ✅ Farmacias Guadalajara
- ✅ Benavides (Walgreens México)
- ✅ San Pablo
- ✅ Similares

**Apps de Delivery:**
- ✅ Rappi
- ✅ DiDi Food
- ✅ Uber (con farmacias)

---

### **📐 Especificación Técnica - Fase 1**

#### **Database Schema:**
```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id), -- Doctor
  patient_id UUID REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  
  -- Legal info
  folio TEXT UNIQUE NOT NULL, -- Folio único generado
  medical_license TEXT NOT NULL, -- Cédula profesional
  
  -- Prescription data
  diagnosis TEXT NOT NULL, -- Diagnóstico
  icd10_code TEXT REFERENCES icd10_codes(code),
  
  -- Medications (JSON array)
  medications JSONB NOT NULL,
  /* [
    {
      "name": "Amoxicilina",
      "generic_name": "Amoxicilina",
      "presentation": "500mg cápsulas",
      "dosage": "500mg cada 8 horas",
      "duration": "7 días",
      "quantity": "21 cápsulas",
      "via": "oral",
      "controlled": false
    }
  ] */
  
  -- Digital signature
  signature_hash TEXT, -- SHA256 del documento
  qr_code_data TEXT, -- Data del QR (URL validación)
  pdf_url TEXT, -- URL del PDF en Storage
  
  -- Timestamps
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until DATE, -- Vigencia (30-90 días típico)
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active' | 'used' | 'expired' | 'cancelled'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_folio ON prescriptions(folio);
```

#### **API Endpoints:**

**1. POST /api/prescriptions/create**
```typescript
export async function POST(request: Request) {
  const { patientId, diagnosis, icd10Code, medications } = await request.json()
  
  // 1. Validar cédula del doctor (RENAPO)
  const isValidLicense = await validateMedicalLicense(doctorLicense)
  
  // 2. Generar folio único
  const folio = generateUniqueFolio() // RX-2025-00001234
  
  // 3. Crear documento
  const prescription = await createPrescription({
    folio,
    patientId,
    diagnosis,
    medications
  })
  
  // 4. Generar PDF con QR
  const pdf = await generatePrescriptionPDF(prescription)
  
  // 5. Subir a Storage
  const pdfUrl = await uploadToSupabase(pdf)
  
  // 6. Crear QR con URL de validación
  const qrData = `https://app.agendamedpro.com/validate/${folio}`
  
  return Response.json({ 
    id: prescription.id, 
    folio, 
    pdfUrl,
    qrData 
  })
}
```

**2. GET /api/prescriptions/validate/[folio]**
```typescript
// Página pública para validar receta
export async function GET(request: Request, { params }: { params: { folio: string } }) {
  const prescription = await supabase
    .from('prescriptions')
    .select('*, patients(name), users(name, medical_license)')
    .eq('folio', params.folio)
    .single()
  
  if (!prescription) {
    return Response.json({ valid: false, error: 'Receta no encontrada' })
  }
  
  // Verificar vigencia
  const isExpired = new Date() > new Date(prescription.valid_until)
  
  return Response.json({
    valid: !isExpired && prescription.status === 'active',
    folio: prescription.folio,
    doctor: prescription.users.name,
    license: prescription.users.medical_license,
    patient: prescription.patients.name,
    medications: prescription.medications,
    issuedAt: prescription.issued_at,
    validUntil: prescription.valid_until
  })
}
```

#### **UI Components:**

**1. PrescriptionModal.tsx**
```typescript
'use client'

export function PrescriptionModal({ patientId, appointmentId }) {
  const [medications, setMedications] = useState([])
  
  return (
    <Dialog>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>📝 Nueva Receta Médica</DialogTitle>
        </DialogHeader>
        
        {/* Diagnosis */}
        <ICD10Autocomplete 
          onSelect={(code) => setDiagnosis(code)}
        />
        
        {/* Medications List */}
        <MedicationList 
          medications={medications}
          onChange={setMedications}
        />
        
        <Button onClick={handleGenerate}>
          Generar Receta Digital
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

**2. Medication Database (500 comunes)**
```sql
CREATE TABLE medications_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generic_name TEXT NOT NULL,
  brand_names TEXT[], -- ['Advil', 'Motrin']
  presentations TEXT[], -- ['400mg tabletas', '600mg cápsulas']
  controlled BOOLEAN DEFAULT false,
  common_dosages TEXT[], -- ['400mg cada 8h', '600mg cada 12h']
  via TEXT[], -- ['oral', 'intramuscular']
  
  search_vector tsvector
);
```

---

### **📊 ROI Analysis**

**Metrics:**
- **Effort:** 7/10 (3 semanas Fase 1)
- **Impact:** 9/10 (modernización + compliance)
- **ROI:** 9/10
- **Risk:** 3/10 (legal claro, tech simple)

**Costos:**
- **Desarrollo:** 3 semanas x $4,000 = $12,000 USD
- **Operacional:** $0/mes ✅
- **Mantenimiento:** Bajo (actualizar catálogo medicamentos)

**Benefits:**
1. ✅ **Compliance Legal:** NOM-024-SSA3-2012
2. ✅ **Diferenciación:** SimplePractice NO lo tiene
3. ✅ **UX Moderna:** Pacientes reciben PDF en WhatsApp
4. ✅ **Tracking:** Historial completo de recetas
5. ✅ **$0 Costo:** Sin APIs de pago

---

### **🎯 Recomendación Final**

**APROBADO PARA Q2 2026** ✅

**Razones:**
1. ✅ **Legal en México** (NOM-024)
2. ✅ **$0 costo operacional**
3. ✅ **Diferenciador fuerte** vs competencia
4. ✅ **Moderniza práctica médica**
5. ✅ **No requiere permisos COFEPRIS**

**Timeline:**
- Q1 2026: Quick Wins + ICD-10 (prerequisito)
- Q2 2026: ePrescribe Fase 1 (3 semanas)

**Fases Futuras (Q3+):**
- Fase 2: Integración con farmacias (API delivery)
- Fase 3: Recetas recurrentes/crónicas
- Fase 4: Analytics de prescripciones

---

## 8. ❌ AI Scribe (RECHAZADO)

**Decisión:** NO implementar por el momento

**Razón:** "no lo necesitamos"

---

## 9. ⏳ Memberships Recurrentes (POSPUESTO)

**Decisión:** Pospuesto a Q3-Q4 2026

**Razón:** "no lo usaremos por el momento, tal vez cuando tengamos mas de 100 clinicas"

**Revisar cuando:**
- Base de clientes > 100
- Demanda clara del mercado
- Recursos de desarrollo disponibles

---

# 📋 RESUMEN EJECUTIVO FINAL

## ✅ Features Aprobadas para Implementación

### **Q1 2026 (5.8 semanas total):**
1. ✅ Service Categories & Tags (3 días)
2. ✅ Quick Phrases Library (4 días)
3. ✅ Treatment Favorites (2 días)
4. ✅ ICD-10 Integration (2 semanas)

### **Q2 2026 (7 semanas total):**
5. ✅ SOAP Notes Templates (2 semanas) - *En módulo /patients*
6. ✅ Treatment Plans (2 semanas) - *En módulo /patients*
7. ✅ ePrescribe México (3 semanas)

## ❌ Features Rechazadas/Pospuestas

1. ❌ Service Catalog rebuild - Ya existe en /treatments
2. ❌ Multi-tier Pricing - Ya cubierto por /promociones
3. ❌ AI Scribe - No necesario
4. ⏳ Memberships - Pospuesto a Q3-Q4 2026

## 💰 Costos Totales

**Desarrollo:**
- Q1: 5.8 semanas x $4,000 = **$23,200 USD**
- Q2: 7 semanas x $4,000 = **$28,000 USD**
- **Total:** $51,200 USD

**Operacional:**
- **$0/mes** (todo self-hosted)

**ROI Estimado:**
- Mejora UX inmediata (Quick Wins)
- Compliance legal (ICD-10, ePrescribe)
- Diferenciación vs SimplePractice
- $0 costos recurrentes

---

**FIN DEL ANÁLISIS DETALLADO**