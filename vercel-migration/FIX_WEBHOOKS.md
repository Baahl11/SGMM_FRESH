# ARREGLAR WEBHOOKS DE STRIPE - GUÍA PASO A PASO

## Problema Actual
- Los webhooks están configurados pero NO se entregan (marcados como "simulado")
- Falta el evento `invoice.paid` que es CRÍTICO
- Las suscripciones no se sincronizan automáticamente

## PASO 1: Verificar el webhook secret en Vercel

1. Ve a: https://vercel.com/baahl11/agendamedpro/settings/environment-variables
2. Busca la variable: `STRIPE_WEBHOOK_SECRET`
3. Si NO existe o está vacía, continúa con el Paso 2

## PASO 2: Obtener el webhook signing secret de Stripe

1. Ve a: https://dashboard.stripe.com/webhooks
2. Busca el webhook: `https://agendamedpro.com/api/stripe/webhook`
3. Haz clic en él
4. Clic en "Reveal" en "Signing secret"
5. Copia el valor (empieza con `whsec_...`)

## PASO 3: Agregar/Actualizar eventos faltantes

En la misma página del webhook, en la sección "Events to send":

### Eventos REQUERIDOS (agregar si no existen):
- ✅ customer.subscription.created
- ✅ customer.subscription.updated  
- ✅ customer.subscription.deleted
- ✅ checkout.session.completed
- ⚠️ **invoice.paid** ← ESTE FALTA, AGRÉGALO
- ⚠️ **invoice.payment_failed** ← AGRÉGALO TAMBIÉN

Clic en "Add events" → Busca "invoice.paid" y "invoice.payment_failed" → Save

## PASO 4: Actualizar el secret en Vercel

Desde la terminal:

```bash
# Opción A: Usar Vercel CLI
vercel env add STRIPE_WEBHOOK_SECRET production
# Pegar el valor whsec_... cuando te lo pida

# Opción B: Manual en dashboard
# Ve a Vercel → Settings → Environment Variables
# Edit STRIPE_WEBHOOK_SECRET → Pega el nuevo valor
```

## PASO 5: Redeployar la aplicación

```bash
npx vercel --prod
```

## PASO 6: Probar el webhook

1. En Stripe Dashboard → Webhooks → Tu webhook
2. Clic en "Send test webhook"
3. Selecciona evento: `invoice.paid`
4. Clic en "Send test webhook"
5. Verifica que aparezca: "✅ Succeeded" (NO "simulado")

## PASO 7: Verificar logs en Vercel

1. Ve a: https://vercel.com/baahl11/agendamedpro/logs
2. Busca requests a `/api/stripe/webhook`
3. Debe aparecer status 200, NO errores

## Archivo a verificar

El webhook handler está en:
`vercel-migration/app/api/stripe/webhook/route.ts`

Debe manejar estos eventos:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid` ← Si no está, hay que agregarlo
- `invoice.payment_failed` ← Si no está, hay que agregarlo

---

## ¿Quieres que revise el código del webhook handler para asegurar que maneje invoice.paid?
