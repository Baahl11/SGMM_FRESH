# 🧪 Manual Testing Checklist - Trial de 7 Días con Tarjeta Requerida

**Fecha de testing:** 2 de noviembre de 2025  
**Sistema:** AgendaMedPro - Trial de 7 días con captura de tarjeta  
**URL de producción:** https://agendamedpro.com

---

## ✅ Pre-flight Check (COMPLETADO)

- [x] Variables de entorno configuradas en Vercel
- [x] Deployment activo en producción (39 minutos)
- [x] Dominio `agendamedpro.com` apuntando correctamente
- [x] Webhook de Stripe configurado

---

## 🧪 TEST 1: Email Signup Flow

### Objetivo
Verificar que un nuevo usuario puede registrarse con email/contraseña, seleccionar un plan, completar el trial y tener acceso a la aplicación.

### Pasos a seguir:

1. **Navegar a la página de registro**
   - [ ] Ir a: https://agendamedpro.com/auth/signup
   - [ ] Verificar que la página carga correctamente
   - [ ] Verificar diseño hero + formulario

2. **Registrarse con email**
   - [ ] Email de prueba: `test+trial_$(date +%s)@agendamedpro.com` (usa timestamp único)
   - [ ] Contraseña: `TestPassword123!`
   - [ ] Click en "Registrarse"
   - [ ] Esperar confirmación de email (o verificar que se salta este paso)

3. **Selección de plan**
   - [ ] Verificar que redirige automáticamente a `/select-trial-plan`
   - [ ] Verificar que se muestran 2 planes: Básico y Pro
   - [ ] Seleccionar plan **Básico Mensual**
   - [ ] Click en "Comenzar prueba gratuita"

4. **Stripe Checkout**
   - [ ] Verificar que se abre Stripe Checkout
   - [ ] **IMPORTANTE:** Verificar que dice "**Includes 7-day free trial**"
   - [ ] Usar tarjeta de prueba: `4242 4242 4242 4242`
   - [ ] Fecha: cualquier fecha futura (ej: 12/26)
   - [ ] CVV: cualquier 3 dígitos (ej: 123)
   - [ ] Código postal: cualquiera (ej: 12345)
   - [ ] Click "Subscribe"

5. **Página de éxito**
   - [ ] Verificar que redirige a `/trial-success`
   - [ ] Verificar que se muestra confetti 🎉
   - [ ] Verificar que se muestra countdown de 7 días
   - [ ] Esperar 5 segundos para auto-redirect a `/agenda`

6. **Verificación en Supabase**
   ```bash
   cd vercel-migration
   node scripts/check-trial-status.js test+trial_XXXXX@agendamedpro.com
   ```
   - [ ] Status: `trialing`
   - [ ] Plan tier: `basico`
   - [ ] Trial start: fecha de hoy
   - [ ] Trial end: 7 días desde hoy
   - [ ] Max doctors: 1
   - [ ] Max locations: 1

7. **Verificación en Stripe Dashboard**
   - [ ] Ir a: https://dashboard.stripe.com/test/subscriptions
   - [ ] Buscar la suscripción del usuario
   - [ ] Verificar status: **Trialing**
   - [ ] Verificar que trial_end es dentro de 7 días
   - [ ] Verificar que NO hay invoice pagado hoy
   - [ ] Verificar que hay un invoice **scheduled** para dentro de 7 días

8. **Acceso a la aplicación**
   - [ ] Verificar que el usuario tiene acceso a `/agenda`
   - [ ] Verificar que puede crear citas
   - [ ] Verificar límites: 1 doctor, 1 ubicación

### ✅ Criterios de éxito:
- Usuario registrado correctamente
- Suscripción creada con status `trialing`
- Fechas del trial correctas (hoy + 7 días)
- NO se hizo cargo a la tarjeta hoy
- Acceso completo a la aplicación durante el trial

### ❌ Errores encontrados:
_Documentar aquí cualquier error o comportamiento inesperado_

---

## 🧪 TEST 2: Google OAuth Flow

### Objetivo
Verificar que un nuevo usuario puede registrarse con Google OAuth, completar el trial y tener acceso.

### Pasos a seguir:

1. **Navegar a la página de registro**
   - [ ] Ir a: https://agendamedpro.com/auth/signup
   - [ ] Click en "Continuar con Google"

2. **Autenticación con Google**
   - [ ] Seleccionar cuenta de Google (o crear una nueva para testing)
   - [ ] Completar autenticación OAuth
   - [ ] Verificar que redirige a `/select-trial-plan`

3. **Selección de plan**
   - [ ] Seleccionar plan **Pro Mensual**
   - [ ] Click en "Comenzar prueba gratuita"

4. **Stripe Checkout**
   - [ ] Verificar mensaje "Includes 7-day free trial"
   - [ ] Usar tarjeta de prueba: `4242 4242 4242 4242`
   - [ ] Completar checkout

5. **Página de éxito**
   - [ ] Verificar `/trial-success` con confetti
   - [ ] Esperar auto-redirect

6. **Verificación en Supabase**
   ```bash
   node scripts/check-trial-status.js [email-google]@gmail.com
   ```
   - [ ] Status: `trialing`
   - [ ] Plan tier: `pro`
   - [ ] Trial dates correctos
   - [ ] Max doctors: 10
   - [ ] Max locations: 5

7. **Verificación en Stripe Dashboard**
   - [ ] Suscripción en estado "Trialing"
   - [ ] Price ID correcto para Pro Mensual

8. **Acceso a la aplicación**
   - [ ] Acceso completo a features Pro
   - [ ] Límites correctos aplicados

### ✅ Criterios de éxito:
- OAuth funcionando correctamente
- Trial creado con plan Pro
- Límites Pro aplicados (10 doctores, 5 ubicaciones)

### ❌ Errores encontrados:
_Documentar aquí cualquier error_

---

## 🧪 TEST 3: Existing User Login

### Objetivo
Verificar que un usuario existente con suscripción activa NO pasa por el flujo de trial nuevamente.

### Pasos a seguir:

1. **Login con usuario existente**
   - [ ] Usar el email del TEST 1 o TEST 2
   - [ ] Ir a: https://agendamedpro.com/auth/signin
   - [ ] Ingresar email y contraseña (o Google OAuth)
   - [ ] Click "Iniciar sesión"

2. **Verificación de redirect**
   - [ ] **IMPORTANTE:** NO debe redirigir a `/select-trial-plan`
   - [ ] Debe redirigir directamente a `/dashboard` o `/agenda`
   - [ ] NO debe pedir tarjeta nuevamente

3. **Verificación de acceso**
   - [ ] Usuario tiene acceso completo
   - [ ] Status de suscripción se mantiene
   - [ ] No hay cambios en la suscripción de Stripe

### ✅ Criterios de éxito:
- Usuario existente va directo a dashboard
- NO pasa por flujo de trial nuevamente
- Suscripción se mantiene intacta

### ❌ Errores encontrados:
_Documentar aquí cualquier error_

---

## 🔍 Verificaciones Adicionales

### Webhook Logs en Vercel

1. **Ver logs en tiempo real**
   ```bash
   vercel logs --follow
   ```

2. **Verificar eventos procesados:**
   - [ ] `checkout.session.completed` procesado correctamente
   - [ ] `customer.subscription.created` procesado
   - [ ] `customer.subscription.updated` procesado
   - [ ] NO hay errores 500 en el webhook
   - [ ] User ID se guarda correctamente en metadata

3. **Verificar logs específicos:**
   - [ ] "✅ Checkout completed for user..."
   - [ ] "🎉 Trial active: [fecha inicio] to [fecha fin]"
   - [ ] "💰 Determined tier: basico/pro from priceId: ..."
   - [ ] "✅ Subscription updated for user..."

### Trial Period Verification

- [ ] Trial end date es exactamente 7 días desde trial start
- [ ] Horario del trial end (verificar timezone)
- [ ] NO hay cargo programado antes del trial end

### Invoice Verification

En Stripe Dashboard:
- [ ] NO hay invoice con status "Paid" hoy
- [ ] Hay un invoice con status "Scheduled" para dentro de 7 días
- [ ] El monto del invoice programado es correcto según el plan

---

## 📋 Resumen de Resultados

### Tests Completados:
- [ ] TEST 1: Email Signup Flow
- [ ] TEST 2: Google OAuth Flow
- [ ] TEST 3: Existing User Login

### Bugs Encontrados:
_Listar bugs aquí con descripción y severidad_

1. 
2. 
3. 

### Estado General:
- [ ] ✅ Sistema funcionando perfectamente - LISTO PARA PRODUCCIÓN
- [ ] ⚠️  Bugs menores encontrados - requieren fixes
- [ ] ❌ Bugs críticos - NO lanzar a producción

---

## 🚀 Próximos Pasos

Si todos los tests pasan:
1. Documentar resultados finales
2. Crear comunicación para usuarios
3. Activar modo producción en Stripe
4. Lanzar campaña de marketing
5. Monitorear primeros usuarios reales

Si hay bugs:
1. Documentar cada bug con detalles
2. Priorizar por severidad
3. Crear fixes
4. Re-testear
5. Repetir hasta que todos los tests pasen

---

**Tester:** _[Tu nombre]_  
**Fecha:** _[Fecha del testing]_  
**Notas adicionales:** _[Cualquier observación relevante]_
