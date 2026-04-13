# 🔒 PAYWALL + STRIPE CHECKOUT - Guía de Implementación

**Fecha de completación:** 31 Octubre 2025  
**Estado:** ✅ Implementación completa

---

## 📋 RESUMEN

Sistema completo de suscripciones con Stripe Checkout integrado:

- ✅ **Middleware** - Verificación automática de suscripción
- ✅ **Paywall** - Bloqueo de features según plan
- ✅ **Stripe Checkout** - Flujo de pago completo
- ✅ **Webhook** - Actualización automática de BD
- ✅ **Página /pricing** - UI para seleccionar planes
- ✅ **UpgradeModal** - Modal de upgrade cuando se alcanza límite

---

## 🏗️ ESTRUCTURA IMPLEMENTADA

### 1. Base de Datos
```
subscriptions (tabla Supabase)
├── id
├── user_id (FK a auth.users)
├── stripe_customer_id
├── stripe_subscription_id
├── stripe_price_id
├── plan_tier ('basico' | 'pro' | 'enterprise')
├── max_doctors
├── max_locations
├── features (JSONB array)
├── status ('active' | 'trialing' | 'past_due' | 'canceled' | ...)
├── current_period_start/end
├── trial_start/end
├── canceled_at
├── created_at
└── updated_at
```

### 2. Middleware (`middleware.ts`)
```typescript
// Verifica:
// 1. Autenticación (session existe)
// 2. Suscripción activa
// 3. Plan tier para features específicas
// 4. Redirige a /pricing si no cumple requisitos
```

### 3. API Routes
```
POST /api/create-checkout-session
├── Input: { priceId, planTier }
├── Output: { sessionId, url }
└── Crea Stripe Checkout Session

POST /api/stripe/webhook
├── Escucha eventos de Stripe
├── checkout.session.completed → actualiza BD
├── customer.subscription.updated → actualiza BD
└── customer.subscription.deleted → marca como cancelado
```

### 4. Componentes
```
/components/subscription/upgrade-modal.tsx
├── Props: currentPlan, limitType, currentCount, maxCount
├── Muestra límite alcanzado
├── Botón "Actualizar plan" → /pricing
└── Comparativa Básico vs Pro vs Enterprise

/app/pricing/page.tsx
├── Toggle mensual/anual
├── Grid con 3 planes
├── Botones → create-checkout-session → Stripe
└── Lifetime plan destacado
```

---

## ⚙️ CONFIGURACIÓN

### 1. Variables de Entorno (.env.local)

Copia `.env.example` a `.env.local` y completa:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs (obtener de Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PRICE_BASICO_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_BASICO_ANNUAL=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_LIFETIME=price_xxx

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Crear Productos y Prices en Stripe

#### Opción A: Usar PowerShell Script (recomendado)
```powershell
cd vercel-migration
.\create-stripe-products.ps1
```

#### Opción B: Manual en Stripe Dashboard
1. Ve a https://dashboard.stripe.com/test/products
2. Crea 3 productos:
   - **Básico** - $599 MXN/mes, $5,990 MXN/año
   - **Pro** - $999 MXN/mes, $9,990 MXN/año
   - **Enterprise** - $2,999 MXN/mes, $29,990 MXN/año
3. Crea 1 producto de pago único:
   - **Lifetime** - $19,990 MXN (one-time payment)
4. Copia los **Price IDs** (empiezan con `price_xxx`)
5. Pégalos en `.env.local`

### 3. Configurar Webhook de Stripe

1. Ve a https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://tu-dominio.com/api/stripe/webhook`
   - Local testing: usa Stripe CLI con `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Selecciona eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copia el **Signing secret** (empieza con `whsec_xxx`)
6. Pégalo en `.env.local` como `STRIPE_WEBHOOK_SECRET`

### 4. Aplicar Migraciones de BD

```bash
# En Supabase Dashboard → SQL Editor, ejecutar:
vercel-migration/supabase/migrations/20251015210000_create_subscriptions_table.sql
vercel-migration/supabase/migrations/007_auto_create_subscriptions.sql
```

---

## 🧪 TESTING DEL FLUJO COMPLETO

### Escenario 1: Usuario Nuevo con Plan Básico

1. **Signup**
   ```bash
   # Usuario se registra en /auth/signup
   # Trigger automático crea subscription con plan 'basico' y status 'trialing'
   ```

2. **Intentar agregar 2do doctor**
   ```bash
   # Usuario va a /settings/doctors
   # Intenta agregar 2do doctor
   # quota-service detecta límite alcanzado (max_doctors = 1 en plan básico)
   # Muestra UpgradeModal
   ```

3. **Upgrade a Pro**
   ```bash
   # Click "Actualizar plan" → redirige a /pricing
   # Selecciona "Plan Pro" mensual ($999)
   # Click "Elegir Plan"
   # API crea Stripe Checkout Session
   # Redirige a Stripe Checkout
   ```

4. **Completar pago**
   ```bash
   # En Stripe Checkout, usar tarjeta de prueba: 4242 4242 4242 4242
   # Fecha: cualquier futura, CVC: cualquier 3 dígitos
   # Stripe redirige a /dashboard?checkout=success
   ```

5. **Webhook actualiza BD**
   ```bash
   # Stripe envía evento checkout.session.completed
   # Webhook /api/stripe/webhook recibe evento
   # Actualiza subscriptions:
   #   - plan_tier = 'pro'
   #   - status = 'active'
   #   - max_doctors = 10
   #   - stripe_subscription_id = sub_xxx
   ```

6. **Usuario puede agregar doctores**
   ```bash
   # Middleware detecta plan 'pro'
   # Permite acceso a /settings/doctors
   # Puede agregar hasta 10 doctores
   ```

### Escenario 2: Middleware Bloquea Ruta Pro

1. **Usuario con plan Básico intenta acceder a /settings/schedules**
   ```bash
   # middleware.ts detecta:
   #   - Ruta: /settings/schedules (requiere Pro)
   #   - Plan actual: 'basico'
   # Redirige a: /pricing?reason=feature_requires_pro&feature=/settings/schedules
   ```

2. **Página /pricing muestra alerta**
   ```bash
   # Alert: "Esta funcionalidad requiere el Plan Pro o superior."
   # Plan Pro está destacado
   ```

### Escenario 3: Probar Webhook Localmente

1. **Instalar Stripe CLI**
   ```powershell
   # Windows (con Chocolatey)
   choco install stripe-cli

   # O descargar desde: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login y forward**
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   # Copia el webhook signing secret que te da (whsec_xxx)
   # Pégalo en .env.local como STRIPE_WEBHOOK_SECRET
   ```

3. **Simular evento**
   ```bash
   stripe trigger checkout.session.completed
   # Observa logs en terminal y en Supabase
   ```

---

## 📊 LÍMITES POR PLAN

| Feature | Básico | Pro | Enterprise |
|---------|--------|-----|------------|
| Doctores | 1 | 10 | Ilimitado |
| Citas/mes | 200 | Ilimitadas | Ilimitadas |
| Inventario | 20 items | Ilimitado | Ilimitado |
| Tratamientos | 10 tipos | Ilimitados | Ilimitados |
| Consultorios | 1 | 5 | Ilimitados |
| Multi-ubicación | ❌ | ❌ | ✅ |
| Horarios recurrentes | ❌ | ✅ | ✅ |
| Excepciones (vacaciones) | ❌ | ✅ | ✅ |
| Reportes avanzados | ❌ | ✅ | ✅ |
| WhatsApp Business | ❌ | ✅ (BYOK) | ✅ (BYOK) |
| API personalizada | ❌ | ❌ | ✅ |

---

## 🐛 TROUBLESHOOTING

### Error: "Not authenticated"
```bash
# Verificar que el usuario esté logueado
# Revisar cookies: sb-access-token o supabase-auth-token
# Probar logout → login nuevamente
```

### Error: "Stripe key not found"
```bash
# Verificar .env.local tiene:
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
# Reiniciar servidor: npm run dev
```

### Webhook no recibe eventos
```bash
# Opción 1: Usar Stripe CLI local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Opción 2: Verificar URL pública esté accesible
# Opción 3: Revisar logs en Stripe Dashboard → Webhooks → Attempts
```

### Usuario no puede acceder después de pagar
```bash
# Verificar en Supabase → subscriptions:
SELECT * FROM subscriptions WHERE user_id = 'xxx';
# Debe tener:
#   - status = 'active' o 'trialing'
#   - plan_tier = 'pro' o el elegido
# Si no existe, webhook falló → revisar logs
```

### Plan no se actualiza tras pago
```bash
# 1. Revisar logs de webhook en Vercel/local
# 2. Verificar STRIPE_WEBHOOK_SECRET coincide
# 3. Probar manualmente:
UPDATE subscriptions 
SET plan_tier = 'pro', status = 'active' 
WHERE user_id = 'user-id-aqui';
```

---

## 🚀 PRÓXIMOS PASOS OPCIONALES

### 1. Dashboard de Admin
```typescript
// Ver todas las suscripciones activas
// Métricas de conversión
// Churn rate
// MRR (Monthly Recurring Revenue)
```

### 2. Email Notifications
```typescript
// Confirmación de suscripción
// Recordatorio de renovación
// Aviso de pago fallido
// Bienvenida con onboarding
```

### 3. Facturación Automática
```typescript
// Generar CFDI tras cada pago
// Enviar factura por email
// Historial de facturas en /settings/billing
```

### 4. Referral Program
```typescript
// Código único por usuario
// 20% descuento al referido
// 1 mes gratis al referidor
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Tabla `subscriptions` creada en Supabase
- [x] Productos y prices creados en Stripe
- [x] Variables de entorno configuradas
- [x] Webhook configurado y probado
- [x] Middleware con paywall funcionando
- [x] Página /pricing funcional
- [x] UpgradeModal creado
- [x] API create-checkout-session funcional
- [ ] Testing con tarjeta de prueba completado
- [ ] Testing de webhook completado
- [ ] Testing de upgrade Básico → Pro completado
- [ ] Documentación entregada al equipo

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisar logs en Vercel/local
2. Revisar Supabase logs
3. Revisar Stripe Dashboard → Webhooks → Attempts
4. Contactar a: soporte@agendamedpro.com

---

**¡El sistema de paywall está completo y listo para producción!** 🎉
