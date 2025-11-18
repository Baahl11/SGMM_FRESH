# Plan de Implementación: Stripe Connect
**Fecha:** 18 de Noviembre 2025  
**Estado:** Pendiente - Prioridad Media  
**Objetivo:** Permitir que cada médico reciba pagos directamente mientras la plataforma cobra comisión automática

---

## ⚠️ PROBLEMA IDENTIFICADO

Actualmente **TODO el dinero de depósitos va a la cuenta de Stripe de la plataforma**, no a la del médico:

- ❌ Plataforma recibe el dinero de las consultas del médico
- ❌ Requiere transferencias manuales 
- ❌ Problemas fiscales y contables
- ❌ No escalable (imagina con 100 médicos)

---

## ✅ SOLUCIÓN: Stripe Connect

Stripe Connect permite que cada médico tenga **su propia cuenta de Stripe** y reciba los pagos directamente.

### Arquitectura Propuesta:

1. **Platform Account** (agendamedpro.com - TÚ):
   - Controlas el flujo de pagos
   - Cobras comisión automática (ej: 3% + $5 MXN por transacción)
   - Provees el servicio SaaS

2. **Connected Accounts** (cada médico):
   - Crea su cuenta de Stripe durante onboarding
   - Recibe el 97% del pago directamente
   - Tú te quedas con el 3% como comisión de plataforma

### Ejemplo de Flujo:
- Paciente paga **$100 MXN** por depósito de consulta
- **$97 MXN** → Cuenta del médico (directo)
- **$3 MXN** → Tu cuenta (comisión plataforma)
- Stripe procesa todo automáticamente

---

## 📋 PLAN DE IMPLEMENTACIÓN

### **Paso 1: Extender Database Schema**

**Archivo:** `supabase/migrations/20251118_stripe_connect.sql`

```sql
-- Nueva tabla: connected_accounts
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe Connect IDs
  stripe_account_id TEXT UNIQUE NOT NULL, -- acct_xxxxx
  account_type TEXT NOT NULL CHECK (account_type IN ('express', 'standard')),
  
  -- Onboarding status
  onboarding_completed BOOLEAN DEFAULT false,
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  
  -- Account details
  business_type TEXT, -- 'individual' or 'company'
  country TEXT DEFAULT 'MX',
  email TEXT,
  
  -- Metadata
  details_submitted BOOLEAN DEFAULT false,
  requirements JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX idx_connected_accounts_stripe_id ON connected_accounts(stripe_account_id);
CREATE INDEX idx_connected_accounts_status ON connected_accounts(onboarding_completed, charges_enabled);

-- RLS
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connected account"
  ON connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Extender booking_deposits para Stripe Connect
ALTER TABLE booking_deposits
ADD COLUMN IF NOT EXISTS connected_account_id TEXT, -- Stripe Connect account que recibió el pago
ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10,2), -- Comisión de plataforma
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2); -- Monto neto al médico (amount - platform_fee_amount)

-- Nueva tabla: platform_fees (tracking de comisiones)
CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionado con el pago
  booking_deposit_id UUID REFERENCES booking_deposits(id) ON DELETE CASCADE,
  clinic_user_id UUID NOT NULL REFERENCES auth.users(id),
  connected_account_id TEXT NOT NULL,
  
  -- Montos
  total_amount DECIMAL(10,2) NOT NULL, -- Monto total del pago
  fee_amount DECIMAL(10,2) NOT NULL, -- Comisión de plataforma
  fee_percentage DECIMAL(5,2) NOT NULL, -- % aplicado (ej: 3.00)
  net_amount DECIMAL(10,2) NOT NULL, -- Lo que recibió el médico
  
  -- Stripe tracking
  stripe_application_fee_id TEXT UNIQUE,
  payment_intent_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (total_amount = fee_amount + net_amount)
);

-- Índices
CREATE INDEX idx_platform_fees_clinic_user ON platform_fees(clinic_user_id);
CREATE INDEX idx_platform_fees_created_at ON platform_fees(created_at DESC);

-- RLS
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fees"
  ON platform_fees FOR SELECT
  USING (auth.uid() = clinic_user_id);

-- Vista de analytics
CREATE OR REPLACE VIEW platform_revenue_analytics AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_transactions,
  SUM(total_amount) as total_volume,
  SUM(fee_amount) as total_platform_revenue,
  SUM(net_amount) as total_doctor_revenue,
  AVG(fee_percentage) as avg_fee_percentage
FROM platform_fees
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

**Cambios en subscriptions:**
```sql
-- Opcionalmente: agregar referencia a Connect account en suscripciones
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS connected_account_id TEXT;
```

---

### **Paso 2: Implementar Connect Onboarding Flow**

**Archivo Nuevo:** `vercel-migration/app/api/stripe/connect/onboarding/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // Verificar si ya tiene Connected Account
    const { data: existingAccount } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let accountId = existingAccount?.stripe_account_id

    // Crear nueva Connected Account si no existe
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express', // Express Account - más fácil para médicos
        country: 'MX',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          user_id: user.id,
          platform: 'agendamedpro'
        }
      })

      accountId = account.id

      // Guardar en BD
      await supabase
        .from('connected_accounts')
        .insert({
          user_id: user.id,
          stripe_account_id: accountId,
          account_type: 'express',
          email: user.email,
          country: 'MX',
          business_type: 'individual'
        })
    }

    // Crear Account Link para onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings/payments?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ 
      url: accountLink.url,
      account_id: accountId 
    })

  } catch (error: any) {
    console.error('Error creating Connect account:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear cuenta de Stripe' },
      { status: 500 }
    )
  }
}
```

**Archivo Nuevo:** `vercel-migration/app/api/stripe/connect/refresh/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: account } = await supabase
    .from('connected_accounts')
    .select('stripe_account_id')
    .eq('user_id', user.id)
    .single()

  if (!account?.stripe_account_id) {
    return NextResponse.json({ error: 'No tienes cuenta conectada' }, { status: 404 })
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: account.stripe_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings/payments?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**Archivo Nuevo:** `vercel-migration/app/api/stripe/connect/status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: connectedAccount } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!connectedAccount) {
    return NextResponse.json({ 
      connected: false,
      onboarding_completed: false 
    })
  }

  try {
    // Obtener estado actualizado de Stripe
    const account = await stripe.accounts.retrieve(connectedAccount.stripe_account_id)

    // Actualizar BD con info actualizada
    await supabase
      .from('connected_accounts')
      .update({
        onboarding_completed: account.details_submitted || false,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        details_submitted: account.details_submitted || false,
        requirements: account.requirements || {},
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    return NextResponse.json({
      connected: true,
      account_id: account.id,
      onboarding_completed: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements_due: account.requirements?.currently_due || [],
      business_type: account.business_type,
      email: account.email
    })

  } catch (error: any) {
    console.error('Error fetching Connect status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

---

### **Paso 3: Modificar Creación de Depósitos**

**Archivo:** `vercel-migration/app/api/bookings/deposits/create/route.ts`

**CAMBIOS:**

```typescript
// ANTES (línea ~80):
const session = await stripe.checkout.sessions.create({
  line_items: [{ ... }],
  mode: 'payment',
  // ...
})

// DESPUÉS:
// 1. Obtener Connected Account del médico
const { data: connectedAccount } = await supabaseAdmin
  .from('connected_accounts')
  .select('stripe_account_id, onboarding_completed, charges_enabled')
  .eq('user_id', booking.clinic_user_id)
  .single()

// 2. Calcular comisión de plataforma (3%)
const PLATFORM_FEE_PERCENTAGE = 3.0 // 3%
const platformFeeAmount = Math.round(amount * (PLATFORM_FEE_PERCENTAGE / 100) * 100) // En centavos
const netAmount = amount - (platformFeeAmount / 100)

// 3. Crear checkout con o sin Connect según disponibilidad
const sessionParams: any = {
  line_items: [{
    price_data: {
      currency: 'mxn',
      unit_amount: Math.round(amount * 100),
      product_data: {
        name: 'Depósito de Reserva',
        description: `Depósito para cita del ${bookingDate}`
      }
    },
    quantity: 1
  }],
  mode: 'payment',
  success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/cancelled?session_id={CHECKOUT_SESSION_ID}`,
  metadata: {
    deposit_type: 'booking_deposit',
    booking_id: booking.id,
    clinic_user_id: booking.clinic_user_id
  }
}

// Si el médico tiene Connect habilitado, usar Connected Account
if (connectedAccount?.stripe_account_id && connectedAccount?.charges_enabled) {
  sessionParams.payment_intent_data = {
    application_fee_amount: platformFeeAmount, // Comisión de plataforma
    transfer_data: {
      destination: connectedAccount.stripe_account_id, // Cuenta del médico
    },
    metadata: {
      booking_id: booking.id,
      clinic_user_id: booking.clinic_user_id,
      platform_fee_percentage: PLATFORM_FEE_PERCENTAGE
    }
  }
  
  console.log(`💰 Using Stripe Connect - Platform fee: $${platformFeeAmount/100} MXN (${PLATFORM_FEE_PERCENTAGE}%)`)
} else {
  console.log('⚠️ No Connected Account - Using legacy centralized payment')
}

const session = await stripe.checkout.sessions.create(sessionParams)

// 4. Guardar en BD con info de Connect
await supabaseAdmin
  .from('booking_deposits')
  .insert({
    // ... campos existentes ...
    connected_account_id: connectedAccount?.stripe_account_id || null,
    platform_fee_amount: connectedAccount?.charges_enabled ? (platformFeeAmount / 100) : null,
    net_amount: connectedAccount?.charges_enabled ? netAmount : amount
  })
```

---

### **Paso 4: Extender Webhook Handler**

**Archivo:** `vercel-migration/app/api/stripe/webhook/route.ts`

**AGREGAR nuevos event handlers:**

```typescript
// En el switch principal (línea ~85)
case 'account.updated':
  await handleAccountUpdated(event.data.object as Stripe.Account)
  break

case 'account.application.deauthorized':
  await handleAccountDeauthorized(event.data.object as Stripe.Account)
  break

case 'application_fee.created':
  await handleApplicationFeeCreated(event.data.object as Stripe.ApplicationFee)
  break

// NUEVAS FUNCIONES al final del archivo:

/**
 * Handle account.updated - Actualizar estado de Connected Account
 */
async function handleAccountUpdated(account: Stripe.Account) {
  console.log('✅ Connected Account updated:', account.id)

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabaseAdmin
    .from('connected_accounts')
    .update({
      onboarding_completed: account.details_submitted || false,
      charges_enabled: account.charges_enabled || false,
      payouts_enabled: account.payouts_enabled || false,
      details_submitted: account.details_submitted || false,
      requirements: account.requirements || {},
      updated_at: new Date().toISOString()
    })
    .eq('stripe_account_id', account.id)

  console.log(`✅ Account ${account.id} status updated in DB`)
}

/**
 * Handle account.application.deauthorized - Usuario desconectó su cuenta
 */
async function handleAccountDeauthorized(account: Stripe.Account) {
  console.log('❌ Account deauthorized:', account.id)

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Marcar cuenta como desconectada
  await supabaseAdmin
    .from('connected_accounts')
    .update({
      charges_enabled: false,
      payouts_enabled: false,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_account_id', account.id)

  console.log('✅ Account marked as deauthorized in DB')
}

/**
 * Handle application_fee.created - Tracking de comisiones
 */
async function handleApplicationFeeCreated(fee: Stripe.ApplicationFee) {
  console.log('💰 Application fee created:', fee.id, '-', fee.amount / 100, 'MXN')

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar el depósito relacionado
  const { data: deposit } = await supabaseAdmin
    .from('booking_deposits')
    .select('*')
    .eq('payment_intent_id', fee.charge)
    .single()

  if (!deposit) {
    console.error('❌ Deposit not found for application fee:', fee.id)
    return
  }

  const totalAmount = deposit.amount
  const feeAmount = fee.amount / 100
  const netAmount = totalAmount - feeAmount
  const feePercentage = (feeAmount / totalAmount) * 100

  // Registrar la comisión
  await supabaseAdmin
    .from('platform_fees')
    .insert({
      booking_deposit_id: deposit.id,
      clinic_user_id: deposit.clinic_user_id,
      connected_account_id: deposit.connected_account_id,
      total_amount: totalAmount,
      fee_amount: feeAmount,
      fee_percentage: feePercentage,
      net_amount: netAmount,
      stripe_application_fee_id: fee.id,
      payment_intent_id: deposit.payment_intent_id
    })

  console.log(`✅ Platform fee tracked: $${feeAmount} MXN (${feePercentage.toFixed(2)}%)`)
}
```

---

### **Paso 5: UI - Settings Page**

**Archivo Nuevo:** `vercel-migration/app/dashboard/settings/payments/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react'

export default function PaymentsSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [connectStatus, setConnectStatus] = useState<any>(null)
  const [onboarding, setOnboarding] = useState(false)

  useEffect(() => {
    fetchConnectStatus()
  }, [])

  async function fetchConnectStatus() {
    try {
      const res = await fetch('/api/stripe/connect/status')
      const data = await res.json()
      setConnectStatus(data)
    } catch (error) {
      console.error('Error fetching connect status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function startOnboarding() {
    setOnboarding(true)
    try {
      const res = await fetch('/api/stripe/connect/onboarding', {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url // Redirigir a Stripe onboarding
      }
    } catch (error) {
      console.error('Error starting onboarding:', error)
      alert('Error al iniciar configuración de pagos')
    } finally {
      setOnboarding(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Configuración de Pagos</h1>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Cuenta de Stripe Connect</h2>
        
        {!connectStatus?.connected ? (
          <div>
            <p className="text-gray-600 mb-4">
              Conecta tu cuenta de Stripe para recibir pagos de depósitos directamente. 
              AgendaMedPro cobrará una comisión del 3% por transacción.
            </p>
            <Button 
              onClick={startOnboarding}
              disabled={onboarding}
            >
              {onboarding ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirigiendo...</>
              ) : (
                <>Conectar Stripe</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {connectStatus.onboarding_completed ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-yellow-500" />
              )}
              <span className="font-medium">
                {connectStatus.onboarding_completed ? 'Cuenta Configurada' : 'Configuración Pendiente'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Pagos habilitados:</span>
                <span className={`ml-2 ${connectStatus.charges_enabled ? 'text-green-600' : 'text-red-600'}`}>
                  {connectStatus.charges_enabled ? 'Sí' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Retiros habilitados:</span>
                <span className={`ml-2 ${connectStatus.payouts_enabled ? 'text-green-600' : 'text-red-600'}`}>
                  {connectStatus.payouts_enabled ? 'Sí' : 'No'}
                </span>
              </div>
            </div>

            {!connectStatus.onboarding_completed && (
              <Button 
                onClick={startOnboarding}
                variant="outline"
                disabled={onboarding}
              >
                {onboarding ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirigiendo...</>
                ) : (
                  <>Completar Configuración <ExternalLink className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Información de Comisiones</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Comisión de plataforma: 3% por transacción</li>
                <li>• Recibes el 97% de cada depósito directamente</li>
                <li>• Sin costos ocultos ni tarifas mensuales adicionales</li>
              </ul>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
```

---

### **Paso 6: Migración & Compatibilidad**

**Estrategia de Rollout:**

1. **Fase 1 - Dual Mode (Recomendado):**
   - Si usuario tiene `connected_account_id` → Usar Connect
   - Si no tiene → Usar modo legacy (actual)
   - Todos los médicos nuevos deben conectar Stripe
   - Médicos existentes tienen banner: "Conecta tu cuenta de Stripe para recibir pagos directamente"

2. **Fase 2 - Migración Gradual (30 días):**
   - Email a todos los usuarios explicando el cambio
   - Banner permanente en dashboard
   - Después de 30 días: requerir Connect para recibir nuevos depósitos

3. **Fase 3 - Solo Connect:**
   - Todos los depósitos van via Connect
   - Modo legacy solo para suscripciones de plataforma

---

## 🎯 DECISIONES PENDIENTES

### 1. Modelo de Comisiones
**Opciones:**
- **A) Flat 3%** (Simple, predecible)
- **B) Escalonado:** Básico 5% / Pro 3% / Enterprise 1%
- **C) Híbrido:** 3% + $5 MXN fijo por transacción

**Recomendación:** Empezar con 3% flat, analizar después de 3 meses.

### 2. Tipo de Connected Account
**Opciones:**
- **Express** (Recomendado): Stripe maneja compliance, más fácil para médicos
- **Standard**: Más control pero más complejo

**Recomendación:** Express para MVP

### 3. Flujo de Suscripciones
**Opciones:**
- **A) Suscripciones a plataforma, depósitos a médicos** (Recomendado)
- **B) Todo via Connect** (más complejo fiscalmente)

**Recomendación:** A - Las suscripciones Básico/Pro/Enterprise van a tu cuenta porque TÚ provees el software.

### 4. Usuarios Existentes
**Opciones:**
- **A) Pausar depósitos hasta Connect** (agresivo)
- **B) 30 días de transición en modo legacy** (recomendado)
- **C) Dual mode indefinido** (legacy code forever)

**Recomendación:** B - 30 días de gracia

### 5. Payout Schedule
**Opciones:**
- Diario (default Stripe)
- Semanal
- Mensual
- Manual

**Recomendación:** Automático semanal (viernes)

---

## 📊 MÉTRICAS A TRACKEAR

Una vez implementado:

```sql
-- Revenue de plataforma por mes
SELECT * FROM platform_revenue_analytics ORDER BY month DESC LIMIT 12;

-- Tasa de adopción de Connect
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed THEN 1 END) as connected_users,
  ROUND(COUNT(CASE WHEN onboarding_completed THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as adoption_rate
FROM users u
LEFT JOIN connected_accounts ca ON ca.user_id = u.id;

-- Top doctors por revenue
SELECT 
  u.name,
  COUNT(pf.id) as total_transactions,
  SUM(pf.net_amount) as total_revenue,
  SUM(pf.fee_amount) as platform_fees_paid
FROM platform_fees pf
JOIN users u ON u.id = pf.clinic_user_id
WHERE pf.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name
ORDER BY total_revenue DESC
LIMIT 10;
```

---

## ⏱️ ESTIMACIÓN DE TIEMPO

- **Paso 1 - Database:** 1 hora
- **Paso 2 - Onboarding API:** 2 horas
- **Paso 3 - Modificar Deposits:** 2 horas
- **Paso 4 - Webhooks:** 1 hora
- **Paso 5 - UI Settings:** 2 horas
- **Paso 6 - Testing:** 3 horas

**Total:** ~11 horas (1.5 días de trabajo)

---

## 📚 RECURSOS

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Express Accounts Guide](https://stripe.com/docs/connect/express-accounts)
- [Application Fees](https://stripe.com/docs/connect/charges#application-fees)
- [Account Links](https://stripe.com/docs/connect/enable-payment-acceptance-guide)

---

## ✅ NEXT STEPS

1. **Revisar este plan** y confirmar decisiones pendientes
2. **Crear migration** 20251118_stripe_connect.sql
3. **Implementar API endpoints** de Connect
4. **Modificar deposit creation** con lógica dual-mode
5. **Testing exhaustivo** en Stripe test mode
6. **Deploy gradual** con feature flag

---

**Estado:** ⏸️ PAUSADO - Prioridad a resolver error 500 en /api/stripe/checkout para Lifetime
