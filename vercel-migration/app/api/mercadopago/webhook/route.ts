import { NextRequest, NextResponse } from 'next/server'
import { paymentClient, PLAN_LIMITS } from '@/lib/mercadopago/server'
import { verifyMercadoPagoSignature, allowUnsignedInDev } from '@/lib/security/webhook-signatures'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'

const log = createLogger('webhook/mercadopago')

/**
 * Auditoría fable 2026-06-11 — hallazgo C9 (P1 alto):
 * El webhook aceptaba cualquier body sin validar `x-signature` ni controlar
 * replays/duplicados, permitiendo falsificar pagos y alterar suscripciones.
 *
 * Cambios:
 * 1. Validación oficial de firma (manifest id/request-id/ts + HMAC-SHA256 con
 *    MERCADOPAGO_WEBHOOK_SECRET) con tolerancia de timestamp anti-replay.
 *    Fail-closed en producción si falta el secreto.
 * 2. Idempotencia mediante la tabla `webhook_events`
 *    (migración 20260611100000_webhook_events.sql): provider+event_id únicos;
 *    los eventos repetidos responden 200 sin reprocesar.
 * 3. Sólo se confía en el estado consultado a la API de MP (data.id), nunca en
 *    el body recibido. Eventos `cancelled/rejected` no degradan una
 *    suscripción ya activa de un pago distinto (control de orden básico).
 * 4. Logs sin payload completo ni datos del pagador.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    if (rawBody.length > 64_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    let body: { type?: string; action?: string; data?: { id?: string | number } }
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const url = new URL(request.url)
    const dataId: string | null =
      url.searchParams.get('data.id') ?? (body?.data?.id != null ? String(body.data.id) : null)

    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    if (!secret) {
      if (!allowUnsignedInDev()) {
        log.error('MERCADOPAGO_WEBHOOK_SECRET ausente; rechazando webhook (fail-closed)')
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 401 })
      }
    } else {
      const result = verifyMercadoPagoSignature({
        xSignature: request.headers.get('x-signature'),
        xRequestId: request.headers.get('x-request-id'),
        dataId,
        secret,
      })
      if (!result.valid) {
        log.warn('Firma inválida', { reason: result.reason })
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const { type, action } = body ?? {}
    log.info('Evento recibido', { type, action, hasDataId: Boolean(dataId) })

    if (type !== 'payment' || !dataId) {
      return NextResponse.json({ received: true })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const eventId = `payment:${dataId}:${action ?? 'event'}`

    // Idempotencia: intenta registrar el evento; si ya existe, no reprocesar.
    const { error: insertEventError } = await supabaseAdmin.from('webhook_events').insert({
      provider: 'mercadopago',
      event_id: eventId,
      event_type: String(type),
      resource_id: String(dataId),
    })
    if (insertEventError) {
      if (insertEventError.code === '23505') {
        log.info('Evento duplicado ignorado', { eventId })
        return NextResponse.json({ received: true, duplicate: true })
      }
      // Si la tabla aún no existe (migración pendiente), continúa pero deja rastro.
      log.warn('No se pudo registrar webhook_event; revisar migración', {
        code: insertEventError.code,
      })
    }

    // Fuente de verdad: la API de Mercado Pago, no el body del webhook.
    const payment = await paymentClient.get({ id: dataId })

    const userId = payment.metadata?.user_id
    const planTier = (payment.metadata?.plan_tier as string) || 'basico'
    const billingCycle = (payment.metadata?.billing_cycle as string) || 'monthly'

    if (!userId) {
      log.warn('Pago sin user_id en metadata', { paymentStatus: payment.status })
      await markEventProcessed(supabaseAdmin, eventId, 'skipped_no_user')
      return NextResponse.json({ received: true })
    }

    const limits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.basico

    let subscriptionStatus = 'active'
    if (payment.status === 'pending') subscriptionStatus = 'pending'
    if (payment.status === 'cancelled' || payment.status === 'rejected') subscriptionStatus = 'canceled'

    // Control de orden: un cancelled/rejected de ESTE pago no debe pisar una
    // suscripción activa creada por otro pago más reciente.
    if (subscriptionStatus === 'canceled') {
      const { data: current } = await supabaseAdmin
        .from('subscriptions')
        .select('status, mercadopago_payment_id')
        .eq('user_id', userId)
        .maybeSingle()
      if (
        current?.status === 'active' &&
        current?.mercadopago_payment_id &&
        current.mercadopago_payment_id !== payment.id?.toString()
      ) {
        log.info('Evento de cancelación de pago antiguo ignorado', { eventId })
        await markEventProcessed(supabaseAdmin, eventId, 'stale_cancel_ignored')
        return NextResponse.json({ received: true })
      }
    }

    const subscriptionData: Record<string, unknown> = {
      user_id: userId,
      plan_tier: planTier === 'lifetime' ? 'enterprise' : planTier,
      status: subscriptionStatus,
      payment_provider: 'mercadopago',
      mercadopago_payment_id: payment.id?.toString(),
      mercadopago_payer_id: payment.payer?.id?.toString(),
      max_doctors: limits.max_doctors,
      max_locations: limits.max_locations,
      updated_at: new Date().toISOString(),
    }

    if (payment.status === 'approved') {
      subscriptionData.status = 'active'
      subscriptionData.current_period_start = new Date().toISOString()
      if (planTier === 'lifetime') {
        subscriptionData.current_period_end = new Date('2125-01-01').toISOString()
      } else if (billingCycle === 'annual') {
        const endDate = new Date()
        endDate.setFullYear(endDate.getFullYear() + 1)
        subscriptionData.current_period_end = endDate.toISOString()
      } else {
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)
        subscriptionData.current_period_end = endDate.toISOString()
      }
    }

    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id', ignoreDuplicates: false })

    if (subError) {
      log.error('Error en upsert de suscripción', { code: subError.code })
      await markEventProcessed(supabaseAdmin, eventId, 'error_subscription')
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }

    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        subscription_tier: planTier,
        subscription_status: subscriptionStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
    if (userError) {
      log.warn('Error actualizando tabla legacy users', { code: userError.code })
    }

    await markEventProcessed(supabaseAdmin, eventId, 'ok')
    log.info('Suscripción actualizada', { plan: planTier, status: subscriptionStatus })
    return NextResponse.json({ received: true })
  } catch (error) {
    log.error('Error procesando webhook', {
      error: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function markEventProcessed(
  admin: ReturnType<typeof getSupabaseAdmin>,
  eventId: string,
  result: string
) {
  await admin
    .from('webhook_events')
    .update({ processed_at: new Date().toISOString(), result })
    .eq('provider', 'mercadopago')
    .eq('event_id', eventId)
}
