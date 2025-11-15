# 🚨 REPORTE CRÍTICO: SUSCRIPCIONES NO SINCRONIZADAS

## Problema Detectado

**3 clientes están siendo cobrados en Stripe pero NO tienen acceso en tu aplicación**

### Clientes Afectados:

1. **Juan Camarillo** (`camarillojuan@hotmail.com`)
   - Suscripción 1: `sub_1SQYowCpe9CE4d2laNm6C3nA` - Creada 6 Nov 2025
   - Suscripción 2: `sub_1SQYaOCpe9CE4d2luZTbzd5L` - Creada 6 Nov 2025
   - Trial terminó: 13 Nov 2025
   - Status: ✅ ACTIVE en Stripe, ❌ NO EXISTE en Supabase
   - Método de pago: Amex •••• 2009
   - **Problema adicional**: Tiene 2 suscripciones (se registró 2 veces)

2. **Guillermo Melgarejo** (`gmelgarejom@gmail.com`)
   - Suscripción: `sub_1SJ4LyCpe9CE4d2lkHcbdgRl` - Creada 16 Oct 2025
   - Status: ✅ ACTIVE en Stripe, ❌ NO EXISTE en Supabase
   - Método de pago: Visa •••• 2464
   - Factura pagada: $499 MXN (16 Oct 2025)

---

## Causa Raíz

Los **webhooks de Stripe NO están funcionando correctamente**:

- ✅ Webhook configurado en: `https://agendamedpro.com/api/stripe/webhook`
- ❌ Eventos marcados como "simulados" (no se enviaron a tu servidor)
- ❌ Falta evento `invoice.paid` en la configuración

Todos los eventos tienen `Webhook delivered: ❌ No (simulado)`

---

## Solución Inmediata

### Paso 1: Sincronizar Manualmente en Supabase

Ve a tu dashboard de Supabase → SQL Editor y ejecuta estos 3 INSERT:

```sql
-- 1. Juan Camarillo (primera suscripción)
INSERT INTO subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  status,
  plan_tier,
  current_period_start,
  current_period_end,
  trial_start,
  trial_end,
  max_doctors,
  max_locations,
  created_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'camarillojuan@hotmail.com' LIMIT 1),
  'sub_1SQYowCpe9CE4d2laNm6C3nA',
  'cus_TNJR4FrB18TbhM',
  'active',
  'basico',
  '2025-11-13 13:26:07',
  '2025-12-13 13:26:07',
  '2025-11-06 13:26:07',
  '2025-11-13 13:26:07',
  2,
  1,
  '2025-11-06 13:26:07'
) ON CONFLICT (stripe_subscription_id) DO NOTHING;

-- 2. Guillermo Melgarejo
INSERT INTO subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  status,
  plan_tier,
  current_period_start,
  current_period_end,
  max_doctors,
  max_locations,
  created_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'gmelgarejom@gmail.com' LIMIT 1),
  'sub_1SJ4LyCpe9CE4d2lkHcbdgRl',
  'cus_TFZSDH4K4o2i7L',
  'active',
  'basico',
  '2025-10-16 21:29:18',
  '2025-11-16 21:29:18',
  2,
  1,
  '2025-10-16 21:29:18'
) ON CONFLICT (stripe_subscription_id) DO NOTHING;

-- 3. CANCELAR la suscripción duplicada de Juan Camarillo en Stripe
-- (Debes hacerlo manualmente en Stripe Dashboard: sub_1SQYaOCpe9CE4d2luZTbzd5L)
```

### Paso 2: Arreglar Webhooks de Stripe

1. **Ve a Stripe Dashboard** → https://dashboard.stripe.com/webhooks
2. **Encuentra el webhook**: `https://agendamedpro.com/api/stripe/webhook`
3. **Agregar evento faltante**: 
   - Click "Add events"
   - Busca y selecciona `invoice.paid`
   - Guardar
4. **Verificar STRIPE_WEBHOOK_SECRET** en `.env` de producción
5. **Probar webhook**: Click "Send test webhook" y verificar que llegue a tu servidor

### Paso 3: Cancelar Suscripción Duplicada

Juan Camarillo tiene 2 suscripciones activas. Debes:

1. Ir a Stripe Dashboard
2. Buscar cliente: `camarillojuan@hotmail.com`
3. Cancelar la suscripción `sub_1SQYaOCpe9CE4d2luZTbzd5L` (la más vieja)
4. Mantener solo `sub_1SQYowCpe9CE4d2laNm6C3nA`

---

## Solución Permanente

### Opción A: Verificar Webhook Secret (MÁS PROBABLE)

El problema puede ser que `STRIPE_WEBHOOK_SECRET` en tu `.env` de producción no coincide con el secret real del webhook.

**Cómo obtener el secret correcto:**

1. Stripe Dashboard → Webhooks
2. Click en tu webhook `agendamedpro.com/api/stripe/webhook`
3. Click "Reveal" en "Signing secret"
4. Copiar el secret (empieza con `whsec_...`)
5. Actualizar en Vercel:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET
   # Pegar el secret revelado
   # Seleccionar: Production
   ```
6. Redeployar:
   ```bash
   vercel --prod
   ```

### Opción B: Endpoint Incorrecto

Si el endpoint es incorrecto:

1. Eliminar webhook viejo en Stripe
2. Crear nuevo webhook apuntando a: `https://agendamedpro.com/api/stripe/webhook`
3. Seleccionar eventos:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid` ⭐ (FALTANTE)
   - `invoice.payment_failed`
   - `checkout.session.completed`

---

## Testing

Después de aplicar los fixes:

1. **Crear usuario de prueba nuevo**
2. **Subscribirse y completar checkout**
3. **Verificar en logs de Vercel** que lleguen webhooks:
   ```bash
   vercel logs --follow
   ```
4. **Verificar en Supabase** que se creó la subscription

---

## Monitoreo

**Script para auditar semanalmente:**

```bash
cd vercel-migration
npx tsx scripts/audit-trials.ts
```

Esto te alertará si hay más suscripciones huérfanas.

---

## Impacto

**Financiero:**
- ✅ NO hay pérdida de dinero (Stripe está cobrando)
- ❌ Clientes frustrados (pagaron pero no tienen acceso)

**Reputacional:**
- 🔴 CRÍTICO: 2 clientes afectados hace 8 días
- Posibles chargebacks si no se resuelve pronto

**Próximos pasos:**
1. ✅ Ejecutar los 2 INSERT en Supabase (5 min)
2. ✅ Cancelar suscripción duplicada en Stripe (2 min)
3. ✅ Verificar/actualizar STRIPE_WEBHOOK_SECRET (10 min)
4. ✅ Agregar evento `invoice.paid` al webhook (2 min)
5. ✅ Testing con usuario nuevo (15 min)
6. 📧 Contactar a los 2 clientes afectados explicando el issue

---

**TOTAL TIEMPO ESTIMADO:** 35 minutos para fix completo
