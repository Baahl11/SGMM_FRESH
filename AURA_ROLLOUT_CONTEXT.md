# CONTEXTO DEL PROYECTO - Rollout Estilo Aura (SGMM_FRESH)

## Stack Técnico
- **Framework**: Next.js 14+ App Router (`app/` directory)
- **Auth**: Supabase client-side (`createClient` from `@/lib/supabase/client`)
- **UI Base**: shadcn/ui components + custom Aura glassmorphism theme
- **Routing**: cada página usa `useRouter()` de `next/navigation` y redirección a `/auth/signin` si no hay usuario
- **Componentes clave**:
  - `AppLayout` wrapper (provee shell global con nav glass)
  - `GlassPanel` (`@/components/ui/glass-panel`) - panel glassmorphico base
  - `Button`, `Input`, `Label`, `Select` de `@/components/ui/*`
  - Lucide React para iconografía

## Configuración de Estilos Aura (app/globals.css)

### Variables CSS raíz:
```css
--surface-night: #020617;
--surface-card: rgba(255, 255, 255, 0.02);
--glass-border: rgba(226, 232, 240, 0.15);
--glass-shadow: 0 30px 120px rgba(2, 6, 23, 0.45);
```

### Clases utilitarias clave:
- `.glass-panel` - panel glassmorphico base (32px radius, backdrop blur)
- `.glass-select` - select inputs con fondo glass y pill shape
- `.glass-chip` - badges/tags pequeños con fondo semitransparente
- `.aura-cta` - botón base (dark glass, hover lift)
- `.aura-cta--primary` - botón primario (gradiente cyan→purple, texto oscuro)
- `.aura-cta--ghost` - botón secundario (borde blanco, fondo dark glass)

### Gradientes de fondo hero estándar:
```tsx
<div className="pointer-events-none absolute inset-0 opacity-60">
  <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-[COLOR]/30 blur-[140px]" />
  <div className="absolute -bottom-40 left-0 h-72 w-72 rounded-full bg-[COLOR2]/30 blur-[160px]" />
</div>
```

## Patrón de Restyle Aplicado (5 páginas completadas)

### Estructura común de cada página:
1. **Imports actualizados**:
   ```tsx
   import { GlassPanel } from "@/components/ui/glass-panel";
   import { Button } from "@/components/ui/button";
   import { Input } from "@/components/ui/input";
   import { cn } from "@/lib/utils";
   ```

2. **Hero GlassPanel** con:
   - Gradientes de fondo específicos del módulo
   - Badge superior con icono + label (`border-white/15 bg-white/10`)
   - Icono grande en rounded-2xl con gradiente
   - Título + descripción en `text-white`
   - Grid de métricas (2-4 stats) en cards pequeños (`border-white/20 bg-white/10`)
   - CTAs con `.aura-cta--primary` y `.aura-cta--ghost`

3. **Filtros/Controles** (si aplica):
   - Otro GlassPanel con inputs/selects
   - Clase `.glass-select` para dropdowns nativos
   - `.glass-chip` para categorías/tags clickeables

4. **Estados especiales**:
   - **Loading**: `<div className="text-white/70"><spinner className="border-emerald-300" />Cargando...</div>`
   - **Error**: `<GlassPanel className="border-rose-400/30 bg-rose-500/10 text-rose-50">`
   - **Empty**: `<GlassPanel className="text-white/70 text-center py-16">` con icono + CTA

5. **Lista/Grid de items**:
   - Grid responsive (`lg:grid-cols-2 xl:grid-cols-3`)
   - Cada card es `<GlassPanel className="space-y-5 p-5 text-white">`
   - Badges de status con `border-[color]/40 bg-[color]/15`
   - Botones inline con `variant="ghost" className="rounded-full border-white/20 bg-white/5 text-white"`

6. **Modales/Dialogs**:
   - Overlay `bg-black/70 z-50`
   - Contenido en `<GlassPanel className="border-white/20 text-white">`
   - Inputs con `border-white/20 bg-white/5 text-white placeholder:text-white/40`

### Formateo de moneda consistente:
```tsx
const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0 // o 2 según página
});
const formatCurrency = (value?: number) => currencyFormatter.format(value ?? 0);
```

## Páginas YA Completadas ✅

1. **app/bookings/page.tsx**
   - Hero: gradientes emerald/indigo
   - Stats: total, pending, confirmed, completed, cancelled, today
   - Grid de booking cards con status badges (pending=amber, confirmed=emerald, etc.)
   - Filtros con `.glass-select` (estado + fecha)

2. **app/patients/page.tsx**
   - Hero: gradientes cyan/violet
   - Stats implícitas en count de pacientes filtrados
   - Filtros: search Input + Select de ordenamiento
   - Grid de patient cards con avatar gradiente, tags display, acciones inline

3. **app/treatments/page.tsx**
   - Hero: gradientes emerald/indigo
   - Stats: activos, ticket promedio, margen %, premium count
   - Filtros: category chips + tag search Input
   - Grid de treatment cards con precio/costo/margen en mini-cards
   - CategoryBadgeList + TagsDisplay con overrides para fondo oscuro

4. **app/promotions/page.tsx**
   - Hero: gradientes fuchsia/violet
   - Stats: total promociones, avg discount %, total savings
   - Grid (lg:2 cols) de promotion cards
   - Muestra tratamientos como `.glass-chip`, pricing normal/promo/ahorro

5. **app/inventory/page.tsx**
   - Hero: gradientes amber/orange
   - Stats: items, valor total MXN, stock bajo, categorías
   - Alert ribbon si hay low stock (amber GlassPanel)
   - Grid (xl:3 cols) de inventory cards con:
     - Stock progress bar (emerald/amber/rose según nivel)
     - Precio unitario + valor total
     - Botones Detalle/Editar/Eliminar
   - Modal CRUD en GlassPanel flotante

## Páginas PENDIENTES ❌

### 8. Mensajería (page.tsx o similar)
- **Buscar archivo**: puede estar en `app/mensajes/`, `app/whatsapp/`, `app/messaging/`
- **Hero sugerido**: gradientes green/teal (WhatsApp theme)
- **Stats esperadas**: mensajes enviados, plantillas activas, tasa entrega
- **Componentes**: lista de conversaciones o plantillas en glass cards

### 9. Gastos Fijos (page.tsx o page.tsx)
- **Hero sugerido**: gradientes red/orange (finanzas)
- **Stats esperadas**: total mensual, categorías, próximo vencimiento
- **Componentes**: tabla o cards de gastos recurrentes

### 10. Reportes (page.tsx o page.tsx)
- **Hero sugerido**: gradientes indigo/purple (analytics)
- **Stats esperadas**: ingresos período, top tratamiento, pacientes activos
- **Componentes**: gráficas + export buttons, date range pickers

### 11. Validación final
- Verificar que NO queden componentes `<Card>` legacy con `bg-white`
- Confirmar que todos los modales usan GlassPanel
- Revisar responsive en mobile (tailwind breakpoints `sm:` `md:` `lg:`)
- Asegurar que Loading states usan spinner emerald sobre fondo oscuro

## Reglas de Edición Críticas

1. **NUNCA tocar lógica de negocio**: solo cambiar markup/clases, mantener `fetch()`, `useState`, handlers intactos
2. **Importar siempre `cn` de `@/lib/utils`** para merge condicional de clases
3. **Mantener auth flow**: `useEffect` con `getUser()` y redirect si no user
4. **Usar `useMemo` para stats** derivadas de arrays grandes
5. **Preservar accesibilidad**: `aria-label`, `htmlFor` en Labels
6. **No crear archivos nuevos** a menos que el módulo no exista

## Instrucciones para Nuevo Chat

**Objetivo**: Completar el rollout Aura en las 3-4 páginas pendientes (Mensajería, Gastos, Reportes) + validación final.

**Primera acción**: 
1. Buscar archivo de Mensajería con `file_search` o `grep_search`
2. Leer contenido completo
3. Aplicar patrón Aura exacto (hero + stats + filtros + grid + modales)
4. Continuar con Gastos y Reportes
5. Hacer grep final de `bg-white` en `app/**/*.tsx` para detectar legacy cards
6. Generar resumen de cambios

**Contexto de continuidad**: Este chat terminó después de completar Inventario. El usuario quiere mantener la coherencia visual total del sistema con el mismo lenguaje glass/aura en TODAS las pestañas operativas.

---

## Ejemplo Completo de Transformación

### ANTES (Legacy Card)
```tsx
<Card className="p-6 bg-white shadow-md">
  <CardHeader>
    <CardTitle>Paciente</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-gray-600">{patient.name}</p>
    <Button variant="default">Ver detalles</Button>
  </CardContent>
</Card>
```

### DESPUÉS (Aura GlassPanel)
```tsx
<GlassPanel className="space-y-5 p-5 text-white">
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500">
      <User className="h-6 w-6 text-white" />
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-white">{patient.name}</h3>
      <p className="text-sm text-white/60">{patient.email}</p>
    </div>
  </div>
  <Button 
    variant="ghost" 
    className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
  >
    Ver detalles
  </Button>
</GlassPanel>
```

## Colores de Gradiente por Módulo (Paleta Estándar)

- **Bookings/Citas**: `emerald-400` / `indigo-500`
- **Patients/Pacientes**: `cyan-400` / `violet-500`
- **Treatments/Tratamientos**: `emerald-400` / `indigo-500`
- **Promotions/Promociones**: `fuchsia-400` / `violet-500`
- **Inventory/Inventario**: `amber-400` / `orange-500`
- **Messaging/Mensajería**: `green-400` / `teal-500`
- **Expenses/Gastos**: `red-400` / `orange-500`
- **Reports/Reportes**: `indigo-400` / `purple-500`

## Status Badge Colors (Consistente en todo el sistema)

```tsx
// Citas/Bookings
pending: "border-amber-400/40 bg-amber-500/15 text-amber-200"
confirmed: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
completed: "border-blue-400/40 bg-blue-500/15 text-blue-200"
cancelled: "border-rose-400/40 bg-rose-500/15 text-rose-200"

// Inventario Stock Levels
high: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
medium: "border-amber-400/40 bg-amber-500/15 text-amber-200"
low: "border-rose-400/40 bg-rose-500/15 text-rose-200"

// Genéricos
active: "border-green-400/40 bg-green-500/15 text-green-200"
inactive: "border-gray-400/40 bg-gray-500/15 text-gray-200"
warning: "border-orange-400/40 bg-orange-500/15 text-orange-200"
```

## Checklist Final Pre-Deploy

- [ ] Todas las páginas principales usan GlassPanel
- [ ] Ningún componente legacy `<Card>` con `bg-white`
- [ ] Todos los botones principales usan `.aura-cta--primary` o `.aura-cta--ghost`
- [ ] Loading states consistentes con spinner emerald
- [ ] Modales con overlay `bg-black/70` y GlassPanel content
- [ ] Responsive verificado en mobile/tablet (Chrome DevTools)
- [ ] Accesibilidad: labels, aria-labels, keyboard navigation
- [ ] Performance: useMemo para cálculos pesados, evitar re-renders innecesarios
