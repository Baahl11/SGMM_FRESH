# 🎯 CÓMO ACCEDER A LOS FORMULARIOS DE ADMISIÓN

## ✅ Accesos Implementados

Ahora hay **3 formas** de acceder al sistema de formularios:

---

## 1️⃣ **Desde el Menú de Navegación Principal**

En la barra de navegación superior, ahora verás:

```
Dashboard | Agenda | Reservas | Pacientes | Tratamientos | Promociones | Inventario | [FORMULARIOS] | Mensajería | Gastos Fijos | Reportes
```

**Clic en "Formularios"** → Te lleva directamente a `/dashboard/settings/forms`

---

## 2️⃣ **Desde el Dashboard Principal**

En la página principal del dashboard (`/dashboard`), encontrarás una **card destacada** con gradiente morado-azul:

### 📋 **Formularios de Admisión**
- Color: Gradiente purple → indigo → blue
- Ubicación: Junto a las cards de "Analytics" y "Historial de Notificaciones"
- Features visible:
  - ✅ Form Builder
  - 🎯 Templates
  - 📊 Tracking

**Clic en la card** → Te lleva a `/dashboard/settings/forms`

---

## 3️⃣ **Desde Configuración (Settings)**

1. Ve a cualquier sección de configuración:
   - `/dashboard/settings/doctors`
   - `/dashboard/settings/consultorios`
   - `/dashboard/settings/appointment-types`
   - etc.

2. En el **sidebar izquierdo**, verás la lista de opciones

3. La última opción es:
   ```
   📄 Formularios
   Formularios de admisión
   ```

**Clic en "Formularios"** → Te lleva a `/dashboard/settings/forms`

---

## 🗺️ Navegación Completa Una Vez Dentro

### Página Principal: `/dashboard/settings/forms`
Desde aquí puedes:
- ✅ Ver todos tus formularios (grid de cards)
- 📊 Ver stats (Total, Activos, Templates)
- 🔍 Buscar formularios
- ➕ **Crear Formulario** (botón azul arriba a la derecha)
- 👁️ Ver respuestas de cada formulario
- ✏️ Editar formulario existente
- 📋 Duplicar formulario
- 🗑️ Eliminar formulario

### Crear/Editar: `/dashboard/settings/forms/[id]` o `/dashboard/settings/forms/new`
- 🎨 Form Builder visual con drag-and-drop
- ➕ Agregar campos de 9 tipos diferentes
- 🔄 Reordenar campos arrastrando
- ⚙️ Configurar firma digital y archivos
- 💾 Guardar cambios

### Ver Respuestas: `/dashboard/settings/forms/[id]/submissions`
- 📥 Grid con todas las respuestas recibidas
- 📊 Stats por estado (Nuevas, Revisadas, Aprobadas)
- 🔍 Buscar por nombre de paciente
- 👁️ Click en card para ver detalles completos
- ✅ Cambiar estado: submitted → reviewed → approved/rejected

---

## 🎨 Diseño Visual de los Accesos

### **Menu Principal**
```
[Formularios] <- Link con hover azul, activo cuando estás en /dashboard/settings/forms
```

### **Card en Dashboard**
```
┌─────────────────────────────────────────────┐
│  📄  Formularios de Admisión            ↗  │
│                                              │
│  Crea formularios personalizados y          │
│  envíalos a tus pacientes por               │
│  WhatsApp o Email                           │
│                                              │
│  ✓ Form Builder  🎯 Templates  📊 Tracking │
└─────────────────────────────────────────────┘
   Gradiente: Purple → Indigo → Blue
```

### **Sidebar en Settings**
```
🩺 Doctores
🏥 Consultorios
📅 Tipos de Cita
🕐 Horarios
❌ Excepciones
🌐 Reservas Online
📧 Notificaciones
📄 Formularios  ← NUEVA
```

---

## 🚀 Flujo de Uso Completo

### Para el Doctor:
1. **Accede** por cualquiera de las 3 rutas
2. **Crea** un formulario con el Form Builder
3. **Configura** campos, firma, archivos
4. **Guarda** el formulario
5. Desde la lista, **click en "Ver"** para ver submissions
6. O **envía** el formulario a un paciente (próxima feature)

### Para el Paciente:
1. Recibe link por WhatsApp/Email: `https://app.com/public/forms/TOKEN`
2. Abre el link en cualquier dispositivo
3. Completa el formulario
4. Firma (si requerido)
5. Envía respuestas
6. Ve confirmación de éxito

### De vuelta al Doctor:
1. Ve notificación de nueva respuesta (futuro)
2. Accede a `/dashboard/settings/forms/[id]/submissions`
3. Revisa todas las respuestas
4. Click en card del paciente
5. Ve modal con detalles completos
6. Marca como revisado/aprobado

---

## 📍 URLs Directas

Si quieres acceder directamente por URL:

```
✅ Lista de formularios:
   /dashboard/settings/forms

✅ Crear nuevo formulario:
   /dashboard/settings/forms/new

✅ Editar formulario existente:
   /dashboard/settings/forms/[ID_DEL_FORMULARIO]

✅ Ver respuestas de un formulario:
   /dashboard/settings/forms/[ID_DEL_FORMULARIO]/submissions

✅ Formulario público (para pacientes):
   /public/forms/[TOKEN_GENERADO]
```

---

## 🎯 Siguiente Paso Recomendado

**Prueba el sistema:**

1. **Accede** por el menú principal → "Formularios"
2. **Crea** tu primer formulario:
   - Click en "Crear Formulario"
   - Nombre: "Prueba de Admisión"
   - Agrega 3-4 campos
   - Activa firma digital
   - Guarda
3. **Genera** un token de prueba (en el código o API)
4. **Abre** el link público en incógnito
5. **Completa** el formulario como si fueras paciente
6. **Regresa** al dashboard
7. **Revisa** la respuesta recibida

---

## ✨ Características Visuales

- 🎨 **Animaciones suaves** con Framer Motion
- 🌙 **Dark mode** completo en todas las páginas
- 📱 **100% responsive** (funciona en celular)
- 🎨 **Gradientes modernos** en cards y botones
- ⚡ **Hover effects** en todos los elementos interactivos
- 📊 **Stats en tiempo real** actualizados automáticamente

---

**¡Listo!** Ahora los formularios son completamente accesibles desde múltiples puntos de la aplicación. 🎉
