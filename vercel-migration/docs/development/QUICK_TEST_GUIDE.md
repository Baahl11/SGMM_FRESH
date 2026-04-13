# 🎯 GUÍA RÁPIDA DE TESTING MANUAL

Esta es la versión condensada para testing rápido. Para detalles completos, ver `MANUAL_TESTING_CHECKLIST.md`.

---

## 🚀 TEST 1: Email Signup (5 minutos)

```bash
# 1. Ir a signup
URL: https://agendamedpro.com/auth/signup

# 2. Registrarse
Email: test+trial_[timestamp]@agendamedpro.com
Password: TestPassword123!

# 3. Seleccionar plan Básico → Stripe Checkout
Tarjeta: 4242 4242 4242 4242
Fecha: 12/26 | CVV: 123 | ZIP: 12345

# 4. Verificar en Supabase
cd vercel-migration
node scripts/check-trial-status.js [tu-email]

# ✅ Debe mostrar:
# - Status: trialing
# - Trial end: 7 días desde hoy
# - Plan: basico
```

**Checklist rápido:**
- [ ] Página signup carga OK
- [ ] Stripe muestra "7-day free trial"
- [ ] Redirige a /trial-success con confetti
- [ ] Status = 'trialing' en Supabase
- [ ] NO se cobró hoy en Stripe
- [ ] Acceso completo a la app

---

## 🚀 TEST 2: Google OAuth (3 minutos)

```bash
# 1. Ir a signup
URL: https://agendamedpro.com/auth/signup

# 2. Click "Continuar con Google" → seleccionar cuenta

# 3. Seleccionar plan Pro → completar Stripe checkout

# 4. Verificar
node scripts/check-trial-status.js [email-google]@gmail.com
```

**Checklist rápido:**
- [ ] OAuth funciona sin errores
- [ ] Plan Pro asignado correctamente
- [ ] Max doctors: 10, Max locations: 5

---

## 🚀 TEST 3: Existing User (1 minuto)

```bash
# 1. Login con usuario del TEST 1
URL: https://agendamedpro.com/auth/signin

# 2. Ingresar credenciales

# ✅ Debe ir DIRECTO a /dashboard (NO a /select-trial-plan)
```

**Checklist rápido:**
- [ ] NO pide tarjeta nuevamente
- [ ] Acceso directo a dashboard
- [ ] Suscripción intacta

---

## 🔍 Verificación de Webhook (tiempo real)

```bash
# Ver logs en tiempo real
vercel logs --follow

# Buscar estos mensajes:
# ✅ "Checkout completed for user..."
# 🎉 "Trial active: [fecha] to [fecha]"
# ✅ "Subscription updated for user..."
```

---

## 🎯 Qué buscar en Stripe Dashboard

https://dashboard.stripe.com/test/subscriptions

1. **Status:** "Trialing" (no "Active")
2. **Trial end:** 7 días desde hoy
3. **Invoice:** NO pagado hoy, SCHEDULED para dentro de 7 días
4. **Customer:** metadata con `supabase_user_id`

---

## ⚠️ Red Flags (si ves esto, hay un bug)

- ❌ Status = "active" inmediatamente (debería ser "trialing")
- ❌ Invoice pagado hoy (no debe cobrarse hasta día 8)
- ❌ Trial end ≠ 7 días desde hoy
- ❌ Usuario sin tarjeta entra a la app
- ❌ Usuario con suscripción ve /select-trial-plan nuevamente
- ❌ Webhook retorna 500 en logs

---

## 📋 Comandos útiles

```bash
# Ver último deployment
vercel ls --prod

# Ver logs del webhook
vercel logs --follow

# Verificar usuario en Supabase
node scripts/check-trial-status.js [email]

# Ver variables de entorno
vercel env ls
```

---

## ✅ Criterio de ÉXITO TOTAL

- [ ] 3 tests completados sin errores
- [ ] Todos los usuarios con status "trialing"
- [ ] Fechas del trial correctas (7 días exactos)
- [ ] NO se cobró a ninguna tarjeta hoy
- [ ] Webhook procesa todos los eventos sin errores
- [ ] Límites de plan aplicados correctamente

---

**Si todo pasa → 🚀 LISTO PARA PRODUCCIÓN**

**Si hay bugs → 🔧 Documentar en MANUAL_TESTING_CHECKLIST.md y crear fixes**
