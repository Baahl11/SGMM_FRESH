# Sistema de Referidos y Comisiones - Equipos de Ventas

## 📋 Resumen

Sistema completo para separar las ventas entre **tu equipo interno** y la **distribuidora**, con comisiones automáticas usando Stripe Connect.

---

## 🎯 Funcionamiento

### Comisiones por Equipo

- **Tu Equipo Interno**: Te quedas con **100%** de la venta
- **Distribuidora**: Te quedas con **70%**, la distribuidora recibe **30%**

### Ejemplo Práctico

**Cliente compra Plan Pro ($999/mes):**

| Equipo | Cliente Paga | Tú Recibes | Distribuidora Recibe |
|--------|--------------|------------|---------------------|
| Interno | $999 | $999 (100%) | $0 |
| Distribuidora | $999 | $699 (70%) | $300 (30%) |

---

## 🔗 URLs para Cada Equipo

### Tu Equipo Interno
```
https://tuapp.com/pricing?ref=internal
https://tuapp.com/pricing?ref=int
```

### Distribuidora
```
https://tuapp.com/pricing?ref=distributor
https://tuapp.com/pricing?ref=dist
```

### Sin Referido (Default = Internal)
```
https://tuapp.com/pricing
```

---

## 🛠️ Configuración Inicial

### 1. Ejecutar la Migración de Base de Datos

```bash
# Conectar a tu base de datos Supabase y ejecutar:
psql -h your-project.supabase.co -U postgres -d postgres -f vercel-migration/supabase/migrations/20251126_add_sales_team_tracking.sql
```

O desde el Supabase Dashboard → SQL Editor → pega el contenido del archivo de migración.

### 2. Configurar Stripe Connect para la Distribuidora

#### Paso 1: Crear registro en `connected_accounts`

```sql
INSERT INTO connected_accounts (
  user_id, 
  sales_team, 
  onboarding_completed
) VALUES (
  'USER_ID_DEL_DISTRIBUIDOR',  -- Reemplazar con el user_id real
  'distributor',
  false
);
```

#### Paso 2: La distribuidora debe completar onboarding

1. Distribuidora hace login en tu app
2. Va a `/api/stripe/connect/onboard` (o creas una página UI)
3. Completa el formulario de Stripe Connect:
   - Información de la empresa
   - Cuenta bancaria donde recibirá los pagos
   - Identificación fiscal

#### Paso 3: Stripe actualiza automáticamente

Cuando completen el onboarding, Stripe enviará un webhook que actualiza:
```sql
UPDATE connected_accounts 
SET 
  stripe_account_id = 'acct_XXXXX',
  onboarding_completed = true,
  charges_enabled = true
WHERE sales_team = 'distributor';
```

### 3. Configurar Variables de Entorno (si aplica)

Ya deberías tener estas variables, pero verifica:

```env
# .env.local
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Para Stripe Connect
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_... # Si usas webhook específico para Connect
```

---

## 📊 Tracking de Ventas

### Ver Ventas por Equipo (SQL)

```sql
-- Ventas del equipo interno
SELECT 
  u.email,
  s.plan_tier,
  s.stripe_price_id,
  s.created_at,
  s.sales_team,
  s.application_fee_percent,
  s.platform_fee_amount
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.sales_team = 'internal'
ORDER BY s.created_at DESC;

-- Ventas de la distribuidora
SELECT 
  u.email,
  s.plan_tier,
  s.stripe_price_id,
  s.created_at,
  s.sales_team,
  s.application_fee_percent,
  s.platform_fee_amount
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.sales_team = 'distributor'
ORDER BY s.created_at DESC;
```

### Dashboard de Reportes (TypeScript)

```typescript
// app/admin/sales-reports/page.tsx

import { supabaseAdmin } from '@/lib/supabase/server'

export default async function SalesReportsPage() {
  const { data: internalSales } = await supabaseAdmin
    .from('subscriptions')
    .select('*, users(email)')
    .eq('sales_team', 'internal')
    .gte('created_at', '2025-01-01')

  const { data: distributorSales } = await supabaseAdmin
    .from('subscriptions')
    .select('*, users(email)')
    .eq('sales_team', 'distributor')
    .gte('created_at', '2025-01-01')

  // Calcular totales
  const internalRevenue = internalSales?.reduce((sum, sale) => {
    return sum + getPriceForTier(sale.plan_tier)
  }, 0) || 0

  const distributorGrossRevenue = distributorSales?.reduce((sum, sale) => {
    return sum + getPriceForTier(sale.plan_tier)
  }, 0) || 0

  const yourDistributorCommission = distributorGrossRevenue * 0.70

  return (
    <div>
      <h1>Reporte de Ventas</h1>
      
      <div>
        <h2>Tu Equipo Interno</h2>
        <p>Ventas: {internalSales?.length}</p>
        <p>Ingresos: ${internalRevenue}</p>
      </div>

      <div>
        <h2>Distribuidora</h2>
        <p>Ventas: {distributorSales?.length}</p>
        <p>Ingresos brutos: ${distributorGrossRevenue}</p>
        <p>Tu comisión (70%): ${yourDistributorCommission}</p>
        <p>Para distribuidora (30%): ${distributorGrossRevenue - yourDistributorCommission}</p>
      </div>
    </div>
  )
}
```

---

## 🔧 Ajustar Comisiones

### Cambiar Porcentaje de Comisión

Edita el archivo `vercel-migration/app/api/stripe/checkout/route.ts`:

```typescript
// Línea ~50
const APPLICATION_FEE_CONFIG = {
  internal: 0,      // 100% para ti
  distributor: 70,  // Cambiar este número (ej: 80 = te quedas con 80%, ellos 20%)
}
```

### Comisiones Diferentes por Plan

```typescript
const APPLICATION_FEE_CONFIG = {
  internal: 0,
  distributor: (planTier: string) => {
    switch(planTier) {
      case 'basico': return 60  // 60% para ti, 40% para ellos
      case 'pro': return 70     // 70% para ti, 30% para ellos
      case 'enterprise': return 80  // 80% para ti, 20% para ellos
      default: return 70
    }
  }
}

// Usar así:
const tier = getPlanTierFromPriceId(priceId)
const applicationFeePercent = typeof APPLICATION_FEE_CONFIG[salesTeam] === 'function'
  ? APPLICATION_FEE_CONFIG[salesTeam](tier)
  : APPLICATION_FEE_CONFIG[salesTeam]
```

---

## 🎨 Personalización UI

### Agregar Logo de Distribuidora

Si la distribuidora quiere su branding:

```typescript
// app/pricing/page.tsx

{referralSource === 'distributor' && (
  <div className="mb-8 flex items-center justify-center gap-4">
    <span className="text-gray-500">Distribuido por:</span>
    <Image 
      src="/logos/distributor-logo.png" 
      alt="Distribuidora" 
      width={150} 
      height={50}
    />
  </div>
)}
```

### Mensajes Personalizados

```typescript
{referralSource === 'distributor' && (
  <Alert className="mb-8">
    <AlertDescription>
      Estás siendo atendido por nuestro socio comercial autorizado.
      Cualquier duda, contacta: soporte@distribuidora.com
    </AlertDescription>
  </Alert>
)}
```

---

## 🔒 Seguridad

### Validaciones Implementadas

1. ✅ El `sales_team` se valida en el backend (no confía en el frontend)
2. ✅ Solo se usa Stripe Connect si la cuenta está verificada (`charges_enabled = true`)
3. ✅ El `referralSource` se almacena en `localStorage` y en metadata de Stripe
4. ✅ Los webhooks verifican la firma de Stripe
5. ✅ La comisión se calcula en el backend, no en el frontend

### Prevención de Fraude

```typescript
// En el checkout, validar que la cuenta Connect existe:
if (salesTeam === 'distributor') {
  const { data: connectedAccount } = await supabaseAdmin
    .from('connected_accounts')
    .select('stripe_account_id, charges_enabled')
    .eq('sales_team', 'distributor')
    .eq('charges_enabled', true)  // ← Importante
    .single()

  if (!connectedAccount) {
    return NextResponse.json(
      { error: 'Distribuidora no autorizada' },
      { status: 403 }
    )
  }
}
```

---

## 📈 Monitoreo en Stripe

### Dashboard de Stripe

1. **Tu Dashboard Principal**: Verás las comisiones que cobras (application fees)
2. **Dashboard de Distribuidora**: Verán los pagos que reciben (después de tu comisión)

### Ver Comisiones en Stripe

1. Ve a tu Dashboard de Stripe
2. Payments → All Payments
3. Filtra por metadata: `sales_team: distributor`
4. Verás la columna "Application Fee" con tu comisión

---

## ❓ FAQ

### ¿Qué pasa si un cliente compra sin `?ref=`?

Se asume que es venta de tu equipo interno (100% para ti).

### ¿Puedo tener múltiples distribuidoras?

Sí, modifica el código para soportar `distributor_1`, `distributor_2`, etc:

```typescript
const APPLICATION_FEE_CONFIG = {
  internal: 0,
  distributor_1: 70,
  distributor_2: 60,
  distributor_3: 80,
}
```

### ¿Cómo se pagan las comisiones?

Stripe lo hace automáticamente:
- Cuando un cliente paga $999
- Stripe deposita $699 a tu cuenta (70%)
- Stripe deposita $300 a la cuenta de la distribuidora (30%)

Todo es instantáneo y automático.

### ¿Puedo cambiar el equipo de ventas de una suscripción existente?

No es recomendado porque cambiaría el flujo de dinero. Si es necesario:

```sql
UPDATE subscriptions 
SET sales_team = 'internal'
WHERE id = 'SUBSCRIPTION_ID';
```

Pero no cambiará la configuración en Stripe retroactivamente.

### ¿Los add-ons también tienen comisiones?

Sí, se hereda el `sales_team` de la suscripción original. Si la suscripción fue vendida por la distribuidora, los add-ons también generarán comisión para ti.

---

## 🚀 Testing

### Probar el Flujo Completo

1. **Venta Interna:**
   ```
   1. Ir a: https://localhost:3000/pricing?ref=internal
   2. Seleccionar un plan
   3. Completar pago con tarjeta de prueba Stripe
   4. Verificar en DB: sales_team = 'internal'
   5. Verificar en Stripe: No hay application fee
   ```

2. **Venta Distribuidora:**
   ```
   1. Ir a: https://localhost:3000/pricing?ref=distributor
   2. Seleccionar un plan
   3. Completar pago con tarjeta de prueba Stripe
   4. Verificar en DB: sales_team = 'distributor'
   5. Verificar en Stripe: Application fee = 70%
   ```

### Tarjetas de Prueba Stripe

```
Tarjeta exitosa: 4242 4242 4242 4242
CVV: cualquier 3 dígitos
Fecha: cualquier fecha futura
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs del servidor: `console.log` en los archivos API
2. Revisa los webhooks en Stripe Dashboard → Developers → Webhooks
3. Verifica la base de datos con las queries SQL de arriba
4. Contacta al equipo de desarrollo

---

## 🎉 ¡Listo!

Ahora tienes un sistema completo de referidos con comisiones automáticas. Cada equipo puede:

- Enviar clientes con su URL única
- Recibir pagos directamente a su cuenta bancaria
- Ver reportes de sus ventas
- Gestionar sus clientes

Y tú mantienes el control total del sistema mientras cobras tu comisión automáticamente.
