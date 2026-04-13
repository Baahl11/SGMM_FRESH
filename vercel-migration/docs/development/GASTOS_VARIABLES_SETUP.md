# 📋 Checklist: Configuración de Supabase para Gastos Variables

## ⚡ Resumen Ejecutivo

Hemos creado todo el backend para el módulo de **Gastos Variables**. Ahora necesitas ejecutar 2 migraciones SQL en tu proyecto de Supabase para activar la funcionalidad.

---

## ✅ Paso 1: Crear Tabla `variable_expenses`

### Opción A: Supabase Dashboard (Recomendado)

1. **Abre el SQL Editor de Supabase:**
   ```
   https://supabase.com/dashboard/project/bpxppzgsgwjlqaykxgmb/sql/new
   ```

2. **Copia y pega el contenido del archivo:**
   ```
   vercel-migration/supabase/migrations/20251110_create_variable_expenses.sql
   ```

3. **Haz clic en "RUN"**

4. **Verifica el mensaje de éxito:**
   ```
   ✅ Migration completed successfully: variable_expenses table created
   ```

### Opción B: Supabase CLI

```bash
cd vercel-migration
supabase db push
```

### ¿Qué crea esta migración?

- ✅ Tabla `variable_expenses` con 20+ columnas
- ✅ 7 índices optimizados para búsqueda rápida
- ✅ RLS (Row Level Security) habilitado
- ✅ 4 policies de seguridad (cada usuario solo ve sus gastos)
- ✅ Trigger automático para `updated_at`
- ✅ Soft delete (los registros nunca se borran físicamente)
- ✅ Validaciones de datos (categorías, estados, montos)

---

## ✅ Paso 2: Crear Bucket de Storage `gastos-facturas`

### Opción A: Supabase Dashboard (Recomendado)

1. **Ve a Storage:**
   ```
   https://supabase.com/dashboard/project/bpxppzgsgwjlqaykxgmb/storage/buckets
   ```

2. **Haz clic en "New Bucket"**

3. **Configura el bucket:**
   ```
   Nombre: gastos-facturas
   Público: ✓ SÍ (habilitado)
   File size limit: 10485760 (10MB)
   Allowed MIME types:
     - application/pdf
     - image/jpeg
     - image/png
     - image/webp
   ```

4. **Guarda**

5. **Configura RLS Policies:**

   Ve a la pestaña "Policies" del bucket y ejecuta:
   
   ```sql
   -- Abrir SQL Editor y pegar contenido de:
   vercel-migration/supabase/storage/setup-gastos-facturas-bucket.sql
   ```

### Opción B: SQL Manual

1. Abre SQL Editor
2. Copia y pega: `vercel-migration/supabase/storage/setup-gastos-facturas-bucket.sql`
3. Ejecuta

---

## 🧪 Paso 3: Verificar Instalación

### Verificar Tabla

Ejecuta en SQL Editor:

```sql
-- Ver estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'variable_expenses';

-- Ver policies de RLS
SELECT * FROM pg_policies WHERE tablename = 'variable_expenses';
```

**Resultado esperado:** ~20 columnas, 4 policies

### Verificar Bucket

1. Ve a Storage → gastos-facturas
2. Debería aparecer vacío (sin archivos)
3. Intenta subir un archivo de prueba manualmente

---

## 📡 APIs Creadas (Ya funcionando)

Una vez ejecutadas las migraciones, estas APIs estarán disponibles:

### **GET /api/gastos-variables**
Lista todos los gastos variables del usuario.

**Filtros disponibles:**
- `?categoria=reparacion`
- `?mes=11&año=2025`
- `?proveedor=CFE`
- `?estado=pendiente`
- `?es_deducible=true`

**Ejemplo:**
```bash
curl http://localhost:3000/api/gastos-variables?mes=11&año=2025
```

### **POST /api/gastos-variables**
Crea un nuevo gasto.

**Body:**
```json
{
  "concepto": "Reparación equipo láser",
  "categoria": "reparacion",
  "monto": 5000,
  "fecha": "2025-11-10",
  "metodo_pago": "transferencia",
  "proveedor": "TecnoMed S.A.",
  "notas": "Mantenimiento preventivo anual"
}
```

### **GET /api/gastos-variables/[id]**
Obtiene detalle de un gasto específico.

### **PUT /api/gastos-variables/[id]**
Actualiza un gasto existente.

### **DELETE /api/gastos-variables/[id]**
Elimina (soft delete) un gasto.

### **GET /api/gastos-variables/stats**
Estadísticas y resumen financiero.

**Ejemplo response:**
```json
{
  "total": 45230.50,
  "total_deducible": 40000.00,
  "count": 12,
  "por_categoria": [
    { "categoria": "reparacion", "total": 15000, "count": 3 },
    { "categoria": "marketing", "total": 8000, "count": 2 }
  ],
  "promedio": 3769.21,
  "mayor_gasto": {
    "concepto": "Compra equipo láser",
    "monto": 150000
  }
}
```

### **POST /api/gastos-variables/upload**
Sube factura (PDF/imagen).

**Form data:**
```
file: [archivo PDF o imagen]
gasto_id: 123 (opcional)
```

### **DELETE /api/gastos-variables/upload?path=...**
Elimina archivo de factura.

---

## 🎨 Próximos Pasos

Una vez completadas las migraciones:

1. ✅ Backend completo funcionando
2. 🔜 Crear página UI `/gastos` con tabs
3. 🔜 Modal para crear/editar gastos
4. 🔜 Integrar en Dashboard y Reports
5. 🔜 Testing end-to-end

---

## ❓ Troubleshooting

### Error: "relation 'variable_expenses' does not exist"
**Solución:** Ejecuta la migración `20251110_create_variable_expenses.sql`

### Error: "bucket 'gastos-facturas' not found"
**Solución:** Crea el bucket manualmente o ejecuta `setup-gastos-facturas-bucket.sql`

### Error: "No autorizado" al crear gasto
**Solución:** Verifica que el usuario esté autenticado con `supabase.auth.getUser()`

### Error: RLS Policy violation
**Solución:** Verifica que las policies se crearon correctamente:
```sql
SELECT * FROM pg_policies WHERE tablename = 'variable_expenses';
```

---

## 📞 Soporte

Si encuentras algún error, revisa los logs de Supabase:
```
Dashboard → Logs → Postgres Logs
```

O contacta al equipo de desarrollo con:
- Mensaje de error exacto
- Query SQL que falló
- Screenshot del problema

---

**Última actualización:** 2025-11-10  
**Versión:** 1.0.0  
**Estado:** ✅ Backend completo, pendiente UI
