/**
 * Legacy compatibility endpoint for WhatsApp reminders.
 *
 * This route now delegates execution to /api/agents/reminders/cron,
 * which is the canonical implementation currently scheduled in vercel.json.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, '');
    const targetUrl = `${baseUrl}/api/agents/reminders/cron`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Delegated reminders cron failed',
          delegated_to: '/api/agents/reminders/cron',
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      delegated_to: '/api/agents/reminders/cron',
      data,
    });
  } catch (error) {
    console.error('[Cron WhatsApp Reminders] Error delegating execution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
