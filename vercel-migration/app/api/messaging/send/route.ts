/**
 * POST /api/messaging/send
 * Queue a message for sending via configured provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { QueueMessagingMessageDTO, MessagingChannel } from '@/types/messaging';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: QueueMessagingMessageDTO = await request.json();

    // Validate required fields
    if (!body.channel || !body.to_contact || !body.body) {
      return NextResponse.json(
        { error: 'Missing required fields: channel, to_contact, body' },
        { status: 400 }
      );
    }

    // Validate contact info based on channel
    if (body.channel === 'sms' || body.channel === 'whatsapp') {
      if (!body.to_contact.phone) {
        return NextResponse.json(
          { error: 'Phone number required for SMS/WhatsApp' },
          { status: 400 }
        );
      }
    } else if (body.channel === 'email') {
      if (!body.to_contact.email) {
        return NextResponse.json(
          { error: 'Email address required for email channel' },
          { status: 400 }
        );
      }
    }

    // Get active provider for this channel
    const { data: provider, error: providerError } = await supabase
      .from('messaging_providers')
      .select('id')
      .eq('user_id', user.id)
      .eq('channel', body.channel)
      .eq('status', 'active')
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        {
          error: `No active ${body.channel} provider configured. Please set up your credentials first.`,
        },
        { status: 400 }
      );
    }

    // Create message record
    const { data: message, error: messageError } = await supabase
      .from('messaging_messages')
      .insert({
        user_id: user.id,
        provider_id: provider.id,
        template_id: body.template_id,
        channel: body.channel,
        to_contact: body.to_contact,
        patient_id: body.patient_id,
        appointment_id: body.appointment_id,
        subject: body.subject,
        body: body.body,
        payload: body.payload,
        status: 'queued',
        scheduled_at: body.scheduled_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (messageError || !message) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      );
    }

    // Create job to process this message
    const runAt = body.scheduled_at || new Date().toISOString();
    const { data: job, error: jobError } = await supabase
      .from('messaging_jobs')
      .insert({
        message_id: message.id,
        run_at: runAt,
        status: 'pending',
        attempts: 0,
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Error creating job:', jobError);
      // Try to mark message as failed
      await supabase
        .from('messaging_messages')
        .update({
          status: 'failed',
          error_message: 'Failed to queue job',
        })
        .eq('id', message.id);

      return NextResponse.json(
        { error: 'Failed to queue message' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: {
          id: message.id,
          status: message.status,
          scheduled_at: message.scheduled_at,
        },
        job: {
          id: job.id,
          run_at: job.run_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in /api/messaging/send:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
