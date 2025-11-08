# 🎛️ Arquitectura de Configuración - AgendaMedPro

## 📍 Dos Niveles de Configuración

### 1️⃣ Modal de Configuración Rápida (Agenda)
**Ubicación:** Botón "⚙️ Configuración" en `/agenda`  
**Propósito:** Configuraciones rápidas y toggles de funcionalidades  
**Tipo:** Modal (overlay)

#### Características que van aquí:
✅ **Tab General:**
- Buffer Time entre citas
- Lista de Espera Automática
- Drag & Drop en móviles
- Bloqueo de reservas anticipadas

✅ **Tab Integraciones:**
- Google Calendar sync
- Zoom/Meet links automáticos (futuro)

✅ **Tab Notificaciones:**
- SMS Recordatorios (con credenciales)
- Email Recordatorios
- WhatsApp (futuro)

**Características:**
- ⚡ Rápido acceso sin salir de la agenda
- 🎚️ Toggles simples on/off
- 💾 Se guarda en localStorage + DB
- 🔄 Cambios inmediatos

---

### 2️⃣ Configuración Completa (Dashboard Settings)
**Ubicación:** `/dashboard/settings/doctors` (y otras subrutas)  
**Propósito:** Configuraciones profundas que requieren formularios  
**Tipo:** Página completa

#### Características que van aquí:
✅ **Doctores** (`/dashboard/settings/doctors`)
- Agregar/editar doctores
- Horarios de cada doctor
- Especialidades
- Días de trabajo
- Excepciones (vacaciones, días libres)

✅ **Consultorios** (`/dashboard/settings/locations`)
- Agregar/editar consultorios
- Direcciones
- Teléfonos
- Horarios por consultorio

✅ **Tipos de Cita** (`/dashboard/settings/appointment-types`)
- Nombres de tipos de cita
- Duración por defecto
- Colores
- Precios

✅ **Perfil** (`/dashboard/settings/profile`)
- Información del usuario
- Email, teléfono
- Foto de perfil
- Configuración de cuenta

✅ **Suscripción** (`/dashboard/settings/subscription`)
- Plan actual
- Facturación
- Historial de pagos

**Características:**
- 📋 Formularios complejos
- 🗂️ CRUD completo (Create, Read, Update, Delete)
- 💳 Integraciones con servicios externos
- 🔐 Configuraciones de seguridad

---

## 🔗 Conexión entre ambos sistemas

### Botón "Configurar Doctores" en el Modal
```tsx
<Button onClick={goToFullSettings}>
  <Users /> Configurar Doctores <ExternalLink />
</Button>
```

**Flujo:**
1. Usuario está en `/agenda`
2. Clic en "⚙️ Configuración" → Abre modal
3. Ve el botón "Configurar Doctores" en el header
4. Clic → Cierra modal → Navega a `/dashboard/settings/doctors`
5. Hace cambios profundos (agrega doctor, configura horarios)
6. Vuelve a `/agenda` → Los cambios ya están reflejados

---

## 📊 Comparación

| Aspecto | Modal Config Agenda | Dashboard Settings |
|---------|-------------------|-------------------|
| **Acceso** | Botón en Agenda | Menú lateral o directo |
| **Velocidad** | ⚡ Instantáneo | 🔄 Cambio de página |
| **Complejidad** | Simple (toggles) | Compleja (formularios) |
| **Persistencia** | localStorage + DB | Base de datos |
| **Ámbito** | Features de agenda | Entidades del sistema |
| **UI** | Overlay/Modal | Página completa |

---

## 🎯 Solución al Problema del Dropdown de Doctores

### Problema identificado:
El dropdown de doctores en `/agenda` no carga los doctores de `/dashboard/settings/doctors`

### Causa:
Los doctores se configuran en la tabla de base de datos, pero el componente de agenda busca en otra fuente o no está conectado correctamente.

### Solución:

#### Paso 1: Verificar endpoint API
```typescript
// app/api/doctors/route.ts
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: doctors } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', user.id)
    .order('name');
  
  return NextResponse.json(doctors);
}
```

#### Paso 2: Hook para cargar doctores
```typescript
// hooks/use-doctors.ts
export function useDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/doctors')
      .then(r => r.json())
      .then(setDoctors)
      .finally(() => setLoading(false));
  }, []);
  
  return { doctors, loading };
}
```

#### Paso 3: Usar en el dropdown
```tsx
// En el componente de filtros de agenda
const { doctors } = useDoctors();

<Select>
  {doctors.map(doctor => (
    <SelectItem key={doctor.id} value={doctor.id}>
      {doctor.name}
    </SelectItem>
  ))}
</Select>
```

---

## 🚀 Mejoras Futuras

### Modal de Config Agenda
- [ ] Preview en vivo de cambios
- [ ] Reset a valores por defecto
- [ ] Exportar/importar configuración
- [ ] Templates de configuración

### Dashboard Settings
- [ ] Wizard de configuración inicial
- [ ] Validación en tiempo real
- [ ] Historial de cambios
- [ ] Permisos por rol (admin vs user)

---

## 📝 Recomendaciones de UX

1. **Mantener ambos sistemas** - Cada uno tiene su propósito
2. **Conexión clara** - Botón visible para ir a config completa
3. **Breadcrumbs** - Mostrar dónde está el usuario
4. **Tooltips** - Explicar qué hace cada configuración
5. **Feedback inmediato** - Mostrar cuando se guardan cambios

---

## 🔍 Debugging

### Si el dropdown de doctores está vacío:

1. **Verificar API:**
   ```bash
   curl https://agendamedpro.com/api/doctors
   ```

2. **Verificar tabla:**
   ```sql
   SELECT * FROM doctors WHERE user_id = 'xxx';
   ```

3. **Console del navegador:**
   ```javascript
   fetch('/api/doctors').then(r => r.json()).then(console.log)
   ```

4. **Verificar RLS (Row Level Security):**
   ```sql
   -- ¿El usuario tiene permisos para ver doctores?
   SELECT * FROM doctors; -- Si retorna vacío, problema de RLS
   ```

---

## ✅ Checklist de Implementación

- [x] Modal de configuración con 3 tabs
- [x] Botón "Configurar Doctores" en modal
- [x] Navegación a `/dashboard/settings/doctors`
- [ ] Conectar dropdown de doctores con API
- [ ] Hook `useDoctors()` para cargar doctores
- [ ] Verificar que doctores se guardan correctamente
- [ ] Testing: Agregar doctor → Ver en dropdown

---

Esta arquitectura permite:
- ✅ Configuración rápida sin salir de la agenda
- ✅ Configuración profunda cuando se necesita
- ✅ Separación clara de responsabilidades
- ✅ Mejor UX para diferentes tipos de tareas
