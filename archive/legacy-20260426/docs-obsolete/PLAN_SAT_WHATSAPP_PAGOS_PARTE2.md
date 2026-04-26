# Plan de Implementación: Pagos + Timeline (Parte 2)

**Fecha:** Noviembre 2025  
**Objetivo:** Completar integraciones de pago Stripe y OpenPay para Q1 2026  
**Prioridad:** ALTA (Revenue-critical features)

---

## Índice - Parte 2

3. [Pagos con Stripe](#3-pagos-con-stripe)
   - Estado Actual (95% Completo)
   - Gaps Menores
4. [Pagos con OpenPay](#4-pagos-con-openpay)
   - Estado Actual (40% Completo)
   - Implementación Completa API
   - MSI (Meses Sin Intereses)
5. [Timeline de Implementación](#5-timeline-de-implementación)
6. [Matriz de Prioridades](#6-matriz-de-prioridades)
7. [Costos y ROI](#7-costos-y-roi)

---

## 3. Pagos con Stripe

### 3.1 Estado Actual (95% Completo)

#### ✅ Implementado

**Stripe Integration (`lib/stripe/`)**
```typescript
// lib/stripe/client.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

// lib/stripe/subscriptions.ts
export async function createCheckoutSession(params: {
  priceId: string;
  userId: string;
  email: string;
  trialDays?: number;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: params.priceId,
      quantity: 1
    }],
    customer_email: params.email,
    metadata: {
      user_id: params.userId
    },
    subscription_data: {
      trial_period_days: params.trialDays || 7,
      metadata: {
        user_id: params.userId
      }
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
  });

  return session;
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  });

  return subscription;
}

export async function updateSubscription(params: {
  subscriptionId: string;
  newPriceId: string;
}) {
  const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);
  
  const updatedSubscription = await stripe.subscriptions.update(params.subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: params.newPriceId
    }],
    proration_behavior: 'create_prorations'  // Cobrar diferencia proporcional
  });

  return updatedSubscription;
}
```

**Webhook Handler (`app/api/webhooks/stripe/route.ts` - 200+ líneas)**
```typescript
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Procesar eventos
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  
  // Actualizar subscription en DB
  await supabase
    .from('subscriptions')
    .update({
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      status: 'active'
    })
    .eq('user_id', userId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;
  const priceId = subscription.items.data[0].price.id;

  // Mapear price ID a plan tier
  const planTierMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_BASICO!]: 'basico',
    [process.env.STRIPE_PRICE_PRO!]: 'pro',
    [process.env.STRIPE_PRICE_ENTERPRISE!]: 'enterprise',
    [process.env.STRIPE_PRICE_LIFETIME!]: 'lifetime'
  };

  await supabase
    .from('subscriptions')
    .update({
      plan_tier: planTierMap[priceId],
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end
    })
    .eq('user_id', userId);
}
```

**Database Schema**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  plan_tier TEXT NOT NULL,  -- basico, pro, enterprise, lifetime
  status TEXT NOT NULL,  -- active, trialing, past_due, canceled, incomplete
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  max_doctors INTEGER NOT NULL,
  max_locations INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Function para validar límites de subscription
CREATE OR REPLACE FUNCTION check_subscription_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
  v_doctor_count INTEGER;
  v_location_count INTEGER;
BEGIN
  -- Obtener subscription del usuario
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = NEW.user_id;

  IF TG_TABLE_NAME = 'doctors' THEN
    -- Contar doctores actuales
    SELECT COUNT(*) INTO v_doctor_count
    FROM doctors
    WHERE user_id = NEW.user_id;

    IF v_doctor_count >= v_subscription.max_doctors THEN
      RAISE EXCEPTION 'Has alcanzado el límite de doctores para tu plan (%). Actualiza tu suscripción.', v_subscription.max_doctors;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'locations' THEN
    -- Contar ubicaciones actuales
    SELECT COUNT(*) INTO v_location_count
    FROM locations
    WHERE user_id = NEW.user_id;

    IF v_location_count >= v_subscription.max_locations THEN
      RAISE EXCEPTION 'Has alcanzado el límite de ubicaciones para tu plan (%). Actualiza tu suscripción.', v_subscription.max_locations;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER enforce_doctor_limits
  BEFORE INSERT ON doctors
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_limits();

CREATE TRIGGER enforce_location_limits
  BEFORE INSERT ON locations
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_limits();
```

**Pricing Configuration**
```typescript
// lib/pricing/plans.ts
export const PRICING_PLANS = {
  basico: {
    name: 'Básico',
    price: 599,
    currency: 'MXN',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_BASICO!,
    features: [
      '1 doctor',
      '1 ubicación',
      'Agenda ilimitada',
      'Expedientes digitales',
      'Recetas y recibos',
      'Reportes básicos'
    ],
    limits: {
      maxDoctors: 1,
      maxLocations: 1
    }
  },
  pro: {
    name: 'Pro',
    price: 999,
    currency: 'MXN',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_PRO!,
    features: [
      '3 doctores',
      '2 ubicaciones',
      'Todo en Básico +',
      'Facturación SAT',
      'WhatsApp recordatorios',
      'Reportes avanzados',
      'Inventario de productos'
    ],
    limits: {
      maxDoctors: 3,
      maxLocations: 2
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 2999,
    currency: 'MXN',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE!,
    features: [
      'Doctores ilimitados',
      '5 ubicaciones',
      'Todo en Pro +',
      'API access',
      'Soporte prioritario',
      'Capacitación personalizada',
      'Integraciones custom'
    ],
    limits: {
      maxDoctors: 999,
      maxLocations: 5
    }
  },
  lifetime: {
    name: 'Lifetime',
    price: 19999,
    currency: 'MXN',
    interval: 'one_time',
    stripePriceId: process.env.STRIPE_PRICE_LIFETIME!,
    features: [
      'Acceso de por vida',
      '5 doctores',
      '3 ubicaciones',
      'Todas las features actuales y futuras',
      'Soporte prioritario lifetime',
      'Sin pagos mensuales'
    ],
    limits: {
      maxDoctors: 5,
      maxLocations: 3
    }
  }
};
```

**UI Components**
```typescript
// components/billing/PricingCards.tsx
export function PricingCards() {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(planId: keyof typeof PRICING_PLANS) {
    setLoading(planId);

    const plan = PRICING_PLANS[planId];
    
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: plan.stripePriceId,
        userId: user.id,
        email: user.email
      })
    });

    const { sessionUrl } = await response.json();
    window.location.href = sessionUrl;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Object.entries(PRICING_PLANS).map(([key, plan]) => (
        <Card key={key} className={key === 'pro' ? 'border-blue-500 border-2' : ''}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <div className="mt-4">
              <span className="text-4xl font-bold">
                ${plan.price.toLocaleString()}
              </span>
              <span className="text-gray-600 ml-2">
                {plan.interval === 'month' ? '/mes' : 'único'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleSubscribe(key as any)}
              disabled={!!loading}
              className="w-full"
            >
              {loading === key ? 'Procesando...' : 'Suscribirse'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// components/billing/SubscriptionManagement.tsx
export function SubscriptionManagement() {
  const { subscription } = useSubscription();

  async function handleCancelSubscription() {
    if (!confirm('¿Seguro que deseas cancelar? Perderás acceso al final del periodo.')) {
      return;
    }

    await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: subscription.stripe_subscription_id
      })
    });

    toast.success('Suscripción cancelada. Tendrás acceso hasta ' + formatDate(subscription.current_period_end));
  }

  async function handleUpgrade(newPlanId: string) {
    await fetch('/api/stripe/update-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: subscription.stripe_subscription_id,
        newPriceId: PRICING_PLANS[newPlanId].stripePriceId
      })
    });

    toast.success('Plan actualizado exitosamente');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu Suscripción Actual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Plan</Label>
            <p className="text-2xl font-bold">{PRICING_PLANS[subscription.plan_tier].name}</p>
          </div>

          <div>
            <Label>Estado</Label>
            <Badge variant={subscription.status === 'active' ? 'success' : 'warning'}>
              {subscription.status}
            </Badge>
          </div>

          <div>
            <Label>Próximo pago</Label>
            <p>{formatDate(subscription.current_period_end)}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => handleUpgrade('enterprise')}>
              Actualizar Plan
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription}>
              Cancelar Suscripción
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 3.2 Gaps Menores (5% Faltante)

#### ⚠️ **GAP 1: Payment Links**

**Problema Actual:**
```typescript
// No se pueden crear links de pago para clientes sin cuenta
```

**Caso de Uso:**
- Médico quiere enviar link de pago por WhatsApp
- Cliente paga sin crear cuenta en AgendaMedPro

**Solución:**
```typescript
// app/api/stripe/payment-links/route.ts
export async function POST(request: Request) {
  const { amount, description, customerEmail } = await request.json();

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{
      price_data: {
        currency: 'mxn',
        product_data: {
          name: description
        },
        unit_amount: amount * 100  // Convertir a centavos
      },
      quantity: 1
    }],
    after_completion: {
      type: 'redirect',
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`
      }
    },
    metadata: {
      customer_email: customerEmail
    }
  });

  return NextResponse.json({ url: paymentLink.url });
}
```

**Esfuerzo Estimado:** 2 horas

---

### 3.3 Resumen Stripe

| Componente | Estado | Esfuerzo Faltante | Prioridad |
|------------|--------|------------------|-----------|
| Subscriptions | ✅ 100% | 0 horas | - |
| Webhooks | ✅ 100% | 0 horas | - |
| Checkout Flow | ✅ 100% | 0 horas | - |
| RLS Enforcement | ✅ 100% | 0 horas | - |
| Payment Links | ❌ 0% | 2 horas | **P2** |
| **TOTAL** | **95%** | **2 horas** | **1 día** |

---

## 4. Pagos con OpenPay

### 4.1 Estado Actual (40% Completo)

#### ✅ Implementado

**Cálculo de Comisiones UI (`components/records/RecordForm.tsx`)**
```typescript
// ✅ Frontend calcula comisiones MSI
const MSI_RATES = {
  3: 0.0349,   // 3.49%
  6: 0.0599,   // 5.99%
  9: 0.0899,   // 8.99%
  12: 0.1199   // 11.99%
};

function calculateMSICommission(amount: number, months: number) {
  const rate = MSI_RATES[months as keyof typeof MSI_RATES] || 0;
  return amount * rate;
}

// UI
<Select
  value={mesesSinIntereses?.toString()}
  onValueChange={(value) => {
    const months = parseInt(value);
    setMesesSinIntereses(months);
    
    const commission = calculateMSICommission(montoPagado, months);
    setComisionMonto(commission);
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar meses" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Pago único (sin comisión)</SelectItem>
    <SelectItem value="3">3 meses - 3.49% comisión</SelectItem>
    <SelectItem value="6">6 meses - 5.99% comisión</SelectItem>
    <SelectItem value="9">9 meses - 8.99% comisión</SelectItem>
    <SelectItem value="12">12 meses - 11.99% comisión</SelectItem>
  </SelectContent>
</Select>

{comisionMonto > 0 && (
  <Alert>
    <AlertDescription>
      Comisión MSI: ${comisionMonto.toFixed(2)} MXN
      <br />
      Total a recibir: ${(montoPagado - comisionMonto).toFixed(2)} MXN
    </AlertDescription>
  </Alert>
)}
```

**Database Schema**
```sql
-- ✅ Campos para pagos OpenPay en records
ALTER TABLE records
  ADD COLUMN tipo_tarjeta TEXT,  -- debito, credito
  ADD COLUMN meses_sin_intereses INTEGER,
  ADD COLUMN comision_porcentaje DECIMAL(5,4),
  ADD COLUMN comision_monto DECIMAL(10,2),
  ADD COLUMN openpay_transaction_id TEXT,
  ADD COLUMN openpay_authorization TEXT;
```

---

### 4.2 Gaps Críticos (60% Faltante)

#### 🚨 **GAP 1: OpenPay API Integration (CRÍTICO)**

**Problema Actual:**
```typescript
// ❌ NO hay integración con OpenPay API
// Solo se guardan datos calculados en frontend
```

**Solución Completa:**

**Paso 1: Configuración OpenPay**

```bash
npm install openpay
```

```typescript
// lib/openpay/client.ts
import Openpay from 'openpay';

export const openpay = new Openpay(
  process.env.OPENPAY_MERCHANT_ID!,
  process.env.OPENPAY_PRIVATE_KEY!,
  process.env.NODE_ENV === 'production'  // false = sandbox
);
```

**Paso 2: Crear cargo con MSI**

```typescript
// lib/openpay/charges.ts
export async function createCharge(params: {
  amount: number;
  description: string;
  customerId: string;
  cardId?: string;  // Si usa tarjeta guardada
  tokenId?: string;  // Si usa token de tarjeta nueva
  msi?: number;  // Meses sin intereses
}) {
  const chargeRequest: any = {
    method: 'card',
    amount: params.amount,
    currency: 'MXN',
    description: params.description,
    customer_id: params.customerId,
    confirm: true,
    capture: true
  };

  // Usar tarjeta guardada o token
  if (params.cardId) {
    chargeRequest.card_id = params.cardId;
  } else if (params.tokenId) {
    chargeRequest.source_id = params.tokenId;
  }

  // Agregar MSI si aplica
  if (params.msi && params.msi > 1) {
    chargeRequest.payment_plan = {
      payments: params.msi
    };
  }

  // Crear cargo
  const charge = await openpay.charges.create(chargeRequest);

  return {
    id: charge.id,
    status: charge.status,  // completed, in_progress, failed
    authorization: charge.authorization,
    amount: charge.amount,
    fee: charge.fee,  // Comisión OpenPay
    created_at: charge.creation_date
  };
}

// Crear customer en OpenPay
export async function createCustomer(params: {
  name: string;
  email: string;
  phone: string;
}) {
  const customer = await openpay.customers.create({
    name: params.name,
    email: params.email,
    phone_number: params.phone,
    requires_account: false
  });

  return customer;
}

// Tokenizar tarjeta (desde frontend)
export async function createCardToken(cardData: {
  cardNumber: string;
  holderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}) {
  // Esto se hace desde frontend con OpenPay.js
  // Backend solo recibe el token
  return 'token generado en frontend';
}
```

**Paso 3: API Endpoints**

```typescript
// app/api/openpay/charges/route.ts
export async function POST(request: Request) {
  const {
    amount,
    description,
    patientId,
    recordId,
    cardToken,
    msi
  } = await request.json();

  const { user } = await getUser(request);

  // 1. Obtener o crear customer OpenPay
  const { data: patient } = await supabase
    .from('patients')
    .select('*, openpay_customer_id')
    .eq('id', patientId)
    .single();

  let customerId = patient.openpay_customer_id;

  if (!customerId) {
    const customer = await createCustomer({
      name: patient.name,
      email: patient.email,
      phone: patient.phone
    });

    customerId = customer.id;

    // Guardar customer ID
    await supabase
      .from('patients')
      .update({ openpay_customer_id: customerId })
      .eq('id', patientId);
  }

  // 2. Calcular comisión MSI
  const MSI_RATES: Record<number, number> = {
    3: 0.0349,
    6: 0.0599,
    9: 0.0899,
    12: 0.1199
  };

  const commission = msi > 1 ? amount * MSI_RATES[msi] : 0;

  // 3. Crear cargo
  const charge = await createCharge({
    amount,
    description,
    customerId,
    tokenId: cardToken,
    msi
  });

  // 4. Actualizar record con info del pago
  await supabase
    .from('records')
    .update({
      monto_pagado: amount,
      tipo_pago: 'tarjeta',
      tipo_tarjeta: msi > 1 ? 'credito' : 'debito',
      meses_sin_intereses: msi,
      comision_porcentaje: MSI_RATES[msi] || 0,
      comision_monto: commission,
      openpay_transaction_id: charge.id,
      openpay_authorization: charge.authorization,
      payment_status: charge.status === 'completed' ? 'paid' : 'pending'
    })
    .eq('id', recordId);

  return NextResponse.json({
    success: true,
    charge,
    commission
  });
}
```

**Paso 4: Frontend con OpenPay.js**

```typescript
// components/payments/OpenPayCheckout.tsx
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    OpenPay: any;
  }
}

export function OpenPayCheckout({ amount, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [deviceSessionId, setDeviceSessionId] = useState('');

  useEffect(() => {
    // Cargar OpenPay.js
    const script = document.createElement('script');
    script.src = 'https://js.openpay.mx/openpay.v1.min.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Configurar OpenPay
      window.OpenPay.setId(process.env.NEXT_PUBLIC_OPENPAY_MERCHANT_ID);
      window.OpenPay.setApiKey(process.env.NEXT_PUBLIC_OPENPAY_PUBLIC_KEY);
      window.OpenPay.setSandboxMode(process.env.NODE_ENV !== 'production');

      // Generar device session ID (para 3D Secure)
      const sessionId = window.OpenPay.deviceData.setup();
      setDeviceSessionId(sessionId);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Tokenizar tarjeta
    window.OpenPay.token.create({
      card_number: formData.get('cardNumber'),
      holder_name: formData.get('holderName'),
      expiration_year: formData.get('expirationYear'),
      expiration_month: formData.get('expirationMonth'),
      cvv2: formData.get('cvv')
    }, 
    async (response: any) => {
      // Token creado exitosamente
      const cardToken = response.data.id;

      // Enviar al backend
      const result = await fetch('/api/openpay/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          cardToken,
          msi: parseInt(formData.get('msi') as string),
          deviceSessionId,
          // ... otros datos
        })
      });

      const data = await result.json();
      
      if (data.success) {
        onSuccess(data.charge);
      }
      
      setLoading(false);
    },
    (error: any) => {
      // Error al tokenizar
      console.error('Error OpenPay:', error);
      toast.error(error.data.description);
      setLoading(false);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pago con Tarjeta</CardTitle>
        <CardDescription>
          Total a pagar: ${amount.toLocaleString()} MXN
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="holderName">Nombre del titular</Label>
            <Input
              id="holderName"
              name="holderName"
              placeholder="JUAN PÉREZ"
              required
            />
          </div>

          <div>
            <Label htmlFor="cardNumber">Número de tarjeta</Label>
            <Input
              id="cardNumber"
              name="cardNumber"
              placeholder="4111 1111 1111 1111"
              maxLength={16}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expirationMonth">Mes</Label>
              <Input
                id="expirationMonth"
                name="expirationMonth"
                placeholder="12"
                maxLength={2}
                required
              />
            </div>
            <div>
              <Label htmlFor="expirationYear">Año</Label>
              <Input
                id="expirationYear"
                name="expirationYear"
                placeholder="25"
                maxLength={2}
                required
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                name="cvv"
                placeholder="123"
                maxLength={4}
                type="password"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="msi">Meses sin intereses</Label>
            <Select name="msi" defaultValue="1">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Pago único</SelectItem>
                <SelectItem value="3">3 meses - 3.49%</SelectItem>
                <SelectItem value="6">6 meses - 5.99%</SelectItem>
                <SelectItem value="9">9 meses - 8.99%</SelectItem>
                <SelectItem value="12">12 meses - 11.99%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Procesando...' : 'Pagar'}
          </Button>

          <div className="flex items-center justify-center gap-2 mt-4">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">
              Pago seguro con OpenPay
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Paso 5: Webhooks OpenPay**

```typescript
// app/api/webhooks/openpay/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  // Verificar firma (OpenPay firma webhooks)
  const signature = request.headers.get('x-openpay-signature');
  // ... validar firma

  switch (body.type) {
    case 'charge.succeeded':
      await handleChargeSucceeded(body.transaction);
      break;

    case 'charge.failed':
      await handleChargeFailed(body.transaction);
      break;

    case 'charge.refunded':
      await handleChargeRefunded(body.transaction);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleChargeSucceeded(transaction: any) {
  // Actualizar record como pagado
  await supabase
    .from('records')
    .update({
      payment_status: 'paid',
      openpay_authorization: transaction.authorization
    })
    .eq('openpay_transaction_id', transaction.id);
}
```

**Paso 6: Database para configuración OpenPay**

```sql
-- Migration: 20251116_openpay_config.sql

CREATE TABLE openpay_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  merchant_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,  -- AES-256-GCM
  private_key_iv TEXT NOT NULL,
  private_key_tag TEXT NOT NULL,
  is_sandbox BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agregar customer ID a pacientes
ALTER TABLE patients
  ADD COLUMN openpay_customer_id TEXT;

-- Crear índice
CREATE INDEX idx_patients_openpay_customer ON patients(openpay_customer_id);
```

**Esfuerzo Estimado:** 24 horas
- 4h: Setup OpenPay SDK + configuración
- 6h: Backend API (charges, customers, tokens)
- 8h: Frontend checkout con OpenPay.js + 3D Secure
- 4h: Webhooks + testing
- 2h: Configuración multi-tenant

---

#### ⚠️ **GAP 2: Tarjetas Guardadas**

**Problema Actual:**
```typescript
// Paciente tiene que ingresar tarjeta cada vez
```

**Solución:**
```typescript
// lib/openpay/cards.ts
export async function saveCard(params: {
  customerId: string;
  cardToken: string;
}) {
  const card = await openpay.customers.cards.create(
    params.customerId,
    { token_id: params.cardToken }
  );

  return {
    id: card.id,
    type: card.type,
    brand: card.brand,
    cardNumber: card.card_number,  // **** **** **** 1234
    holderName: card.holder_name,
    expirationMonth: card.expiration_month,
    expirationYear: card.expiration_year
  };
}

export async function listCards(customerId: string) {
  const cards = await openpay.customers.cards.list(customerId);
  return cards.data;
}

export async function deleteCard(customerId: string, cardId: string) {
  await openpay.customers.cards.delete(customerId, cardId);
}
```

**Database:**
```sql
CREATE TABLE saved_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients NOT NULL,
  openpay_card_id TEXT NOT NULL,
  brand TEXT NOT NULL,  -- visa, mastercard, amex
  last_four TEXT NOT NULL,
  expiration_month TEXT NOT NULL,
  expiration_year TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**UI:**
```typescript
// components/payments/SavedCards.tsx
<div className="space-y-2">
  {savedCards.map((card) => (
    <Card key={card.id} className={card.is_default ? 'border-blue-500' : ''}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6" />
          <div>
            <p className="font-medium">{card.brand.toUpperCase()} **** {card.last_four}</p>
            <p className="text-sm text-gray-600">
              Vence {card.expiration_month}/{card.expiration_year}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!card.is_default && (
            <Button size="sm" onClick={() => setDefaultCard(card.id)}>
              Predeterminar
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deleteCard(card.id)}
          >
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

**Esfuerzo Estimado:** 6 horas

---

### 4.3 Resumen OpenPay

| Componente | Estado | Esfuerzo Faltante | Prioridad |
|------------|--------|------------------|-----------|
| Cálculo Comisiones UI | ✅ 100% | 0 horas | - |
| Database Schema | ✅ 100% | 0 horas | - |
| OpenPay API Integration | ❌ 0% | 24 horas | **P0** |
| Tarjetas Guardadas | ❌ 0% | 6 horas | **P1** |
| 3D Secure | ❌ 0% | 4 horas | **P1** |
| **TOTAL** | **40%** | **34 horas** | **3-4 semanas** |

---

## 5. Timeline de Implementación

### Fase 1: Críticos (Semana 1-2) - 48 horas

**Prioridad P0 - Must Have**

| Tarea | Feature | Esfuerzo | Responsable |
|-------|---------|----------|-------------|
| Encriptación AES-256-GCM | Facturación SAT | 8h | Backend |
| Testing Producción + CSD | Facturación SAT | 12h | Backend + QA |
| Templates Meta | WhatsApp | 6h | Backend + Meta |
| Opt-in/Opt-out | WhatsApp | 4h | Backend + Frontend |
| OpenPay API Base | Pagos | 24h | Backend + Frontend |

**Total Fase 1:** 54 horas (2 semanas con 1 developer full-time)

---

### Fase 2: Enhanced (Semana 3-4) - 36 horas

**Prioridad P1 - Should Have**

| Tarea | Feature | Esfuerzo | Responsable |
|-------|---------|----------|-------------|
| Facturación Masiva | Facturación SAT | 6h | Backend |
| Notas de Crédito | Facturación SAT | 8h | Backend |
| Webhook Status Updates | WhatsApp | 4h | Backend |
| Tarjetas Guardadas | Pagos OpenPay | 6h | Backend + Frontend |
| 3D Secure | Pagos OpenPay | 4h | Frontend |

**Total Fase 2:** 28 horas (1 semana)

---

### Fase 3: Nice to Have (Semana 5) - 6 horas

**Prioridad P2 - Could Have**

| Tarea | Feature | Esfuerzo | Responsable |
|-------|---------|----------|-------------|
| Reportes Dashboard | Facturación SAT | 4h | Frontend |
| Payment Links | Stripe | 2h | Backend |

**Total Fase 3:** 6 horas (3 días)

---

### Timeline Visual

```
Semana 1
├─ Lun-Mar: Encriptación passwords Facturama (8h)
├─ Mié-Jue: Testing producción + CSD upload (12h)
└─ Vie: Templates Meta WhatsApp (6h)

Semana 2
├─ Lun: Opt-in/opt-out WhatsApp (4h)
├─ Mar-Jue: OpenPay SDK + API base (16h)
└─ Vie: OpenPay checkout frontend (8h)

Semana 3
├─ Lun: Facturación masiva (6h)
├─ Mar-Mié: Notas de crédito (8h)
├─ Jue: Webhook WhatsApp (4h)
└─ Vie: Tarjetas guardadas (6h)

Semana 4
├─ Lun: 3D Secure OpenPay (4h)
├─ Mar: Reportes facturación (4h)
└─ Mié: Payment links Stripe (2h)
```

**Total Proyecto:** 88 horas (4-5 semanas con 1 developer, 2-3 semanas con 2 developers)

---

## 6. Matriz de Prioridades

### Por Impacto en Revenue

| Feature | Impacto Revenue | Effort | Prioridad | Ratio (Impact/Effort) |
|---------|-----------------|--------|-----------|------------------------|
| OpenPay MSI | 🔥🔥🔥 Alto | 24h | **P0** | 4.2 |
| Facturación SAT | 🔥🔥🔥 Alto | 20h | **P0** | 5.0 |
| WhatsApp Templates | 🔥🔥 Medio | 6h | **P0** | 3.3 |
| Tarjetas Guardadas | 🔥🔥 Medio | 6h | **P1** | 3.3 |
| Notas de Crédito | 🔥 Bajo | 8h | **P1** | 1.3 |
| Payment Links | 🔥 Bajo | 2h | **P2** | 2.0 |

### Por Riesgo Legal/Compliance

| Feature | Riesgo | Urgencia | Prioridad |
|---------|--------|----------|-----------|
| Encriptación Passwords | 🚨 CRÍTICO | Inmediato | **P0** |
| Opt-in/Opt-out WhatsApp | 🚨 ALTO | 1 semana | **P0** |
| 3D Secure OpenPay | ⚠️ MEDIO | 2 semanas | **P1** |
| Templates Meta | ⚠️ MEDIO | 3 días | **P0** |

### Por Solicitudes de Clientes

| Feature | # Solicitudes | Churn Risk | Prioridad |
|---------|---------------|------------|-----------|
| Facturación SAT | 18 | 🔴 Alto | **P0** |
| MSI Pagos | 12 | 🔴 Alto | **P0** |
| WhatsApp Automático | 15 | 🟡 Medio | **P0** |
| Facturación Masiva | 5 | 🟢 Bajo | **P1** |

---

## 7. Costos y ROI

### 7.1 Costos de Implementación

**Desarrollo (88 horas a $50 USD/hora):** $4,400 USD

**Servicios Externos (mensual):**
- Facturama API: $299 MXN/mes por cliente (~$17 USD)
- OpenPay: 2.99% + $2.50 MXN por transacción
- Stripe: 3.6% + $3 MXN por transacción
- Meta WhatsApp Business: $0.04 USD por mensaje entregado

**Total Inversión Inicial:** $4,400 USD

---

### 7.2 ROI Proyectado

**Asumiendo 100 clientes activos en 6 meses:**

**Revenue Incremental:**
1. **Facturación SAT:** 18 clientes esperando feature × $999 MXN/mes = $17,982 MXN/mes ($1,000 USD/mes)
2. **MSI Pagos:** 12 clientes × comisión 5% promedio × $10,000 MXN promedio/cliente/mes = $6,000 MXN/mes ($333 USD/mes)
3. **WhatsApp Automation:** Reducción churn 10% = retención de 10 clientes × $999 MXN = $9,990 MXN/mes ($555 USD/mes)

**Revenue Total Mensual:** $1,888 USD/mes  
**Revenue Anual:** $22,656 USD/año

**ROI:** ($22,656 - $4,400) / $4,400 = **415% ROI en primer año**

**Breakeven:** 2.3 meses

---

### 7.3 Comparativa de Esfuerzo vs. Impact

| Feature | Dev Hours | Revenue/Mes | ROI ($/hour) | Ranking |
|---------|-----------|-------------|--------------|---------|
| Facturación SAT | 20h | $1,000 | $50/h | 🥇 1 |
| OpenPay MSI | 24h | $333 | $13.87/h | 🥈 2 |
| WhatsApp | 10h | $555 | $55.50/h | 🥉 3 |
| Stripe Payment Links | 2h | $50 | $25/h | 4 |

---

## 8. Riesgos y Mitigación

### 8.1 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Facturama API downtime | Media | Alto | Implementar retry logic + queue |
| Meta rechaza templates | Alta | Crítico | Usar lenguaje neutro, evitar promociones |
| OpenPay 3D Secure falla | Media | Alto | Testing exhaustivo con tarjetas de prueba |
| Stripe webhook pierde eventos | Baja | Crítico | Reconciliación diaria con Stripe API |

### 8.2 Riesgos de Negocio

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Clientes no adoptan MSI | Media | Medio | Educación en onboarding + incentivos |
| Costos WhatsApp > presupuesto | Alta | Medio | Límites diarios configurables |
| Facturama aumenta precios | Baja | Medio | Evaluar PAC alternativo (Ecodex, SW Sapien) |

---

## 9. Checklist de Lanzamiento

### Pre-Launch (1 semana antes)

- [ ] **Seguridad:**
  - [ ] Passwords Facturama encriptados con AES-256-GCM
  - [ ] Passwords OpenPay encriptados
  - [ ] Stripe webhooks con verificación de firma
  - [ ] RLS policies actualizadas

- [ ] **Testing:**
  - [ ] Facturación SAT en sandbox → UUID válido en SAT
  - [ ] WhatsApp templates aprobados por Meta
  - [ ] OpenPay cargo con MSI exitoso
  - [ ] Stripe checkout flow completo

- [ ] **Compliance:**
  - [ ] Términos y condiciones actualizados (MSI, comisiones)
  - [ ] Aviso de privacidad (WhatsApp opt-in)
  - [ ] PCI-DSS compliance (no almacenar CVV)

### Launch Day

- [ ] Deploy a producción
- [ ] Monitoreo de errores (Sentry/Datadog)
- [ ] Comunicado a clientes beta (email + WhatsApp)
- [ ] Soporte extendido (12 horas disponibilidad)

### Post-Launch (1 semana después)

- [ ] Review de métricas:
  - [ ] Facturas generadas exitosamente
  - [ ] WhatsApp delivery rate > 95%
  - [ ] OpenPay approval rate
  - [ ] Stripe churn rate

- [ ] Recolección de feedback
- [ ] Iteración rápida en bugs críticos

---

## 10. Próximos Pasos Inmediatos

### Esta Semana

1. **Lunes:** 
   - Crear script de encriptación AES-256-GCM
   - Migrar passwords Facturama existentes

2. **Martes:**
   - Solicitar credenciales producción cliente piloto
   - Subir certificados CSD

3. **Miércoles:**
   - Crear templates WhatsApp en Meta Business Manager
   - Esperar aprobación (1-3 días)

4. **Jueves:**
   - Setup OpenPay SDK
   - Configurar sandbox merchant

5. **Viernes:**
   - Testing end-to-end de Facturación SAT
   - Demo a cliente piloto

---

**Fin del Plan - Parte 2**

Ver [PLAN_SAT_WHATSAPP_PAGOS_PARTE1.md](./PLAN_SAT_WHATSAPP_PAGOS_PARTE1.md) para:
- Facturación SAT (estado 80%)
- WhatsApp Recordatorios (estado 90%)

---

**Última actualización:** Noviembre 16, 2025  
**Autor:** AgendaMedPro Development Team