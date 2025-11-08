# 🎫 Sistema de Códigos Promocionales - Trial Sin Tarjeta

## 📋 Resumen

Sistema implementado para ofrecer **trial de 7 días SIN tarjeta** usando códigos promocionales de Stripe.

## 🎯 Funcionamiento

### Con Código `TRIAL7`:

```
Día 1-7:  ✅ Usuario usa sistema GRATIS (sin agregar tarjeta)
Día 8:    ⚠️ Sistema detecta trial expirado
          → Middleware bloquea acceso
          → Redirige a /select-trial-plan
          → Usuario debe agregar método de pago para continuar
```

### Sin Código Promocional:

```
Día 1:    Usuario agrega tarjeta de débito/crédito
Día 1-7:  ✅ Trial gratis (no se cobra)
Día 8:    💳 Stripe cobra automáticamente
```

## 🚀 Configuración (Una sola vez)

### 1. Crear Códigos Promocionales en Stripe

Ejecuta el script:

```bash
cd vercel-migration
node create-promo-codes.js
```

Esto crea 3 códigos:

- **`TRIAL7`** - 100% OFF, sin tarjeta, 7 días gratis
- **`BIENVENIDO50`** - 50% OFF en primer pago, tarjeta requerida
- **`DEMO14`** - 100% OFF, 14 días para clientes VIP

### 2. Verificar en Stripe Dashboard

Ve a: https://dashboard.stripe.com/test/coupons

Deberías ver los cupones creados.

## 📖 Instrucciones para Usuarios

### Para usar `TRIAL7`:

1. Ve a: https://tu-dominio.com/select-trial-plan
2. Selecciona un plan (Básico o Pro)
3. Click en "Comenzar Trial Gratis"
4. En el Stripe Checkout, busca **"¿Tienes un código promocional?"**
5. Ingresa: `TRIAL7`
6. ✨ El precio se ajusta a $0.00
7. **NO se pide tarjeta** - Solo completa con tu email
8. ¡Listo! Tienes 7 días gratis

### Después del Día 7:

Al día 8, cuando el usuario intente entrar:

1. El middleware detecta que el trial expiró
2. Verifica si tiene método de pago registrado
3. Si NO tiene tarjeta → Redirige a `/select-trial-plan?reason=trial_expired`
4. Aparece banner naranja: **"Tu Periodo de Prueba ha Terminado"**
5. Usuario selecciona plan y agrega tarjeta
6. Una vez agregada la tarjeta → Acceso restaurado

## 🔧 Archivos Modificados

### 1. `middleware.ts`
- Detecta cuando trial expira (compara `trial_ends_at` vs fecha actual)
- Verifica si usuario tiene método de pago en Stripe
- Si no tiene → Bloquea acceso y redirige

### 2. `app/api/check-payment-method/route.ts` (NUEVO)
- Endpoint para verificar si cliente tiene tarjeta registrada
- Usado por el middleware

### 3. `app/select-trial-plan/page.tsx`
- Detecta parámetro `?reason=trial_expired`
- Muestra banner naranja de alerta
- Cambia mensaje del header

### 4. `create-promo-codes.js` (NUEVO)
- Script para crear códigos en Stripe
- Solo se ejecuta una vez

## 🎨 Flujo Visual

```
┌─────────────────────────────────────┐
│  Usuario sin cuenta                 │
│                                     │
│  1. Visita /select-trial-plan       │
│  2. Selecciona Plan Pro             │
│  3. Click "Comenzar Trial"          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Stripe Checkout                    │
│                                     │
│  [¿Tienes código promocional?]      │
│  Ingresa: TRIAL7                    │
│                                     │
│  Subtotal: $999.00                  │
│  Descuento (TRIAL7): -$999.00       │
│  Total: $0.00                       │
│                                     │
│  ❌ No se pide tarjeta               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Días 1-7: Usando el sistema        │
│  ✅ Acceso completo                  │
│  ✅ Todas las funciones              │
│  ⏰ trial_ends_at guardado en DB     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Día 8: Usuario intenta entrar      │
│                                     │
│  middleware.ts detecta:             │
│  • trial_ends_at < NOW              │
│  • No tiene método de pago          │
│                                     │
│  → BLOQUEA acceso                   │
│  → Redirige a /select-trial-plan    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  /select-trial-plan                 │
│  ?reason=trial_expired              │
│                                     │
│  ⚠️ Banner naranja:                  │
│  "Tu periodo de prueba terminó"     │
│                                     │
│  Usuario selecciona plan            │
│  Agrega tarjeta en Stripe           │
│  → Acceso restaurado ✅              │
└─────────────────────────────────────┘
```

## ⚙️ Variables de Entorno Requeridas

Asegúrate de tener en `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_BASICO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
```

## 🧪 Testing

### Test 1: Trial sin tarjeta
1. Usa código `TRIAL7`
2. Verifica que NO pide tarjeta
3. Espera 7 días (o cambia `trial_ends_at` en DB manualmente)
4. Intenta acceder → Debe bloquear

### Test 2: Trial con tarjeta
1. NO uses código promocional
2. Agrega tarjeta
3. Trial de 7 días
4. Día 8: Stripe cobra automáticamente

## 📊 Monitoreo

Puedes ver el uso de códigos en:
- Stripe Dashboard → Promotion Codes
- Ver cuántos se han usado
- Ver qué usuarios los usaron

## 🔒 Seguridad

- El middleware verifica en cada request
- Imposible burlar el paywall
- Código promocional solo válido para nuevos clientes
- Límite de usos configurado (1000 para TRIAL7)

## 🎉 ¡Listo!

El sistema ya está configurado. Solo necesitas:

1. Ejecutar `node create-promo-codes.js` (una vez)
2. Deploy a producción
3. Compartir el código `TRIAL7` con usuarios

---

**Notas:**
- Los códigos son case-insensitive (TRIAL7 = trial7)
- Puedes crear más códigos desde Stripe Dashboard
- Para cambiar la duración del trial, modifica el webhook de Stripe
