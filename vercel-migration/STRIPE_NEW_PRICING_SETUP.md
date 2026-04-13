# 🎯 Configuración de Nuevo Plan Único en Stripe

## 📋 Resumen del Cambio

**Antes:** 3 planes (Básico, Pro, Enterprise) + Lifetime
**Ahora:** 1 plan único con 2 opciones de facturación

### Nuevo Plan: AgendaMedPro

- **Mensual:** $1,499 MXN/mes
- **Anual:** $14,990 MXN/año (ahorro de $3,398 - 2 meses gratis)

---

## 🔧 PASO 1: Crear Producto en Stripe

1. Ve a: https://dashboard.stripe.com/products
2. Haz clic en **"+ New"** (Nuevo)
3. Configura:
   - **Name:** `AgendaMedPro`
   - **Description:** `Plataforma completa de gestión médica - Todo incluido`
   - **Statement descriptor:** `AGENDAMEDPRO`

---

## 💰 PASO 2: Crear Precio Mensual

1. En el producto que acabas de crear, haz clic en **"Add price"**
2. Configura:
   - **Price:** `1499`
   - **Currency:** `MXN` (Peso Mexicano)
   - **Billing period:** `Monthly` (Mensual)
   - **Payment type:** `Recurring` (Recurrente)
   - **Price description:** `Plan Mensual AgendaMedPro`
3. Haz clic en **"Add price"**
4. **COPIA EL PRICE ID** → Será algo como: `price_xxxxxxxxxxxxx`

---

## 💰 PASO 3: Crear Precio Anual

1. En el mismo producto, haz clic en **"Add another price"**
2. Configura:
   - **Price:** `14990`
   - **Currency:** `MXN` (Peso Mexicano)
   - **Billing period:** `Yearly` (Anual)
   - **Payment type:** `Recurring` (Recurrente)
   - **Price description:** `Plan Anual AgendaMedPro (2 meses gratis)`
3. Haz clic en **"Add price"**
4. **COPIA EL PRICE ID** → Será algo como: `price_yyyyyyyyyyy`

---

## 🔐 PASO 4: Actualizar Variables de Entorno

### En `.env.local`:

```env
# ============================================================================
# STRIPE NUEVO PLAN ÚNICO
# ============================================================================

# Plan AgendaMedPro - Mensual
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx  # <-- REEMPLAZA CON TU PRICE ID MENSUAL

# Plan AgendaMedPro - Anual
NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL=price_yyyyyyyyyyy  # <-- REEMPLAZA CON TU PRICE ID ANUAL

# Mantener por compatibilidad (deprecados pero no eliminar aún)
NEXT_PUBLIC_STRIPE_PRICE_BASICO_MONTHLY=price_1SO7NSCpe9CE4d2l5TOfOGw5
NEXT_PUBLIC_STRIPE_PRICE_BASICO_ANNUAL=price_1SO7NfCpe9CE4d2lFAgISFdU
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1SVEDDCpe9CE4d2lIpb5bvVP
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL=price_1SVEDECpe9CE4d2lzD8MkHVN
```

### En Vercel (Variables de Producción):

1. Ve a: https://vercel.com/guillermo-melgarejos-projects/vercel-migration/settings/environment-variables
2. Edita o agrega:
   - `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` → Tu nuevo Price ID mensual
   - `NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL` → Tu nuevo Price ID anual

---

## 🗄️ PASO 5: Actualizar Base de Datos (Opcional)

Si tienes subscripciones activas con los planes viejos, necesitas migrarlas.

### SQL para verificar suscripciones activas:

```sql
SELECT 
  plan_id, 
  COUNT(*) as total_users
FROM subscriptions 
WHERE status IN ('active', 'trialing')
GROUP BY plan_id;
```

### SQL para migrar usuarios al nuevo plan (si es necesario):

```sql
-- Migrar todos los planes antiguos al nuevo "pro"
UPDATE subscriptions 
SET 
  plan_id = 'pro',
  updated_at = NOW()
WHERE plan_id IN ('basico', 'enterprise', 'lifetime')
  AND status IN ('active', 'trialing');
```

---

## 🧪 PASO 6: Probar en Modo Test

**IMPORTANTE:** Antes de desplegar a producción, prueba con Stripe Test Mode

1. Ve a: https://dashboard.stripe.com/test/products
2. Repite los pasos 1-3 pero en **modo test**
3. Copia los Price IDs de test
4. En tu `.env.local`:
   ```env
   # Test Mode
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_test_...
   NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL=price_test_...
   ```
5. Prueba el flujo completo:
   - Ir a /pricing
   - Seleccionar plan mensual → Verificar checkout
   - Seleccionar plan anual → Verificar checkout
   - Completar pago con tarjeta de prueba: `4242 4242 4242 4242`

---

## 🚀 PASO 7: Desplegar Nueva Página

Una vez que tengas los Price IDs:

1. Reemplaza el archivo actual:
   ```bash
   Move-Item app\pricing\page.tsx app\pricing\page-old.tsx
   Move-Item app\pricing\page-new.tsx app\pricing\page.tsx
   ```

2. Actualiza `.env.local` con los Price IDs

3. Despliega:
   ```bash
   npx vercel --prod
   ```

---

## 📊 PASO 8: Actualizar Webhook de Stripe (Importante)

Tu webhook debe manejar el nuevo plan. Verifica que `/api/webhooks/stripe` maneje correctamente:

```typescript
// Mapeo de Price IDs a Plan IDs
const PRICE_TO_PLAN_MAP: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!]: 'pro',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL!]: 'pro',
  // Mantener viejos por compatibilidad
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_BASICO_MONTHLY!]: 'basico',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_BASICO_ANNUAL!]: 'basico',
  // ... etc
}
```

---

## ✅ Checklist de Verificación

Antes de lanzar a producción, verifica:

- [ ] Producto creado en Stripe
- [ ] Precio mensual configurado ($1,499 MXN/mes)
- [ ] Precio anual configurado ($14,990 MXN/año)
- [ ] Price IDs copiados correctamente
- [ ] Variables de entorno actualizadas en `.env.local`
- [ ] Variables de entorno actualizadas en Vercel
- [ ] Probado en Stripe Test Mode
- [ ] Probado checkout completo
- [ ] Webhook actualizado (si es necesario)
- [ ] Nueva página de pricing desplegada
- [ ] Página anterior respaldada

---

## 🔄 Rollback Plan (Si algo sale mal)

Si necesitas volver atrás:

```bash
# Restaurar página anterior
Move-Item app\pricing\page.tsx app\pricing\page-error.tsx
Move-Item app\pricing\page-old.tsx app\pricing\page.tsx

# Desplegar
npx vercel --prod
```

---

## 📞 Soporte

Si tienes problemas con Stripe:
- 📧 Email: support@stripe.com
- 💬 Chat: https://dashboard.stripe.com (esquina inferior derecha)
- 📚 Docs: https://stripe.com/docs

---

## 🎉 Listo!

Una vez completados todos los pasos, tu nuevo sistema de precios estará activo:
- ✅ Una sola opción de plan (simplifica decisión del cliente)
- ✅ Ahorro significativo en plan anual (incentiva compromiso a largo plazo)
- ✅ Todas las features incluidas (mayor valor percibido)

**Resultado esperado:**
- Mayor tasa de conversión (menos opciones = menos confusión)
- Más suscripciones anuales (mejor flujo de caja)
- Menor churn (clientes más comprometidos)
