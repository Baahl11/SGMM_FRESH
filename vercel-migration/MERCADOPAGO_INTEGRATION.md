# 💳 MERCADO PAGO - Guía de Configuración

## 📋 Resumen

Ahora AgendaMedPro acepta pagos tanto por **Stripe** como por **Mercado Pago**. Los usuarios pueden elegir su pasarela preferida en la página de pricing.

---

## 🔧 Configuración Requerida

### 1. Obtener Credenciales de Mercado Pago

1. Ir a [https://www.mercadopago.com.mx/developers](https://www.mercadopago.com.mx/developers)
2. Crear una aplicación o usar una existente
3. Obtener el **Access Token** (Production)

### 2. Agregar Variables de Entorno

Agregar en Vercel (o `.env.local` para desarrollo):

```bash
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Planes de Mercado Pago (crear suscripciones en MP Dashboard)
NEXT_PUBLIC_MERCADOPAGO_PLAN_BASICO_MONTHLY=plan_xxx_basico_monthly
NEXT_PUBLIC_MERCADOPAGO_PLAN_PRO_MONTHLY=plan_xxx_pro_monthly
NEXT_PUBLIC_MERCADOPAGO_PLAN_ENTERPRISE_MONTHLY=plan_xxx_enterprise_monthly

NEXT_PUBLIC_MERCADOPAGO_PLAN_BASICO_ANNUAL=plan_xxx_basico_annual
NEXT_PUBLIC_MERCADOPAGO_PLAN_PRO_ANNUAL=plan_xxx_pro_annual
NEXT_PUBLIC_MERCADOPAGO_PLAN_ENTERPRISE_ANNUAL=plan_xxx_enterprise_annual

NEXT_PUBLIC_MERCADOPAGO_PLAN_LIFETIME=plan_xxx_lifetime
```

**Comando para agregar via Vercel CLI:**
```bash
cd vercel-migration

# Access Token (secreto)
npx vercel env add MERCADOPAGO_ACCESS_TOKEN production

# Planes (públicos)
npx vercel env add NEXT_PUBLIC_MERCADOPAGO_PLAN_BASICO_MONTHLY production
npx vercel env add NEXT_PUBLIC_MERCADOPAGO_PLAN_PRO_MONTHLY production
npx vercel env add NEXT_PUBLIC_MERCADOPAGO_PLAN_ENTERPRISE_MONTHLY production
npx vercel env add NEXT_PUBLIC_MERCADOPAGO_PLAN_BASICO_ANNUAL production
npx vercel env add NEXT_PUBLIC_MERCADOPAGO_PLAN_PRO_ANNUAL production
npx vercel env add NEXT_PUBLIC_MERCADOPAGO_PLAN_ENTERPRISE_ANNUAL production
npx vercel env add NEXT_PUBLIC_MERCADOPAGO_PLAN_LIFETIME production
```

### 3. Aplicar Migración de Base de Datos

En Supabase SQL Editor, ejecutar:

```sql
-- Ya está en: supabase/migrations/20251118_mercadopago_support.sql

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'mercadopago', 'admin')),
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_payer_id TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_preapproval_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_mercadopago_payment
  ON subscriptions(mercadopago_payment_id)
  WHERE mercadopago_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_mercadopago_preapproval
  ON subscriptions(mercadopago_preapproval_id)
  WHERE mercadopago_preapproval_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_provider
  ON subscriptions(payment_provider);
```

### 4. Configurar Webhook en Mercado Pago

1. Ir a [Webhooks en MP](https://www.mercadopago.com.mx/developers/panel/app/webhooks)
2. Agregar nueva URL de webhook:
   ```
   https://agendamedpro.com/api/mercadopago/webhook
   ```
3. Seleccionar eventos:
   - ✅ `payment`
   - ✅ `subscription_preapproval`
   - ✅ `subscription_authorized_payment`

---

## 🎯 ¿Cómo Funciona?

### Flujo de Usuario

1. **Usuario va a `/pricing`**
   - Ve toggle para elegir **Mensual** o **Anual**
   - Ve selector para **Stripe** (💳) o **Mercado Pago** (🔵)

2. **Selecciona un plan**
   - Si elige Stripe → Redirige a Stripe Checkout
   - Si elige Mercado Pago → Redirige a Mercado Pago Checkout

3. **Completa el pago**
   - Stripe: webhook `checkout.session.completed`
   - Mercado Pago: webhook `payment` con status `approved`

4. **Sistema actualiza suscripción**
   ```sql
   subscriptions {
     payment_provider: 'mercadopago',
     mercadopago_payment_id: '12345678',
     plan_tier: 'pro',
     status: 'active',
     max_doctors: 10,
     max_locations: 5
   }
   ```

### Archivos Creados

```
lib/mercadopago/
  └── server.ts                      # SDK de Mercado Pago + configuración

app/api/mercadopago/
  ├── checkout/route.ts              # POST - Crear preference de pago
  └── webhook/route.ts               # POST - Recibir notificaciones de MP

supabase/migrations/
  └── 20251118_mercadopago_support.sql  # Agregar columnas a subscriptions
```

### Archivos Modificados

```
app/pricing/page.tsx                 # + Selector de pasarela
package.json                         # + mercadopago SDK
```

---

## 🧪 Testing

### Modo Sandbox (Desarrollo)

1. Usar **Access Token de Test** en desarrollo
2. Mercado Pago proporciona tarjetas de prueba:
   ```
   Tarjeta aprobada: 5031 7557 3453 0604
   CVV: 123
   Fecha: 11/25
   Nombre: APRO
   ```

3. La API devuelve `sandbox_init_point` en desarrollo

### Modo Producción

1. Usar **Access Token de Production**
2. Pagos reales se cobran
3. Webhook debe estar configurado

---

## 💰 Precios Actuales

| Plan | Mensual | Anual |
|------|---------|-------|
| Básico | $599 | $5,990 |
| Pro | $999 | $9,990 |
| Enterprise | $2,999 | $29,990 |
| **Lifetime** | - | **$19,990** (pago único) |

---

## 🔐 Seguridad

- ✅ Webhook verifica autenticidad via firma (Mercado Pago IPN)
- ✅ Solo actualiza BD si `status === 'approved'`
- ✅ RLS policies protegen datos de usuario
- ✅ Access Token nunca se expone al cliente

---

## 📊 Diferencias Stripe vs Mercado Pago

| Característica | Stripe | Mercado Pago |
|----------------|--------|--------------|
| Trial gratuito | ✅ 7 días | ⚠️ Requiere configuración manual |
| Suscripciones | ✅ Nativo | ✅ Preapproval |
| Comisión | ~3.6% + $3 MXN | ~3.99% + IVA |
| Métodos | Tarjetas | Tarjetas + OXXO + Transferencias |
| Dashboard | Stripe Dashboard | Mercado Pago Panel |

---

## ⚠️ Notas Importantes

1. **Mercado Pago no maneja trials automáticamente** como Stripe. El trial está implementado en la lógica del backend (7 días gratis al registrarse).

2. **Los planes de suscripción en MP** deben crearse manualmente en el dashboard o via API. Por ahora usamos **Preferences** (pagos únicos) y renovamos manualmente cada mes/año.

3. **Para suscripciones recurrentes reales**, usar `Preapproval Plans` de Mercado Pago (requiere configuración adicional).

---

## 🚀 Deploy Checklist

- [ ] Migración aplicada en Supabase
- [ ] Variables de entorno agregadas en Vercel
- [ ] Webhook configurado en Mercado Pago
- [ ] Código desplegado (`git push`)
- [ ] Probar checkout con tarjeta de prueba
- [ ] Verificar webhook recibe notificaciones
- [ ] Confirmar suscripción se crea en BD

---

## 🐛 Troubleshooting

**Error: "MERCADOPAGO_ACCESS_TOKEN is not defined"**
- Solución: Agregar variable de entorno en Vercel

**Webhook no se recibe:**
- Verificar URL en MP Dashboard
- Verificar logs: `npx vercel logs --prod`
- Probar webhook manualmente en MP Simulator

**Pago aprobado pero no se actualiza suscripción:**
- Revisar logs del webhook: `POST /api/mercadopago/webhook`
- Verificar `metadata.user_id` está presente
- Verificar RLS policies permiten update

---

## 📞 Soporte

Para problemas con Mercado Pago:
- Docs: https://www.mercadopago.com.mx/developers/es/docs
- Soporte: https://www.mercadopago.com.mx/ayuda

