# 🔧 PLAN DE CORRECCIÓN - PREVENIR SUSCRIPCIONES HUÉRFANAS

## ❌ PROBLEMA ACTUAL

1. **Endpoint `/api/activate-trial`** crea suscripciones en Supabase SIN Stripe
2. **Resultado**: Suscripciones huérfanas (stripe_subscription_id = NULL)
3. **Impacto**: No se pueden cobrar, no hay sincronización con webhooks

## ✅ SOLUCIÓN RECOMENDADA

### OPCIÓN A: Forzar Stripe Checkout (RECOMENDADA)
```typescript
// En activate-trial/route.ts
// EN LUGAR DE: Crear suscripción directa en Supabase
// HACER: Redirigir a Stripe Checkout con trial

POST /api/activate-trial
↓
Crear Stripe Checkout Session con:
  - mode: 'subscription'
  - subscription_data: { trial_period_days: 7 }
  - payment_method_collection: 'always' // ← REQUIERE tarjeta
↓
Retornar checkout URL
↓
Usuario completa Stripe Checkout
↓
Webhook checkout.session.completed crea suscripción en Supabase
↓
✅ Siempre tiene stripe_subscription_id
```

### OPCIÓN B: Trial sin tarjeta + Conversión obligatoria
```typescript
// Permitir trial en Supabase sin Stripe PERO:
1. Marcar claramente como "trial_no_card"
2. Al finalizar trial:
   - Bloquear acceso si no tiene stripe_subscription_id
   - Mostrar pantalla de pago obligatoria
   - Eliminar suscripción huérfana después de 7 días
```

## 🛠️ CAMBIOS NECESARIOS

### 1. Modificar activate-trial/route.ts
```typescript
// ANTES:
const subscriptionData = {
  user_id: user.id,
  status: 'trialing',
  // ... sin stripe_subscription_id
}

// DESPUÉS:
// Crear suscripción en Stripe PRIMERO
const stripeSubscription = await stripe.subscriptions.create({
  customer: stripeCustomerId,
  items: [{ price: priceId }],
  trial_period_days: 7,
  payment_behavior: 'default_incomplete', // Requiere método de pago
});

const subscriptionData = {
  user_id: user.id,
  stripe_subscription_id: stripeSubscription.id, // ← SIEMPRE presente
  stripe_customer_id: stripeCustomerId,
  status: 'trialing',
  // ...
}
```

### 2. Crear función de limpieza automática
```sql
-- Cron job diario para limpiar trials vencidos sin Stripe
DELETE FROM subscriptions
WHERE stripe_subscription_id IS NULL
  AND trial_end < NOW() - INTERVAL '7 days'
  AND status = 'trialing';
```

### 3. Agregar validación en RLS
```sql
-- Bloquear acceso si trial vencido y sin Stripe
CREATE POLICY "Block access after trial without payment"
  ON patients FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = auth.uid()
      AND (
        stripe_subscription_id IS NOT NULL  -- Tiene suscripción pagada
        OR trial_end > NOW()                -- O trial aún activo
      )
    )
  );
```

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Modificar `/api/activate-trial` para crear en Stripe primero
- [ ] Actualizar UI de registro para capturar tarjeta en trial
- [ ] Crear `/api/cleanup-orphaned-subscriptions` (cron diario)
- [ ] Agregar validación RLS para bloquear acceso post-trial
- [ ] Actualizar documentación de registro
- [ ] Probar flujo completo end-to-end

## ⚠️ MIGRACIÓN DE USUARIOS EXISTENTES

```sql
-- Identificar usuarios con suscripciones huérfanas activas
SELECT u.email, s.trial_end
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.stripe_subscription_id IS NULL
  AND s.trial_end > NOW();

-- Opciones:
-- 1. Extender trial 7 días más y notificar para agregar tarjeta
-- 2. Bloquear acceso inmediato y forzar pago
-- 3. Eliminar cuenta (si no tienen datos)
```

## 🎯 RESULTADO FINAL

✅ **0 suscripciones huérfanas nuevas**
✅ Todos los usuarios tienen `stripe_subscription_id`
✅ Webhooks funcionan correctamente
✅ Fácil sincronización Stripe ↔ Supabase
