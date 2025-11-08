# 🧪 GUÍA DE TESTING: Trial con Tarjeta Requerida

## ✅ CHECKLIST DE PRUEBA

### PASO 1: Registro de Usuario
1. **Ir a:** https://agendamedpro.com/auth/signup
2. **Ingresar datos:**
   - Email: `test+trial1@tudominio.com` (usa +algo para crear múltiples emails de prueba)
   - Contraseña: `Test123456`
   - Confirmar contraseña: `Test123456`
3. **Click:** "Crear Cuenta"
4. **✅ Verificar:**
   - Toast de éxito: "¡Cuenta creada exitosamente! Ahora selecciona tu plan"
   - Redirige automáticamente a `/select-trial-plan` en 1.5 segundos

---

### PASO 2: Selección de Plan
**URL esperada:** `https://agendamedpro.com/select-trial-plan`

1. **✅ Verificar página muestra:**
   - Badge verde: "🎉 ¡Bienvenido a AgendaMedPro!"
   - Título: "Selecciona tu Plan"
   - Subtítulo: "Agrega tu tarjeta y comienza tu prueba de **7 días gratis**"
   - Toggle: Mensual / Anual
   - 2 planes: Básico y Pro
   - Botón: "🎉 Iniciar Prueba Gratis"

2. **Seleccionar plan:**
   - Click en toggle "Anual" (opcional, para ver diferencia de precio)
   - Click en "🎉 Iniciar Prueba Gratis" del Plan **Pro**

3. **✅ Verificar:**
   - Botón cambia a "Procesando..." con spinner
   - Redirige a Stripe Checkout

---

### PASO 3: Stripe Checkout (TEST MODE)
**URL esperada:** Empieza con `https://checkout.stripe.com/...`

1. **✅ Verificar página de Stripe muestra:**
   - Logo: AgendaMedPro
   - Producto: "Plan Pro" (o el que hayas seleccionado)
   - Precio: $999 MXN/mes (o anual si elegiste anual)
   - **Badge azul:** "Includes 7-day free trial"
   - Campos: Email (pre-llenado), Tarjeta, Nombre

2. **Ingresar datos de prueba:**
   - Email: Ya debe estar pre-llenado
   - Número de tarjeta: `4242 4242 4242 4242`
   - Fecha de expiración: `12/34` (cualquier fecha futura)
   - CVC: `123`
   - Nombre: `Test User`
   - País: México

3. **Click:** "Suscribirse"

4. **✅ Verificar:**
   - Stripe procesa el pago (demora 2-3 segundos)
   - **NO se hace cargo hoy** (es trial de 7 días)
   - Redirige a tu sitio

---

### PASO 4: Página de Éxito
**URL esperada:** `https://agendamedpro.com/trial-success?session_id=cs_test_...`

1. **✅ Verificar página muestra:**
   - ✨ **Confetti animado** (celebración)
   - ✅ Ícono verde grande de check
   - Título: "¡Bienvenido a AgendaMedPro! 🎉"
   - Subtítulo: "Tu prueba gratis de 7 días ha comenzado"
   
2. **✅ Verificar tarjetas informativas:**
   - **Card 1 (azul):**
     - 📅 "7 Días Gratis"
     - Fecha de fin del trial (hoy + 7 días)
   - **Card 2 (verde):**
     - 💳 "Sin Cargo Hoy"
     - "Tu primer pago será el día 8"
   
3. **✅ Verificar próximos pasos:**
   - Lista de 4 pasos numerados
   
4. **✅ Verificar countdown:**
   - "Redirigiendo automáticamente en X segundos..."
   - Cuenta regresiva de 5 a 0
   - Botón: "Ir a Mi Agenda"

5. **Esperar auto-redirect (5 segundos):**
   - Debe redirigir a `/agenda`

---

### PASO 5: Verificación en Base de Datos (Supabase)

1. **Ir a:** Supabase Dashboard → SQL Editor
2. **Ejecutar query:**

```sql
-- Ver la suscripción recién creada
SELECT 
  user_id,
  plan_tier,
  status,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  trial_start,
  trial_end,
  current_period_start,
  current_period_end,
  max_doctors,
  max_locations,
  created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 1;
```

3. **✅ Verificar campos:**
   - `plan_tier`: `'pro'` (o el plan que seleccionaste)
   - `status`: `'trialing'`
   - `stripe_customer_id`: `'cus_...'` (ID de Stripe)
   - `stripe_subscription_id`: `'sub_...'` (ID de Stripe)
   - `stripe_price_id`: El precio correspondiente al plan
   - `trial_start`: Fecha y hora actual
   - `trial_end`: Fecha y hora actual + 7 días
   - `max_doctors`: `10` (para Pro)
   - `max_locations`: `5` (para Pro)

---

### PASO 6: Verificación en Stripe Dashboard

1. **Ir a:** https://dashboard.stripe.com/test/subscriptions
2. **Buscar:** La subscripción más reciente
3. **✅ Verificar:**
   - Status: **"Trialing"** (badge azul)
   - Customer: Email del usuario test
   - Product: Plan Pro (o el que seleccionaste)
   - Price: $999 MXN/mes (o anual)
   - **Trial ends:** Fecha actual + 7 días
   - **Next payment:** Fecha actual + 7 días
   - Amount: $999 MXN (o el precio correspondiente)

4. **Click en la suscripción para ver detalles:**
   - **✅ Verificar timeline:**
     - "Trial period started" (ahora)
     - "Trial will end in 7 days" (fecha futura)
     - "Payment scheduled" (en 7 días)

---

### PASO 7: Verificación de Acceso en la App

1. **Navegar por el sistema:**
   - `/agenda` → Debe funcionar ✅
   - `/patients` → Debe funcionar ✅
   - `/settings` → Debe funcionar ✅
   - `/settings/schedules` → Debe funcionar ✅ (es Pro)
   - `/inventory` → Debe funcionar ✅

2. **✅ Verificar que NO hay bloqueos:**
   - El usuario con trial activo tiene acceso completo
   - No debe ver mensajes de "Upgrade required"
   - Todas las funcionalidades Pro están disponibles

---

### PASO 8: Verificación del Webhook (Logs)

1. **Ir a:** Vercel Dashboard → Tu proyecto → Logs
2. **Filtrar por:** `/api/stripe/webhook`
3. **✅ Buscar logs que digan:**
   - `✅ Checkout completed for user [user_id], mode: subscription`
   - `💰 Determined tier: pro from priceId: [price_id]`
   - `🎉 Trial active: [start_date] to [end_date]`
   - `✅ Subscription updated for user [user_id]: pro (trialing)`
   - `✅ User [user_id] upgraded to pro`

---

## 🎯 RESULTADOS ESPERADOS

### ✅ TODO CORRECTO SI:
1. Usuario se registra sin problemas
2. Redirige automáticamente a selección de plan
3. Stripe Checkout muestra "7-day free trial"
4. Página de éxito muestra confetti y countdown
5. Base de datos muestra `status='trialing'` con fechas correctas
6. Stripe Dashboard muestra subscripción en "Trialing"
7. Usuario tiene acceso completo a todas las funcionalidades
8. Webhook procesó correctamente el evento

### ❌ PROBLEMAS POTENCIALES:

#### Error 1: "No autenticado" al crear trial session
**Causa:** Cookie de sesión no se guardó
**Solución:** Verificar que Supabase auth está funcionando, usuario está logueado

#### Error 2: "Ya tienes una suscripción activa"
**Causa:** Usuario ya tiene un trial/plan activo
**Solución:** Usar otro email o limpiar la suscripción anterior

#### Error 3: No redirige a Stripe
**Causa:** Error en el endpoint `/api/create-trial-session`
**Solución:** Revisar logs de Vercel, verificar variables de entorno

#### Error 4: Webhook no actualiza la base de datos
**Causa:** Webhook no se está ejecutando o hay error
**Solución:** 
- Verificar que el webhook está activo en Stripe Dashboard
- Verificar `STRIPE_WEBHOOK_SECRET` en Vercel
- Revisar logs del webhook en Vercel

---

## 🔄 PRUEBA DE CANCELACIÓN (OPCIONAL)

1. **Ir a:** Stripe Dashboard → Subscriptions
2. **Click en:** La suscripción del test
3. **Click en:** "Actions" → "Cancel subscription"
4. **Seleccionar:** "Cancel immediately"
5. **✅ Verificar:**
   - En Supabase: `status` cambia a `'canceled'`
   - En la app: Usuario pierde acceso a rutas protegidas
   - Redirige a `/select-trial-plan` o `/pricing`

---

## 📊 MÉTRICAS A MONITOREAR

Una vez en producción, monitorear:
- **Tasa de conversión signup → trial:** Debe ser ~80-90%
- **Tasa de conversión trial → pago:** Meta 40-60%
- **Cancelaciones durante trial:** Idealmente <30%
- **Webhooks fallidos:** Debe ser 0%

---

## 🚨 IMPORTANTE: Después del Testing

1. **Limpiar datos de prueba:**
   ```sql
   -- Eliminar subscripciones de prueba
   DELETE FROM subscriptions 
   WHERE stripe_customer_id LIKE 'cus_test_%';
   ```

2. **Verificar variables de entorno en Vercel:**
   - Todas las 7 price IDs correctas
   - `STRIPE_WEBHOOK_SECRET` correcto
   - `NEXT_PUBLIC_APP_URL` apuntando a tu dominio

3. **Test con tarjeta real (LIVE MODE):**
   - Cambiar Stripe a modo Live
   - Actualizar todas las variables de entorno con keys de producción
   - Hacer un test real con tarjeta verdadera
   - **IMPORTANTE:** Cancelar inmediatamente para no ser cobrado

---

## ✅ CHECKLIST FINAL ANTES DE LANZAR

- [ ] Test completo en modo Test funcionando
- [ ] Webhook responde correctamente
- [ ] Base de datos se actualiza
- [ ] Emails de Stripe se envían (confirmación, recibos)
- [ ] Flujo de cancelación funciona
- [ ] Variables de producción configuradas
- [ ] Test en modo Live exitoso
- [ ] Documentación para usuarios lista
- [ ] Soporte preparado para dudas sobre trials

---

**🎉 ¡Listo para lanzar cuando todos los checks estén en verde!**
