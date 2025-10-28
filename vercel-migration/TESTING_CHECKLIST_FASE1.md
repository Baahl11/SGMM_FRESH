# 🧪 CHECKLIST DE TESTING - AGENDA MULTI-DOCTOR

**Fecha:** 2025-10-15  
**Versión:** FASE 1 Completada

---

## 📋 **INSTRUCCIONES**

1. Inicia el servidor de desarrollo:
   ```bash
   cd vercel-migration
   npm run dev
   ```

2. Abre el navegador en: `http://localhost:3000/agenda`

3. Marca cada ítem como ✅ cuando lo pruebes exitosamente

---

## 🎨 **1. INTERFAZ Y CARGA DE DATOS**

- [ ] **1.1** La página de agenda carga sin errores
- [ ] **1.2** Se muestran los filtros: Doctor, Consultorio, Tipo de Cita
- [ ] **1.3** Los dropdowns de filtros cargan datos correctamente
- [ ] **1.4** No hay console.errors en la consola del navegador

---

## 🎨 **2. COLORES DINÁMICOS POR DOCTOR**

- [ ] **2.1** Las citas muestran el color del doctor asignado
- [ ] **2.2** Cada doctor tiene un color único y visible
- [ ] **2.3** El color se mantiene después de editar la cita
- [ ] **2.4** El color aparece en el modal de edición (dot junto al nombre del doctor)

---

## ➕ **3. CREAR NUEVA CITA**

- [ ] **3.1** Click en un slot vacío abre el modal "Nueva Cita"
- [ ] **3.2** Modal muestra skeleton loaders mientras carga datos (debería durar ~1 segundo)
- [ ] **3.3** Fecha y hora se pre-llenan correctamente
- [ ] **3.4** Búsqueda de paciente funciona (por nombre o teléfono)
- [ ] **3.5** Botón "Nuevo" paciente muestra formulario verde
- [ ] **3.6** Seleccionar doctor muestra opciones con colores
- [ ] **3.7** Seleccionar consultorio muestra opciones con ubicación
- [ ] **3.8** Seleccionar tipo de cita muestra duración en minutos
- [ ] **3.9** Búsqueda de tratamiento funciona
- [ ] **3.10** Seleccionar estado muestra badges con colores

---

## ⚠️ **4. VALIDACIÓN DE CONFLICTOS EN VIVO**

### 4.1 Conflicto de Doctor
- [ ] **a)** Crear cita con Dr. García a las 10:00
- [ ] **b)** Intentar crear otra cita con Dr. García a las 10:00 (mismo horario)
- [ ] **c)** Debe aparecer alerta ámbar: "El doctor ya tiene una cita en este horario"
- [ ] **d)** Botón "Crear Cita" debe estar deshabilitado
- [ ] **e)** Cambiar la hora a 10:30 y la alerta debe desaparecer

### 4.2 Conflicto de Consultorio
- [ ] **a)** Crear cita con Consultorio 1 a las 11:00 (con cualquier doctor)
- [ ] **b)** Intentar crear otra cita con Consultorio 1 a las 11:00 (con otro doctor)
- [ ] **c)** Debe aparecer alerta: "El consultorio está ocupado en este horario"
- [ ] **d)** Botón deshabilitado hasta cambiar consultorio o hora

### 4.3 Conflicto de Paciente
- [ ] **a)** Crear cita con Paciente "Juan Pérez" a las 12:00
- [ ] **b)** Intentar crear otra cita con "Juan Pérez" a las 12:00
- [ ] **c)** Debe aparecer alerta: "El paciente ya tiene una cita en este horario"
- [ ] **d)** Botón deshabilitado hasta cambiar paciente o hora

### 4.4 Validación Múltiple
- [ ] **a)** Crear escenario con 2+ conflictos simultáneos
- [ ] **b)** La alerta debe listar todos los conflictos detectados
- [ ] **c)** Spinner azul "Validando disponibilidad..." aparece mientras se valida (500ms debounce)

---

## ✏️ **5. EDITAR CITA EXISTENTE**

- [ ] **5.1** Click en cita existente abre modal "Editar Cita"
- [ ] **5.2** Datos pre-cargados correctamente (paciente, doctor, consultorio, tratamiento)
- [ ] **5.3** Cambiar doctor actualiza el color de la cita
- [ ] **5.4** Cambiar consultorio se guarda correctamente
- [ ] **5.5** Cambiar tipo de cita funciona
- [ ] **5.6** Cambiar estado se refleja en la vista
- [ ] **5.7** Botón "Actualizar" guarda cambios correctamente
- [ ] **5.8** Validación de conflictos funciona también al editar (debe excluir la cita actual)

---

## 🗑️ **6. ELIMINAR CITA**

- [ ] **6.1** Botón "🗑️ Eliminar Cita" aparece solo al editar (no al crear)
- [ ] **6.2** Click en eliminar muestra confirmación
- [ ] **6.3** Confirmar elimina la cita de la agenda
- [ ] **6.4** La cita desaparece inmediatamente de la vista
- [ ] **6.5** No hay errores en consola después de eliminar

---

## 🔍 **7. FILTROS**

### 7.1 Filtro por Doctor
- [ ] **a)** Crear citas con Dr. García y Dra. López
- [ ] **b)** Filtrar por "Dr. García"
- [ ] **c)** Solo se muestran citas del Dr. García
- [ ] **d)** Cambiar a "Todos" muestra todas las citas

### 7.2 Filtro por Consultorio
- [ ] **a)** Crear citas en Consultorio 1 y Consultorio 2
- [ ] **b)** Filtrar por "Consultorio 1"
- [ ] **c)** Solo se muestran citas del Consultorio 1

### 7.3 Filtro por Tipo de Cita
- [ ] **a)** Crear citas de tipo "Consulta" y "Revisión"
- [ ] **b)** Filtrar por "Consulta"
- [ ] **c)** Solo se muestran citas tipo Consulta

### 7.4 Filtros Combinados
- [ ] **a)** Aplicar múltiples filtros simultáneamente
- [ ] **b)** Resultados coinciden con todos los filtros activos

---

## ⚡ **8. PERFORMANCE Y OPTIMIZACIÓN**

- [ ] **8.1** Las citas cargan en menos de 2 segundos
- [ ] **8.2** Los filtros responden instantáneamente
- [ ] **8.3** Modal abre sin lag
- [ ] **8.4** Validación de conflictos no bloquea la UI
- [ ] **8.5** No hay "flash" de contenido sin estilo

---

## 🎯 **9. CASOS EDGE**

- [ ] **9.1** Crear cita sin seleccionar doctor (debe permitir, doctor es opcional)
- [ ] **9.2** Crear cita sin seleccionar consultorio (debe permitir)
- [ ] **9.3** Crear cita sin seleccionar tipo (debe usar duración default 60min)
- [ ] **9.4** Buscar paciente que no existe muestra mensaje
- [ ] **9.5** Crear paciente nuevo con email vacío funciona
- [ ] **9.6** Cambiar de filtro mientras modal está abierto no rompe nada

---

## 📱 **10. RESPONSIVE (OPCIONAL)**

- [ ] **10.1** Agenda se ve bien en tablet (768px)
- [ ] **10.2** Modal se adapta a pantallas pequeñas
- [ ] **10.3** Filtros son usables en mobile

---

## ✅ **RESUMEN DE TESTING**

**Total de Tests:** 70+  
**Tests Pasados:** ___ / 70  
**Tests Fallidos:** ___ / 70  
**Bugs Encontrados:** 

---

## 🐛 **BUGS REPORTADOS**

Si encuentras algún bug, anótalo aquí con detalles:

### Bug #1
- **Descripción:**
- **Pasos para reproducir:**
- **Comportamiento esperado:**
- **Comportamiento actual:**

### Bug #2
- **Descripción:**
- **Pasos para reproducir:**
- **Comportamiento esperado:**
- **Comportamiento actual:**

---

## 🎉 **¡FELICIDADES!**

Si completaste todos los tests exitosamente, ¡la FASE 1 está 100% funcional! 🚀

**Próximos pasos:**
- PASO 2: Horarios Recurrentes
- PASO 3: Excepciones de Horario
- PASO 4: Vistas Avanzadas

---

**Probado por:** ___________  
**Fecha:** ___________  
**Resultado:** ☐ APROBADO  ☐ CON OBSERVACIONES  ☐ RECHAZADO
