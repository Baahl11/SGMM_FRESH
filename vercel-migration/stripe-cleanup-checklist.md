# 🔧 Plan de Acción: Limpieza de Suscripciones Stripe

**Fecha:** 14 Noviembre 2025  
**Objetivo:** Sincronizar todas las suscripciones entre Stripe y Supabase

---

## 📊 Estado Actual

### Suscripciones Huérfanas Detectadas:
- ❌ `sub_1SQYowCpe9CE4d2laNm6C3nA` - Juan Camarillo - Plan Pro $999 MXN (6 nov) - **MANTENER**
- ❌ `sub_1SQYaOCpe9CE4d2luZTbzd5L` - Juan Camarillo - Plan Pro $999 MXN (6 nov) - **CANCELAR**
- ❌ `sub_1SJ4LyCpe9CE4d2lkHcbdgRl` - gmelgarejom@gmail.com - Plan Básico $499 MXN (16 oct) - **SINCRONIZAR**

---

## ✅ Pasos Completados

- [x] ✅ Identificar webhook configurado
- [x] ✅ Actualizar `STRIPE_WEBHOOK_SECRET` en Vercel
- [x] ✅ Redeploy exitoso - webhook responde 200 OK
- [x] ✅ Limpiar suscripción duplicada de Juan en Supabase
- [x] ✅ Crear scripts de diagnóstico y limpieza

---

## 🎯 Pasos Pendientes

### PASO 1: Obtener Detalles de Stripe
```bash
npx tsx scripts/get-stripe-subscription-details.ts
```

**Resultado esperado:**
- Customer ID de gmelgarejom
- Fechas exactas de periodo
- Confirmación de status

**Estado:** [ ] Pendiente

---

### PASO 2: Cancelar Suscripción Duplicada en Stripe

**Manual en Stripe Dashboard:**

1. Ir a: https://dashboard.stripe.com/customers
2. Buscar: `camarillojuan@hotmail.com` o `asc.admon23@gmail.com`
3. Click en el cliente
4. Ir a pestaña "Subscriptions"
5. Identificar: `sub_1SQYaOCpe9CE4d2luZTbzd5L` (la duplicada del 6 nov)
6. Click "Cancel subscription"
7. Seleccionar: **"Cancel immediately"** (no esperar fin de periodo)
8. Confirmar cancelación

**Estado:** [ ] Pendiente

**Verificación:**
```sql
-- Debe quedar solo 1 suscripción para Juan
SELECT * FROM subscriptions 
WHERE user_id = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db';
```

---

### PASO 3: Sincronizar Suscripción de gmelgarejom

**Ejecutar en Supabase SQL Editor:**

```sql
-- 1. Obtener user_id
SELECT id FROM auth.users WHERE email = 'gmelgarejom@gmail.com';
-- Copiar el UUID

-- 2. Verificar que no tenga suscripción
SELECT * FROM subscriptions WHERE user_id = 'UUID_COPIADO';
-- Debe devolver 0 resultados

-- 3. Insertar suscripción (usar datos del script de PASO 1)
INSERT INTO subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  plan_tier,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
)
VALUES (
  'UUID_DE_GMELGAREJOM', -- Del paso 3.1
  'sub_1SJ4LyCpe9CE4d2lkHcbdgRl',
  'cus_XXXXXXXXXX', -- Del script PASO 1
  'basico',
  'active', -- O status del script PASO 1
  'FECHA_START', -- Del script PASO 1
  'FECHA_END', -- Del script PASO 1
  false,
  NOW(),
  NOW()
)
ON CONFLICT (stripe_subscription_id) DO NOTHING;
```

**Estado:** [ ] Pendiente

---

### PASO 4: Verificar Sincronización

**Ejecutar script de health check:**
```bash
npx tsx scripts/check-sync-health.ts
```

**Resultado esperado:**
```
✅ Todas las suscripciones sincronizadas
📊 Suscripciones huérfanas: 0
```

**Estado:** [ ] Pendiente

---

### PASO 5: Verificar Webhooks en Producción

**En Stripe Dashboard:**

1. Ir a: https://dashboard.stripe.com/webhooks
2. Click en el webhook de agendamedpro.com
3. Verificar:
   - ✅ "Success rate" debe ser > 95%
   - ✅ Últimos eventos muestran 200 OK
   - ✅ No hay errores recientes

**Crear suscripción de prueba:**
```bash
# Monitorear logs en tiempo real
vercel logs agendamedpro.com --follow
```

**En otra terminal, crear suscripción de prueba en Stripe:**
1. Usar modo test
2. Crear checkout session
3. Completar pago
4. Verificar que aparezca automáticamente en Supabase

**Estado:** [ ] Pendiente

---

## 📝 Archivos Generados

- ✅ `vercel-migration/complete-stripe-cleanup.sql` - Script SQL completo
- ✅ `scripts/get-stripe-subscription-details.ts` - Helper para obtener datos de Stripe
- ✅ `vercel-migration/stripe-cleanup-checklist.md` - Este checklist

---

## 🚨 Rollback Plan (Por si algo sale mal)

### Si se cancela la suscripción equivocada:

1. Ir a Stripe Dashboard
2. Buscar la suscripción cancelada
3. Click "Reactivate subscription"
4. Ajustar fechas si es necesario

### Si se inserta mal en Supabase:

```sql
-- Ver ID de la inserción incorrecta
SELECT * FROM subscriptions WHERE stripe_subscription_id = 'sub_XXX';

-- Eliminar
DELETE FROM subscriptions WHERE id = 'UUID_DE_INSERCION_INCORRECTA';
```

---

## 📞 Contactos de Soporte

- **Stripe Support:** https://support.stripe.com
- **Supabase Support:** https://supabase.com/support
- **Vercel Support:** https://vercel.com/help

---

## 📈 Métricas de Éxito

Al completar todos los pasos:

- ✅ 0 suscripciones huérfanas
- ✅ Webhooks con > 95% success rate
- ✅ Juan solo tiene 1 suscripción Pro activa
- ✅ gmelgarejom tiene su suscripción Básico sincronizada
- ✅ Nuevas suscripciones se sincronizan automáticamente

---

## ⏭️ Próximos Pasos (Después de completar limpieza)

1. **Monitoreo automatizado:**
   - Configurar cron job en Vercel para ejecutar `check-sync-health.ts` diariamente
   - Enviar alertas por email si se detectan huérfanas

2. **Documentación:**
   - Actualizar `FUNCIONALIDADES_AGENDAMEDPRO.md`
   - Crear runbook para futuros problemas de sincronización

3. **Testing:**
   - Probar flujo completo de registro → pago → activación
   - Verificar que todos los webhooks funcionen correctamente
   - Documentar casos edge

---

**Última actualización:** 14 Nov 2025 23:15 CST
