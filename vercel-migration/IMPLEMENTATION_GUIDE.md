# ✅ Sistema de Referidos Implementado - Resumen Ejecutivo

## 🎯 ¿Qué se implementó?

Sistema completo de rastreo de ventas y comisiones automáticas para separar las ventas entre:
- **Tu equipo interno** (100% de ingresos para ti)
- **Distribuidora** (70% para ti, 30% para ellos)

---

## 📁 Archivos Modificados/Creados

### 1. Base de Datos
- ✅ `supabase/migrations/20251126_add_sales_team_tracking.sql` - Migración principal
- ✅ `supabase/migrations/20251126_setup_sales_teams.sql` - Script de configuración

### 2. API Routes
- ✅ `app/api/stripe/checkout/route.ts` - Modificado para soportar referidos y application fees
- ✅ `app/api/stripe/webhook/route.ts` - Actualizado para guardar metadata de ventas
- ✅ `app/api/addons/purchase/route.ts` - Actualizado para heredar sales_team

### 3. Frontend
- ✅ `app/pricing/page.tsx` - Detección automática de referidos desde URL

### 4. Documentación
- ✅ `SALES_TEAM_REFERRAL_SYSTEM.md` - Guía completa de uso
- ✅ `app/admin/sales-reports/page.example.tsx` - Ejemplo de dashboard de reportes

---

## 🚀 Próximos Pasos (EN ORDEN)

### Paso 1: Ejecutar Migración de Base de Datos
```bash
# Conectar a Supabase y ejecutar:
psql -h tu-proyecto.supabase.co -U postgres -d postgres \
  -f vercel-migration/supabase/migrations/20251126_add_sales_team_tracking.sql
```

**O desde Supabase Dashboard:**
1. Ve a SQL Editor
2. Copia y pega el contenido del archivo de migración
3. Ejecuta

**Verifica que funcionó:**
```sql
-- Debe mostrar las nuevas columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
  AND column_name IN ('sales_team', 'application_fee_percent', 'platform_fee_amount', 'referral_source');
```

---

### Paso 2: Configurar Cuenta de Distribuidora

#### 2.1 Crear Usuario para Distribuidora (si no existe)
```sql
-- Ejecutar en Supabase SQL Editor
INSERT INTO users (email, full_name, role)
VALUES (
  'distribuidor@ejemplo.com',
  'Nombre Distribuidora S.A.',
  'admin'
);
```

#### 2.2 Crear Registro en connected_accounts
```sql
-- Reemplaza <USER_ID_DEL_DISTRIBUIDOR> con el ID del paso anterior
INSERT INTO connected_accounts (
  user_id, 
  sales_team, 
  onboarding_completed,
  charges_enabled
) VALUES (
  '<USER_ID_DEL_DISTRIBUIDOR>',
  'distributor',
  false,
  false
);
```

#### 2.3 Distribuidora Completa Onboarding de Stripe

**Opción A: Crear Página UI (Recomendado)**
```typescript
// app/connect/onboarding/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function ConnectOnboardingPage() {
  const [loading, setLoading] = useState(false)

  const handleOnboard = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/connect/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team: 'distributor' })
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  return (
    <div className="p-8">
      <h1>Configurar Cuenta de Pagos</h1>
      <p>Conecta tu cuenta bancaria para recibir pagos</p>
      <Button onClick={handleOnboard} disabled={loading}>
        {loading ? 'Cargando...' : 'Conectar Cuenta Bancaria'}
      </Button>
    </div>
  )
}
```

**Opción B: Usar Directamente la API**
```bash
# La distribuidora hace POST a:
curl -X POST https://tuapp.com/api/stripe/connect/onboard \
  -H "Content-Type: application/json" \
  -d '{"team": "distributor"}'
```

Esto redirige a Stripe donde completarán:
- Información de la empresa
- Datos bancarios (CLABE/cuenta)
- Identificación fiscal (RFC)
- Comprobantes de identidad

**⏱️ Tiempo estimado:** 10-15 minutos
**⚠️ Importante:** En modo test, la aprobación es instantánea. En producción puede tardar 1-2 días.

---

### Paso 3: Ajustar Configuración de Comisiones (Opcional)

Edita `app/api/stripe/checkout/route.ts` línea ~50:

```typescript
// Cambiar estos valores según tu acuerdo:
const APPLICATION_FEE_CONFIG = {
  internal: 0,      // Tu equipo: 100% para ti (no cambiar)
  distributor: 70,  // ← AJUSTAR: % que TÚ te quedas (actualmente 70%)
}
```

**Ejemplos:**
- `distributor: 60` = Tú 60%, Distribuidora 40%
- `distributor: 80` = Tú 80%, Distribuidora 20%
- `distributor: 50` = Tú 50%, Distribuidora 50%

---

### Paso 4: Probar el Sistema

#### 4.1 Probar Venta Interna
```
1. Ir a: http://localhost:3000/pricing?ref=internal
2. Seleccionar un plan (ej: Pro Mensual)
3. Completar checkout con tarjeta de prueba: 4242 4242 4242 4242
4. Verificar en base de datos:
   SELECT sales_team, application_fee_percent FROM subscriptions 
   WHERE user_id = '<USER_ID_DE_PRUEBA>';
   
   Debe mostrar: sales_team = 'internal', application_fee_percent = 0
```

#### 4.2 Probar Venta Distribuidora
```
1. Ir a: http://localhost:3000/pricing?ref=distributor
2. Seleccionar un plan
3. Completar checkout con tarjeta de prueba
4. Verificar en base de datos:
   SELECT sales_team, application_fee_percent FROM subscriptions 
   WHERE user_id = '<USER_ID_DE_PRUEBA>';
   
   Debe mostrar: sales_team = 'distributor', application_fee_percent = 70
```

#### 4.3 Verificar en Stripe Dashboard
```
1. Ve a Stripe Dashboard → Payments
2. Busca el pago reciente
3. Debe mostrar:
   - Para ventas internas: Normal payment (sin application fee)
   - Para distribuidora: Application fee de 70%
```

---

### Paso 5: Crear Dashboard de Reportes (Opcional)

Usa el archivo de ejemplo proporcionado:

```bash
# Copiar el ejemplo
cp app/admin/sales-reports/page.example.tsx \
   app/admin/sales-reports/page.tsx

# O crear manualmente siguiendo el ejemplo
```

Luego accede a: `http://localhost:3000/admin/sales-reports`

---

### Paso 6: Distribuir URLs a los Equipos

#### URL para Tu Equipo Interno:
```
https://tuapp.com/pricing?ref=internal
https://tuapp.com/pricing?ref=int
```

#### URL para Distribuidora:
```
https://tuapp.com/pricing?ref=distributor
https://tuapp.com/pricing?ref=dist
```

**💡 Tip:** Crea URLs cortas con bit.ly o tu.app/dist

---

## 📊 Cómo Monitorear Ventas

### Opción 1: SQL Queries Directas

```sql
-- Ventas del mes por equipo
SELECT 
  sales_team,
  COUNT(*) as total_ventas,
  SUM(platform_fee_amount) as comisiones_cobradas
FROM subscriptions
WHERE created_at >= date_trunc('month', CURRENT_DATE)
  AND status IN ('active', 'trialing')
GROUP BY sales_team;
```

### Opción 2: Dashboard de Stripe

1. Ve a Stripe Dashboard
2. Reports → Payments
3. Filtra por metadata: `sales_team: distributor`
4. Verás la columna "Application Fee" con tu comisión

### Opción 3: Dashboard Personalizado

Implementa el componente de ejemplo en `app/admin/sales-reports/page.tsx`

---

## 💰 Ejemplo de Cálculo de Ingresos

### Escenario: 10 ventas de Plan Pro ($999/mes)

| Equipo | Ventas | Ingresos Brutos | Tu Comisión | Para Distribuidora |
|--------|--------|-----------------|-------------|-------------------|
| Interno | 6 ventas | $5,994 | $5,994 (100%) | $0 |
| Distribuidora | 4 ventas | $3,996 | $2,797 (70%) | $1,199 (30%) |
| **TOTAL** | **10 ventas** | **$9,990** | **$8,791** | **$1,199** |

**Resultado:** De $9,990 en ventas totales, tú recibes $8,791 y la distribuidora $1,199.

---

## ⚠️ Consideraciones Importantes

### 1. Modo Test vs Producción

**En Desarrollo (Test Mode):**
- Usa tarjeta de prueba: 4242 4242 4242 4242
- Aprobación de Connect instantánea
- No se mueve dinero real

**En Producción (Live Mode):**
- Usa `STRIPE_SECRET_KEY=sk_live_...` en `.env`
- Distribuidora necesita documentos reales para onboarding
- Verificación puede tardar 1-2 días
- ⚠️ Stripe cobra 3.6% + $3 MXN por transacción

### 2. Comisiones de Stripe

Stripe cobra fees sobre el total:
- **Venta de $999:**
  - Fee de Stripe: ~$39 (3.6% + $3)
  - Neto antes de división: $960
  - Tu 70%: $672
  - Distribuidora 30%: $288

**⚠️ El application fee se calcula sobre el monto ANTES de fees de Stripe.**

### 3. Impuestos y Facturación

- Los pagos se consideran ingresos gravables
- Debes emitir facturas según tu régimen fiscal
- La distribuidora debe emitir facturas por su comisión
- Consulta con tu contador sobre el tratamiento fiscal

### 4. Seguridad

- ✅ El sistema valida que la cuenta Connect esté verificada (`charges_enabled = true`)
- ✅ Los webhooks verifican la firma de Stripe
- ✅ El `sales_team` se determina en el backend (no confía en el frontend)
- ✅ Solo cuentas verificadas pueden recibir pagos

---

## 🐛 Troubleshooting

### Error: "Distribuidora no configurada"

**Causa:** La cuenta Connect no está completa.

**Solución:**
```sql
-- Verificar estado
SELECT * FROM connected_accounts WHERE sales_team = 'distributor';

-- Si onboarding_completed = false, la distribuidora debe completar el proceso
```

### Error: "No se recibió URL de checkout"

**Causa:** Fallo en la creación de la sesión de Stripe.

**Solución:**
1. Revisa los logs del servidor
2. Verifica que las API keys sean correctas
3. Verifica que el `priceId` sea válido

### Los pagos no se dividen correctamente

**Causa:** El `application_fee_percent` no se está aplicando.

**Solución:**
```sql
-- Verificar que se guardó correctamente
SELECT 
  id, 
  sales_team, 
  application_fee_percent, 
  platform_fee_amount 
FROM subscriptions 
ORDER BY created_at DESC 
LIMIT 5;
```

### No aparece el indicador de equipo en pricing

**Causa:** El parámetro `ref` no se está capturando.

**Solución:**
1. Verifica que la URL tenga `?ref=distributor`
2. Abre las DevTools → Console, debe mostrar: `🎯 Referral source detected: distributor`
3. Verifica localStorage: `localStorage.getItem('referral_source')`

---

## 📞 Soporte

Si tienes problemas durante la implementación:

1. **Revisa los logs:** Busca mensajes con `🔥`, `✅`, `❌` en la consola del servidor
2. **Verifica la base de datos:** Usa las queries de monitoreo proporcionadas
3. **Revisa Stripe Dashboard:** Ve a Developers → Webhooks para ver eventos
4. **Consulta la documentación:** `SALES_TEAM_REFERRAL_SYSTEM.md`

---

## ✅ Checklist de Implementación

- [ ] Migración de base de datos ejecutada
- [ ] Cuenta de distribuidora creada en `users`
- [ ] Registro en `connected_accounts` creado
- [ ] Distribuidora completó onboarding de Stripe
- [ ] Comisiones configuradas correctamente
- [ ] Pruebas realizadas (venta interna + distribuidora)
- [ ] URLs distribuidas a los equipos
- [ ] Dashboard de reportes implementado (opcional)
- [ ] Sistema en producción con Stripe Live Mode

---

## 🎉 ¡Listo para Usar!

Una vez completados todos los pasos, tu sistema estará completamente funcional:

✅ **Tu equipo** puede vender usando `tuapp.com/pricing?ref=internal`
✅ **Distribuidora** puede vender usando `tuapp.com/pricing?ref=distributor`
✅ **Comisiones** se dividen automáticamente según configuración
✅ **Reportes** disponibles en tiempo real
✅ **Pagos** se depositan directamente a las cuentas bancarias

**Duración estimada de implementación:** 1-2 horas (sin contar aprobación de Stripe en producción)

---

## 📚 Recursos Adicionales

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Stripe Application Fees](https://stripe.com/docs/connect/direct-charges#collecting-fees)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- Documentación completa: `SALES_TEAM_REFERRAL_SYSTEM.md`
