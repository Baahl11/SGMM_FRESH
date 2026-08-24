/**
 * POST /api/messaging/webhooks/[provider]
 * Callbacks de estado de entrega de proveedores de mensajería.
 *
 * Auditoría fable 2026-06-11 — hallazgo C8 (P1 alto):
 * Antes no se validaba ninguna firma, se usaba service role y se guardaba el
 * body completo (PII) en `payload`. Además Twilio envía form-urlencoded y el
 * handler hacía request.json(), por lo que los callbacks reales fallaban.
 *
 * Ahora:
 * - Twilio: X-Twilio-Signature (HMAC-SHA1 URL+params, doc oficial) verificada.
 * - Plivo: X-Plivo-Signature-V2 (HMAC-SHA256 de url+nonce, base64) verificada.
 * - MessageBird: FAIL-CLOSED en producción hasta implementar la validación
 *   JWT oficial (Decisión OD-5). En dev se permite con WEBHOOKS_ALLOW_UNSIGNED.
 * - Allowlist de transiciones de estado, límite de tamaño, y el payload
 *   almacenado se reduce a campos de estado (sin cuerpos de mensaje).
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { verifyTwilioSignature, allowUnsignedInDev } from '@/lib/security/webhook-signatures';
import { createLogger } from '@/lib/log';

const log = createLogger('webhook/messaging');

const ALLOWED_STATUSES = new Set(['queued', 'processing', 'sent', 'delivered', 'read', 'failed']);

function publicUrlFor(request: NextRequest): string {
  // Detrás de Vercel, request.url puede traer host interno; reconstruimos con
  // los headers de proxy para que la firma de Twilio/Plivo coincida.
  const url = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.host;
  return `${proto}://${host}${url.pathname}${url.search}`;
}

function verifyPlivoV2(authToken: string, request: NextRequest, url: string): boolean {
  const signature = request.headers.get('x-plivo-signature-v2');
  const nonce = request.headers.get('x-plivo-signature-v2-nonce');
  if (!signature || !nonce) return false;
  const expected = crypto.createHmac('sha256', authToken).update(url + nonce).digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const rawBody = await request.text();
    if (rawBody.length > 64_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    let messageId: string | null = null;
    let status: string | null = null;
    let errorMessage: string | null = null;
    let providerStatusRaw: string | null = null;

    if (provider === 'twilio') {
      const form = Object.fromEntries(new URLSearchParams(rawBody)) as Record<string, string>;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!authToken) {
        if (!allowUnsignedInDev()) {
          log.error('TWILIO_AUTH_TOKEN ausente; rechazando webhook (fail-closed)');
          return NextResponse.json({ error: 'Webhook not configured' }, { status: 401 });
        }
      } else if (
        !verifyTwilioSignature(
          authToken,
          request.headers.get('x-twilio-signature'),
          publicUrlFor(request),
          form
        )
      ) {
        log.warn('Firma Twilio inválida');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      messageId = form.MessageSid ?? null;
      providerStatusRaw = form.MessageStatus ?? null;
      status = parseTwilioStatus(form.MessageStatus ?? '');
      errorMessage = form.ErrorMessage || null;
    } else if (provider === 'plivo') {
      const form = Object.fromEntries(new URLSearchParams(rawBody)) as Record<string, string>;
      const authToken = process.env.PLIVO_AUTH_TOKEN;
      if (!authToken) {
        if (!allowUnsignedInDev()) {
          log.error('PLIVO_AUTH_TOKEN ausente; rechazando webhook (fail-closed)');
          return NextResponse.json({ error: 'Webhook not configured' }, { status: 401 });
        }
      } else if (!verifyPlivoV2(authToken, request, publicUrlFor(request))) {
        log.warn('Firma Plivo inválida');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      messageId = form.MessageUUID ?? null;
      providerStatusRaw = form.Status ?? null;
      status = parsePlivoStatus(form.Status ?? '');
      errorMessage = form.ErrorMessage || null;
    } else if (provider === 'messagebird') {
      // Pendiente OD-5: validación MessageBird-Signature-JWT oficial.
      if (!allowUnsignedInDev()) {
        log.error('Webhook MessageBird sin validación implementada; fail-closed en producción');
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 401 });
      }
      let body: { id?: string; status?: string; errors?: Array<{ description?: string }> };
      try {
        body = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }
      messageId = body.id ?? null;
      providerStatusRaw = body.status ?? null;
      status = parseMessageBirdStatus(body.status ?? '');
      errorMessage = body.errors?.[0]?.description || null;
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    if (!messageId) {
      return NextResponse.json({ error: 'Missing message ID in webhook' }, { status: 400 });
    }
    if (status && !ALLOWED_STATUSES.has(status)) {
      status = 'processing';
    }

    const supabase = getSupabaseAdmin();

    const { data: message, error: findError } = await supabase
      .from('messaging_messages')
      .select('id, status, payload')
      .eq('provider_message_id', messageId)
      .single();

    if (findError || !message) {
      log.warn('Mensaje no encontrado para callback', { provider });
      // 200 para evitar reintentos del proveedor.
      return NextResponse.json({ received: true });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'delivered' && !message.status.includes('delivered')) {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'read' && !message.status.includes('read')) {
        updateData.read_at = new Date().toISOString();
      } else if (status === 'failed' && !message.status.includes('failed')) {
        updateData.failed_at = new Date().toISOString();
      }
    }
    if (errorMessage) {
      updateData.error_message = errorMessage.slice(0, 500);
    }

    // Sólo metadatos de estado; nunca el body completo del proveedor.
    updateData.payload = {
      ...((message.payload as Record<string, unknown> | null) ?? {}),
      webhooks: [
        ...((((message.payload as { webhooks?: unknown[] } | null)?.webhooks) ?? []).slice(-19)),
        {
          provider,
          timestamp: new Date().toISOString(),
          status: providerStatusRaw,
          mapped_status: status,
        },
      ],
    };

    const { error: updateError } = await supabase
      .from('messaging_messages')
      .update(updateData)
      .eq('id', message.id);

    if (updateError) {
      log.error('Error actualizando mensaje', { provider, code: updateError.code });
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }
    return NextResponse.json({ received: true, updated: true });
  } catch (error: unknown) {
    log.error('Error en webhook de mensajería', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function parseTwilioStatus(status: string): string {
  const map: Record<string, string> = {
    queued: 'queued',
    sending: 'processing',
    sent: 'sent',
    delivered: 'delivered',
    undelivered: 'failed',
    failed: 'failed',
  };
  return map[status] || 'processing';
}

function parseMessageBirdStatus(status: string): string {
  const map: Record<string, string> = {
    scheduled: 'queued',
    sent: 'sent',
    buffered: 'processing',
    delivered: 'delivered',
    expired: 'failed',
    delivery_failed: 'failed',
  };
  return map[status] || 'processing';
}

function parsePlivoStatus(status: string): string {
  const map: Record<string, string> = {
    queued: 'queued',
    sent: 'sent',
    failed: 'failed',
    delivered: 'delivered',
    undelivered: 'failed',
    rejected: 'failed',
  };
  return map[status] || 'processing';
}
