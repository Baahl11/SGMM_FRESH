/**
 * POST /api/messaging/webhooks/[provider]
 * Receives delivery status callbacks from messaging providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const body = await request.json();

    console.log(`[Webhook ${provider}] Received:`, JSON.stringify(body, null, 2));

    // Create service role client (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let messageId: string | null = null;
    let status: string | null = null;
    let errorMessage: string | null = null;

    // Parse webhook payload based on provider
    switch (provider) {
      case 'twilio':
        messageId = body.MessageSid;
        status = parseTwilioStatus(body.MessageStatus);
        errorMessage = body.ErrorMessage || null;
        break;

      case 'messagebird':
        messageId = body.id;
        status = parseMessageBirdStatus(body.status);
        errorMessage = body.errors?.[0]?.description || null;
        break;

      case 'plivo':
        messageId = body.MessageUUID;
        status = parsePlivoStatus(body.Status);
        errorMessage = body.ErrorMessage || null;
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        );
    }

    if (!messageId) {
      return NextResponse.json(
        { error: 'Missing message ID in webhook' },
        { status: 400 }
      );
    }

    // Find message by provider_message_id
    const { data: message, error: findError } = await supabase
      .from('messaging_messages')
      .select('id, status')
      .eq('provider_message_id', messageId)
      .single();

    if (findError || !message) {
      console.warn(`[Webhook ${provider}] Message not found: ${messageId}`);
      // Return 200 to prevent retries
      return NextResponse.json({ received: true });
    }

    // Update message status
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;

      // Set timestamps based on status
      if (status === 'delivered' && !message.status.includes('delivered')) {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'read' && !message.status.includes('read')) {
        updateData.read_at = new Date().toISOString();
      } else if (status === 'failed' && !message.status.includes('failed')) {
        updateData.failed_at = new Date().toISOString();
      }
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    // Store raw webhook data in metadata
    updateData.payload = {
      ...(message as any).payload,
      webhooks: [
        ...((message as any).payload?.webhooks || []),
        {
          provider,
          timestamp: new Date().toISOString(),
          data: body,
        },
      ],
    };

    const { error: updateError } = await supabase
      .from('messaging_messages')
      .update(updateData)
      .eq('id', message.id);

    if (updateError) {
      console.error(`[Webhook ${provider}] Update error:`, updateError);
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      );
    }

    console.log(
      `[Webhook ${provider}] Updated message ${message.id} to status: ${status}`
    );

    return NextResponse.json({ received: true, updated: true });
  } catch (error: any) {
    console.error(`[Webhook] Error:`, error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Status parsers for each provider

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
