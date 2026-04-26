# CONTEXTO DEL PROYECTO: AgendaMedPro AI Assistant - Estado Actual

## 📋 RESUMEN EJECUTIVO

Estoy trabajando en **AgendaMedPro**, un SaaS médico para consultorios en México (Next.js 15, Supabase, TypeScript). Actualmente implementando un **asistente de IA con Claude 3.5 Haiku** que tiene acceso completo a los datos del sistema del usuario autenticado.

**ESTADO ACTUAL:** El backend está 100% funcional con todas las integraciones de datos. Bloqueado por 1 error TypeScript en frontend que impide deployment a producción.

---

## 🎯 OBJETIVO INMEDIATO

**CRITICAL:** Resolver error TypeScript en `components/layout/main-nav.tsx` línea 204 para poder deployar a producción.

**Error:** `Property 'highlight' does not exist on type '{ href: string; label: string; active: boolean; }'`

**Contexto del error:** La línea 204 usa `route.highlight` en un operador ternario para aplicar estilos condicionales, pero la propiedad `highlight?` no existe en la definición del tipo de `routes`.

**Fix necesario:** Agregar `highlight?: boolean` a la definición de tipo del array `routes` (actualmente en línea ~113).

---

## ✅ LO QUE YA FUNCIONA (Completado exitosamente)

### 1. AI Assistant Backend (`app/api/chat/route.ts`)
- ✅ Edge runtime para performance
- ✅ Claude 3.5 Haiku via Anthropic SDK
- ✅ **Autenticación:** Extrae user_id del Bearer token
- ✅ **6 Fuentes de datos integradas** (todas filtradas por user_id):
  - `appointments` (fecha_hora, duracion_minutos, estado, precio_acordado)
  - `treatments` (nombre, precio, duracion_minutos, categoria)
  - `inventory_items` (nombre, cantidad_actual, stock_minimo, precio_unitario)
  - `gastos_fijos` (concepto, monto, frecuencia)
  - `gastos_variables` (concepto, monto, categoria, fecha)
  - `patients` (nombre, apellido, telefono, email)
- ✅ Context injection vía `[DATOS DEL SISTEMA]` en mensaje
- ✅ Rate limiting: 20 mensajes/hora por usuario
- ✅ Manejo correcto de timezones (UTC-6 México)
- ✅ Todas las columnas de BD mapeadas correctamente

### 2. Frontend Chat (`components/ai-chat.tsx`)
- ✅ Obtiene sesión Supabase
- ✅ Envía Authorization header con Bearer token
- ✅ Streaming de respuestas

### 3. Queries Verificadas por Usuario
```typescript
// Usuario confirmó: "tenemos 7 tratamientos"
const { data: treatments } = await supabase
  .from('treatments')
  .select('*')
  .eq('user_id', authenticatedUser.id);

// Inventario usando tabla correcta
const { data: inventory } = await supabase
  .from('inventory_items')  // ← Corregido de 'inventory'
  .select('*')
  .eq('user_id', authenticatedUser.id);
```

---

## 🚨 BLOQUEADOR ACTUAL

### Error TypeScript Pendiente
**Archivo:** `components/layout/main-nav.tsx`
**Línea:** 204
**Error:** `Property 'highlight' does not exist on type`

**Código problemático:**
```typescript
// Línea ~113 - Definición actual (sin tipo explícito)
const routes = [
  { href: "/dashboard", label: "Dashboard", active: pathname === "/dashboard" },
  { href: "/agenda", label: "Agenda", active: pathname === "/agenda" },
  // ... más rutas
];

// Línea 204 - Uso del highlight
className={cn(
  route.active
    ? "bg-white text-slate-900"
    : route.highlight  // ← ERROR: property doesn't exist
    ? "bg-gradient-to-r from-blue-500/20..."
    : "text-white/70 hover:bg-white/10"
)}
```

**Fix requerido:**
```typescript
const routes: Array<{
  href: string;
  label: string;
  active: boolean;
  highlight?: boolean;  // ← Agregar esto
}> = [
  // ... definiciones existentes
];
```

---

## 🚀 PLAN MAESTRO DE IA (Roadmap Futuro)

Ver archivo completo: `vercel-migration/AGENTS.md` (2234 líneas)

### Visión: Transformar AgendaMedPro en AaaS (Agents-as-a-Service)

**De:** SaaS tradicional donde doctor ingresa todo manualmente
**A:** Plataforma con agentes autónomos que ejecutan tareas médico-administrativas

### Quick Wins Planificados (Post-Deploy)

1. **Chat Assistant** ✅ (EN PROGRESO - backend listo)
   - Consulta natural a todos los datos
   - Respuestas contextuales con datos reales del usuario
   - ROI: Diferenciador vs competencia

2. **Agente de Recordatorios** (6 semanas)
   - Envío automático WhatsApp 24h/2h antes
   - Reduce no-shows 40%
   - Tools: `send_whatsapp_reminder(appointmentId, template)`

3. **Agente Facturador** (8 semanas)
   - Generación automática CFDI 4.0
   - Envío por email/WhatsApp
   - Tools: `generate_invoice(appointmentId, fiscalData)`

### Arquitectura Futura (del AGENTS.md)

```typescript
// Base para todos los agentes médicos
abstract class MedicalAgent {
  constructor(
    protected anthropic: Anthropic,
    protected supabase: SupabaseClient,
    protected memory: AgentMemory  // Aprende de interacciones
  ) {}
  
  abstract async execute(task: MedicalTask): Promise<TaskResult>;
}

// MCP Server (Model Context Protocol)
// Expone herramientas a Claude:
// - get_appointments(filters)
// - create_appointment(data)
// - send_whatsapp_reminder(id)
// - generate_invoice(id)
// - get_analytics(metric, period)
```

**Stack Planificado:**
- LLM: Claude 3.5 Sonnet (razonamiento complejo)
- Orquestación: Temporal.io (workflows durables)
- MCP: @modelcontextprotocol/sdk
- Vector DB: Supabase pgvector (memoria semántica)
- Queue: Redis + BullMQ (jobs asíncronos)

### Métricas de Éxito
- Ahorro: 15-20 horas/semana por consultorio
- Reducción no-shows: 40%
- Facturación: De 30% a 80% de consultas
- Precio premium: $999-1,999 MXN/mes (vs $399 plan básico)

---

## 📊 ESQUEMA DE BASE DE DATOS (Supabase PostgreSQL)

### Tablas Principales y Columnas Correctas

```sql
-- appointments (citas)
appointments (
  id, user_id, patient_id,
  fecha_hora,              -- ← NOT start_time
  duracion_minutos,        -- ← NOT end_time (calculado)
  estado,                  -- ← NOT status ('scheduled'|'confirmed'|'completed')
  precio_acordado,         -- ← NOT price
  notas, recordatorio_enviado
)

-- treatments (tratamientos)
treatments (
  id, user_id,
  nombre,                  -- algunos tienen 'name' también
  precio,                  -- algunos tienen 'price' también
  duracion_minutos,
  categoria,
  descripcion
)

-- inventory_items (inventario)
inventory_items (         -- ← NOT 'inventory' table
  id, user_id,
  nombre, categoria,
  cantidad_actual,
  stock_minimo,
  precio_unitario,
  unidad
)

-- gastos_fijos (gastos recurrentes)
gastos_fijos (
  id, user_id,
  concepto,
  monto,
  frecuencia,              -- 'mensual'|'trimestral'|'anual'
  dia_pago,
  activo
)

-- gastos_variables (gastos extraordinarios)
gastos_variables (
  id, user_id,
  concepto,
  monto,
  categoria,               -- 'reparacion'|'mantenimiento'|'compras_equipo'|etc
  fecha,
  deleted_at
)

-- patients (pacientes)
patients (
  id, user_id,
  nombre, apellido,
  telefono, email,
  fecha_nacimiento
)
```

**Join syntax Supabase:**
```typescript
// Con alias (recomendado para claridad)
.select('*, patient:patients(nombre, apellido)')

// Sin alias (usa nombre de tabla)
.select('*, patients(nombre)')
```

---

## 🛠️ COMANDOS ÚTILES

```powershell
# Deploy a producción (después de fix TypeScript)
cd c:\Users\gm_me\SGMM_FRESH\vercel-migration
npx vercel --prod

# Verificar errores TypeScript localmente
npx tsc --noEmit

# Ver logs en tiempo real (Vercel)
vercel logs agendamedpro.com --follow

# Test local del AI endpoint
curl http://localhost:3000/api/chat -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"messages":[{"role":"user","content":"¿cuántas citas tenemos mañana?"}]}'
```

---

## 📝 PRÓXIMOS PASOS (En Orden)

1. **INMEDIATO:** Arreglar error TypeScript en main-nav.tsx línea 204
2. **INMEDIATO:** Deploy a producción con `npx vercel --prod`
3. **TESTING:** Usuario prueba todas las queries de IA:
   - ✅ "¿cuántos tratamientos tenemos?" (ya confirmado: 7)
   - ⏳ "¿cuántos items en inventario? ¿alguno bajo en stock?"
   - ⏳ "¿cuánto gastamos en fijos al mes?"
   - ⏳ "¿cuántos pacientes registrados?"
   - ⏳ "¿cuántas citas hay mañana?" (debería funcionar ahora)
4. **OPTIMIZACIÓN:** Ajustar system prompts según feedback
5. **FASE 2:** Implementar agente de recordatorios automáticos

---

## ⚠️ ERRORES COMUNES Y SOLUCIONES

### 1. "column appointments.start_time does not exist"
**Causa:** Usar nombres incorrectos de columnas
**Fix:** Usar `fecha_hora`, `duracion_minutos`, `estado`, `precio_acordado`

### 2. "relation 'inventory' does not exist"
**Causa:** Nombre de tabla incorrecto
**Fix:** Usar `inventory_items` (con underscore y plural)

### 3. AI responde "no hay datos" pero sí existen
**Causa:** Falta filtro por user_id
**Fix:** Todas las queries deben tener `.eq('user_id', authenticatedUser.id)`

### 4. Fechas incorrectas (off by 1 day)
**Causa:** Doble conversión de timezone
**Fix:** Fechas en BD ya están en UTC-6, no convertir nuevamente

---

## 🎯 SOLICITUD PARA ESTE CHAT

**Por favor ayúdame a:**
1. Arreglar el error TypeScript de `route.highlight` en main-nav.tsx
2. Verificar que no haya otros errores de compilación
3. Deployar exitosamente a producción
4. (Opcional) Revisar si hay optimizaciones obvias en el AI prompt

**Prioridad:** CRÍTICA - Usuario esperando deploy desde hace varias horas, múltiples intentos fallidos por este error.

---

## 📂 ESTRUCTURA DEL PROYECTO

```
vercel-migration/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          ← AI Assistant Backend (477 líneas) ✅
│   ├── reports/
│   │   └── page.tsx              ← Reports Dashboard ✅
│   └── ...
├── components/
│   ├── ai-chat.tsx               ← Chat UI Component ✅
│   └── layout/
│       └── main-nav.tsx          ← ERROR AQUÍ ⛔ línea 204
├── backend/                      ← Python scripts (migrations, etc)
├── AGENTS.md                     ← Plan maestro de IA (2234 líneas)
└── package.json
```

---

## 🔑 CONTEXTO CLAVE PARA DEBUGGING

### Historial de Fixes Previos (6 iteraciones)

**Iteración 1:** Detección de "mañana" con regex
**Iteración 2:** Fix timezone UTC-6 para México
**Iteración 3:** Fix corrupción de código (28 lint errors)
**Iteración 4:** Fix Supabase join syntax (`patient:patients`)
**Iteración 5:** Fix columnas BD (`fecha_hora`, `estado`, `precio_acordado`)
**Iteración 6:** Fix tabla inventory → `inventory_items`

### Usuario confirmó funcionamiento:
- ✅ Query de tratamientos: "tenemos 7 tratamientos"
- ⏳ Queries de inventario, gastos, pacientes pendientes de probar post-deploy

### Vercel Deployment:
- Dominio: agendamedpro.com
- Framework: Next.js 15 (App Router)
- Deploy command: `npx vercel --prod`
- Build command: `next build`
- **Status actual:** Exit Code 1 (TypeScript compilation failed)

---

**NOTA IMPORTANTE:** El sistema de IA está COMPLETAMENTE FUNCIONAL en el backend. Solo necesitamos resolver este último error TypeScript para poder deployar y que el usuario pueda probarlo en producción.
